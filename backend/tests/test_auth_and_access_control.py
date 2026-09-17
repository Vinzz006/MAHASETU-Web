import pytest
import concurrent.futures
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import tempfile
import os

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.auth import get_password_hash, create_access_token

@pytest.fixture(scope="module")
def test_setup():
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()
    db_path = temp_db.name.replace("\\", "/")

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    # Seed users with bcrypt
    citizen_1 = User(
        id="CIT-TEST-001",
        name="Citizen Ramesh",
        mobile="9000000001",
        email="ramesh@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=get_password_hash("mahasetu123")
    )
    citizen_2 = User(
        id="CIT-TEST-002",
        name="Citizen Suresh",
        mobile="9000000002",
        email="suresh@citizen.gov.in",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=get_password_hash("mahasetu123")
    )
    officer = User(
        id="OFF-TEST-001",
        name="Officer Patil",
        mobile="8000000001",
        email="patil@officer.gov.in",
        role="OFFICER",
        department_id="DEPT_C",
        registration_status="APPROVED",
        hashed_password=get_password_hash("mahasetu123")
    )
    admin = User(
        id="ADM-TEST-001",
        name="Admin Deshmukh",
        mobile="7000000001",
        email="deshmukh@admin.gov.in",
        role="SYSTEM_ADMIN",
        registration_status="APPROVED",
        hashed_password=get_password_hash("mahasetu123")
    )
    db.add_all([citizen_1, citizen_2, officer, admin])
    db.commit()

    tokens = {
        "citizen_1": create_access_token({"sub": citizen_1.id, "role": citizen_1.role, "name": citizen_1.name}),
        "citizen_2": create_access_token({"sub": citizen_2.id, "role": citizen_2.role, "name": citizen_2.name}),
        "officer": create_access_token({"sub": officer.id, "role": officer.role, "name": officer.name}),
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

def test_password_verification_and_login(test_setup):
    client, tokens, db = test_setup

    # 1. Valid credentials
    res = client.post("/api/auth/login", json={"username": "9000000001", "password": "mahasetu123"})
    assert res.status_code == 200
    assert "access_token" in res.json()

    # 2. Wrong password returns 401
    res = client.post("/api/auth/login", json={"username": "9000000001", "password": "wrongpassword"})
    assert res.status_code == 401

    # 3. Bypass attempts fail (mock_hash or plain string)
    res = client.post("/api/auth/login", json={"username": "9000000001", "password": "mock_hash"})
    assert res.status_code == 401

def test_missing_token_returns_401(test_setup):
    client, tokens, db = test_setup

    # Calling protected routes with NO Authorization header returns 401
    assert client.get("/api/dashboard/metrics").status_code == 401
    assert client.get("/api/dashboard/exceptions").status_code == 401
    assert client.get("/api/applications").status_code == 401
    assert client.post("/api/applications", json={
        "service_id": "farmer-dbt",
        "citizen_name": "Test",
        "mobile": "9999999999"
    }).status_code == 401
    assert client.get("/api/key-rotation/ring-status").status_code == 401

def test_rbac_officer_and_admin_routes(test_setup):
    client, tokens, db = test_setup
    citizen_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}
    officer_headers = {"Authorization": f"Bearer {tokens['officer']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

    # Citizen accessing officer routes -> 403
    assert client.get("/api/dashboard/metrics", headers=citizen_headers).status_code == 403
    assert client.get("/api/dashboard/exceptions", headers=citizen_headers).status_code == 403
    assert client.get("/api/dashboard/audit-logs", headers=citizen_headers).status_code == 403
    assert client.get("/api/dashboard/schema-assistant", headers=citizen_headers).status_code == 403
    assert client.get("/api/key-rotation/ring-status", headers=citizen_headers).status_code == 403

    # Officer accessing officer routes -> 200
    assert client.get("/api/dashboard/metrics", headers=officer_headers).status_code == 200
    assert client.get("/api/dashboard/exceptions", headers=officer_headers).status_code == 200
    assert client.get("/api/dashboard/audit-logs", headers=officer_headers).status_code == 200
    # Officer accessing system_admin only route -> 403
    assert client.get("/api/dashboard/schema-assistant", headers=officer_headers).status_code == 403
    assert client.get("/api/key-rotation/ring-status", headers=officer_headers).status_code == 403

    # Admin accessing system_admin routes -> 200
    assert client.get("/api/dashboard/metrics", headers=admin_headers).status_code == 200
    assert client.get("/api/dashboard/schema-assistant", headers=admin_headers).status_code == 200
    assert client.get("/api/key-rotation/ring-status", headers=admin_headers).status_code == 200

def test_citizen_object_level_ownership(test_setup):
    client, tokens, db = test_setup
    c1_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}
    c2_headers = {"Authorization": f"Bearer {tokens['citizen_2']}"}
    officer_headers = {"Authorization": f"Bearer {tokens['officer']}"}

    # Citizen 1 creates an application
    create_res = client.post("/api/applications", json={
        "service_id": "employment-support",
        "citizen_name": "Applicant One",
        "mobile": "9876543210",
        "dob": "1995-01-01",
        "district": "Pune",
        "annual_income": 120000,
        "employment_status": "UNEMPLOYED"
    }, headers=c1_headers)
    assert create_res.status_code == 200
    app_id = create_res.json()["id"]

    # Citizen 1 can view own application
    res_c1 = client.get(f"/api/applications/{app_id}", headers=c1_headers)
    assert res_c1.status_code == 200

    # Citizen 2 CANNOT view Citizen 1's application -> 403
    res_c2 = client.get(f"/api/applications/{app_id}", headers=c2_headers)
    assert res_c2.status_code == 403

    # Officer CANNOT view Citizen 1's application without authorized consent and assigned department -> 403
    res_off_unauth = client.get(f"/api/applications/{app_id}", headers=officer_headers)
    assert res_off_unauth.status_code == 403

    # Grant and authorize consent, and assign application to officer's department (DEPT_C)
    consent = Consent(
        id="c-auth-test-01",
        consent_number="MH-CON-TEST-001",
        application_id=app_id,
        citizen_id="CIT-AUTH-001",
        requested_by="Employment Department (DEPT_C)",
        purpose="Employment Verification",
        status="AUTHORIZED",
        data_categories=["IDENTITY", "EMPLOYMENT"]
    )
    db.add(consent)
    app_record = db.query(Application).filter(Application.id == app_id).first()
    app_record.current_department = "DEPT_C"
    db.commit()

    # Officer CAN now view Citizen 1's application -> 200
    res_off = client.get(f"/api/applications/{app_id}", headers=officer_headers)
    assert res_off.status_code == 200

