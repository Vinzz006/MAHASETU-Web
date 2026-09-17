import pytest

from backend.app.api.treasury_beams import (
    get_treasury_liquidity_pulse,
    reconcile_scheme_sanction,
    ReconcileSanctionRequest
)
from backend.app.api.tender_shield import (
    get_active_tenders,
    analyze_tender_bids_for_collusion,
    AnalyzeTenderRequest
)
from backend.app.api.crisis_logistics import (
    get_evacuation_logistics_nodes,
    activate_drone_corridor,
    DispatchCorridorRequest
)
from backend.app.api.quantum_key_rotation import (
    get_hsm_key_ring_status,
    execute_zero_downtime_key_rotation,
    KeyRotationRequest
)
from backend.app.api.drone_pmfby import (
    get_drone_pmfby_surveys,
    settle_drone_pmfby_claim,
    SettleClaimRequest
)

def test_treasury_beams_liquidity_and_reconciliation():
    # 1. Pulse
    pulse = get_treasury_liquidity_pulse()
    assert pulse["state_consolidated_fund_exchequer_balance_cr"] > 10000
    assert len(pulse["department_allocations"]) >= 3

    # 2. Reconcile sanction
    rec_req = ReconcileSanctionRequest(
        department="Agriculture & Farmers Welfare",
        scheme_code="SCHEME-PM-KISAN-MH-01",
        requested_amount_cr=25.5
    )
    rec_res = reconcile_scheme_sanction(rec_req)
    assert rec_res["status"] == "TREASURY_CLEARANCE_APPROVED"
    assert rec_res["treasury_authorization_token"].startswith("BEAMS-AUTH-2026-")
    assert rec_res["overdraft_risk"].startswith("ZERO")

def test_municipal_tender_collusion_shield():
    # 1. Active tenders
    tenders = get_active_tenders()
    assert tenders["total_active_tenders"] >= 2

    # 2. Analyze bids for cartelization
    analyze_req = AnalyzeTenderRequest(tender_id="TENDER-BMC-ROADS-2026-88")
    res = analyze_tender_bids_for_collusion(analyze_req)
    assert res["status"] == "COLLUSION_ANALYSIS_COMPLETED"
    assert res["collusion_verdict"] == "HIGH_CARTEL_RISK"
    assert res["cartelization_probability_pct"] > 70
    assert len(res["anomalies_detected"]) >= 2

def test_crisis_evacuation_logistics_and_drone():
    # 1. Nodes
    nodes = get_evacuation_logistics_nodes()
    assert nodes["total_shelter_capacity"] > 5000
    assert nodes["available_icu_beds"] > 10

    # 2. Activate corridor
    dispatch_req = DispatchCorridorRequest(
        source_node="NODE-RAI-MAHAD-01",
        destination_cluster="Poladpur Remote Tribal Hamlet",
        payload_type="EMERGENCY_ANTIVENOM_AND_O_NEG_BLOOD"
    )
    dispatch_res = activate_drone_corridor(dispatch_req)
    assert dispatch_res["status"] == "GREEN_CORRIDOR_ACTIVE"
    assert dispatch_res["corridor_id"].startswith("CORRIDOR-UAV-MH-")
    assert dispatch_res["estimated_flight_minutes"] > 0

def test_quantum_hsm_key_rotation():
    # 1. Ring status
    rings = get_hsm_key_ring_status()
    assert rings["total_active_key_rings"] >= 3

    # 2. Zero-downtime rotation
    rot_req = KeyRotationRequest(key_ring_id="HSM-RING-STATE-ROOT-01")
    rot_res = execute_zero_downtime_key_rotation(rot_req)
    assert rot_res["status"] == "KEY_ROTATION_SUCCESSFUL"
    assert rot_res["new_public_key_fingerprint"].startswith("0x")
    assert rot_res["audit_certificate_urn"].startswith("urn:mahasetu:hsm:cert:")

def test_drone_pmfby_crop_damage_and_settlement():
    # 1. Surveys
    surveys = get_drone_pmfby_surveys()
    assert surveys["total_drone_missions_logged"] >= 2

    # 2. Settle claim
    settle_req = SettleClaimRequest(survey_id="DRONE-UAV-LAT-2026-081")
    settle_res = settle_drone_pmfby_claim(settle_req)
    assert settle_res["status"] == "PMFBY_CLAIM_SETTLED_INSTANTLY"
    assert settle_res["insurance_payout_amount_inr"] > 10000
    assert settle_res["dbt_utr_number"].startswith("PMFBY-CLAIM-MH-")
