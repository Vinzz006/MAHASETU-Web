import pytest

from backend.app.api.executive_war_room import (
    get_executive_macro_pulse,
    simulate_policy_shift,
    PolicyShiftRequest
)
from backend.app.api.merkle_audit_ledger import (
    get_merkle_blocks,
    verify_merkle_inclusion,
    VerifyInclusionRequest
)
from backend.app.api.diaspora_gateway import (
    get_diaspora_requests,
    attest_document_for_diaspora,
    AttestDocumentRequest
)
from backend.app.api.workforce_rebalancer import (
    get_officer_workload,
    execute_workload_rebalance,
    RebalanceRequest
)
from backend.app.api.capstone_demo import (
    get_capstone_summary,
    run_end_to_end_simulation
)

def test_executive_war_room_macro_pulse_and_simulation():
    # 1. Macro pulse
    pulse = get_executive_macro_pulse()
    assert pulse["statewide_macro_metrics"]["total_citizen_transactions_processed"] > 500000
    assert pulse["statewide_macro_metrics"]["total_direct_benefit_disbursed_crores"] > 1000
    assert len(pulse["regional_breakdown"]) >= 5

    # 2. Simulate policy shift
    shift_req = PolicyShiftRequest(
        welfare_budget_multiplier=1.3,
        income_ceiling_expansion_pct=20.0,
        fast_track_sla_days=2
    )
    shift_res = simulate_policy_shift(shift_req)
    assert shift_res["status"] == "SIMULATION_COMPLETED"
    assert shift_res["projected_impacts"]["additional_citizens_covered"] > 100000
    assert shift_res["projected_impacts"]["projected_additional_fiscal_outlay_cr"] > 0

def test_merkle_audit_ledger_blocks_and_inclusion():
    # 1. Blocks
    blocks_res = get_merkle_blocks()
    assert blocks_res["total_merkle_blocks_anchored"] >= 1000
    assert len(blocks_res["recent_blocks"]) >= 2
    assert blocks_res["recent_blocks"][0]["merkle_root"].startswith("0x")

    # 2. Verify Inclusion Proof
    inc_req = VerifyInclusionRequest(
        application_number="MH-APP-2026-000184",
        block_number=1042
    )
    inc_res = verify_merkle_inclusion(inc_req)
    assert inc_res["status"] == "MERKLE_INCLUSION_VERIFIED"
    assert inc_res["verification_result"] is True
    assert len(inc_res["inclusion_proof_path"]) >= 2
    assert "PASS" in inc_res["tamper_evidence"]

def test_diaspora_international_attestation():
    # 1. Requests
    diaspora = get_diaspora_requests()
    assert diaspora["total_international_attestations"] > 10000
    assert len(diaspora["requests"]) >= 2

    # 2. Attest document
    attest_req = AttestDocumentRequest(
        citizen_name="Demo Diaspora Citizen",
        passport_number="Z9812401",
        destination_country="United States of America",
        document_type="7-12_LAND_RECORD_TITLE",
        source_application_number="MH-APP-2026-000184"
    )
    attest_res = attest_document_for_diaspora(attest_req)
    assert attest_res["status"] == "APOSTILLE_ISSUED_AND_AUTHENTICATED"
    assert attest_res["apostille_number"].startswith("IN-MH-APO-2026-")
    assert attest_res["hague_apostille_seal"]["certificate_urn"].startswith("urn:apostille:india:mh:")

def test_ai_workforce_rebalancer():
    # 1. Officer load
    load = get_officer_workload()
    assert load["total_monitored_offices"] >= 4
    assert load["total_pending_desk_files"] > 100

    # 2. Execute rebalance
    reb_req = RebalanceRequest(priority_level="MAX_EQUALIZATION")
    reb_res = execute_workload_rebalance(reb_req)
    assert reb_res["status"] == "WORKLOAD_EQUALIZED_SUCCESSFULLY"
    assert reb_res["files_reassigned_count"] > 50
    assert len(reb_res["reallocations"]) >= 2

def test_capstone_demo_summary_and_end_to_end():
    # 1. Summary
    summ = get_capstone_summary()
    assert summ["total_phases_implemented"] == 15
    assert len(summ["phases"]) == 15

    # 2. Run End-to-End Simulation
    e2e_res = run_end_to_end_simulation()
    assert e2e_res["status"] == "END_TO_END_SIMULATION_SUCCESSFUL"
    assert e2e_res["total_steps_executed"] == 8
    assert len(e2e_res["pipeline_steps"]) == 8
    assert e2e_res["simulation_application_id"].startswith("MH-APP-2026-CAPSTONE-")
