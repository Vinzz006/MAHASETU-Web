import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.api.verifiable_credentials import (
    get_citizen_verifiable_credentials,
    generate_zkp_proof,
    verify_zkp_proof,
    ZKPProofRequest,
    ZKPVerifyRequest
)
from backend.app.api.district_cockpit import (
    get_district_cockpit_summary,
    get_district_details,
    dispatch_district_administrative_action,
    DistrictActionRequest
)
from backend.app.api.grievance_ombudsperson import (
    list_ombudsperson_cases,
    submit_citizen_grievance,
    remediate_ombudsperson_case,
    GrievanceSubmissionRequest,
    RemediationActionRequest
)
from backend.app.api.webhook_mesh import (
    get_webhook_subscriptions,
    dispatch_test_webhook_event,
    TestWebhookDispatchRequest
)
from backend.app.api.chaos_simulator import (
    get_chaos_status,
    trigger_chaos_experiment,
    reset_chaos_baseline,
    TriggerChaosRequest
)

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-P7-TEST",
        name="Demo Citizen",
        mobile="9999999999",
        email="citizen@mahasetu.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)

    app = Application(
        application_number="MH-APP-2026-000184",
        citizen_id="CIT-P7-TEST",
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

def test_verifiable_credentials_wallet(db_session):
    wallet = get_citizen_verifiable_credentials(citizen_mobile="9999999999", db=db_session)
    assert wallet["wallet_status"] == "SOVEREIGN_ACTIVE"
    assert wallet["citizen_did"].startswith("did:mahasetu:citizen:")
    
    vc = wallet["verifiable_credential"]
    assert "https://www.w3.org/2018/credentials/v1" in vc["@context"]
    assert vc["issuer"]["name"] == "Government of Maharashtra Interoperability & Service Passport Hub"
    assert len(vc["zero_knowledge_predicates"]) >= 4
    assert vc["proof"]["type"] == "Ed25519Signature2020"

def test_zkp_proof_generation_and_verification(db_session):
    # 1. Generate ZKP Proof for Age, Income, and Domicile
    req = ZKPProofRequest(
        claims_to_prove=["age_ge_18", "income_lt_threshold", "maharashtra_domicile"],
        verifier_audience="DEPT_B_ELIGIBILITY_EVALUATION"
    )
    proof_res = generate_zkp_proof(req=req, db=db_session)
    assert proof_res["status"] == "ZKP_PROOF_GENERATED"
    assert proof_res["proof_token"].startswith("zkp.mahasetu.")
    assert len(proof_res["claims_proved"]) == 3
    assert len(proof_res["cryptographic_digest"]) == 64

    # 2. Public Verifier checks the mathematical proof token
    v_req = ZKPVerifyRequest(
        proof_token=proof_res["proof_token"],
        issuer_did=proof_res["issuer_did"],
        claims_proved=proof_res["claims_proved"],
        cryptographic_digest=proof_res["cryptographic_digest"],
        timestamp=proof_res["timestamp"]
    )
    v_res = verify_zkp_proof(v_req)
    assert v_res["verification_result"] == "VALID_AUTHENTIC_PROOF"
    assert v_res["issuer_trusted"] is True
    assert v_res["claims_verified_count"] == 3
    assert v_res["dpdp_compliance"] == "COMPLIANT_ZERO_DATA_LEAK"

def test_district_collectorate_cockpit(db_session):
    # 1. Macro Summary
    summary = get_district_cockpit_summary(db=db_session)
    assert summary["state"] == "Maharashtra"
    assert summary["statewide_kpis"]["total_districts_monitored"] == 36
    assert summary["statewide_kpis"]["state_federation_index_pct"] > 90.0
    assert len(summary["district_leaderboard"]) >= 5
    assert summary["district_leaderboard"][0]["district"] == "Pune"

    # 2. District Drilldown
    pune = get_district_details("Pune")
    assert pune["district"] == "Pune"
    assert pune["division"] == "Pune"
    assert pune["sla_adherence_pct"] >= 95.0
    assert len(pune["top_schemes_disbursed"]) >= 3

    # 3. Administrative Dispatch
    disp_req = DistrictActionRequest(
        district="Solapur",
        action_type="DISPATCH_OFFICER_REBALANCE",
        officer_instructions="Assign 2 additional verifiers to clear land registry sync backlog."
    )
    disp_res = dispatch_district_administrative_action(disp_req)
    assert disp_res["status"] == "DISPATCH_EXECUTED"
    assert disp_res["district"] == "Solapur"
    assert "MH-DISP-2026-" in disp_res["dispatch_id"]

def test_nivarana_ai_ombudsperson(db_session):
    # 1. List cases
    cases_res = list_ombudsperson_cases(db=db_session)
    assert cases_res["total_cases_analyzed"] >= 2
    assert cases_res["average_root_cause_confidence"] >= 90.0

    # 2. Submit new grievance with AI deep trace
    sub_req = GrievanceSubmissionRequest(
        application_number="MH-APP-2026-000184",
        citizen_name="Demo Citizen",
        district="Pune",
        category="INCOME_CALCULATION",
        description="Department B rejected my income bracket stating income is over 3 lakhs, which is incorrect."
    )
    sub_res = submit_citizen_grievance(req=sub_req, db=db_session)
    assert sub_res["status"] == "SUCCESS_RECORDED"
    assert sub_res["ai_analysis_complete"] is True
    assert "DEPT_B" in sub_res["case"]["ai_diagnostics"]["root_cause_department"]

    # 3. Remediate Case
    rem_req = RemediationActionRequest(
        case_id=sub_res["case"]["case_id"],
        action="TRIGGER_WORKFLOW_RETRY",
        officer_notes="Income certificate re-verified. Slabs adjusted under FY 2025-26 guidelines."
    )
    rem_res = remediate_ombudsperson_case(rem_req)
    assert rem_res["status"] == "SUCCESS"
    assert rem_res["remediation_action"] == "TRIGGER_WORKFLOW_RETRY"

def test_webhook_mesh():
    # 1. Subscriptions list
    subs_res = get_webhook_subscriptions()
    assert subs_res["total_subscriptions"] >= 4
    assert subs_res["active_mesh_endpoints"] >= 4
    assert subs_res["average_mesh_latency_ms"] > 0

    # 2. Test HMAC signed dispatch
    disp_req = TestWebhookDispatchRequest(
        subscription_id="SUB-DEPT-A",
        event_type="IDENTITY_VERIFIED"
    )
    disp_res = dispatch_test_webhook_event(disp_req)
    assert disp_res["status"] == "SUCCESS_DISPATCHED"
    assert "sha256=" in disp_res["headers_emitted"]["X-MahaSetu-Signature"]
    assert disp_res["verification_result"] == "HMAC_VERIFIED_AUTHENTIC"

def test_chaos_resilience_simulator():
    # 1. Initial status
    status = get_chaos_status()
    assert len(status["available_experiments"]) >= 4

    # 2. Inject Latency Spike Chaos
    req = TriggerChaosRequest(experiment_id="LATENCY_SPIKE", intensity="HIGH")
    res = trigger_chaos_experiment(req)
    assert res["status"] == "CHAOS_FAULT_INJECTED"
    assert res["current_state"]["injected_latency_ms"] == 3500

    # 3. Inject Schema Drift Chaos
    req2 = TriggerChaosRequest(experiment_id="SCHEMA_DRIFT")
    res2 = trigger_chaos_experiment(req2)
    assert res2["current_state"]["schema_drift_active"] is True

    # 4. Reset to baseline
    reset_res = reset_chaos_baseline()
    assert reset_res["status"] == "HEALTHY_BASELINE_RESTORED"
    assert reset_res["state"]["injected_latency_ms"] == 0
    assert reset_res["state"]["schema_drift_active"] is False