def test_submitted_identity_reflection(test_setup):
    client, tokens, db = test_setup
    c1_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}

    create_res = client.post("/api/applications", json={
        "service_id": "farmer-dbt",
        "citizen_name": "Farmer Test Name",
        "mobile": "9123456780",
        "dob": "1988-08-18",
        "district": "Kolhapur",
        "annual_income": 150000,
        "employment_status": "FARMER"
    }, headers=c1_headers)
    assert create_res.status_code == 200
    data = create_res.json()
    assert data["citizen_name"] == "Farmer Test Name"
    assert data["citizen_mobile"] == "9123456780"

    # Fetch detail
    detail_res = client.get(f"/api/applications/{data['id']}", headers=c1_headers)
    assert detail_res.json()["citizen_name"] == "Farmer Test Name"
    assert detail_res.json()["citizen_mobile"] == "9123456780"

def test_service_name_resolution(test_setup):
    client, tokens, db = test_setup
    c1_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}

    services_expected = [
        ("employment-support", "Maharashtra Employment & Skill Assistance Scheme"),
        ("farmer-dbt", "MahaDBT Farmer Agricultural Assistance"),
        ("urban-housing", "Maharashtra Urban Affordable Housing Grant"),
        ("smart-ration", "Unified Food Security & Ration Card Portability"),
    ]

    for svc_id, expected_name in services_expected:
        res = client.post("/api/applications", json={
            "service_id": svc_id,
            "citizen_name": f"Applicant for {svc_id}",
            "mobile": "9999999999",
            "dob": "1992-03-21",
            "district": "Pune"
        }, headers=c1_headers)
        assert res.status_code == 200
        assert res.json()["service_name"] == expected_name

def test_20_concurrent_unique_application_numbers(test_setup):
    client, tokens, db = test_setup
    c1_headers = {"Authorization": f"Bearer {tokens['citizen_1']}"}

    def post_app(i):
        return client.post("/api/applications", json={
            "service_id": "employment-support",
            "citizen_name": f"Concurrent User {i}",
            "mobile": f"90000000{i:02d}",
            "dob": "1990-10-10",
            "district": "Pune"
        }, headers=c1_headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(post_app, i) for i in range(20)]
        results = [f.result() for f in futures]

    assert all(r.status_code == 200 for r in results)
    app_numbers = [r.json()["application_number"] for r in results]
    assert len(app_numbers) == 20
    assert len(set(app_numbers)) == 20, "Expected all 20 application numbers to be unique"
    for num in app_numbers:
        assert num.startswith("MH-APP-2026-")
