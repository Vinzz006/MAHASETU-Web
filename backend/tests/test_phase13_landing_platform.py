"""
Phase 13 Tests: Premium Landing Page + Platform Stats API
- GET /api/platform/stats  — public, no auth, live DB counts
- GET /api/platform/architecture — public workflow pipeline definition
- GET /api/health — regression guard
- Validation: field presence, type correctness, turnaround metrics
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Test 1: Platform stats returns all expected fields
# ---------------------------------------------------------------------------
def test_platform_stats_fields():
    res = client.get("/api/platform/stats")
    assert res.status_code == 200, res.text
    data = res.json()
    required = [
        "total_applications", "completed_applications", "total_citizens",
        "total_consents", "active_departments", "phases_implemented",
        "total_modules", "turnaround_improvement_pct", "current_avg_days",
        "baseline_days", "districts_covered", "compliance", "timestamp",
    ]
    for field in required:
        assert field in data, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Test 2: Stats numeric values are sane
# ---------------------------------------------------------------------------
def test_platform_stats_numeric_validity():
    res = client.get("/api/platform/stats")
    assert res.status_code == 200
    d = res.json()
    assert d["total_applications"] >= d["completed_applications"] >= 0
    assert d["active_departments"] > 0
    assert d["phases_implemented"] >= 15          # should be 15+ by now
    assert d["total_modules"] >= 35
    assert 0 < d["turnaround_improvement_pct"] < 100
    assert 0 < d["current_avg_days"] < d["baseline_days"]
    assert d["districts_covered"] == 36
    assert isinstance(d["compliance"], list)
    assert len(d["compliance"]) >= 3


# ---------------------------------------------------------------------------
# Test 3: Platform architecture returns correct pipeline
# ---------------------------------------------------------------------------
def test_platform_architecture_pipeline():
    res = client.get("/api/platform/architecture")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "pipeline" in data
    assert len(data["pipeline"]) == 8

    for node in data["pipeline"]:
        assert "step" in node
        assert "name" in node
        assert "dept" in node
        assert "color" in node


# ---------------------------------------------------------------------------
# Test 4: Architecture pipeline steps are sequential 1-8
# ---------------------------------------------------------------------------
def test_platform_architecture_sequential_steps():
    res = client.get("/api/platform/architecture")
    assert res.status_code == 200
    pipeline = res.json()["pipeline"]
    steps = [n["step"] for n in pipeline]
    assert steps == list(range(1, 9)), f"Steps not sequential: {steps}"


# ---------------------------------------------------------------------------
# Test 5: Health check still responds (regression)
# ---------------------------------------------------------------------------
def test_health_check_regression():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "core_mission" in data
