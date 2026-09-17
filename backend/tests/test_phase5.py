import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.api.fraud_detector import get_fraud_anomalies, resolve_fraud_anomaly, AnomalyResolveRequest
from backend.app.api.policy_simulator import evaluate_policy_scenario, PolicySimulationRequest
from backend.app.api.security_audit import get_security_audit_scorecard

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_fraud_detector():
    anomalies_res = get_fraud_anomalies()
    assert "summary" in anomalies_res
    assert anomalies_res["summary"]["total_anomalies_detected"] >= 3
    assert len(anomalies_res["anomalies"]) >= 3

    # Test resolving an anomaly
    req = AnomalyResolveRequest(
        action="FREEZE_BENEFIT",
        officer_notes="Legal cross-audit confirmed duplicate income declaration."
    )
    resolve_res = resolve_fraud_anomaly("ANOM-2026-001", req)
    assert resolve_res["status"] == "SUCCESS"
    assert resolve_res["anomaly"]["status"] == "BENEFIT_FROZEN"

def test_policy_simulator():
    req = PolicySimulationRequest(
        scheme_id="farmer-dbt",
        income_ceiling_inr=300000,
        target_districts_count=36,
        sla_target_hours=48,
        include_legacy_sync=True
    )
    sim = evaluate_policy_scenario(req)
    assert "projections" in sim
    assert sim["projections"]["eligible_beneficiaries_statewide"] > 0
    assert sim["projections"]["total_fiscal_outlay_crores"] > 0
    assert "infrastructure_capacity_impact" in sim
    assert sim["infrastructure_capacity_impact"]["daily_interop_transactions"] > 0

def test_security_audit_scorecard(db_session):
    scorecard = get_security_audit_scorecard(db=db_session)
    assert scorecard["overall_security_grade"] == "A+ (ZERO-TRUST CERTIFIED)"
    assert scorecard["composite_integrity_index"] >= 95.0
    assert len(scorecard["active_security_checks"]) >= 5
    assert len(scorecard["cryptographic_master_seal"]) == 64
