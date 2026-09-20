import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import get_settings

client = TestClient(app)

def test_centralized_settings():
    settings = get_settings()
    assert settings.ENVIRONMENT is not None
    assert settings.DATABASE_URL is not None
    assert settings.JWT_SECRET is not None
    assert isinstance(settings.cors_origins_list, list)

def test_liveness_healthz():
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert "timestamp" in data

def test_readiness_readyz():
    res = client.get("/readyz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "READY"
    assert data["checks"]["database"] == "OK"

def test_api_v1_versioning_native():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.headers.get("X-API-Version") == "v1"
    assert res.headers.get("X-Request-ID") is not None
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["api_version"] == "v1"

def test_api_unversioned_backwards_compatibility():
    # Legacy unversioned endpoint /api/health should work transparently
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.headers.get("X-API-Version") == "v1"
    assert "deprecated" in res.headers.get("Deprecation", "").lower()
    data = res.json()
    assert data["status"] == "HEALTHY"

def test_request_correlation_id_propagation():
    custom_id = "req-test-tracing-correlation-12345"
    res = client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_id

def test_consistent_error_response_404():
    res = client.get("/api/v1/nonexistent-endpoint-test")
    assert res.status_code == 404
    assert res.headers.get("X-Request-ID") is not None
    data = res.json()
    assert "error" in data
    assert data["error"]["status_code"] == 404
    assert "request_id" in data["error"]

def test_consistent_error_response_422_validation():
    res = client.post("/api/v1/auth/register", json={"invalid": "payload"})
    assert res.status_code == 422
    assert res.headers.get("X-Request-ID") is not None
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["request_id"] is not None
    assert "fields" in data["error"]

def test_docker_compose_jwt_secret_not_hardcoded():
    from pathlib import Path
    compose_path = Path(__file__).resolve().parent.parent.parent / "docker-compose.yml"
    content = compose_path.read_text(encoding="utf-8")
    assert "mahasetu-hackathon-2026-interop-secret-key-pune" not in content
    assert "${JWT_SECRET}" in content
