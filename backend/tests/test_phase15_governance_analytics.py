"""
Phase 15 Tests: Governance Analytics API (MahaDrishti Intelligence Panel)
- GET /api/dashboard/analytics — cross-role KPIs, funnel, consent, SLA, districts
- Validates field presence, type correctness, funnel coherence, dept analytics
- Regression: /api/dashboard/metrics still works
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.user import User
from backend.app.auth import create_access_token

client = TestClient(app)


def _auth(role: str = "ADMIN") -> dict:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == role).first()
        if not user:
            raise RuntimeError(f"No {role} user in DB")
        token = create_access_token({"sub": user.id, "role": user.role})
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Test 1: Analytics endpoint returns all required top-level fields
# ---------------------------------------------------------------------------
def test_analytics_top_level_fields():
    res = client.get("/api/dashboard/analytics", headers=_auth("ADMIN"))
    assert res.status_code == 200, res.text
    data = res.json()
    required = [
        "summary", "funnel", "consent_compliance_pct", "authorized_consents",
        "total_consents", "sla_breaches", "sla_baseline_days",
        "transactions_last_hour", "department_analytics", "top_districts",
        "platform_health", "timestamp",
    ]
    for field in required:
        assert field in data, f"Missing top-level field: {field}"


# ---------------------------------------------------------------------------
# Test 2: Summary block fields and non-negative values
# ---------------------------------------------------------------------------
def test_analytics_summary_block():
    res = client.get("/api/dashboard/analytics", headers=_auth("ADMIN"))
    assert res.status_code == 200
    s = res.json()["summary"]
    required_summary = [
        "total_applications", "completed", "in_progress", "rework_required",
        "exceptions", "completion_rate_pct", "total_citizens", "total_staff",
        "avg_apps_per_citizen",
    ]
    for field in required_summary:
        assert field in s, f"Missing summary field: {field}"
    assert s["total_applications"] >= 0
    assert s["total_citizens"] >= 0
    # Completed + in_progress + rework + exceptions should equal total
    total_reconstructed = s["completed"] + s["in_progress"] + s["rework_required"] + s["exceptions"]
    assert total_reconstructed == s["total_applications"], (
        f"Funnel parts {total_reconstructed} != total {s['total_applications']}"
    )


# ---------------------------------------------------------------------------
# Test 3: Funnel has 5 stages and percentages are non-negative
# ---------------------------------------------------------------------------
def test_analytics_funnel_structure():
    res = client.get("/api/dashboard/analytics", headers=_auth("ADMIN"))
    assert res.status_code == 200
    funnel = res.json()["funnel"]
    assert len(funnel) == 5, f"Expected 5 funnel stages, got {len(funnel)}"
    stage_names = [f["stage"] for f in funnel]
    assert "Submitted" in stage_names
    assert "Sanctioned" in stage_names
    for row in funnel:
        assert row["pct"] >= 0
        assert row["count"] >= 0


# ---------------------------------------------------------------------------
# Test 4: Department analytics returns 4 departments with required fields
# ---------------------------------------------------------------------------
def test_analytics_department_analytics():
    res = client.get("/api/dashboard/analytics", headers=_auth("ADMIN"))
    assert res.status_code == 200
    dept_list = res.json()["department_analytics"]
    assert len(dept_list) == 4, f"Expected 4 depts, got {len(dept_list)}"
    dept_ids = {d["department_id"] for d in dept_list}
    assert {"DEPT_A", "DEPT_B", "DEPT_C", "LEGACY_01"} == dept_ids
    for dept in dept_list:
        assert "success_rate" in dept
        assert "status" in dept
        assert dept["status"] in ("HEALTHY", "DEGRADED", "CRITICAL")
        assert 0 <= dept["success_rate"] <= 100


# ---------------------------------------------------------------------------
# Test 5: Consent compliance pct is between 0 and 100; platform_health valid
# ---------------------------------------------------------------------------
def test_analytics_consent_and_health():
    res = client.get("/api/dashboard/analytics", headers=_auth("ADMIN"))
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["consent_compliance_pct"] <= 100
    assert data["authorized_consents"] <= data["total_consents"]
    assert data["platform_health"] in ("HEALTHY", "DEGRADED", "AT_RISK")
    assert data["sla_breaches"] >= 0
    assert data["transactions_last_hour"] >= 0
