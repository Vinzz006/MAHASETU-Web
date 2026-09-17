import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.service import Service
from backend.app.auth import create_access_token

@pytest.fixture
def svc_env():
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

    admin = User(
        id="U-SVC-ADM",
        name="Admin User",
        email="admin@services.gov.in",
        mobile="9823999991",
        role="ADMIN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    citizen = User(
        id="U-SVC-CIT",
        name="Citizen User",
        email="citizen@services.gov.in",
        mobile="9823999992",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )

    session.add_all([admin, citizen])
    session.commit()

    client = TestClient(app)

    yield {
        "session": session,
        "client": client,
        "admin_token": create_access_token({"sub": admin.id, "role": admin.role}),
        "citizen_token": create_access_token({"sub": citizen.id, "role": citizen.role}),
        "db_path": temp_db.name
    }

    app.dependency_overrides.clear()
    session.close()
    if os.path.exists(temp_db.name):
        try:
            os.remove(temp_db.name)
        except Exception:
            pass

def test_services_crud_and_permissions(svc_env):
    client = svc_env["client"]
    adm_t = svc_env["admin_token"]
    cit_t = svc_env["citizen_token"]

    # 1. Public GET /api/services returns auto-seeded baseline
    r_list = client.get("/api/services")
    assert r_list.status_code == 200
    services = r_list.json()
    assert len(services) >= 4
    service_ids = [s["id"] for s in services]
    assert "employment-support" in service_ids

    # 2. Citizen tries to create a service -> 403 Forbidden
    new_svc = {
        "id": "solar-pump-subsidy",
        "name": "PM Kusum Solar Agriculture Pump Subsidy",
        "department": "Energy Department",
        "description": "Subsidized solar water pumps for rural agriculture.",
        "participating_departments": ["MSEDCL", "Agriculture Dept", "Treasury"],
        "sla_days": 10,
        "is_active": True
    }
    r_unauth = client.post(
        "/api/services",
        headers={"Authorization": f"Bearer {cit_t}"},
        json=new_svc
    )
    assert r_unauth.status_code == 403

    # 3. Admin creates the service -> 201 Created
    r_create = client.post(
        "/api/services",
        headers={"Authorization": f"Bearer {adm_t}"},
        json=new_svc
    )
    assert r_create.status_code == 201
    created_data = r_create.json()
    assert created_data["id"] == "solar-pump-subsidy"
    assert created_data["sla_days"] == 10

    # 4. Admin updates the service -> 200 OK
    r_update = client.put(
        "/api/services/solar-pump-subsidy",
        headers={"Authorization": f"Bearer {adm_t}"},
        json={"sla_days": 5, "name": "PM Kusum Solar Agriculture Pump Subsidy (Expedited)"}
    )
    assert r_update.status_code == 200
    assert r_update.json()["sla_days"] == 5
    assert "Expedited" in r_update.json()["name"]

    # 5. Admin deletes the service -> 200 OK
    r_del = client.delete(
        "/api/services/solar-pump-subsidy",
        headers={"Authorization": f"Bearer {adm_t}"}
    )
    assert r_del.status_code == 200

    # Verify service is gone
    r_check = client.get("/api/services")
    remaining_ids = [s["id"] for s in r_check.json()]
    assert "solar-pump-subsidy" not in remaining_ids
