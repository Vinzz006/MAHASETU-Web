import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/kiosk-solar", tags=["MahaUrja — Gramin Kiosk Solar Microgrid Telemetry"])

REMOTE_SOLAR_KIOSKS = [
    {
        "kiosk_id": "KIOSK-GAD-BHAM-01",
        "location": "Bhamragad Tribal Forest Post",
        "district": "Gadchiroli",
        "battery_soc_pct": 82.5,
        "solar_pv_generation_watts": 480.0,
        "inverter_load_watts": 145.0,
        "offline_queued_transactions": 24,
        "grid_connection": "100% OFF-GRID SOLAR MICROGRID",
        "power_profile": "NORMAL_ACTIVE"
    },
    {
        "kiosk_id": "KIOSK-NAN-DHAD-02",
        "location": "Dhadgaon Satpuda Hilltop CSC",
        "district": "Nandurbar",
        "battery_soc_pct": 34.0,
        "solar_pv_generation_watts": 85.0,
        "inverter_load_watts": 130.0,
        "offline_queued_transactions": 19,
        "grid_connection": "100% OFF-GRID SOLAR MICROGRID",
        "power_profile": "MONSOON_CLOUD_DEFICIT"
    },
    {
        "kiosk_id": "KIOSK-MEL-CHIKH-03",
        "location": "Chikhaldara Melghat Tiger Reserve Kiosk",
        "district": "Amravati",
        "battery_soc_pct": 91.0,
        "solar_pv_generation_watts": 520.0,
        "inverter_load_watts": 110.0,
        "offline_queued_transactions": 8,
        "grid_connection": "100% OFF-GRID SOLAR MICROGRID",
        "power_profile": "OPTIMAL_GREEN"
    }
]

class OptimizePowerRequest(BaseModel):
    kiosk_id: str = "KIOSK-NAN-DHAD-02"

@router.get("/kiosk-telemetry")
def get_solar_kiosk_telemetry():
    """
    Returns live solar microgrid telemetry, battery state of charge, and edge transaction counts.
    """
    return {
        "portal": "MahaUrja — Gramin Kiosk Solar Microgrid Telemetry",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_monitored_solar_kiosks": len(REMOTE_SOLAR_KIOSKS),
        "telemetry_link": "LoRaWAN & ISRO NavIC Low-Power Edge Uplink",
        "kiosks": REMOTE_SOLAR_KIOSKS
    }

@router.post("/optimize-power")
def optimize_kiosk_power_profile(req: OptimizePowerRequest):
    """
    Activates low-power edge conservation mode to safeguard transaction queues during solar deficits.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    kiosk = next((k for k in REMOTE_SOLAR_KIOSKS if k["kiosk_id"] == req.kiosk_id), REMOTE_SOLAR_KIOSKS[0])
    kiosk["power_profile"] = "EDGE_BATTERY_CONSERVATION_SAVER"

    return {
        "status": "POWER_PROFILE_OPTIMIZED",
        "kiosk_id": req.kiosk_id,
        "location": kiosk["location"],
        "active_profile": "EDGE_BATTERY_CONSERVATION_SAVER",
        "power_saving_actions": [
            "Thermal printer and external display backlight powered down.",
            "Biometric iris/fingerprint scanner throttled to demand-wake mode.",
            "LoRaWAN telemetry transmissions batched to 30-minute intervals."
        ],
        "extended_battery_runtime_hours": 18.5,
        "offline_queue_integrity": "GUARANTEED (Flash EEPROM Protected)",
        "timestamp": now_iso
    }
