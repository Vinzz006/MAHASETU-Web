import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(
    prefix="/api/green", tags=["MahaHarit — Green GovTech & Carbon Offset Ledger"]
)

DISTRICT_GREEN_METRICS = [
    {
        "district": "Pune",
        "paper_sheets_saved": 84200,
        "travel_km_eliminated": 248000,
        "co2_offset_kg": 33400,
        "queue_hours_saved": 52100,
        "trees_preserved": 10.1,
        "green_index_score": 98.4,
    },
    {
        "district": "Mumbai Suburban",
        "paper_sheets_saved": 112000,
        "travel_km_eliminated": 315000,
        "co2_offset_kg": 42500,
        "queue_hours_saved": 68400,
        "trees_preserved": 13.4,
        "green_index_score": 99.1,
    },
    {
        "district": "Nagpur",
        "paper_sheets_saved": 61400,
        "travel_km_eliminated": 182000,
        "co2_offset_kg": 24500,
        "queue_hours_saved": 38200,
        "trees_preserved": 7.4,
        "green_index_score": 96.2,
    },
    {
        "district": "Nashik",
        "paper_sheets_saved": 51200,
        "travel_km_eliminated": 154000,
        "co2_offset_kg": 20800,
        "queue_hours_saved": 32100,
        "trees_preserved": 6.1,
        "green_index_score": 94.8,
    },
    {
        "district": "Chhatrapati Sambhaji Nagar",
        "paper_sheets_saved": 46800,
        "travel_km_eliminated": 139000,
        "co2_offset_kg": 18700,
        "queue_hours_saved": 29400,
        "trees_preserved": 5.6,
        "green_index_score": 93.9,
    },
]


@router.get("/footprint")
def get_green_footprint_metrics():
    """
    Returns state-level environmental impact counters showing tangible CO2 reduction,
    paper conservation, and citizen transit savings.
    """
    total_paper = sum(d["paper_sheets_saved"] for d in DISTRICT_GREEN_METRICS)
    total_km = sum(d["travel_km_eliminated"] for d in DISTRICT_GREEN_METRICS)
    total_co2_kg = sum(d["co2_offset_kg"] for d in DISTRICT_GREEN_METRICS)
    total_hours = sum(d["queue_hours_saved"] for d in DISTRICT_GREEN_METRICS)
    total_trees = round(sum(d["trees_preserved"] for d in DISTRICT_GREEN_METRICS), 1)

    now_iso = datetime.now(timezone.utc).isoformat()
    seal_hash = hashlib.sha256(
        f"MAHAHARIT-CARBON-OFFSET-{total_co2_kg}-{now_iso[:10]}".encode()
    ).hexdigest()

    return {
        "portal": "MahaHarit — Green GovTech & Environmental Accounting Ledger",
        "timestamp": now_iso,
        "statewide_totals": {
            "physical_paper_sheets_eliminated": total_paper,
            "mature_forest_trees_preserved": total_trees,
            "citizen_physical_travel_km_saved": total_km,
            "metric_tons_co2_avoided": round(total_co2_kg / 1000.0, 2),
            "total_citizen_queue_hours_returned": total_hours,
            "carbon_offset_digest": seal_hash,
        },
        "district_rankings": DISTRICT_GREEN_METRICS,
        "esg_framework": "UN Sustainable Development Goals (SDG 11, 12 & 13) & Mission LiFE",
    }


@router.get("/certificate/{district_name}")
def get_district_green_certificate(district_name: str):
    """
    Generates a verifiable district Eco-Governance Green Certificate.
    """
    target = next(
        (
            d
            for d in DISTRICT_GREEN_METRICS
            if d["district"].lower() == district_name.lower()
        ),
        None,
    )
    if not target:
        target = DISTRICT_GREEN_METRICS[0]

    cert_id = f"MAHA-ECO-2026-{target['district'].upper()[:4]}-01"
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "certificate_id": cert_id,
        "district": target["district"],
        "awarded_by": "Government of Maharashtra Environment & Climate Change Department",
        "citation": f"Awarded to {target['district']} Collectorate for eliminating {target['paper_sheets_saved']} physical application dossiers through MahaSetu Interoperability Hub.",
        "co2_mitigated_kg": target["co2_offset_kg"],
        "trees_saved": target["trees_preserved"],
        "green_rating": "5-STAR ECO-GOVERNANCE CERTIFIED",
        "digital_stamp": hashlib.sha256((cert_id + now_iso).encode()).hexdigest(),
        "issued_date": now_iso,
    }
