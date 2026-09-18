import pytest
import os
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.metrics import metrics_service
from backend.app.services.feature_flags import feature_flags

client = TestClient(app)

def test_prometheus_metrics_endpoint():
    # Make a dummy request to trigger metric increment
    client.get("/api/v1/health")

    res = client.get("/metrics")
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    text = res.text

    assert "mahasetu_uptime_seconds" in text
    assert "mahasetu_cache_hits_total" in text
    assert "mahasetu_cache_misses_total" in text
    assert "http_requests_total" in text
    assert "http_request_duration_seconds_count" in text
    # Verify compliant EOF format
    assert text.endswith("\n")

def test_feature_flags_service_and_endpoint():
    # 1. API endpoint inspection
    res = client.get("/api/v1/platform/features")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    features = data["features"]
    assert "DEMO_PERSONAS" in features
    assert "SMS_NOTIFICATIONS" in features
    assert "PDF_RECEIPTS" in features
    assert "CSV_EXPORTS" in features

    # 2. Service override behavior
    feature_flags.set_override("TEST_EXPERIMENT", True)
    assert feature_flags.is_enabled("TEST_EXPERIMENT") is True

    feature_flags.set_override("TEST_EXPERIMENT", False)
    assert feature_flags.is_enabled("TEST_EXPERIMENT") is False

    feature_flags.clear_overrides()
    assert feature_flags.is_enabled("TEST_EXPERIMENT", default=False) is False

def test_metrics_service_recording():
    metrics_service.record_request("POST", "/api/v1/applications", 201, 0.045)
    metrics_service.record_cache_hit()
    metrics_service.record_cache_miss()
    metrics_service.record_dept_transaction("DEPT_A", "SUCCESS")

    exposition = metrics_service.generate_exposition()
    assert 'http_requests_total{method="POST",handler="/api/v1/applications",status="201"} 1' in exposition
    assert 'mahasetu_department_transactions_total{department="DEPT_A",status="SUCCESS"} 1' in exposition
