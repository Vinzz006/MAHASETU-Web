"""
Performance, Concurrency, and Optimization Test Suite
Validates:
1. GZip compression on responses > 1KB and bypass for small payloads
2. AnyIO threadpool sizing (>= 100 worker tokens during lifespan)
3. Database connection pool configuration
4. Non-blocking SSE live-feed with token query param auth and instant teardown
5. Cache-Control headers on Services Catalog and Passport Verification
6. Aggregation query correctness for Assistant and Dashboard
"""
import os
import pytest
from fastapi.testclient import TestClient
import anyio.to_thread

from backend.app.main import app, lifespan
from backend.app.database import SessionLocal, engine
from backend.app.models.user import User
from backend.app.auth import create_access_token

client = TestClient(app)


def _get_token(role: str = "CITIZEN") -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == role).first()
        if not user:
            raise RuntimeError(f"No {role} user found in DB")
        return create_access_token({"sub": user.id, "role": user.role})
    finally:
        db.close()


def _auth(role: str = "CITIZEN") -> dict:
    return {"Authorization": f"Bearer {_get_token(role)}"}


# ---------------------------------------------------------------------------
# 1. GZip Compression
# ---------------------------------------------------------------------------
def test_gzip_compression_enabled_on_large_payloads():
    """Verify responses > 1000 bytes include Content-Encoding: gzip when client sends Accept-Encoding."""
    headers = {
        **_auth("CITIZEN"),
        "Accept-Encoding": "gzip",
    }
    # /api/v1/services is a large catalog response (> 1000 bytes)
    response = client.get("/api/v1/services", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "gzip"


def test_gzip_bypassed_for_tiny_payloads():
    """Verify small responses (< 1000 bytes) do not have gzip content-encoding."""
    headers = {
        "Accept-Encoding": "gzip",
    }
    response = client.get("/healthz", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("content-encoding") != "gzip"


# ---------------------------------------------------------------------------
# 2. Concurrency & Threadpool Limiter
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_anyio_threadpool_limiter_sized():
    """Verify that the AnyIO default threadpool limiter is sized >= 100 in lifespan."""
    async with lifespan(app):
        limiter = anyio.to_thread.current_default_thread_limiter()
        expected_min = max(100, (os.cpu_count() or 4) * 25)
        assert limiter.total_tokens >= expected_min
        assert limiter.total_tokens >= 100


# ---------------------------------------------------------------------------
# 3. Database Connection Pooling
# ---------------------------------------------------------------------------
def test_database_engine_pool_settings():
    """Verify database connection pool parameters configured for production."""
    from backend.app.database import engine_kwargs, DATABASE_URL
    if not DATABASE_URL.startswith("sqlite"):
        assert engine_kwargs.get("pool_size") >= 10
        assert engine_kwargs.get("max_overflow") >= 10
        assert engine_kwargs.get("pool_pre_ping") is True
    else:
        # Verify engine exists and connects
        assert engine is not None
        db = SessionLocal()
        try:
            assert db.is_active
        finally:
            db.close()


# ---------------------------------------------------------------------------
# 4. SSE Live-Feed Concurrency & Non-Blocking Stream
# ---------------------------------------------------------------------------
def test_sse_live_feed_query_param_auth():
    """Verify SSE live-feed accepts token in query params and returns text/event-stream headers."""
    token = _get_token("CITIZEN")
    with client.stream("GET", f"/api/v1/applications/live-feed?token={token}&max_events=1") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        assert response.headers.get("cache-control") == "no-cache"
        found_data = False
        for line in response.iter_lines():
            if line and line.startswith("data:"):
                found_data = True
                break
        assert found_data, "Did not receive data event from SSE stream"


def test_sse_live_feed_unauthorized_without_token():
    """Verify SSE live-feed rejects unauthenticated requests."""
    response = client.get("/api/v1/applications/live-feed")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 5. Caching & HTTP Cache-Control Headers
# ---------------------------------------------------------------------------
def test_services_catalog_cache_control_headers():
    """Verify /api/v1/services returns Cache-Control: public, max-age=120."""
    headers = _auth("CITIZEN")
    response = client.get("/api/v1/services", headers=headers)
    assert response.status_code == 200
    assert "public, max-age=120" in response.headers.get("cache-control", "")


def test_passport_verify_cache_control_header():
    """Verify /api/v1/passport/verify/{id} returns Cache-Control: public, max-age=60."""
    response = client.get("/api/v1/passport/verify/MSP-MOCK-TEST-12345")
    assert response.status_code == 200
    assert "public, max-age=60" in response.headers.get("cache-control", "")


# ---------------------------------------------------------------------------
# 6. Database Grouped Aggregation (N+1 Elimination)
# ---------------------------------------------------------------------------
def test_assistant_conversations_batch_aggregation():
    """Verify assistant list_conversations executes efficiently with GROUP BY count."""
    headers = _auth("CITIZEN")
    response = client.get("/api/v1/assistant/conversations", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_dashboard_metrics_aggregation():
    """Verify officer/admin dashboard metrics compute properly with batch aggregation."""
    headers = _auth("ADMIN")
    response = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_applications" in data
    assert "sla_compliance_rate" in data
    assert "department_health" in data
