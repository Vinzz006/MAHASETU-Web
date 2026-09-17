import os
import io
import pytest
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.audit import AuditLog
from backend.app.auth import get_password_hash, create_access_token, _expand_roles
from backend.app.services.audit import create_audit_log
from backend.app.firebase import verify_firebase_id_token

@pytest.fixture
def master_test_setup():
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()

    engine = create_engine(f"sqlite:///{temp_db.name}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()

    pwd = get_password_hash("TestP@ssw0rd123!")

    citizen = User(
        id="CIT-SEC-001",
        name="Sunita Patil",
        mobile="9800000001",
        email="sunita@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    dept_a = User(
        id="DEPTA-SEC-001",
        name="Officer Identity",
        mobile="8800000002",
        email="identity@dept.gov.in",
        role="DEPARTMENT_A",
        department_id="DEPT_A",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    auditor = User(
        id="AUD-SEC-001",
        name="State Auditor",
        mobile="6600000003",
        email="auditor@audit.gov.in",
        role="AUDITOR",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    admin = User(
        id="ADM-SEC-001",
        name="Central System Admin",
        mobile="7700000004",
        email="sysadmin@mahasetu.gov.in",
        role="SYSTEM_ADMIN",
        registration_status="APPROVED",
        hashed_password=pwd
    )

    db.add_all([citizen, dept_a, auditor, admin])
    db.commit()

    tokens = {
        "citizen": create_access_token({"sub": citizen.id, "role": citizen.role, "name": citizen.name}),
        "dept_a": create_access_token({"sub": dept_a.id, "role": dept_a.role, "name": dept_a.name}),
        "auditor": create_access_token({"sub": auditor.id, "role": auditor.role, "name": auditor.name}),
        "admin": create_access_token({"sub": admin.id, "role": admin.role, "name": admin.name}),
    }

    client = TestClient(app)
    yield client, tokens, db

    db.close()
    app.dependency_overrides.clear()
    engine.dispose()
    try:
        os.unlink(temp_db.name)
    except Exception:
        pass


def test_personas_endpoint_restricted(master_test_setup):
    """2.1: Anonymous users and citizens cannot query /api/auth/personas."""
    client, tokens, db = master_test_setup

    # 1. Anonymous request is rejected
    anon_res = client.get("/api/auth/personas")
    assert anon_res.status_code == 401

    # 2. Authenticated citizen is forbidden
    citizen_headers = {"Authorization": f"Bearer {tokens['citizen']}"}
    citizen_res = client.get("/api/auth/personas", headers=citizen_headers)
    assert citizen_res.status_code == 403

    # 3. System admin is allowed in demo mode
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    admin_res = client.get("/api/auth/personas", headers=admin_headers)
    assert admin_res.status_code == 200
    assert isinstance(admin_res.json(), list)


def test_firebase_token_mock_rejected_outside_testing():
    """2.3: Guessable mock tokens are rejected when not in TESTING mode."""
    # Temporarily disable TESTING flag
    old_val = os.environ.get("TESTING")
    try:
        os.environ["TESTING"] = "false"
        res = verify_firebase_id_token("fb_mock_attacker_uid")
        assert res is None

        res2 = verify_firebase_id_token("firebase_attacker_token")
        assert res2 is None
    finally:
        if old_val is not None:
            os.environ["TESTING"] = old_val


def test_department_cannot_view_unconsented_application(master_test_setup):
    """2.5: Department role cannot view application without active authorized consent."""
    client, tokens, db = master_test_setup
    c_headers = {"Authorization": f"Bearer {tokens['citizen']}"}
    dept_headers = {"Authorization": f"Bearer {tokens['dept_a']}"}

    # Citizen creates application
    app_res = client.post("/api/applications", json={
        "service_id": "farmer-dbt",
        "citizen_name": "Sunita Patil",
        "mobile": "9800000001",
        "dob": "1992-04-15",
        "district": "Pune",
        "annual_income": 95000,
        "employment_status": "FARMER"
    }, headers=c_headers)
    assert app_res.status_code == 200
    app_id = app_res.json()["id"]

    # Dept A attempts to access -> 403 Forbidden
    dept_denied = client.get(f"/api/applications/{app_id}", headers=dept_headers)
    assert dept_denied.status_code == 403
    assert "consent" in dept_denied.json()["detail"].lower()

    # Verify denial audit log entry exists
    denial_log = db.query(AuditLog).filter(
        AuditLog.action == "APPLICATION_ACCESS_DENIED_DEPARTMENT_UNAUTHORIZED",
        AuditLog.application_id == app_id
    ).first()
    assert denial_log is not None

    # Now authorize consent and assign to DEPT_A
    consent = Consent(
        id="c-sec-test-01",
        consent_number="MH-CON-SEC-001",
        application_id=app_id,
        citizen_id="CIT-SEC-001",
        requested_by="Agriculture Department (DEPT_A)",
        purpose="Farmer Land Assistance",
        status="AUTHORIZED",
        data_categories=["IDENTITY", "LAND"]
    )
    db.add(consent)
    app_rec = db.query(Application).filter(Application.id == app_id).first()
    app_rec.current_department = "DEPT_A"
    db.commit()

    # Now Dept A can access -> 200 OK
    dept_allowed = client.get(f"/api/applications/{app_id}", headers=dept_headers)
    assert dept_allowed.status_code == 200


def test_passport_pdf_magic_bytes_and_traversal_defense(master_test_setup):
    """3.3, 1.1, 2.6: Magic byte PDF check and path-traversal prevention."""
    client, tokens, db = master_test_setup
    c_headers = {"Authorization": f"Bearer {tokens['citizen']}"}

    # 1. Non-PDF content disguised as PDF -> Rejected 400
    fake_pdf = io.BytesIO(b"This is a fake plain text document pretending to be PDF")
    fake_upload = client.post(
        "/api/citizens/me/passport-document",
        files={"file": ("fake.pdf", fake_pdf, "application/pdf")},
        headers=c_headers
    )
    assert fake_upload.status_code == 400
    assert "header signature" in fake_upload.json()["detail"]

    # 2. Genuine PDF with %PDF- header -> Accepted 200
    valid_pdf_content = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"
    valid_pdf = io.BytesIO(valid_pdf_content)
    upload_res = client.post(
        "/api/citizens/me/passport-document",
        files={"file": ("passport.pdf", valid_pdf, "application/pdf")},
        headers=c_headers
    )
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["status"] == "SUCCESS"
    storage_path = data["storage_path"]

    # 3. Valid download endpoint -> 200 PDF stream
    download_res = client.get(
        f"/api/citizens/me/passport-document/download?path={storage_path}",
        headers=c_headers
    )
    assert download_res.status_code == 200
    assert download_res.headers["content-type"] == "application/pdf"
    assert download_res.content.startswith(b"%PDF-")

    # 4. Path traversal attempt (../../) -> Rejected 403
    traversal_res = client.get(
        "/api/citizens/me/passport-document/download?path=../../residents/CIT-OTHER/passports/secret.pdf",
        headers=c_headers
    )
    assert traversal_res.status_code == 403
    assert "traversal" in traversal_res.json()["detail"].lower()


def test_role_expansion_prevents_privilege_escalation():
    """3.5: DEPARTMENT_ADMIN does NOT expand to SYSTEM_ADMIN or ADMIN."""
    expanded = _expand_roles(["DEPARTMENT_ADMIN"])
    assert "SYSTEM_ADMIN" not in expanded
    assert "ADMIN" not in expanded
    assert "DEPARTMENT_A" in expanded


def test_audit_log_immutability(master_test_setup):
    """1.4: AuditLog records are append-only; update and delete are blocked."""
    client, tokens, db = master_test_setup

    log = create_audit_log(
        db=db,
        actor_id="SYS-TEST",
        action="TEST_ACTION",
        resource="TEST_RESOURCE",
        metadata={"key": "val"}
    )
    assert log.id is not None

    # Attempt UPDATE -> Must raise RuntimeError
    log.action = "TAMPERED_ACTION"
    with pytest.raises(RuntimeError) as exc_update:
        db.commit()
    assert "append-only" in str(exc_update.value).lower()
    db.rollback()

    # Attempt DELETE -> Must raise RuntimeError
    log_fresh = db.query(AuditLog).filter(AuditLog.id == log.id).first()
    db.delete(log_fresh)
    with pytest.raises(RuntimeError) as exc_delete:
        db.commit()
    assert "append-only" in str(exc_delete.value).lower()
    db.rollback()


def test_public_passport_verification_masks_beneficiary_name(master_test_setup):
    """3.4: Public passport verification endpoint masks citizen real name to prevent PII harvesting."""
    client, tokens, db = master_test_setup
    c_headers = {"Authorization": f"Bearer {tokens['citizen']}"}

    # Citizen creates application
    app_res = client.post("/api/applications", json={
        "service_id": "employment-support",
        "citizen_name": "Sunita Patil",
        "mobile": "9800000001",
        "dob": "1992-04-15",
        "district": "Pune",
        "annual_income": 85000,
        "employment_status": "UNEMPLOYED"
    }, headers=c_headers)
    app_num = app_res.json()["application_number"]

    # Public verify endpoint
    verify_res = client.get(f"/api/passport/verify/{app_num}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["is_valid"] is True
    # Name must be masked: "S****a P***l", never plain "Sunita Patil"
    assert v_data["beneficiary_name"] != "Sunita Patil"
    assert "*" in v_data["beneficiary_name"]
