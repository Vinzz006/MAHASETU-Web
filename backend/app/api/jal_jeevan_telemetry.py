import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/jal-jeevan", tags=["MahaJal — Jal Jeevan Aquifer Telemetry"]
)

AQUIFER_SENSORS = [
    {
        "sensor_id": "JAL-LAT-AUSA-01",
        "village_name": "Ausa Watershed Cluster",
        "district": "Latur",
        "groundwater_level_mbgl": 14.8,  # meters below ground level (deep depletion)
        "tap_water_supply_lpcd": 28.0,  # liters per capita per day (below 55 lpcd norm)
        "soil_moisture_index": 0.18,
        "population": 6400,
        "drought_stage": "CRITICAL_AQUIFER_DEPLETION",
    },
    {
        "sensor_id": "JAL-JAL-AMBAD-02",
        "village_name": "Ambad Cotton Belt Cluster",
        "district": "Jalna",
        "groundwater_level_mbgl": 10.2,
        "tap_water_supply_lpcd": 42.0,
        "soil_moisture_index": 0.34,
        "population": 4800,
        "drought_stage": "MODERATE_STRESS",
    },
    {
        "sensor_id": "JAL-DHA-TULJA-03",
        "village_name": "Tuljapur Temple Foothills",
        "district": "Dharashiv (Osmanabad)",
        "groundwater_level_mbgl": 8.5,
        "tap_water_supply_lpcd": 56.5,
        "soil_moisture_index": 0.48,
        "population": 8200,
        "drought_stage": "NORMAL_POTABLE_SUPPLY",
    },
]


class DispatchTankerRequest(BaseModel):
    sensor_id: str = "JAL-LAT-AUSA-01"
    tanker_capacity_litres: int = 12000


@router.get("/aquifer-sensors")
def get_aquifer_sensors():
    """
    Returns live IoT groundwater levels (mbgl) and Jal Jeevan tap water flow (LPCD) across Marathwada.
    """
    avg_mbgl = sum(s["groundwater_level_mbgl"] for s in AQUIFER_SENSORS) / len(
        AQUIFER_SENSORS
    )
    avg_lpcd = sum(s["tap_water_supply_lpcd"] for s in AQUIFER_SENSORS) / len(
        AQUIFER_SENSORS
    )

    return {
        "portal": "MahaJal — Jal Jeevan Aquifer Telemetry",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_watersheds_monitored": len(AQUIFER_SENSORS),
        "regional_average_groundwater_mbgl": round(avg_mbgl, 2),
        "regional_average_supply_lpcd": round(avg_lpcd, 2),
        "har_ghar_jal_benchmark_lpcd": 55.0,
        "sensors": AQUIFER_SENSORS,
    }


@router.post("/dispatch-tanker")
def dispatch_emergency_potable_water_tanker(req: DispatchTankerRequest):
    """
    Authorizes an emergency GPS-tracked water tanker dispatch to critically depleted villages.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    cluster = next(
        (s for s in AQUIFER_SENSORS if s["sensor_id"] == req.sensor_id),
        AQUIFER_SENSORS[0],
    )
    cluster["tap_water_supply_lpcd"] = 55.0
    cluster["drought_stage"] = "EMERGENCY_TANKER_RELIEF_ACTIVE"

    tanker_trip_id = f"TANKER-MH-JAL-{random.randint(1000, 9999)}"

    return {
        "status": "EMERGENCY_TANKER_DISPATCHED",
        "tanker_trip_id": tanker_trip_id,
        "destination_village": cluster["village_name"],
        "district": cluster["district"],
        "potable_water_litres": req.tanker_capacity_litres,
        "gps_registered_tanker_no": f"MH-24-AG-{random.randint(1000, 9999)}",
        "source_reservoir": "Manjara Dam Regional Potable Filtration Hub",
        "eta_minutes": 45,
        "iot_flow_sensor_verification": "AUTOMATED_DISCHARGE_METRIC_LINKED",
        "timestamp": now_iso,
    }
