import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent, DataSharingLog
from backend.app.models.workflow import WorkflowStep, WorkflowDefinition
from backend.app.models.interoperability import DepartmentRegistryEntry, ConnectorRegistryEntry
from backend.app.models.mdm import CitizenMasterRecord, IdentifierRegistry, MDMMatchReview

from backend.app.services.transformation import DataTransformationEngine
from backend.app.services.interoperability import DepartmentRegistryService, ConnectorRegistryService
from backend.app.services.mdm import MasterDataManagementService
from backend.app.services.consent import ConsentManager
from backend.app.services.workflow import WorkflowEngine
from backend.app.services.identity.factory import get_identity_provider, get_all_identity_providers
from backend.app.auth import create_access_token

from sqlalchemy.pool import StaticPool

@pytest.fixture
def sih_db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()


    # Seed core test users
    citizen = User(
        id="CIT-SIH-001",
        name="Sunita Patil",
        email="sunita@citizen.gov.in",
        mobile="9823000001",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    officer = User(
        id="OFF-SIH-001",
        name="Officer Sharma",
        email="sharma@dept.gov.in",
        mobile="8888888888",
        role="OFFICER",
        department_id="DEPT_A",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    admin = User(
        id="ADM-SIH-001",
        name="System Admin",
        email="admin@mahasetu.gov.in",
        mobile="7777777777",
        role="SYSTEM_ADMIN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    session.add_all([citizen, officer, admin])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client_env(sih_db_session):
    def override_get_db():
        try:
            yield sih_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ==============================================================================
# PHASE 2 TESTS: INTEROPERABILITY CORE
# ==============================================================================

def test_department_registry_lifecycle(sih_db_session, client_env):
    """Verifies listing, details, health probe, and registration in Department Registry."""
    admin_token = create_access_token({"sub": "ADM-SIH-001", "role": "SYSTEM_ADMIN", "name": "System Admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List departments (seeds defaults)
    res = client_env.get("/api/v1/interoperability/departments")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) >= 4
    dept_ids = [d["department_id"] for d in depts]
    assert "DEPT_A" in dept_ids
    assert "LEGACY_01" in dept_ids
    assert "DEPT_REVENUE_SOAP" in dept_ids

    # 2. Get specific department
    res = client_env.get("/api/v1/interoperability/departments/DEPT_A")
    assert res.status_code == 200
    data = res.json()
    assert data["code"] == "MH-UID-01"
    assert data["protocol"] == "REST_JSON"

    # 3. Health probe
    probe_res = client_env.post("/api/v1/interoperability/departments/DEPT_A/health-check")
    assert probe_res.status_code == 200
    probe = probe_res.json()
    assert probe["health_status"] == "HEALTHY"
    assert probe["latency_ms"] >= 0

    # 4. Register new department
    new_dept = {
        "department_id": "DEPT_FOREST",
        "name": "State Forest & Wildlife Department",
        "code": "MH-FOR-05",
        "status": "ACTIVE",
        "api_base_url": "http://forest.gov.in/api",
        "protocol": "REST_JSON",
        "auth_method": "API_KEY",
        "schema_version": "v1.0",
        "service_list": ["forest_clearance"]
    }
    reg_res = client_env.post("/api/v1/interoperability/departments", json=new_dept, headers=headers)
    assert reg_res.status_code == 200
    assert reg_res.json()["department_id"] == "DEPT_FOREST"


def test_connector_registry_and_multi_protocol_transformations(sih_db_session, client_env):
    """Verifies Connector Registry execution tests across REST, SOAP/XML, PIPE, and CSV formats."""
    # 1. List connectors
    res = client_env.get("/api/v1/interoperability/connectors")
    assert res.status_code == 200
    connectors = res.json()
    conn_ids = [c["connector_id"] for c in connectors]
    assert "CONN_DEPT_A_REST" in conn_ids
    assert "CONN_LEGACY_01_PIPE" in conn_ids
    assert "CONN_SOAP_REVENUE" in conn_ids

    # 2. Test REST Connector
    rest_test = client_env.post(
        "/api/v1/interoperability/connectors/CONN_DEPT_A_REST/test",
        json={"sample_payload": {"citizen_name": "Sunita Patil", "mobile_no": "9823000001", "district": "Pune"}}
    )
    assert rest_test.status_code == 200
    r_data = rest_test.json()
    assert r_data["status"] == "SUCCESS"
    assert r_data["stage_2_canonical_model"]["citizen"]["name"] == "Sunita Patil"

    # 3. Test Legacy Pipe-Delimited Connector
    pipe_test = client_env.post(
        "/api/v1/interoperability/connectors/CONN_LEGACY_01_PIPE/test",
        json={"sample_payload": "CIT001|Sunita Patil|Pune|MH"}
    )
    assert pipe_test.status_code == 200
    p_data = pipe_test.json()
    assert p_data["status"] == "SUCCESS"
    assert p_data["stage_2_canonical_model"]["citizen"]["name"] == "Sunita Patil"
    assert "CIT001|Sunita Patil|Pune|MH" in p_data["stage_3_target_payload"]

    # 4. Test Enterprise SOAP/XML Connector
    soap_input = (
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        '<soap:Body><CitizenVerificationRequest>'
        '<CitizenID>REV-001</CitizenID><CitizenName>Sunita Patil</CitizenName>'
        '<MobileNumber>9823000001</MobileNumber><District>Pune</District>'
        '</CitizenVerificationRequest></soap:Body></soap:Envelope>'
    )
    soap_test = client_env.post(
        "/api/v1/interoperability/connectors/CONN_SOAP_REVENUE/test",
        json={"sample_payload": soap_input}
    )
    assert soap_test.status_code == 200
    s_data = soap_test.json()
    assert s_data["status"] == "SUCCESS"
    assert s_data["stage_2_canonical_model"]["citizen"]["name"] == "Sunita Patil"
    assert "<mh:CitizenName>Sunita Patil</mh:CitizenName>" in s_data["stage_3_target_payload"]


def test_canonical_data_model_bidirectional_transformation():
    """Validates Department A -> Canonical Model -> Department B / Legacy / CSV / SOAP translations."""
    # Source Department A payload
    dept_a_raw = {
        "citizen_name": "Sunita Patil",
        "mobile_no": "9823000001",
        "dob": "1998-05-12",
        "district": "Pune",
        "annual_income": 180000
    }

    # Transform to CDM
    cdm = DataTransformationEngine.to_canonical_from_dept_a(dept_a_raw)
    assert cdm["citizen"]["name"] == "Sunita Patil"
    assert cdm["citizen"]["phone"] == "9823000001"

    # Transform CDM to Department B format
    dept_b_payload = DataTransformationEngine.from_canonical_to_dept_b(cdm)
    assert dept_b_payload["fullName"] == "Sunita Patil"
    assert dept_b_payload["income_bracket"] == "BELOW_2L"

    # Transform CDM to Legacy Pipe Delimited format
    pipe_payload = DataTransformationEngine.from_canonical_to_legacy(cdm)
    assert "Sunita Patil|Pune|MH" in pipe_payload

    # Transform CDM to CSV
    csv_payload = DataTransformationEngine.from_canonical_to_csv(cdm)
    assert '"Sunita Patil",9823000001,1998-05-12,Pune,180000' in csv_payload

    # Transform CDM to SOAP XML
    soap_payload = DataTransformationEngine.from_canonical_to_soap_xml(cdm)
    assert "<mh:CitizenName>Sunita Patil</mh:CitizenName>" in soap_payload


# ==============================================================================
# PHASE 3 TESTS: MASTER DATA MANAGEMENT (MDM)
# ==============================================================================

def test_mdm_matching_and_identifier_registry(sih_db_session, client_env):
    """Verifies MDM multi-attribute confidence scoring, auto-link, ambiguous queue, and new master creation."""
    officer_token = create_access_token({"sub": "OFF-SIH-001", "role": "OFFICER", "name": "Officer Sharma"})
    headers = {"Authorization": f"Bearer {officer_token}"}

    # 1. Register first record: Creates new Master Record (MS-000001)
    record_1 = {
        "citizen_data": {
            "name": "Sunita Patil",
            "phone": "9823000001",
            "email": "sunita@citizen.gov.in",
            "dob": "1998-05-12",
            "district": "Pune"
        },
        "source_system": "DEPT_A",
        "source_identifier": "A-12345",
        "identifier_type": "AADHAAR_TOKEN"
    }
    res1 = client_env.post("/api/v1/mdm/match", json=record_1, headers=headers)
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["action"] == "NEW_MASTER_CREATED"
    master_id = d1["master_id"]
    assert master_id.startswith("MS-")

    # 2. Register second record with identical phone, email, and DOB from Department B: Auto-links (score >= 0.85)
    record_2 = {
        "citizen_data": {
            "name": "Sunita Patil",
            "phone": "9823000001",
            "email": "sunita@citizen.gov.in",
            "dob": "1998-05-12",
            "district": "Pune"
        },
        "source_system": "DEPT_B",
        "source_identifier": "B-77891",
        "identifier_type": "BENEFICIARY_ID"
    }
    res2 = client_env.post("/api/v1/mdm/match", json=record_2, headers=headers)
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["action"] == "AUTO_MATCHED_AND_LINKED"
    assert d2["master_id"] == master_id
    assert d2["confidence_score"] >= 0.85

    # Verify both identifiers are linked to the same Master Record
    golden = client_env.get(f"/api/v1/mdm/citizens/{master_id}", headers=headers).json()
    linked_ids = {i["source_system"]: i["source_identifier"] for i in golden["linked_identifiers"]}
    assert linked_ids.get("DEPT_A") == "A-12345"
    assert linked_ids.get("DEPT_B") == "B-77891"

    # 3. Test Ambiguous Match (0.50 <= score < 0.85): Same mobile and district, but different name
    record_ambiguous = {
        "citizen_data": {
            "name": "Sunita R Patil",
            "phone": "9823000001",
            "dob": "1990-01-01", # Different DOB
            "district": "Pune"
        },
        "source_system": "LEGACY_01",
        "source_identifier": "LEG-991"
    }
    res_amb = client_env.post("/api/v1/mdm/match", json=record_ambiguous, headers=headers)
    assert res_amb.status_code == 200
    d_amb = res_amb.json()
    assert d_amb["action"] == "AMBIGUOUS_MATCH_FLAGGED_FOR_REVIEW"
    review_id = d_amb["review_id"]

    # 4. Officer reviews and resolves ambiguous match
    reviews = client_env.get("/api/v1/mdm/reviews", headers=headers).json()
    assert any(r["id"] == review_id for r in reviews)

    res_resolve = client_env.post(
        f"/api/v1/mdm/reviews/{review_id}/resolve",
        json={"decision": "MERGE", "notes": "Verified marriage record and name variation"},
        headers=headers
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["resolution"] == "RESOLVED_MERGE"


# ==============================================================================
# PHASE 4 TESTS: CONSENT MANAGEMENT
# ==============================================================================

def test_consent_lifecycle_and_data_sharing_enforcement(sih_db_session, client_env):
    """Verifies DPDP-aligned consent lifecycle and granular 5-point data exchange enforcement."""
    citizen_token = create_access_token({"sub": "CIT-SIH-001", "role": "CITIZEN", "name": "Sunita Patil"})
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # 1. Create Application
    app_record = Application(
        application_number="MH-APP-2026-CONSENT01",
        citizen_id="CIT-SIH-001",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL"
    )
    sih_db_session.add(app_record)
    sih_db_session.commit()

    # 2. Request Consent
    req_payload = {
        "application_id": app_record.id,
        "requested_by": "Employment Department (DEPT_C)",
        "requesting_department": "DEPT_C",
        "receiving_department": "DEPT_B",
        "purpose": "Income and eligibility verification",
        "data_categories": ["Identity Information", "Income Bracket"],
        "scope": ["READ_IDENTITY_DEMOGRAPHICS", "READ_INCOME_BRACKET"]
    }
    c_res = client_env.post("/api/v1/consents", json=req_payload, headers=headers)
    assert c_res.status_code == 200
    consent = c_res.json()
    consent_id = consent["id"]
    assert consent["status"] == "REQUESTED"

    # 3. Data exchange blocked prior to approval
    with pytest.raises(Exception):
        ConsentManager.enforce_data_exchange(
            db=sih_db_session,
            application_id=app_record.id,
            requesting_dept="DEPT_C",
            receiving_dept="DEPT_B",
            requested_categories=["Income Bracket"],
            actor_id="OFF-SIH-001"
        )

    # 4. Approve Consent
    appr_res = client_env.post(f"/api/v1/consents/{consent_id}/approve", headers=headers)
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "AUTHORIZED"
    assert appr_res.json()["consent_hash"] is not None

    # 5. Data exchange allowed when in scope
    allowed = ConsentManager.enforce_data_exchange(
        db=sih_db_session,
        application_id=app_record.id,
        requesting_dept="DEPT_C",
        receiving_dept="DEPT_B",
        requested_categories=["Income Bracket"],
        actor_id="OFF-SIH-001"
    )
    assert allowed is True

    # 6. Data exchange BLOCKED when scope is exceeded
    with pytest.raises(Exception):
        ConsentManager.enforce_data_exchange(
            db=sih_db_session,
            application_id=app_record.id,
            requesting_dept="DEPT_C",
            receiving_dept="DEPT_B",
            requested_categories=["Health Records & Biometric Scan"], # Not in consent
            actor_id="OFF-SIH-001"
        )

    # 7. Check Data Disclosures Audit Log
    disc_res = client_env.get("/api/v1/consents/disclosures", headers=headers)
    assert disc_res.status_code == 200
    disclosures = disc_res.json()
    assert len(disclosures) >= 2
    statuses = [d["status"] for d in disclosures]
    assert "ALLOWED" in statuses
    assert "BLOCKED_SCOPE_EXCEEDED" in statuses

    # 8. Revoke Consent
    rev_res = client_env.post(f"/api/v1/consents/{consent_id}/revoke", headers=headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVOKED"


# ==============================================================================
# PHASE 5 TESTS: FEDERATED IDENTITY / SSO
# ==============================================================================

def test_federated_identity_and_oidc_sso(client_env):
    """Verifies pluggable identity factory, OIDC discovery, and MeriPehchaan Sandbox SSO login."""
    # 1. OIDC Discovery endpoint
    disc_res = client_env.get("/api/v1/auth/sso/.well-known/openid-configuration")
    assert disc_res.status_code == 200
    disc = disc_res.json()
    assert "authorization_endpoint" in disc
    assert "token_endpoint" in disc
    assert "scopes_supported" in disc

    # 2. List registered providers
    prov_res = client_env.get("/api/v1/auth/sso/providers")
    assert prov_res.status_code == 200
    provs = prov_res.json()
    p_ids = [p["provider_id"] for p in provs]
    assert "INTERNAL_JWT" in p_ids
    assert "FIREBASE_AUTH" in p_ids
    assert "GOV_OIDC_SSO" in p_ids

    # 3. Simulate Government SSO login (Citizen)
    sso_cit = client_env.post("/api/v1/auth/sso/mock-login", json={"persona": "CITIZEN"})
    assert sso_cit.status_code == 200
    res_cit = sso_cit.json()
    assert res_cit["status"] == "SUCCESS"
    assert res_cit["user"]["role"] == "CITIZEN"
    assert "access_token" in res_cit

    # 4. Simulate Government SSO login (Officer)
    sso_off = client_env.post("/api/v1/auth/sso/mock-login", json={"persona": "OFFICER", "department_id": "DEPT_A"})
    assert sso_off.status_code == 200
    res_off = sso_off.json()
    assert res_off["status"] == "SUCCESS"
    assert res_off["user"]["role"] == "OFFICER"

    # 5. Verify token verification
    token = res_cit["oidc_token_details"]["id_token"]
    verify_res = client_env.post("/api/v1/auth/sso/verify", json={"token": token})
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VALID"
    assert verify_res.json()["claims"]["aud"] == "mahasetu-platform"


# ==============================================================================
# PHASE 6 TESTS: WORKFLOW ORCHESTRATION
# ==============================================================================

def test_configurable_workflow_orchestration(sih_db_session, client_env):
    """Verifies configurable declarative workflow definitions, initialization, and lifecycle transitions."""
    admin_token = create_access_token({"sub": "ADM-SIH-001", "role": "SYSTEM_ADMIN", "name": "System Admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List workflow definitions
    def_res = client_env.get("/api/v1/workflow/definitions/all")
    assert def_res.status_code == 200
    definitions = def_res.json()
    assert len(definitions) >= 2
    def_ids = [d["id"] for d in definitions]
    assert "WF-DEF-EMPLOYMENT" in def_ids
    assert "WF-DEF-CASTE-CERT" in def_ids

    # 2. Create application under caste-certificate service (5-step workflow)
    app_caste = Application(
        application_number="MH-APP-2026-CASTE01",
        citizen_id="CIT-SIH-001",
        service_id="caste-certificate",
        status="APPLICATION_CREATED",
        current_department="PORTAL",
        citizen_data={"name": "Sunita Patil", "mobile": "9823000001", "district": "Pune"}
    )
    sih_db_session.add(app_caste)
    sih_db_session.commit()

    # 3. Initialize workflow from definition
    WorkflowEngine.initialize_workflow(sih_db_session, app_caste.id)
    steps = WorkflowEngine.get_application_workflow(sih_db_session, app_caste.id)
    step_names = [s.step_name for s in steps]
    assert len(steps) == 5
    assert "LEGACY_ARCHIVE_VERIFICATION" in step_names

    # 4. Authorize consent
    consent = ConsentManager.request_consent(sih_db_session, app_caste.id, "CIT-SIH-001")
    ConsentManager.approve_consent(sih_db_session, consent.id, "CIT-SIH-001")

    # 5. Advance through steps
    # Step 1: CONSENT_GRANTED
    r1 = WorkflowEngine.advance_step(sih_db_session, app_caste.id)
    assert r1["status"] == "COMPLETED"

    # Step 2: IDENTITY_VERIFICATION (DEPT_A)
    r2 = WorkflowEngine.advance_step(sih_db_session, app_caste.id)
    assert r2["status"] == "COMPLETED"
    assert r2["result"]["department_id"] == "DEPT_A"

    # Step 3: LEGACY_ARCHIVE_VERIFICATION (LEGACY_01)
    r3 = WorkflowEngine.advance_step(sih_db_session, app_caste.id)
    assert r3["status"] == "COMPLETED"
    assert r3["result"]["department_id"] == "LEGACY_01"

    # Step 4: APPLICATION_COMPLETED
    r4 = WorkflowEngine.advance_step(sih_db_session, app_caste.id)
    assert r4["status"] == "COMPLETED"
    assert app_caste.status == "COMPLETED"

    # 6. Test Workflow Cancellation
    app_cancel = Application(
        application_number="MH-APP-2026-CANCEL01",
        citizen_id="CIT-SIH-001",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL"
    )
    sih_db_session.add(app_cancel)
    sih_db_session.commit()

    cancel_res = client_env.post(
        f"/api/v1/workflow/{app_cancel.id}/cancel",
        json={"reason": "Citizen withdrew scheme request"},
        headers=headers
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["application_status"] == "CANCELLED"

    # 7. Test Workflow Escalation
    escalate_res = client_env.post(
        f"/api/v1/workflow/{app_caste.id}/escalate",
        json={"reason": "SLA warning timeout exceeded"},
        headers=headers
    )
    assert escalate_res.status_code == 200
    assert escalate_res.json()["application_status"] == "ESCALATED"
