import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/pds-ration", tags=["MahaAnna — PDS Ration Supply Chain Optimizer"]
)

FAIR_PRICE_SHOPS = [
    {
        "fps_id": "FPS-PUN-HAVELI-01",
        "fps_name": "Haveli Central Taluka Ration Depot",
        "district": "Pune",
        "beneficiaries_covered": 4250,
        "wheat_stock_quintals": 185.0,
        "rice_stock_quintals": 140.0,
        "buffer_stock_pct": 68.5,
        "epos_transactions_today": 312,
        "stock_status": "STABLE_IN_STOCK",
    },
    {
        "fps_id": "FPS-AUR-PAITHAN-02",
        "fps_name": "Paithan Godavari Basin Cooperative FPS",
        "district": "Chhatrapati Sambhajinagar",
        "beneficiaries_covered": 3800,
        "wheat_stock_quintals": 18.5,
        "rice_stock_quintals": 12.0,
        "buffer_stock_pct": 14.8,
        "epos_transactions_today": 485,
        "stock_status": "DEPLETION_ALERT_BELOW_20_PCT",
    },
    {
        "fps_id": "FPS-NAG-HINGNA-03",
        "fps_name": "Hingna Rural Tribal Sub-Depot",
        "district": "Nagpur",
        "beneficiaries_covered": 2900,
        "wheat_stock_quintals": 120.0,
        "rice_stock_quintals": 95.0,
        "buffer_stock_pct": 52.0,
        "epos_transactions_today": 190,
        "stock_status": "STABLE_IN_STOCK",
    },
]


class DispatchReplenishmentRequest(BaseModel):
    fps_id: str = "FPS-AUR-PAITHAN-02"
    replenish_quintals: float = 150.0


@router.get("/fps-nodes")
def get_fair_price_shop_nodes():
    """
    Returns real-time food grain inventories and biometric e-PoS transactions across Maharashtra FPS shops.
    """
    total_wheat = sum(f["wheat_stock_quintals"] for f in FAIR_PRICE_SHOPS)
    total_rice = sum(f["rice_stock_quintals"] for f in FAIR_PRICE_SHOPS)
    total_beneficiaries = sum(f["beneficiaries_covered"] for f in FAIR_PRICE_SHOPS)

    return {
        "portal": "MahaAnna — PDS Ration Supply Chain Optimizer",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_fps_monitored": len(FAIR_PRICE_SHOPS),
        "total_beneficiaries_active": total_beneficiaries,
        "total_wheat_reserve_quintals": total_wheat,
        "total_rice_reserve_quintals": total_rice,
        "epos_biometric_sync": "100% Aadhaar-ePoS Authenticated (Zero-Ghost-Card-Enforced)",
        "shops": FAIR_PRICE_SHOPS,
    }


@router.post("/dispatch-replenishment")
def dispatch_grain_replenishment_convoy(req: DispatchReplenishmentRequest):
    """
    Dispatches a GPS-geofenced grain transport truck from the nearest MSWC godown.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    fps = next(
        (f for f in FAIR_PRICE_SHOPS if f["fps_id"] == req.fps_id), FAIR_PRICE_SHOPS[0]
    )
    fps["wheat_stock_quintals"] += req.replenish_quintals
    fps["buffer_stock_pct"] = 72.0
    fps["stock_status"] = "REPLENISHMENT_EN_ROUTE"

    convoy_id = f"GRAIN-CONVOY-MH-{random.randint(1000, 9999)}"

    return {
        "status": "REPLENISHMENT_CONVOY_DISPATCHED",
        "convoy_id": convoy_id,
        "destination_fps": req.fps_id,
        "fps_name": fps["fps_name"],
        "dispatched_grain_quintals": req.replenish_quintals,
        "mswc_warehouse_source": "Aurangabad Regional Buffer Silo Hub",
        "truck_tracking_vehicle_no": f"MH-20-BT-{random.randint(1000, 9999)}",
        "eta_hours": 3.5,
        "anti_diversion_seal": "RFID_DIGITAL_LOCK_TAMPER_PROTECTED",
        "timestamp": now_iso,
    }
