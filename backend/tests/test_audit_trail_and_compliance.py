import csv
import io
import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.auth import create_access_token, get_password_hash
from backend.app.services.audit import create_audit_log, verify_audit_log_integrity

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def audit_setup():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    pwd = get_password_hash("testpass123")

    auditor = User(
        id="AUD-CAG-001",
        name="CAG State Auditor",
        mobile="9800000001",
        email="auditor@cag.gov.in",
        role="AUDITOR",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    admin = User(
        id="ADM-SEC-001",
        name="Chief IT Secretary",
        mobile="9800000002",
        email="admin@it.gov.in",
        role="ADMIN",
        registration_status="APPROVED",
        hashed_password=pwd
    )
    citizen = User(
        id="CIT-PUN-001",
        name="Sachin Tendulkar",
        mobile="9800000003",
        email="sachin@gmail.com",
        role="CITIZEN",
        registration_status="APPROVED",
        hashed_password=pwd
    )

    db.add_all([auditor, admin, citizen])
    db.commit()

    # Seed diverse audit logs with tamper hashes
    log1 = create_audit_log(
        db=db,
        actor_id=citizen.id,
        action="APPLICATION_CREATED",
        resource="APPLICATION",
        application_id="APP-MH-001",
        metadata={"scheme": "Employment Assistance", "district": "Pune"}
    )
    log2 = create_audit_log(
        db=db,
        actor_id=citizen.id,
        action="CONSENT_GRANTED",
        resource="CONSENT",
        application_id="APP-MH-001",
        metadata={"departments": ["DEPT_A", "DEPT_B", "DEPT_C"]}
    )
    log3 = create_audit_log(
        db=db,
        actor_id="DEPTA-OFF-01",
        action="IDENTITY_VERIFIED",
        resource="DEPT_A",
        application_id="APP-MH-001",
        metadata={"match_score": 0.994}
    )
    log4 = create_audit_log(
        db=db,
        actor_id=admin.id,
        action="ADMIN_APPROVED",
        resource="ADMIN",
        application_id="APP-MH-001",
        metadata={"signoff_tier": "STATE_SECRETARIAT"}
    )
    log5 = create_audit_log(
        db=db,
        actor_id=auditor.id,
        action="AUDITOR_CONFIRMED",
        resource="AUDIT",
        application_id="APP-MH-001",
        metadata={"status": "STATUTORY_COMPLIANT"}
    )

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    tokens = {
        "auditor": create_access_token({"sub": auditor.id, "role": auditor.role, "name": auditor.name}),
        "admin": create_access_token({"sub": admin.id, "role": admin.role, "name": admin.name}),
        "citizen": create_access_token({"sub": citizen.id, "role": citizen.role, "name": citizen.name}),
    }

    yield {
        "client": client,
        "db": db,
        "tokens": tokens,
        "auditor": auditor,
        "admin": admin,
        "citizen": citizen,
        "logs": [log1, log2, log3, log4, log5]
    }

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_audit_trail_query_and_filters(audit_setup):
    client = audit_setup["client"]
    headers = {"Authorization": f"Bearer {audit_setup['tokens']['auditor']}"}

    # 1. Fetch all logs
    res = client.get("/api/audit-logs", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 5
    assert len(data["logs"]) == 5

    # Check tamper verification and hash presence
    first_log = data["logs"][0]
    assert first_log["tamper_verified"] is True
    assert len(first_log["tamper_hash"]) == 64

    # 2. Filter by action
    res_filtered = client.get("/api/audit-logs?action=CONSENT_GRANTED", headers=headers)
    assert res_filtered.status_code == 200
    filtered_data = res_filtered.json()
    assert filtered_data["total"] == 1
    assert filtered_data["logs"][0]["action"] == "CONSENT_GRANTED"

    # 3. Filter by resource
    res_resource = client.get("/api/audit-logs?resource=DEPT_A", headers=headers)
    assert res_resource.status_code == 200
    assert res_resource.json()["total"] == 1

    # 4. Search query
    res_search = client.get("/api/audit-logs?search=Tendulkar", headers=headers)
    # actor_id is CIT-PUN-001, test searching for action or actor_id
    res_actor_search = client.get("/api/audit-logs?search=CIT-PUN", headers=headers)
    assert res_actor_search.status_code == 200
    assert res_actor_search.json()["total"] == 2

def test_audit_trail_role_access_control(audit_setup):
    client = audit_setup["client"]
    tokens = audit_setup["tokens"]

    # Auditor -> Allowed (200)
    res_auditor = client.get("/api/audit-logs", headers={"Authorization": f"Bearer {tokens['auditor']}"})
    assert res_auditor.status_code == 200

    # Admin -> Allowed (200)
    res_admin = client.get("/api/audit-logs", headers={"Authorization": f"Bearer {tokens['admin']}"})
    assert res_admin.status_code == 200

    # Citizen -> Forbidden (403)
    res_citizen = client.get("/api/audit-logs", headers={"Authorization": f"Bearer {tokens['citizen']}"})
    assert res_citizen.status_code == 403

    # Unauthenticated -> Unauthorized / Forbidden (401/403)
    res_anon = client.get("/api/audit-logs")
    assert res_anon.status_code in [401, 403]

def test_append_only_immutability(audit_setup):
    client = audit_setup["client"]
    headers = {"Authorization": f"Bearer {audit_setup['tokens']['admin']}"}
    log_id = audit_setup["logs"][0].id

    # Verify no PUT endpoint exists
    put_res = client.put(f"/api/audit-logs/{log_id}", json={"action": "TAMPERED"}, headers=headers)
    assert put_res.status_code in [404, 405]

    # Verify no PATCH endpoint exists
    patch_res = client.patch(f"/api/audit-logs/{log_id}", json={"action": "TAMPERED"}, headers=headers)
    assert patch_res.status_code in [404, 405]

    # Verify no DELETE endpoint exists
    del_res = client.delete(f"/api/audit-logs/{log_id}", headers=headers)
    assert del_res.status_code in [404, 405]

def test_audit_summary_scorecard(audit_setup):
    client = audit_setup["client"]
    headers = {"Authorization": f"Bearer {audit_setup['tokens']['auditor']}"}

    res = client.get("/api/audit-logs/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()

    assert summary["total_audit_events"] == 5
    assert summary["tamper_verification_rate"] == 100.0
    assert summary["statutory_compliance_status"] == "FULLY_COMPLIANT"
    assert "APPLICATION_CREATED" in summary["events_by_action"]
    assert "DEPT_A" in summary["events_by_resource"]

def test_csv_and_json_compliance_export(audit_setup):
    client = audit_setup["client"]
    headers = {"Authorization": f"Bearer {audit_setup['tokens']['auditor']}"}

    # 1. CSV Export
    res_csv = client.get("/api/audit-logs/export/csv", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "attachment" in res_csv.headers.get("content-disposition", "")
    assert ".csv" in res_csv.headers.get("content-disposition", "")

    csv_reader = csv.reader(io.StringIO(res_csv.text))
    rows = list(csv_reader)
    header = rows[0]
    assert "Timestamp_UTC" in header
    assert "Log_UUID" in header
    assert "Actor_ID" in header
    assert "SHA256_Tamper_Hash" in header
    assert "Integrity_Verified" in header
    assert len(rows) == 6 # 1 header + 5 rows

    # 2. JSON Export
    res_json = client.get("/api/audit-logs/export/json", headers=headers)
    assert res_json.status_code == 200
    assert "application/json" in res_json.headers["content-type"]
    data = res_json.json()
    assert "export_metadata" in data
    assert data["export_metadata"]["record_count"] == 5
    assert len(data["records"]) == 5
    assert data["records"][0]["tamper_verified"] is True
