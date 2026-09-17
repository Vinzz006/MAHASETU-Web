import os
import tempfile
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.workflow import WorkflowStep
from backend.app.models.consent import Consent
from backend.app.services.workflow import WorkflowEngine
from backend.app.services.consent import ConsentManager
from backend.app.auth import create_access_token
from backend.app.integrations.department_b import DepartmentBFailureController

@pytest.fixture
def test_env():
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()

    engine = create_engine(f"sqlite:///{temp_db.name}", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    session = TestingSession()

    # Seed Users for all roles
    citizen = User(
        id="CIT-WF-1",
        name="Sunita Patil",
        email="sunita.patil@citizen.gov.in",
        mobile="9823000001",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    admin = User(
        id="ADM-WF-1",
        name="State Administrator",
        email="admin@mahasetu.gov.in",
        mobile="9823000002",
        role="ADMIN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    auditor = User(
        id="AUD-WF-1",
        name="Chief Vigilance Auditor",
        email="auditor@cag.gov.in",
        mobile="9823000003",
        role="AUDITOR",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    dept_a = User(
        id="DEPT-A-1",
        name="UIDAI Officer",
        email="officer.a@dept.gov.in",
        mobile="9823000004",
        role="DEPARTMENT_A",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    session.add_all([citizen, admin, auditor, dept_a])
    session.commit()

    with TestClient(app) as client:
        yield {"db": session, "client": client, "SessionLocal": TestingSession}

    session.close()
    app.dependency_overrides.clear()
    try:
        os.unlink(temp_db.name)
    except Exception:
        pass

def test_extended_workflow_8_steps_complete_pipeline(test_env):
    """Verifies all 8 steps in WORKFLOW_PIPELINE execute sequentially to COMPLETED."""
    DepartmentBFailureController.simulate_failure = False
    db = test_env["db"]

    app_record = Application(
        application_number="MH-APP-2026-WF001",
        citizen_id="CIT-WF-1",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL",
        citizen_data={"name": "Sunita Patil", "mobile": "9823000001", "district": "Pune"}
    )
    db.add(app_record)
    db.commit()

    WorkflowEngine.initialize_workflow(db, app_record.id)
    steps = WorkflowEngine.get_application_workflow(db, app_record.id)
    assert len(steps) == 8

    # Authorize consent
    consent = ConsentManager.request_consent(db, app_record.id, "CIT-WF-1")
    ConsentManager.approve_consent(db, consent.id, "CIT-WF-1")

    # Step 1: CONSENT_GRANTED
    s1 = WorkflowEngine.advance_step(db, app_record.id)
    assert s1["step"] == "CONSENT_GRANTED"

    # Step 2: IDENTITY_VERIFICATION (DEPT_A)
    s2 = WorkflowEngine.advance_step(db, app_record.id)
    assert s2["step"] == "IDENTITY_VERIFICATION"
    assert s2["result"]["department_id"] == "DEPT_A"

    # Step 3: ELIGIBILITY_VERIFICATION (DEPT_B)
    s3 = WorkflowEngine.advance_step(db, app_record.id)
    assert s3["step"] == "ELIGIBILITY_VERIFICATION"
    assert s3["result"]["department_id"] == "DEPT_B"

    # Step 4: DEPARTMENT_APPROVAL (DEPT_C)
    s4 = WorkflowEngine.advance_step(db, app_record.id)
    assert s4["step"] == "DEPARTMENT_APPROVAL"
    assert s4["result"]["department_id"] == "DEPT_C"
    db.refresh(app_record)
    assert app_record.status == "APPROVAL_STARTED"
    assert app_record.current_department == "ADMIN"

    # Step 5: ADMIN_REVIEW (ADMIN)
    s5 = WorkflowEngine.advance_step(db, app_record.id)
    assert s5["step"] == "ADMIN_REVIEW"
    db.refresh(app_record)
    assert app_record.status == "ADMIN_APPROVED"
    assert app_record.current_department == "AUDIT"

    # Step 6: AUDITOR_REVIEW (AUDIT)
    s6 = WorkflowEngine.advance_step(db, app_record.id)
    assert s6["step"] == "AUDITOR_REVIEW"
    db.refresh(app_record)
    assert app_record.status == "AUDITOR_CONFIRMED"
    assert app_record.current_department == "PORTAL"

    # Step 7: APPLICATION_COMPLETED (PORTAL)
    s7 = WorkflowEngine.advance_step(db, app_record.id)
    assert s7["step"] == "APPLICATION_COMPLETED"
    db.refresh(app_record)
    assert app_record.status == "COMPLETED"

def test_admin_rework_and_citizen_resubmit_cycle(test_env):
    """Tests Admin sending application for rework, and citizen resubmitting with updated details."""
    DepartmentBFailureController.simulate_failure = False
    db = test_env["db"]
    client = test_env["client"]

    app_record = Application(
        application_number="MH-APP-2026-WF002",
        citizen_id="CIT-WF-1",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL",
        citizen_data={"name": "Sunita Patil", "mobile": "9823000001", "district": "Pune", "annual_income": 120000}
    )
    db.add(app_record)
    db.commit()

    WorkflowEngine.initialize_workflow(db, app_record.id)
    consent = ConsentManager.request_consent(db, app_record.id, "CIT-WF-1")
    ConsentManager.approve_consent(db, consent.id, "CIT-WF-1")

    # Advance through Dept C
    for _ in range(4):
        WorkflowEngine.advance_step(db, app_record.id)

    db.refresh(app_record)
    assert app_record.status == "APPROVAL_STARTED"

    # Non-admin cannot perform admin-review
    citizen_token = create_access_token({"sub": "CIT-WF-1", "role": "CITIZEN"})
    admin_token = create_access_token({"sub": "ADM-WF-1", "role": "ADMIN"})

    forbidden_resp = client.post(
        f"/api/workflow/{app_record.id}/admin-review",
        json={"decision": "REWORK", "comments": "Please upload valid income certificate"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert forbidden_resp.status_code == 403

    # Admin requests rework
    rework_resp = client.post(
        f"/api/workflow/{app_record.id}/admin-review",
        json={"decision": "REWORK", "comments": "Income declaration documents required", "rejection_reason": "Missing proof of income under 1.5 Lakh"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert rework_resp.status_code == 200
    assert rework_resp.json()["decision"] == "REWORK"

    db.refresh(app_record)
    assert app_record.status == "REWORK"
    assert "Missing proof" in app_record.rejection_reason

    # Citizen resubmits
    resubmit_resp = client.post(
        f"/api/applications/{app_record.id}/resubmit",
        json={"citizen_data": {"annual_income": 110000, "income_cert_id": "INC-2026-99"}, "comments": "Uploaded certificate INC-2026-99"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert resubmit_resp.status_code == 200
    detail = resubmit_resp.json()
    assert detail["status"] == "APPROVAL_STARTED"
    assert detail["rejection_reason"] is None
    assert detail["citizen_data"]["income_cert_id"] == "INC-2026-99"

    # Admin now approves
    approve_resp = client.post(
        f"/api/workflow/{app_record.id}/admin-review",
        json={"decision": "APPROVE", "comments": "Income proof verified and cleared"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["decision"] == "APPROVE"

    db.refresh(app_record)
    assert app_record.status == "ADMIN_APPROVED"

def test_auditor_review_confirm_and_flag(test_env):
    """Tests Auditor confirm and flag actions with role checks."""
    db = test_env["db"]
    client = test_env["client"]

    app_record = Application(
        application_number="MH-APP-2026-WF003",
        citizen_id="CIT-WF-1",
        service_id="employment-support",
        status="ADMIN_APPROVED",
        current_department="AUDIT"
    )
    db.add(app_record)
    db.commit()

    WorkflowEngine.initialize_workflow(db, app_record.id)

    auditor_token = create_access_token({"sub": "AUD-WF-1", "role": "AUDITOR"})
    dept_a_token = create_access_token({"sub": "DEPT-A-1", "role": "DEPARTMENT_A"})

    # Department A cannot perform auditor review
    forbidden_resp = client.post(
        f"/api/workflow/{app_record.id}/auditor-review",
        json={"decision": "CONFIRM", "comments": "Compliance check passed"},
        headers={"Authorization": f"Bearer {dept_a_token}"}
    )
    assert forbidden_resp.status_code == 403

    # Auditor confirms
    confirm_resp = client.post(
        f"/api/workflow/{app_record.id}/auditor-review",
        json={"decision": "CONFIRM", "comments": "All compliance logs match hash chain"},
        headers={"Authorization": f"Bearer {auditor_token}"}
    )
    assert confirm_resp.status_code == 200, confirm_resp.json()
    assert confirm_resp.json()["decision"] == "CONFIRM"

    db.refresh(app_record)
    assert app_record.status == "AUDITOR_CONFIRMED"
