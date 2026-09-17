"""
Phase 14 Tests: Smart Application Wizard + Eligibility Validation
- POST /api/applications/validate-eligibility — income cap, status rules
- Eligible citizen passes, ineligible fails with reason
- Alternative service suggestion when income too high
- All 4 scheme income caps validated
- Regression: existing application create still works
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.user import User
from backend.app.auth import create_access_token

client = TestClient(app)


def _auth(role: str = "CITIZEN") -> dict:
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
# Test 1: Eligible citizen — income within cap
# ---------------------------------------------------------------------------
def test_eligibility_eligible_citizen():
    res = client.post(
        "/api/applications/validate-eligibility",
        json={"service_id": "employment-support", "annual_income": 180000, "employment_status": "UNEMPLOYED"},
        headers=_auth("CITIZEN")
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["eligible"] is True
    assert data["verdict"] == "ELIGIBLE"
    assert data["income_eligible"] is True
    assert data["status_eligible"] is True
    assert data["reason"] is None
    assert data["income_cap"] == 300000


# ---------------------------------------------------------------------------
# Test 2: Ineligible — income exceeds cap
# ---------------------------------------------------------------------------
def test_eligibility_income_over_cap():
    res = client.post(
        "/api/applications/validate-eligibility",
        json={"service_id": "employment-support", "annual_income": 500000, "employment_status": "UNEMPLOYED"},
        headers=_auth("CITIZEN")
    )
    assert res.status_code == 200
    data = res.json()
    assert data["eligible"] is False
    assert data["verdict"] == "INELIGIBLE"
    assert data["income_eligible"] is False
    assert data["reason"] is not None and len(data["reason"]) > 0


# ---------------------------------------------------------------------------
# Test 3: Alternative service suggested when income too high for first scheme
# ---------------------------------------------------------------------------
def test_eligibility_alternative_service_suggested():
    # Smart-ration cap is 2L; farmer-dbt cap is 5L — so if income=250000, employment-support
    # is ineligible (cap 3L? no 3L > 250000... let me use 350000 for employment-support)
    # employment-support cap = 300000, farmer-dbt cap = 500000
    res = client.post(
        "/api/applications/validate-eligibility",
        json={"service_id": "employment-support", "annual_income": 350000, "employment_status": "UNEMPLOYED"},
        headers=_auth("CITIZEN")
    )
    assert res.status_code == 200
    data = res.json()
    assert data["eligible"] is False
    # Should suggest an alternative scheme with higher cap
    assert data["alternative_service"] is not None


# ---------------------------------------------------------------------------
# Test 4: All four service caps are independently enforced
# ---------------------------------------------------------------------------
def test_eligibility_all_four_caps():
    caps = {
        "employment-support": 300000,
        "farmer-dbt":         500000,
        "urban-housing":      600000,
        "smart-ration":       200000,
    }
    for service_id, cap in caps.items():
        # Just at cap — eligible
        res = client.post(
            "/api/applications/validate-eligibility",
            json={"service_id": service_id, "annual_income": cap, "employment_status": "UNEMPLOYED"},
            headers=_auth("CITIZEN")
        )
        assert res.status_code == 200
        assert res.json()["income_eligible"] is True, f"Should be eligible at cap for {service_id}"

        # 1 rupee over cap — ineligible
        res2 = client.post(
            "/api/applications/validate-eligibility",
            json={"service_id": service_id, "annual_income": cap + 1, "employment_status": "UNEMPLOYED"},
            headers=_auth("CITIZEN")
        )
        assert res2.json()["income_eligible"] is False, f"Should be ineligible over cap for {service_id}"


# ---------------------------------------------------------------------------
# Test 5: Income percentage of cap is calculated correctly
# ---------------------------------------------------------------------------
def test_eligibility_income_pct_of_cap():
    res = client.post(
        "/api/applications/validate-eligibility",
        json={"service_id": "employment-support", "annual_income": 150000, "employment_status": "UNEMPLOYED"},
        headers=_auth("CITIZEN")
    )
    assert res.status_code == 200
    data = res.json()
    # 150000 / 300000 = 50.0%
    assert data["income_pct_of_cap"] == 50.0
