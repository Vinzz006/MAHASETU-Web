import os
import pytest
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.auth import get_password_hash, create_access_token

@pytest.fixture
def auth_setup():
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

    admin = User(
        id="ADM-TEST-999",
        name="State Admin",
        mobile="7700000001",
        email="admin@mahasetu.gov.in",
        role="ADMIN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    auditor = User(
        id="AUD-TEST-999",
        name="State Auditor",
        mobile="6600000001",
        email="auditor@audit.gov.in",
        role="AUDITOR",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    dept_a = User(
        id="DEPTA-TEST-999",
        name="Dept A Officer",
        mobile="8800000001",
        email="officer.a@identity.gov.in",
        role="DEPARTMENT_A",
        department_id="DEPT_A",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    db.add_all([admin, auditor, dept_a])
    db.commit()

    tokens = {
        "admin": create_access_token({"sub": admin.id, "role": admin.role, "name": admin.name}),
        "auditor": create_access_token({"sub": auditor.id, "role": auditor.role, "name": auditor.name}),
        "dept_a": create_access_token({"sub": dept_a.id, "role": dept_a.role, "name": dept_a.name}),
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

def test_citizen_registration_and_pending_approval_flow(auth_setup):
    client, tokens, db = auth_setup

    # 1. Citizen registers
    reg_res = client.post("/api/auth/register", json={
        "name": "Sunita Patil",
        "mobile": "9811223344",
        "email": "sunita.patil@example.com",
        "password": "mypassword123",
        "role": "CITIZEN"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert data["registration_status"] == "PENDING"
    user_id = data["id"]

    # 2. Login with registered credentials returns token
    login_res = client.post("/api/auth/login", json={
        "username": "9811223344",
        "password": "mypassword123"
    })
    assert login_res.status_code == 200
    pending_token = login_res.json()["access_token"]
    pending_headers = {"Authorization": f"Bearer {pending_token}"}

    # 3. Status check (/api/auth/me) works and shows PENDING
    me_res = client.get("/api/auth/me", headers=pending_headers)
    assert me_res.status_code == 200
    assert me_res.json()["registration_status"] == "PENDING"

    # 4. Access to protected routes returns 403 (pending approval)
    apps_res = client.get("/api/applications", headers=pending_headers)
    assert apps_res.status_code == 403
    assert "pending" in apps_res.json()["detail"].lower()

    # 5. Non-admin cannot view pending registrations
    non_admin_res = client.get("/api/auth/registrations/pending", headers=pending_headers)
    assert non_admin_res.status_code == 403

    # 6. Admin can view pending registrations
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    pending_list_res = client.get("/api/auth/registrations/pending", headers=admin_headers)
    assert pending_list_res.status_code == 200
    pending_items = pending_list_res.json()
    assert any(item["id"] == user_id for item in pending_items)

    # 7. Admin approves registration
    approve_res = client.post(f"/api/auth/registrations/{user_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["registration_status"] == "APPROVED"

    # 8. Now citizen can access protected routes
    apps_after_approve = client.get("/api/applications", headers=pending_headers)
    assert apps_after_approve.status_code == 200

def test_admin_rejection_flow(auth_setup):
    client, tokens, db = auth_setup
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

    reg_res = client.post("/api/auth/register", json={
        "name": "Invalid User",
        "mobile": "9900112233",
        "email": "invalid@example.com",
        "password": "StrongPassword123!",
        "role": "CITIZEN"
    })
    assert reg_res.status_code == 200
    user_id = reg_res.json()["id"]

    reject_res = client.post(
        f"/api/auth/registrations/{user_id}/reject",
        json={"reason": "Incomplete documentation provided"},
        headers=admin_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert reject_res.json()["rejection_reason"] == "Incomplete documentation provided"

def test_firebase_token_auth_path(auth_setup):
    client, tokens, db = auth_setup

    # Register user with mock Firebase token in demo mode
    reg_res = client.post("/api/auth/register", json={
        "firebase_token": "fb_mock_user_123",
        "name": "Firebase User",
        "mobile": "9123456789",
        "email": "fbuser@citizen.gov.in",
        "password": "StrongPassword123!",
        "role": "CITIZEN"
    })
    assert reg_res.status_code == 200
    user_id = reg_res.json()["id"]

    # Approve by admin
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    client.post(f"/api/auth/registrations/{user_id}/approve", headers=admin_headers)

    # Authenticate directly using the Firebase ID token in Authorization header
    fb_headers = {"Authorization": "Bearer fb_mock_user_123"}
    me_res = client.get("/api/auth/me", headers=fb_headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Firebase User"
