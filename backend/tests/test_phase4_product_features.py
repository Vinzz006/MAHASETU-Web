import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.auth import create_access_token
from backend.app.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
import uuid
from datetime import datetime, timezone

client = TestClient(app)

def _get_auth_headers(role: str = "CITIZEN"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == role).first()
        if not user:
            user = User(
                id=f"TEST-{role}-{uuid.uuid4().hex[:4]}",
                name=f"Test {role}",
                email=f"{role.lower()}@test.mahasetu.gov.in",
                mobile=f"98{uuid.uuid4().hex[:8]}",
                role=role,
                registration_status="APPROVED",
                hashed_password="fake"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        token = create_access_token({"sub": user.id, "role": user.role, "name": user.name})
        return {"Authorization": f"Bearer {token}"}, user.id
    finally:
        db.close()

def test_export_applications_csv():
    headers, _ = _get_auth_headers("ADMIN")
    res = client.get("/api/v1/export/applications.csv", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "mahasetu_applications_" in res.headers["content-disposition"]
    csv_text = res.text
    assert "Application Number,Citizen Name,Citizen Mobile" in csv_text

def test_export_audit_logs_csv():
    headers, _ = _get_auth_headers("ADMIN")
    res = client.get("/api/v1/export/audit-logs.csv", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "mahasetu_audit_trail_" in res.headers["content-disposition"]
    csv_text = res.text
    assert "Log ID,Application ID,Actor ID,Action" in csv_text

def test_download_application_receipt_pdf():
    headers, citizen_id = _get_auth_headers("CITIZEN")
    db = SessionLocal()
    try:
        app_id = f"APP-TEST-{uuid.uuid4().hex[:6]}"
        app_record = Application(
            id=app_id,
            application_number=f"MH-{uuid.uuid4().hex[:8].upper()}",
            citizen_id=citizen_id,
            service_id="ES-001",
            status="COMPLETED",
            current_department="DEPT_C",
            citizen_data={"name": "Test Citizen"}
        )
        db.add(app_record)
        db.commit()

        res = client.get(f"/api/v1/passport/{app_id}/receipt.pdf", headers=headers)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert res.content.startswith(b"%PDF-1.4")
        assert b"%%EOF" in res.content
    finally:
        db.close()

def test_bulk_approve_registrations():
    headers, _ = _get_auth_headers("ADMIN")
    db = SessionLocal()
    try:
        user1_id = f"PENDING-{uuid.uuid4().hex[:6]}"
        user2_id = f"PENDING-{uuid.uuid4().hex[:6]}"
        u1 = User(
            id=user1_id,
            name="Pending User 1",
            email=f"{user1_id}@example.com",
            mobile=f"99{uuid.uuid4().hex[:8]}",
            role="CITIZEN",
            registration_status="PENDING",
            hashed_password="fake"
        )
        u2 = User(
            id=user2_id,
            name="Pending User 2",
            email=f"{user2_id}@example.com",
            mobile=f"98{uuid.uuid4().hex[:8]}",
            role="CITIZEN",
            registration_status="PENDING",
            hashed_password="fake"
        )
        db.add_all([u1, u2])
        db.commit()

        payload = {"user_ids": [user1_id, user2_id, "NON-EXISTENT"]}
        res = client.post(
            "/api/v1/auth/registrations/bulk-approve",
            json=payload,
            headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert data["approved_count"] == 2
        assert user1_id in data["approved_ids"]
        assert user2_id in data["approved_ids"]
        assert "NON-EXISTENT" in data["failed_ids"]
    finally:
        db.close()

def test_citizen_consent_history():
    headers, citizen_id = _get_auth_headers("CITIZEN")
    db = SessionLocal()
    try:
        # Create valid application first to satisfy foreign key
        app_id = f"APP-P4-{uuid.uuid4().hex[:6]}"
        app_obj = Application(
            id=app_id,
            application_number=f"MH-{uuid.uuid4().hex[:8].upper()}",
            citizen_id=citizen_id,
            service_id="ES-001",
            status="PROCESSING",
            current_department="DEPT_A",
            citizen_data={"name": "Test Citizen"}
        )
        db.add(app_obj)
        db.commit()

        cid = f"CON-{uuid.uuid4().hex[:6]}"
        consent = Consent(
            id=cid,
            consent_number=f"CN-{uuid.uuid4().hex[:6]}",
            application_id=app_id,
            citizen_id=citizen_id,
            requested_by="Department of Revenue",
            purpose="Land record verification",
            data_categories=["Land parcel ID", "District boundary"],
            status="AUTHORIZED",
            granted_at=datetime.now(timezone.utc)
        )
        db.add(consent)
        db.commit()

        res = client.get("/api/v1/consents/my-history", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        matches = [c for c in data if c["id"] == cid]
        assert len(matches) == 1
        assert matches[0]["purpose"] == "Land record verification"
        assert matches[0]["requested_by"] == "Department of Revenue"
    finally:
        db.close()
