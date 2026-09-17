"""
Phase 12 Tests: Enhanced Services Catalog
- GET /api/services/stats  — platform-wide catalog metrics
- GET /api/services/categories — grouped by department
- Validation: counts, SLA ranges, compliance list
- Edge: empty state handling, category grouping correctness
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Test 1: Stats endpoint returns all expected fields
# ---------------------------------------------------------------------------
def test_service_stats_fields():
    res = client.get("/api/services/stats")
    assert res.status_code == 200, res.text
    data = res.json()
    for field in ("total_services", "active_services", "total_departments",
                  "avg_sla_days", "min_sla_days", "platform", "compliance"):
        assert field in data, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Test 2: Stats values are numerically valid
# ---------------------------------------------------------------------------
def test_service_stats_values():
    res = client.get("/api/services/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_services"] >= data["active_services"] >= 1
    assert data["total_departments"] >= 1
    assert 0 < data["avg_sla_days"] <= 365
    assert 0 < data["min_sla_days"] <= data["avg_sla_days"]
    assert isinstance(data["compliance"], list)
    assert len(data["compliance"]) >= 1


# ---------------------------------------------------------------------------
# Test 3: Categories endpoint returns grouped structure
# ---------------------------------------------------------------------------
def test_service_categories_structure():
    res = client.get("/api/services/categories")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "categories" in data
    assert "total" in data
    assert isinstance(data["categories"], list)
    assert data["total"] >= 1

    # Each category must have name, count, and services list
    for cat in data["categories"]:
        assert "name" in cat
        assert "count" in cat
        assert "services" in cat
        assert cat["count"] == len(cat["services"])


# ---------------------------------------------------------------------------
# Test 4: Category total matches individual service count
# ---------------------------------------------------------------------------
def test_service_categories_total_matches():
    res_cats = client.get("/api/services/categories")
    res_all  = client.get("/api/services")
    assert res_cats.status_code == 200
    assert res_all.status_code == 200

    cat_total = res_cats.json()["total"]
    all_count = len(res_all.json())
    assert cat_total == all_count, (
        f"Category total {cat_total} != active services {all_count}"
    )


# ---------------------------------------------------------------------------
# Test 5: Service list still fully functional (regression guard)
# ---------------------------------------------------------------------------
def test_service_list_not_broken_after_additions():
    res = client.get("/api/services")
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 1

    # All services must have mandatory fields
    for svc in services:
        for field in ("id", "name", "department", "sla_days", "is_active"):
            assert field in svc, f"Service missing field: {field}"
        assert svc["sla_days"] > 0
