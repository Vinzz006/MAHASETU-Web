import pytest

from backend.app.api.industrial_emissions import (
    get_industrial_cems_stacks,
    issue_mpcb_stop_work_notice,
    IssuePenaltyRequest
)
from backend.app.api.marriage_registry import (
    get_recent_marriage_registrations,
    register_marriage_and_provision_joint_entitlements,
    RegisterMarriageRequest
)
from backend.app.api.solar_feeder_grid import (
    get_solar_feeder_substations,
    optimize_solar_feeder_irrigation_schedule,
    OptimizeFeederRequest
)
from backend.app.api.policy_copilot import (
    get_sample_policy_queries,
    query_executive_policy_copilot,
    AskCopilotRequest
)
from backend.app.api.master_showcase import (
    get_master_capstone_overview,
    run_twelve_step_full_spectrum_simulation
)

def test_industrial_emissions_cems_and_penalty():
    # 1. Stacks
    stacks = get_industrial_cems_stacks()
    assert stacks["total_monitored_cems_stacks"] >= 3
    assert len(stacks["stacks"]) >= 3

    # 2. Issue penalty
    req = IssuePenaltyRequest(stack_id="STACK-TAR-CHEM-01")
    res = issue_mpcb_stop_work_notice(req)
    assert res["status"] == "STATUTORY_NOTICE_SERVED"
    assert res["notice_id"].startswith("MPCB-PENALTY-MH-")
    assert res["environmental_damage_fine_inr"] > 0

def test_marriage_registry_and_joint_entitlements():
    # 1. Recent marriages
    records = get_recent_marriage_registrations()
    assert records["total_marriages_registered"] >= 2

    # 2. Register marriage
    req = RegisterMarriageRequest(
        spouse_one_name="Gaurav Vilas Shinde",
        spouse_one_aadhaar_vault="vault:uidai:981244510923",
        spouse_two_name="Sayali Eknath Patil",
        spouse_two_aadhaar_vault="vault:uidai:771209384512",
        marriage_venue="Shivaji Park Cultural Hall, Dadar, Mumbai",
        corporation="Brihanmumbai Municipal Corporation"
    )
    res = register_marriage_and_provision_joint_entitlements(req)
    assert res["status"] == "MARRIAGE_DIGITALLY_REGISTERED"
    assert res["registration_id"].startswith("MRG-MH-")
    assert res["digital_certificate_hash"].startswith("0xMARRIAGE-CERT-")
    assert len(res["auto_provisioned_welfare"]) >= 3

def test_solar_feeder_grid_and_load_balance():
    # 1. Feeders
    feeders = get_solar_feeder_substations()
    assert feeders["total_monitored_feeders"] >= 3
    assert feeders["total_installed_solar_mw"] > 0

    # 2. Optimize feeder
    req = OptimizeFeederRequest(feeder_id="FEEDER-SOLAR-JAL-BHOKAR-02")
    res = optimize_solar_feeder_irrigation_schedule(req)
    assert res["status"] == "FEEDER_LOAD_OPTIMIZED"
    assert res["optimization_token"].startswith("MSKVY-OPT-")
    assert res["guaranteed_daytime_hours"] == 8.0

def test_policy_sql_copilot_queries():
    # 1. Sample queries
    queries = get_sample_policy_queries()
    assert queries["total_sample_queries"] >= 3

    # 2. Ask copilot
    req = AskCopilotRequest(question="Show me all talukas in Marathwada where PDS grain stock is below 20% and groundwater is below 12 mbgl.")
    res = query_executive_policy_copilot(req)
    assert res["status"] == "POLICY_QUERY_EXECUTED"
    assert "SELECT" in res["synthesized_sql_query"]
    assert len(res["tabular_correlation_results"]) >= 1
    assert "READ_ONLY" in res["security_sandbox"]

def test_master_showcase_state_overview_and_full_simulation():
    # 1. Overview
    overview = get_master_capstone_overview()
    assert overview["total_phases_completed"] == 15
    assert len(overview["phase_capability_matrix"]) == 15
    assert overview["empirical_metrics"]["total_automated_backend_tests"] == 66

    # 2. Run 12-step full spectrum simulation
    sim = run_twelve_step_full_spectrum_simulation()
    assert sim["status"] == "FULL_SPECTRUM_SIMULATION_COMPLETED"
    assert sim["total_steps_executed"] == 12
    assert sim["all_phases_verified"] is True
    assert sim["master_cryptographic_receipt"].startswith("0xMAHA-SOVEREIGN-SEAL-")
