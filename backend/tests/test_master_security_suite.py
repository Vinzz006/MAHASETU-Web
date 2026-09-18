import os
import io
import pytest
import tempfile
from unittest.mock import patch, MagicMock
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
from backend.app.models.assistant import AssistantConversation, AssistantMessage
from backend.app.auth import get_password_hash, create_access_token, _expand_roles
from backend.app.services.audit import create_audit_log
from backend.app.services.rate_limiter import assistant_rate_limiter
from backend.app.services.assistant import generate_assistant_response

@pytest.fixture
def sec_suite_setup():
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

    pwd = get_password_hash("ValidP@ssw0rd123!")

    citizen_1 = User(
        id="CIT-SUITE-001",
        name="Ananya Sharma",
        mobile="9811111111",
        email="ananya@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    citizen_2 = User(
        id="CIT-SUITE-002",
        name="Vikram Joshi",
        mobile="9822222222",
        email="vikram@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    dept_a = User(
        id="DEPTA-SUITE-001",
        name="Dept A Officer",
        mobile="8811111111",
        email="officer.a@dept.gov.in",
        role="DEPARTMENT_A",
        department_id="DEPT_A",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    auditor = User(
        id="AUD-SUITE-001",
        name="Chief Auditor",
        mobile="6611111111",
        email="auditor@state.gov.in",
        role="AUDITOR",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    sys_admin = User(
        id="SYSADMIN-SUITE-001",
        name="Super Admin",
        mobile="7711111111",
        email="superadmin@mahasetu.gov.in",
        role="SYSTEM_ADMIN",
        registration_status="APPROVED",
        hashed_password=pwd
    )

    db.add_all([citizen_1, citizen_2, dept_a, auditor, sys_admin])
    db.commit()

    tokens = {
        "citizen_1": create_access_token({"sub": citizen_1.id, "role": citizen_1.role, "name": citizen_1.name}),
        "citizen_2": create_access_token({"sub": citizen_2.id, "role": citizen_2.role, "name": citizen_2.name}),
        "dept_a": create_access_token({"sub": dept_a.id, "role": dept_a.role, "name": dept_a.name}),
        "auditor": create_access_token({"sub": auditor.id, "role": auditor.role, "name": auditor.name}),
        "sys_admin": create_access_token({"sub": sys_admin.id, "role": sys_admin.role, "name": sys_admin.name}),
    }

    client = TestClient(app)
    yield client, tokens, db, TestingSessionLocal

    db.close()
    app.dependency_overrides.clear()
    engine.dispose()
    try:
        os.unlink(temp_db.name)
    except Exception:
        pass


def test_personas_strictly_system_admin(sec_suite_setup):
    """Section 2.1: /api/auth/personas strictly requires SYSTEM_ADMIN, rejects others."""
    client, tokens, db, _ = sec_suite_setup

    # Anonymous -> 401
    res_anon = client.get("/api/auth/personas")
    assert res_anon.status_code == 401

    # Citizen -> 403
    res_cit = client.get("/api/auth/personas", headers={"Authorization": f"Bearer {tokens['citizen_1']}"})
    assert res_cit.status_code == 403

    # Officer -> 403
    res_off = client.get("/api/auth/personas", headers={"Authorization": f"Bearer {tokens['dept_a']}"})
    assert res_off.status_code == 403

    # Auditor -> 403
    res_aud = client.get("/api/auth/personas", headers={"Authorization": f"Bearer {tokens['auditor']}"})
    assert res_aud.status_code == 403

    # SYSTEM_ADMIN -> 200
    res_sys = client.get("/api/auth/personas", headers={"Authorization": f"Bearer {tokens['sys_admin']}"})
    assert res_sys.status_code == 200
    assert isinstance(res_sys.json(), list)


def test_personas_disabled_in_prod_mode(sec_suite_setup):
    """Section 2.1: In production mode (DEMO_MODE=false), /personas is disabled and returns 404."""
    client, tokens, db, _ = sec_suite_setup
    old_demo = os.environ.get("DEMO_MODE")
    try:
        os.environ["DEMO_MODE"] = "false"
        res = client.get("/api/auth/personas", headers={"Authorization": f"Bearer {tokens['sys_admin']}"})
        assert res.status_code == 404
    finally:
        if old_demo is not None:
            os.environ["DEMO_MODE"] = old_demo


def test_public_registration_forces_citizen_and_pending(sec_suite_setup):
    """Section 1.2 & 1.3: Self-registration always creates CITIZEN with PENDING status."""
    client, _, db, _ = sec_suite_setup

    reg_payload = {
        "name": "Self Registered User",
        "mobile": "9912345678",
        "email": "selfreg@citizen.gov.in",
        "password": "StrongPassword123!",
        "role": "SYSTEM_ADMIN"  # Attempt to elevate role
    }

    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "CITIZEN"
    assert data["registration_status"] == "PENDING"

    # Confirm in DB
    created = db.query(User).filter(User.email == "selfreg@citizen.gov.in").first()
    assert created is not None
    assert created.role == "CITIZEN"
    assert created.registration_status == "PENDING"


def test_registration_password_complexity(sec_suite_setup):
    """Section 2.4: Registration rejects weak or short passwords."""
    client, _, _, _ = sec_suite_setup

    # Too short (< 8 chars)
    res_short = client.post("/api/auth/register", json={
        "name": "Weak User",
        "mobile": "9900000001",
        "email": "short@citizen.gov.in",
        "password": "pwd1"
    })
    assert res_short.status_code == 422

    # Missing numeric digits
    res_no_digits = client.post("/api/auth/register", json={
        "name": "Weak User",
        "mobile": "9900000002",
        "email": "nodigits@citizen.gov.in",
        "password": "LongPasswordWithoutNumbers"
    })
    assert res_no_digits.status_code == 422


def test_department_requires_consent_for_application(sec_suite_setup):
    """Section 2.5: Department role cannot access citizen application without active consent."""
    client, tokens, db, _ = sec_suite_setup
    c_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}
    dept_headers = {"Authorization": f"Bearer {tokens['dept_a']}"}

    # Citizen creates application
    app_res = client.post("/api/applications", json={
        "service_id": "farmer-dbt",
        "citizen_name": "Ananya Sharma",
        "mobile": "9811111111",
        "dob": "1995-08-20",
        "district": "Pune",
        "annual_income": 95000,
        "employment_status": "FARMER"
    }, headers=c_headers)
    assert app_res.status_code == 200
    app_id = app_res.json()["id"]

    # Dept A attempts access without consent -> 403 Forbidden
    denied = client.get(f"/api/applications/{app_id}", headers=dept_headers)
    assert denied.status_code == 403

    # Verify denial audit log
    denial_log = db.query(AuditLog).filter(
        AuditLog.action == "APPLICATION_ACCESS_DENIED_DEPARTMENT_UNAUTHORIZED",
        AuditLog.application_id == app_id
    ).first()
    assert denial_log is not None


def test_passport_path_traversal_defense(sec_suite_setup):
    """Section 2.6: Path traversal (../../) in passport download is rejected with 403 and logged."""
    client, tokens, db, _ = sec_suite_setup
    c_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}

    # Upload valid PDF
    pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"
    upload = client.post(
        "/api/citizens/me/passport-document",
        files={"file": ("doc.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=c_headers
    )
    assert upload.status_code == 200

    # Path traversal attack
    traversal_res = client.get(
        "/api/citizens/me/passport-document/download?path=../../residents/CIT-SUITE-002/passports/secret.pdf",
        headers=c_headers
    )
    assert traversal_res.status_code == 403

    # Confirm audit log records the traversal attempt
    trav_log = db.query(AuditLog).filter(
        AuditLog.action == "PASSPORT_DOCUMENT_ACCESS_DENIED_PATH_TRAVERSAL",
        AuditLog.actor_id == "CIT-SUITE-001"
    ).first()
    assert trav_log is not None


def test_assistant_conversation_isolation(sec_suite_setup):
    """Section 1A.6: Citizens cannot access or inject messages into another citizen's conversation."""
    client, tokens, db, _ = sec_suite_setup
    c1_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}
    c2_headers = {"Authorization": f"Bearer {tokens['citizen_2']}"}

    # Citizen 1 initiates conversation
    res1 = client.post("/api/assistant/chat", json={"message": "What is my scheme status?"}, headers=c1_headers)
    assert res1.status_code == 200
    conv_id = res1.json()["conversation_id"]

    # Citizen 1 can retrieve details
    detail_c1 = client.get(f"/api/assistant/conversations/{conv_id}", headers=c1_headers)
    assert detail_c1.status_code == 200

    # Citizen 2 attempts to retrieve Citizen 1's conversation -> 404
    detail_c2 = client.get(f"/api/assistant/conversations/{conv_id}", headers=c2_headers)
    assert detail_c2.status_code == 404

    # Citizen 2 attempts to send message into Citizen 1's conversation -> 404
    post_c2 = client.post(
        "/api/assistant/chat",
        json={"conversation_id": conv_id, "message": "Injected attack query"},
        headers=c2_headers
    )
    assert post_c2.status_code == 404


def test_assistant_error_returns_generic_message():
    """Section 1A.4: Any provider exception returns a generic safe message, not raw trace."""
    old_demo = os.environ.get("DEMO_MODE")
    old_key = os.environ.get("GEMINI_API_KEY")
    try:
        os.environ["DEMO_MODE"] = "false"
        os.environ["GEMINI_API_KEY"] = "test-mock-gemini-key"
        with patch("google.genai.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.models.generate_content.side_effect = Exception("Internal API Timeout 504 Gateway Error")
            mock_client_cls.return_value = mock_client

            response = generate_assistant_response(
                user_message="Hello",
                conversation_history=[],
                system_context="System Prompt",
                applications=[],
                services=[]
            )
            # Response must be generic and empathetic, never revealing the 504 or exception details
            assert "temporarily unavailable" in response.lower()
            assert "504" not in response
            assert "timeout" not in response.lower()
    finally:
        if old_demo is not None:
            os.environ["DEMO_MODE"] = old_demo
        if old_key is not None:
            os.environ["GEMINI_API_KEY"] = old_key
        else:
            os.environ.pop("GEMINI_API_KEY", None)
