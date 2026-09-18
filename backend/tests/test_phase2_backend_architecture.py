import pytest
import time
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.cache import cache
from backend.app.services.sms import send_sms_sync, dispatch_background_sms
from backend.app.auth import create_access_token
from backend.app.database import SessionLocal
from backend.app.models.user import User

client = TestClient(app)

def _get_auth_headers(role: str = "CITIZEN", user_id: str = "CIT-TEST-001"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == role).first()
        uid = user.id if user else user_id
        token = create_access_token({"sub": uid, "role": role})
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()

def test_cache_layer_basic_operations():
    cache.set("test:key", {"value": 42}, ttl_seconds=2)
    assert cache.get("test:key") == {"value": 42}
    cache.delete("test:key")
    assert cache.get("test:key") is None

def test_platform_stats_caching():
    # First call primes cache
    res1 = client.get("/api/v1/platform/stats")
    assert res1.status_code == 200
    data1 = res1.json()

    # Second call should come from cache
    res2 = client.get("/api/v1/platform/stats")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data1["timestamp"] == data2["timestamp"]

def test_sms_service_with_retry():
    # In DEMO_MODE, send_sms_sync should succeed gracefully
    res = send_sms_sync("9999999999", "Test SMS verification message")
    assert res is True

def test_applications_pagination():
    headers = _get_auth_headers("ADMIN")
    res = client.get("/api/v1/applications?page=1&page_size=2", headers=headers)
    assert res.status_code == 200
    assert "X-Total-Count" in res.headers
    assert res.headers["X-Page"] == "1"
    assert res.headers["X-Page-Size"] == "2"
    items = res.json()
    assert len(items) <= 2

def test_citizens_pagination():
    headers = _get_auth_headers("ADMIN")
    res = client.get("/api/v1/citizens?page=1&page_size=5", headers=headers)
    assert res.status_code == 200
    assert "X-Total-Count" in res.headers
    assert res.headers["X-Page"] == "1"
    items = res.json()
    assert len(items) <= 5

def test_idempotency_key_replay():
    headers = _get_auth_headers("CITIZEN")
    idempotency_key = f"idem-key-{time.time()}"
    headers["Idempotency-Key"] = idempotency_key

    payload = {
        "service_id": "caste-validity-certificate",
        "citizen_name": "Idempotent Citizen",
        "mobile": "9876543210",
        "dob": "1995-05-15",
        "district": "Pune",
        "annual_income": 150000,
        "employment_status": "EMPLOYED"
    }

    # First request creates application
    res1 = client.post("/api/v1/applications", json=payload, headers=headers)
    assert res1.status_code == 200
    app1 = res1.json()
    app_num1 = app1["application_number"]

    # Second request with SAME Idempotency-Key must return identical response without duplicate creation
    res2 = client.post("/api/v1/applications", json=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.headers.get("X-Idempotent-Replay") == "true"
    app2 = res2.json()
    assert app2["application_number"] == app_num1
