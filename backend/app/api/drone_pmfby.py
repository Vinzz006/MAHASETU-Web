import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/drone-pmfby",
    tags=["MahaPahani — Drone AI Crop Damage & PMFBY Settlement"],
)

SAMPLE_DRONE_SURVEYS = [
    {
        "survey_id": "DRONE-UAV-LAT-2026-081",
        "district": "Latur",
        "taluka": "Ausa",
        "crop": "Soybean (Kharif)",
        "farmer_name": "Baburao Kadam",
        "gat_number": "214/1",
        "insured_area_hectares": 3.2,
        "pre_disaster_ndvi": 0.74,
        "post_disaster_ndvi": 0.18,
        "damage_percentage": 75.7,
        "disaster_type": "UNSEASONAL_HAILSTORM_AND_FLOOD",
        "claim_status": "PENDING_ASSESSMENT",
    },
    {
        "survey_id": "DRONE-UAV-BEE-2026-092",
        "district": "Beed",
        "taluka": "Georai",
        "crop": "Bt Cotton",
        "farmer_name": "Tukaram Shinde",
        "gat_number": "119/A",
        "insured_area_hectares": 2.5,
        "pre_disaster_ndvi": 0.68,
        "post_disaster_ndvi": 0.22,
        "damage_percentage": 67.6,
        "disaster_type": "SEVERE_MOISTURE_STRESS_DROUGHT",
        "claim_status": "PENDING_ASSESSMENT",
    },
]


class SettleClaimRequest(BaseModel):
    survey_id: str = "DRONE-UAV-LAT-2026-081"


@router.get("/surveys")
def get_drone_pmfby_surveys():
    """
    Returns aerial drone multispectral surveys and NDVI crop loss telemetry across Marathwada & Vidarbha.
    """
    return {
        "portal": "MahaPahani — Drone AI Crop Damage & PMFBY Settlement",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_drone_missions_logged": len(SAMPLE_DRONE_SURVEYS),
        "insurance_framework": "Pradhan Mantri Fasal Bima Yojana (PMFBY) State Drone Protocol",
        "surveys": SAMPLE_DRONE_SURVEYS,
    }


@router.post("/settle-claim")
def settle_drone_pmfby_claim(req: SettleClaimRequest):
    """
    Computes compensation based on multispectral NDVI delta and executes instant PMFBY DBT credit.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    survey = next(
        (s for s in SAMPLE_DRONE_SURVEYS if s["survey_id"] == req.survey_id),
        SAMPLE_DRONE_SURVEYS[0],
    )
    survey["claim_status"] = "APPROVED_DIRECT_CREDIT_DISBURSED"

    max_sum_insured = survey["insured_area_hectares"] * 45000.0  # ₹45,000 / hectare
    payout_inr = round(max_sum_insured * (survey["damage_percentage"] / 100.0), 2)
    utr_no = f"PMFBY-CLAIM-MH-{random.randint(100000, 999999)}"

    return {
        "status": "PMFBY_CLAIM_SETTLED_INSTANTLY",
        "survey_id": req.survey_id,
        "farmer_name": survey["farmer_name"],
        "gat_number": survey["gat_number"],
        "district": survey["district"],
        "crop": survey["crop"],
        "ndvi_damage_delta": round(
            survey["pre_disaster_ndvi"] - survey["post_disaster_ndvi"], 3
        ),
        "evaluated_loss_pct": survey["damage_percentage"],
        "insurance_payout_amount_inr": payout_inr,
        "dbt_utr_number": utr_no,
        "settlement_timeline": "INSTANT (Eliminated 60-day physical crop-cutting delay)",
        "timestamp": now_iso,
    }
