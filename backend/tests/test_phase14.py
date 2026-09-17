import pytest

from backend.app.api.pds_ration_optimizer import (
    get_fair_price_shop_nodes,
    dispatch_grain_replenishment_convoy,
    DispatchReplenishmentRequest
)
from backend.app.api.jal_jeevan_telemetry import (
    get_aquifer_sensors,
    dispatch_emergency_potable_water_tanker,
    DispatchTankerRequest
)
from backend.app.api.ev_grid_balancer import (
    get_ev_charging_hubs,
    balance_ev_charging_grid_load,
    BalanceChargeRequest
)
from backend.app.api.police_cctns_station import (
    get_recent_cctns_records,
    file_lost_property_nc_report,
    FileLostPropertyRequest
)
from backend.app.api.meripehchaan_sso import (
    get_meripehchaan_federation_status,
    exchange_meripehchaan_token_for_mahasetu_session,
    TokenExchangeRequest
)

def test_pds_ration_optimizer_and_replenishment():
    # 1. FPS nodes
    nodes = get_fair_price_shop_nodes()
    assert nodes["total_fps_monitored"] >= 3
    assert nodes["total_beneficiaries_active"] > 5000

    # 2. Dispatch replenishment
    req = DispatchReplenishmentRequest(fps_id="FPS-AUR-PAITHAN-02", replenish_quintals=150.0)
    res = dispatch_grain_replenishment_convoy(req)
    assert res["status"] == "REPLENISHMENT_CONVOY_DISPATCHED"
    assert res["convoy_id"].startswith("GRAIN-CONVOY-MH-")
    assert res["truck_tracking_vehicle_no"].startswith("MH-")

def test_jal_jeevan_aquifer_telemetry_and_tanker():
    # 1. Aquifer sensors
    sensors = get_aquifer_sensors()
    assert sensors["total_watersheds_monitored"] >= 3
    assert sensors["regional_average_groundwater_mbgl"] > 0

    # 2. Dispatch tanker
    req = DispatchTankerRequest(sensor_id="JAL-LAT-AUSA-01", tanker_capacity_litres=12000)
    res = dispatch_emergency_potable_water_tanker(req)
    assert res["status"] == "EMERGENCY_TANKER_DISPATCHED"
    assert res["tanker_trip_id"].startswith("TANKER-MH-JAL-")
    assert res["potable_water_litres"] == 12000

def test_ev_grid_balancer_and_peak_shaving():
    # 1. Hubs
    hubs = get_ev_charging_hubs()
    assert hubs["total_active_charging_hubs"] >= 3
    assert hubs["total_electric_buses_charging"] > 50

    # 2. Balance charge
    req = BalanceChargeRequest(hub_id="HUB-BEST-MUM-WADALA-01")
    res = balance_ev_charging_grid_load(req)
    assert res["status"] == "SMART_GRID_LOAD_BALANCED"
    assert res["dispatch_job_id"].startswith("GRID-SHAVE-MH-")
    assert res["shaved_peak_demand_kva"] > 0

def test_police_cctns_digital_station_and_nc_report():
    # 1. Records
    records = get_recent_cctns_records()
    assert records["total_digital_records_logged"] >= 2

    # 2. File lost property
    req = FileLostPropertyRequest(
        citizen_name="Pooja Shankar Deshmukh",
        contact_phone="9822019283",
        item_lost="Original University Degree Certificate & Aadhaar Card",
        incident_location="Dadar Railway Station Central Concourse, Mumbai",
        police_station="Dadar Police Station"
    )
    res = file_lost_property_nc_report(req)
    assert res["status"] == "NC_CERTIFICATE_ISSUED_INSTANTLY"
    assert res["cctns_reference_number"].startswith("CCTNS-NC-MH-2026-")
    assert res["digital_signature_hash"].startswith("0xPOLICE-CCTNS-")

def test_meripehchaan_national_sso_federation():
    # 1. Federation status
    status = get_meripehchaan_federation_status()
    assert status["federation_health"] == "CONNECTED_AND_SYNCHRONIZED"
    assert len(status["supported_national_issuers"]) >= 3

    # 2. Exchange token
    req = TokenExchangeRequest(
        meripehchaan_id_token="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.meripehchaan.national.gov.in",
        citizen_name="Ananya Vikram Rao",
        home_state="Karnataka",
        digilocker_linked_uid="vault:uidai:109238475612"
    )
    res = exchange_meripehchaan_token_for_mahasetu_session(req)
    assert res["status"] == "NATIONAL_SSO_FEDERATED_LOGIN_SUCCESS"
    assert res["mahasetu_session_token"].startswith("MAHA-SSO-SESSION-")
    assert "Karnataka" in res["cross_state_interoperability"]
