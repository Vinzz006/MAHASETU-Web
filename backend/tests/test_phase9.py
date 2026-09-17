import pytest

from backend.app.api.disaster_surge import (
    get_active_disaster_events,
    trigger_emergency_relief,
    TriggerDisasterReliefRequest
)
from backend.app.api.dpdp_erasure import (
    get_privacy_scorecard,
    execute_right_to_be_forgotten,
    ErasureRequest
)
from backend.app.api.document_forensics import (
    get_forensic_audit_history,
    analyze_document_forensics,
    AnalyzeDocumentRequest
)
from backend.app.api.mesh_autonomous import (
    get_autonomous_mesh_health,
    trigger_mesh_auto_tuning,
    TuneMeshRequest
)
from backend.app.api.developer_sdk import (
    get_certified_partners,
    certify_new_connector,
    verify_sandbox_payload,
    CertifyConnectorRequest,
    SandboxTestRequest
)

def test_disaster_surge_declarations_and_trigger():
    # 1. Active events
    events_res = get_active_disaster_events()
    assert events_res["total_active_emergencies"] >= 2
    assert len(events_res["events"]) >= 2
    assert "Konkan" in events_res["events"][0]["title"]

    # 2. Trigger automated disaster relief
    req = TriggerDisasterReliefRequest(
        event_id="DISASTER-KONKAN-FLOOD-2026",
        target_district="Ratnagiri",
        authorized_officer_badge="IAS-SDMA-CHIEF-01"
    )
    res = trigger_emergency_relief(req)
    assert res["status"] == "EMERGENCY_RELIEF_DISBURSED_AUTOMATICALLY"
    assert res["beneficiaries_credited"] > 1000
    assert res["total_fiscal_disbursed_inr"] > 0
    assert res["paperwork_eliminated_ratio"].startswith("100%")
    assert res["batch_reference"].startswith("MAHA-RELIEF-BATCH-")

def test_dpdp_privacy_scorecard_and_erasure():
    # 1. Privacy Scorecard
    scorecard = get_privacy_scorecard(citizen_mobile="9999999999")
    assert "DPDP ACT 2023" in scorecard["dpdp_compliance_status"]
    assert len(scorecard["departmental_footprints"]) >= 3

    # 2. Right-to-be-Forgotten execution
    req = ErasureRequest(
        citizen_mobile="9999999999",
        requested_departments=["DEPT_B_ELIGIBILITY", "DEPT_A_CIVIL"],
        reason="Service application completed; exercising statutory Right to be Forgotten."
    )
    res = execute_right_to_be_forgotten(req)
    assert res["status"] == "DATA_ERASURE_EXECUTED_SUCCESSFULLY"
    assert res["purged_staging_bytes"] > 0
    assert len(res["purged_records"]) >= 2
    assert res["erasure_certificate"]["certificate_urn"].startswith("urn:dpdp:cert:erasure:")

def test_ai_document_forensics_tamper_detection():
    # 1. Audit history
    hist = get_forensic_audit_history()
    assert hist["total_documents_screened"] > 10000
    assert len(hist["recent_audits"]) >= 2

    # 2. Analyze authentic document
    auth_req = AnalyzeDocumentRequest(
        document_name="7-12_Land_Extract_Demo.pdf",
        doc_type="LAND_RECORD_EXTRACT",
        simulate_tamper=False
    )
    auth_res = analyze_document_forensics(auth_req)
    assert auth_res["verdict"] == "GENUINE_AUTHENTIC_DOCUMENT"
    assert auth_res["integrity_score_pct"] > 90.0

    # 3. Analyze tampered document
    tamp_req = AnalyzeDocumentRequest(
        document_name="7-12_Forged_Copy.pdf",
        doc_type="LAND_RECORD_EXTRACT",
        simulate_tamper=True
    )
    tamp_res = analyze_document_forensics(tamp_req)
    assert tamp_res["verdict"] == "TAMPER_DETECTED_FORGERY_SUSPECTED"
    assert tamp_res["integrity_score_pct"] < 50.0
    assert "ANOMALY" in tamp_res["forensic_breakdown"]["font_kerning_analysis"]

def test_autonomous_mesh_telemetry_and_tuning():
    # 1. Mesh health
    health = get_autonomous_mesh_health()
    assert health["overall_mesh_health_score"] > 90.0
    assert health["active_nodes_count"] >= 4
    assert health["total_cluster_rps"] > 0

    # 2. Trigger auto tuning
    tune_req = TuneMeshRequest(policy_mode="AGGRESSIVE_STABILIZATION")
    tune_res = trigger_mesh_auto_tuning(tune_req)
    assert tune_res["status"] == "MESH_RECALIBRATED_SUCCESSFULLY"
    assert len(tune_res["rebalancing_actions_executed"]) >= 3
    assert tune_res["cluster_throughput_gain_pct"] > 0

def test_developer_sdk_certification_and_sandbox():
    # 1. Certified partners
    partners = get_certified_partners()
    assert partners["total_certified_entities"] >= 3

    # 2. Certify new connector
    cert_req = CertifyConnectorRequest(
        organization_name="Pimpri Chinchwad Municipal Corporation (PCMC)",
        service_domain="Civic Revenue & Water Utility Integration"
    )
    cert_res = certify_new_connector(cert_req)
    assert cert_res["status"] == "CONNECTOR_CERTIFIED_GOLD"
    assert cert_res["certification_id"].startswith("MAHA-CERT-GOLD-")
    assert cert_res["canonical_conformance_score_pct"] > 90.0

    # 3. Test sandbox payload
    test_req = SandboxTestRequest(
        source_schema_name="PCMC_PROPERTY_TAX_V2",
        payload={"tax_no": "12345", "owner_name": "Citizen"}
    )
    test_res = verify_sandbox_payload(test_req)
    assert test_res["status"] == "VALIDATION_PASSED"
    assert test_res["canonical_compatibility"] == "100% COMPATIBLE"
