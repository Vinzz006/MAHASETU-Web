import os
import pytest
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.audit import AuditLog
from backend.app.auth import get_password_hash, create_access_token

@pytest.fixture
def profile_setup():
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

    pwd = get_password_hash("mahasetu123")

    citizen = User(
        id="CIT-PROF-001",
        name="Sunita Patil",
        mobile="9822001122",
        email="sunita@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    admin = User(
        id="ADM-PROF-001",
        name="State Admin",
        mobile="7711001122",
        email="admin@mahasetu.gov.in",
        role="ADMIN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    auditor = User(
        id="AUD-PROF-001",
        name="State Auditor",
        mobile="6611001122",
        email="auditor@audit.gov.in",
        role="AUDITOR",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    dept_b = User(
        id="DEPTB-PROF-001",
        name="Dept B Officer",
        mobile="8822001122",
        email="dept_b@eligibility.gov.in",
        role="DEPARTMENT_B",
        department_id="DEPT_B",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    db.add_all([citizen, admin, auditor, dept_b])
    db.commit()

    tokens = {
        "citizen": create_access_token({"sub": citizen.id, "role": citizen.role, "name": citizen.name}),
        "admin": create_access_token({"sub": admin.id, "role": admin.role, "name": admin.name}),
        "auditor": create_access_token({"sub": auditor.id, "role": auditor.role, "name": auditor.name}),
        "dept_b": create_access_token({"sub": dept_b.id, "role": dept_b.role, "name": dept_b.name}),
    }

    client = TestClient(app)
    yield client, tokens, db, citizen, dept_b

    db.close()
    app.dependency_overrides.clear()
    engine.dispose()
    try:
        os.unlink(temp_db.name)
    except Exception:
        pass

def test_resident_profile_crud_and_computed_age(profile_setup):
    client, tokens, db, citizen, _ = profile_setup
    headers = {"Authorization": f"Bearer {tokens['citizen']}"}

    # 1. Update own profile
    update_res = client.put("/api/citizens/me/profile", json={
        "legal_name": "Sunita Ramesh Patil",
        "date_of_birth": "1995-05-15",
        "gender": "FEMALE",
        "marital_status": "MARRIED",
        "community_caste": "OBC",
        "district": "Pune",
        "city": "Haveli",
        "full_address": "Plot 42, Karve Road, Pune 411038",
        "aadhaar_number": "1234 5678 9012",
        "pan_number": "ABCDE1234F",
        "bank_name": "State Bank of India",
        "account_number": "98765432101234",
        "ifsc": "SBIN0001234"
    }, headers=headers)

    assert update_res.status_code == 200
    data = update_res.json()
    assert data["legal_name"] == "Sunita Ramesh Patil"
    assert data["age"] is not None
    assert data["age"] >= 28 # Computed age
    assert data["aadhaar_last_four"] == "9012"
    assert "XXXX" in data["account_number_masked"]
    assert data["account_number_masked"].endswith("1234")

    # 2. GET own profile
    get_res = client.get("/api/citizens/me/profile", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["district"] == "Pune"

def test_passport_pdf_upload_validation(profile_setup):
    client, tokens, db, _, _ = profile_setup
    headers = {"Authorization": f"Bearer {tokens['citizen']}"}

    # 1. Non-PDF upload should fail
    txt_file = ("document.txt", b"Hello Text File", "text/plain")
    res_txt = client.post("/api/citizens/me/passport-document", files={"file": txt_file}, headers=headers)
    assert res_txt.status_code == 400
    assert "application/pdf" in res_txt.json()["detail"]

    # 2. File exceeding 10 MB should fail
    oversized_bytes = b"%PDF-1.4 " + (b"0" * (11 * 1024 * 1024))
    res_large = client.post(
        "/api/citizens/me/passport-document",
        files={"file": ("large_passport.pdf", oversized_bytes, "application/pdf")},
        headers=headers
    )
    assert res_large.status_code == 413
    assert "10 MB" in res_large.json()["detail"]

    # 3. Valid PDF under 10 MB succeeds
    valid_pdf_bytes = b"%PDF-1.4 Mock PDF Content with Valid Header"
    res_valid = client.post(
        "/api/citizens/me/passport-document",
        files={"file": ("passport.pdf", valid_pdf_bytes, "application/pdf")},
        headers=headers
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "SUCCESS"
    assert "storage_path" in res_valid.json()

def test_field_level_authorization_and_audit(profile_setup):
    client, tokens, db, citizen, dept_b = profile_setup
    cit_headers = {"Authorization": f"Bearer {tokens['citizen']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    auditor_headers = {"Authorization": f"Bearer {tokens['auditor']}"}
    dept_b_headers = {"Authorization": f"Bearer {tokens['dept_b']}"}

    # Populate citizen profile with sensitive banking and identity info
    client.put("/api/citizens/me/profile", json={
        "legal_name": "Sunita Patil",
        "date_of_birth": "1995-05-15",
        "district": "Pune",
        "bank_name": "State Bank of India",
        "account_number": "112233445566"
    }, headers=cit_headers)

    # 1. Department B attempts to read citizen profile with NO active application -> 403
    res_no_app = client.get(f"/api/citizens/{citizen.id}/profile", headers=dept_b_headers)
    assert res_no_app.status_code == 403

    # 2. Create in-flight application assigned to DEPT_B with consent restricted to Identity & Address only (no banking)
    app = Application(
        application_number="MH-APP-2026-TESTB",
        citizen_id=citizen.id,
        service_id="employment-support",
        status="IDENTITY_VERIFIED",
        current_department="DEPT_B"
    )
    db.add(app)
    db.commit()

    consent = Consent(
        consent_number="CON-TEST-B",
        application_id=app.id,
        citizen_id=citizen.id,
        requested_by="Dept B",
        purpose="Eligibility check",
        data_categories=["Identity verification", "Address verification"], # Banking NOT consented
        status="AUTHORIZED"
    )
    db.add(consent)
    db.commit()

    # 3. Department B reads citizen profile -> Succeeds, but banking is filtered out!
    dept_res = client.get(f"/api/citizens/{citizen.id}/profile", headers=dept_b_headers)
    assert dept_res.status_code == 200
    filtered_data = dept_res.json()
    assert "identity" in filtered_data
    assert "address" in filtered_data
    assert "banking" not in filtered_data # Enforces field-level authorization per consent!

    # 4. Admin reads citizen profile -> Full access, and audit log generated
    admin_res = client.get(f"/api/citizens/{citizen.id}/profile", headers=admin_headers)
    assert admin_res.status_code == 200
    assert admin_res.json()["legal_name"] == "Sunita Patil"
    # Verify audit log entry
    audit_admin = db.query(AuditLog).filter(AuditLog.action == "CITIZEN_PROFILE_VIEWED").first()
    assert audit_admin is not None
    assert audit_admin.actor_id == "ADM-PROF-001"

    # 5. Auditor reads citizen profile -> Full access, and audit log generated
    auditor_res = client.get(f"/api/citizens/{citizen.id}/profile", headers=auditor_headers)
    assert auditor_res.status_code == 200
    audit_auditor = db.query(AuditLog).filter(AuditLog.action == "CITIZEN_PROFILE_AUDITED").first()
    assert audit_auditor is not None
    assert audit_auditor.actor_id == "AUD-PROF-001"
