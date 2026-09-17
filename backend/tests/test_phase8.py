import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application

from backend.app.api.confidential_mpc import (
    get_mpc_sessions,
    verify_blind_match,
    BlindMatchRequest
)
from backend.app.api.interstate_bridge import (
    get_interstate_trust_anchors,
    port_citizen_credentials,
    InterstatePortRequest
)
from backend.app.api.proactive_entitlements import (
    get_proactive_scheme_recommendations,
    auto_draft_scheme_bundle,
    AutoDraftBundleRequest
)
from backend.app.api.green_telemetry import (
    get_green_footprint_metrics,
    get_district_green_certificate
)
from backend.app.api.pqc_quantum_sandbox import (
    get_pqc_quantum_assessment,
    simulate_hybrid_handshake,
    HybridHandshakeRequest
)

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-P8-TEST",
        name="Demo Citizen",
        mobile="9999999999",
        email="citizen@mahasetu.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)

    app = Application(
        application_number="MH-APP-2026-000184",
        citizen_id="CIT-P8-TEST",
        service_id="employment-support",
        status="COMPLETED",
        citizen_data={
            "name": "Demo Citizen",
            "district": "Pune",
            "annual_income": 180000,
            "dob": "1998-05-12"
        }
    )
    session.add(app)
    session.commit()

    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_confidential_mpc_sessions_and_matching():
    # 1. Active sessions
    sessions_res = get_mpc_sessions()
    assert sessions_res["total_mpc_sessions"] >= 2
    assert len(sessions_res["protocol_standards"]) >= 3

    # 2. Private Set Intersection blind verification
    req = BlindMatchRequest(
        citizen_blind_hash="CIT-DEMO-9999999999",
        party_a_id="DEPT_REVENUE",
        party_b_id="DEPT_SOCIAL_WELFARE",
        criterion="INCOME_LEQ_300K_AND_LAND_LEQ_5ACRES"
    )
    res = verify_blind_match(req)
    assert res["status"] == "CONFIDENTIAL_MATCH_VERIFIED"
    assert res["match_result"] is True
    assert res["blind_token_party_a"].startswith("blind:")
    assert res["blind_token_party_b"].startswith("blind:")
    assert res["intersection_certificate"].startswith("cert:mpc:")

def test_interstate_mobility_trust_anchors():
    # 1. State trust anchors
    anchors = get_interstate_trust_anchors()
    assert anchors["total_partner_states"] >= 3
    assert anchors["home_state"].startswith("Maharashtra")

    # 2. Port credentials to Gujarat
    req = InterstatePortRequest(
        application_number="MH-APP-2026-000184",
        citizen_name="Demo Citizen",
        source_state="Maharashtra",
        target_state_id="STATE_GUJARAT",
        migration_reason="Inter-State Employment & Skill Program Enrollment"
    )
    port_res = port_citizen_credentials(req)
    assert port_res["status"] == "PORTABILITY_HANDSHAKE_SUCCESS"
    assert port_res["target_state"] == "Gujarat"
    assert port_res["credential_portability_result"]["re_verification_waived"] is True
    assert port_res["credential_portability_result"]["portability_certificate"].startswith("urn:cert:onosp:")

def test_proactive_scheme_entitlements(db_session):
    # 1. Recommendations
    rec_res = get_proactive_scheme_recommendations(citizen_mobile="9999999999", db=db_session)
    assert rec_res["total_proactive_matches"] >= 3
    assert rec_res["total_potential_annual_benefit_inr"] > 0
    assert len(rec_res["recommendations"]) >= 3
    assert rec_res["recommendations"][0]["match_percentage"] > 90.0

    # 2. Auto-draft application bundle
    draft_req = AutoDraftBundleRequest(
        citizen_mobile="9999999999",
        selected_scheme_ids=["SCHEME-YOUTH-SKILL-2026", "SCHEME-AROGYA-2026"]
    )
    draft_res = auto_draft_scheme_bundle(draft_req, db=db_session)
    assert draft_res["status"] == "BUNDLE_DRAFTED_SUCCESSFULLY"
    assert draft_res["total_schemes_bundled"] == 2
    assert len(draft_res["drafted_applications"]) == 2
    assert draft_res["bundle_id"].startswith("MH-BUNDLE-2026-")

def test_green_govtech_carbon_footprint():
    # 1. Footprint metrics
    green = get_green_footprint_metrics()
    assert green["statewide_totals"]["physical_paper_sheets_eliminated"] > 100000
    assert green["statewide_totals"]["metric_tons_co2_avoided"] > 50.0
    assert len(green["district_rankings"]) >= 5

    # 2. District certificate
    cert = get_district_green_certificate("Pune")
    assert cert["district"] == "Pune"
    assert "ECO-GOVERNANCE" in cert["green_rating"]
    assert cert["trees_saved"] > 5.0

def test_pqc_quantum_readiness_and_handshake():
    # 1. Quantum audit
    pqc = get_pqc_quantum_assessment()
    assert pqc["quantum_readiness_index_pct"] >= 90.0
    assert len(pqc["evaluated_endpoints"]) >= 4

    # 2. Hybrid classical + ML-KEM handshake
    h_req = HybridHandshakeRequest(
        department_id="DEPT_B_ELIGIBILITY",
        packet_id="MH-APP-2026-PQC-TEST"
    )
    h_res = simulate_hybrid_handshake(h_req)
    assert h_res["status"] == "HYBRID_PQC_HANDSHAKE_ESTABLISHED"
    assert "Ed25519" in h_res["hybrid_envelope"]["classical_layer"]["primitive"]
    assert "ML-KEM" in h_res["hybrid_envelope"]["post_quantum_layer"]["primitive"]
    assert h_res["transport_security"] == "HYBRID DUAL-SEAL SECURE"
