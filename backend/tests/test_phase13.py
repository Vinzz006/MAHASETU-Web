import pytest

from backend.app.api.life_events_mesh import (
    get_proactive_life_event_triggers,
    dispatch_proactive_welfare_entitlement,
    DispatchEntitlementRequest
)
from backend.app.api.epidemic_health import (
    get_epidemic_ward_clusters,
    forecast_vector_outbreak,
    ForecastOutbreakRequest
)
from backend.app.api.zk_property_tax import (
    get_ready_reckoner_rates,
    assess_property_tax_and_stamp_duty,
    AssessDutyRequest
)
from backend.app.api.kiosk_solar_telemetry import (
    get_solar_kiosk_telemetry,
    optimize_kiosk_power_profile,
    OptimizePowerRequest
)
from backend.app.api.voice_hotline_agent import (
    get_voice_hotline_dialects,
    converse_with_voice_hotline,
    HotlineConverseRequest
)

def test_proactive_life_events_and_sanction():
    # 1. Triggers
    triggers = get_proactive_life_event_triggers()
    assert triggers["total_active_triggers"] >= 3

    # 2. Zero-touch dispatch
    req = DispatchEntitlementRequest(event_id="EVENT-CRS-BIRTH-2026-912")
    res = dispatch_proactive_welfare_entitlement(req)
    assert res["status"] == "ZERO_TOUCH_SANCTION_ISSUED"
    assert res["sanction_order_id"].startswith("PROACTIVE-SANCTION-")
    assert res["citizen_effort_hours_saved"] > 0

def test_epidemic_health_clusters_and_forecast():
    # 1. Clusters
    clusters = get_epidemic_ward_clusters()
    assert clusters["total_monitored_health_clusters"] >= 3

    # 2. Outbreak forecast
    req = ForecastOutbreakRequest(cluster_id="HEALTH-MUM-FSOUTH-01")
    res = forecast_vector_outbreak(req)
    assert res["status"] == "EPIDEMIC_FORECAST_EVALUATED"
    assert res["epidemic_threat_level"] == "RED_ALERT_EPIDEMIC_SURGE"
    assert res["outbreak_probability_pct"] > 70
    assert len(res["automated_public_health_orders"]) >= 2

def test_zk_property_tax_and_stamp_duty():
    # 1. Rates
    rates = get_ready_reckoner_rates()
    assert len(rates["zones"]) >= 3

    # 2. Assess duty
    req = AssessDutyRequest(
        zone_code="ZONE-MUM-BANDRA-01",
        carpet_area_sqft=850.0,
        declared_transaction_value_inr=45000000.0
    )
    res = assess_property_tax_and_stamp_duty(req)
    assert res["status"] == "ZK_STAMP_DUTY_ASSESSED"
    assert res["payable_stamp_duty_inr"] > 100000
    assert res["zero_knowledge_valuation_proof"].startswith("0xZK-STAMP-")

def test_kiosk_solar_telemetry_and_power_saver():
    # 1. Telemetry
    telemetry = get_solar_kiosk_telemetry()
    assert telemetry["total_monitored_solar_kiosks"] >= 3

    # 2. Optimize power
    req = OptimizePowerRequest(kiosk_id="KIOSK-NAN-DHAD-02")
    res = optimize_kiosk_power_profile(req)
    assert res["status"] == "POWER_PROFILE_OPTIMIZED"
    assert res["active_profile"] == "EDGE_BATTERY_CONSERVATION_SAVER"
    assert res["extended_battery_runtime_hours"] > 10

def test_dialectal_voice_hotline_agent():
    # 1. Dialects
    dialects = get_voice_hotline_dialects()
    assert dialects["total_dialects_supported"] >= 4

    # 2. Converse
    req = HotlineConverseRequest(
        dialect_code="mr-IN-varhadi",
        citizen_speech_input="माझं शेतकरी अनुदान कधी जमा व्हनार हाये? लय दिवस झाले."
    )
    res = converse_with_voice_hotline(req)
    assert res["status"] == "VOICE_RESPONSE_SYNTHESIZED"
    assert res["call_session_id"].startswith("CALL-VOICE-MH-")
    assert "भाऊ" in res["agent_audio_response_text"]
    assert res["speech_synthesis_token"].startswith("bhashini://ssml/marathi/")
