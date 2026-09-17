import pytest

from backend.app.api.smart_escrow_erupi import (
    get_active_escrow_vouchers,
    mint_programmable_voucher,
    redeem_escrow_voucher,
    MintVoucherRequest,
    RedeemVoucherRequest
)
from backend.app.api.bhoomi_geo_cadastre import (
    get_bhoomi_cadastre_parcels,
    verify_cadastral_polygon,
    VerifyParcelPolygonRequest
)
from backend.app.api.tribunal_nyaya import (
    get_tribunal_disputes,
    arbitrate_dispute_multi_agent,
    ArbitrateDisputeRequest
)
from backend.app.api.accessibility_assist import (
    get_accessibility_profiles,
    synthesize_accessible_narration,
    SynthesizeNarrationRequest
)
from backend.app.api.vanadhikar_fra import (
    get_fra_claims,
    reconcile_tribal_fra_claim,
    ReconcileFRAClaimRequest
)

def test_smart_escrow_vouchers_mint_and_redeem():
    # 1. Active vouchers
    vouchers = get_active_escrow_vouchers()
    assert vouchers["total_active_vouchers"] >= 2
    assert vouchers["total_escrow_committed_inr"] > 0

    # 2. Mint voucher
    mint_req = MintVoucherRequest(
        beneficiary_name="Sunita Jadhav",
        aadhaar_last_four="7721",
        amount_inr=5000.0,
        purpose_category="MATERNAL_NUTRITION_SUPPLEMENTS"
    )
    mint_res = mint_programmable_voucher(mint_req)
    assert mint_res["status"] == "VOUCHER_MINTED_SUCCESSFULLY"
    assert mint_res["voucher"]["voucher_id"].startswith("ERUPI-MH-")

    # 3. Redeem voucher
    redeem_req = RedeemVoucherRequest(
        voucher_id=mint_res["voucher"]["voucher_id"],
        merchant_id="MERCHANT-PCOOP-BARAMATI-09",
        merchant_mcc="5169",
        otp_code="849201"
    )
    redeem_res = redeem_escrow_voucher(redeem_req)
    assert redeem_res["status"] == "REDEMPTION_SETTLED_VIA_RBI_CBDC"
    assert redeem_res["amount_credited_inr"] == 5000.0

def test_bhoomi_geo_cadastre_parcels_and_polygon():
    # 1. Parcels
    parcels = get_bhoomi_cadastre_parcels()
    assert parcels["total_monitored_parcels"] >= 2

    # 2. Inland agricultural parcel
    inland_req = VerifyParcelPolygonRequest(
        gat_number="142/B",
        district="Pune",
        taluka="Baramati",
        latitude=18.1512,
        longitude=74.5784
    )
    inland_res = verify_cadastral_polygon(inland_req)
    assert inland_res["clearance_status"] == "CLEARANCE_GRANTED"
    assert inland_res["satellite_validation_score"] > 90

    # 3. Coastal CRZ parcel
    coastal_req = VerifyParcelPolygonRequest(
        gat_number="88/1",
        district="Raigad",
        taluka="Alibaug",
        latitude=18.6414,
        longitude=72.8722
    )
    coastal_res = verify_cadastral_polygon(coastal_req)
    assert coastal_res["clearance_status"] == "CONDITIONAL_CRZ_CLEARANCE"

def test_tribunal_nyaya_disputes_and_arbitration():
    # 1. Disputes
    disputes = get_tribunal_disputes()
    assert disputes["total_active_tribunal_cases"] >= 2

    # 2. Arbitrate case
    arb_req = ArbitrateDisputeRequest(case_number="RTSA-MH-PUN-2026-042")
    arb_res = arbitrate_dispute_multi_agent(arb_req)
    assert arb_res["status"] == "DECREE_PROMULGATED"
    assert "investigative_agent" in arb_res["multi_agent_deliberation"]
    assert "statutory_legal_agent" in arb_res["multi_agent_deliberation"]
    assert arb_res["quasi_judicial_decree"]["citizen_compensation_inr"] > 0

def test_accessibility_profiles_and_narration():
    # 1. Profiles
    profiles = get_accessibility_profiles()
    assert len(profiles["profiles"]) >= 4

    # 2. Synthesize accessible narration
    synth_req = SynthesizeNarrationRequest(
        text_content="आपला अर्ज मंजूर करण्यात आला आहे.",
        language="mr"
    )
    synth_res = synthesize_accessible_narration(synth_req)
    assert synth_res["status"] == "ACCESSIBLE_REPRESENTATION_GENERATED"
    assert len(synth_res["bharati_braille_unicode_stream"]) > 0
    assert "Marathi Phonetic SSML" in synth_res["phonetic_speech_script"]

def test_tribal_fra_claims_and_reconciliation():
    # 1. Claims
    claims = get_fra_claims()
    assert claims["total_claims_monitored"] >= 2

    # 2. Reconcile claim
    rec_req = ReconcileFRAClaimRequest(
        claim_id="FRA-MH-GAD-ETAPALLI-01",
        district_collector_signoff=True
    )
    rec_res = reconcile_tribal_fra_claim(rec_req)
    assert rec_res["status"] == "VANADHIKAR_TITLE_DEED_CONFERRED"
    assert rec_res["title_deed_number"].startswith("IN-MH-FRA-PATTA-2026-")
    assert rec_res["area_recognized_acres"] == 1820.0
