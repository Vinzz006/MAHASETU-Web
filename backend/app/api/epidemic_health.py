import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/epidemic-health", tags=["MahaArogya — Predictive Epidemic Surveillance"])

SAMPLE_HEALTH_CLUSTERS = [
    {
        "cluster_id": "HEALTH-MUM-FSOUTH-01",
        "district": "Mumbai",
        "ward": "F/South Ward (Parel / KEM Hospital Belt)",
        "disease_vector": "Dengue & Leptospirosis",
        "weekly_cases": 142,
        "three_year_baseline_cases": 68,
        "monsoon_rainfall_mm": 210.5,
        "epidemic_index": 2.08,
        "status": "ELEVATED_VECTOR_CLUSTER"
    },
    {
        "cluster_id": "HEALTH-PUN-KASBA-02",
        "district": "Pune",
        "ward": "Kasba Peth / Mutha River Embankment",
        "disease_vector": "Chikungunya & Dengue",
        "weekly_cases": 88,
        "three_year_baseline_cases": 72,
        "monsoon_rainfall_mm": 95.0,
        "epidemic_index": 1.22,
        "status": "WATCH_STAGE"
    },
    {
        "cluster_id": "HEALTH-NAG-SITA-03",
        "district": "Nagpur",
        "ward": "Sitabuldi Urban Health Post",
        "disease_vector": "Seasonal Malaria",
        "weekly_cases": 24,
        "three_year_baseline_cases": 28,
        "monsoon_rainfall_mm": 45.0,
        "epidemic_index": 0.85,
        "status": "NORMAL_BASELINE"
    }
]

class ForecastOutbreakRequest(BaseModel):
    cluster_id: str = "HEALTH-MUM-FSOUTH-01"

@router.get("/ward-clusters")
def get_epidemic_ward_clusters():
    """
    Returns real-time syndromic disease telemetry, case counts, and monsoon vectors.
    """
    return {
        "portal": "MahaArogya — Predictive Epidemic Surveillance",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_monitored_health_clusters": len(SAMPLE_HEALTH_CLUSTERS),
        "surveillance_source": "Integrated Disease Surveillance Programme (IDSP) & Municipal Hospitals",
        "clusters": SAMPLE_HEALTH_CLUSTERS
    }

@router.post("/forecast-outbreak")
def forecast_vector_outbreak(req: ForecastOutbreakRequest):
    """
    Evaluates epidemiological risk models and issues automated municipal fumigation notices.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    cluster = next((c for c in SAMPLE_HEALTH_CLUSTERS if c["cluster_id"] == req.cluster_id), SAMPLE_HEALTH_CLUSTERS[0])

    is_surge = cluster["weekly_cases"] > (cluster["three_year_baseline_cases"] * 1.25)
    outbreak_prob = 89.4 if is_surge else 18.5

    return {
        "status": "EPIDEMIC_FORECAST_EVALUATED",
        "cluster_id": req.cluster_id,
        "ward": cluster["ward"],
        "disease_vector": cluster["disease_vector"],
        "outbreak_probability_pct": outbreak_prob,
        "epidemic_threat_level": "RED_ALERT_EPIDEMIC_SURGE" if is_surge else "GREEN_BASELINE",
        "automated_public_health_orders": [
            f"Automated vector fumigation drone deployment ordered in {cluster['ward']}.",
            "Hospital Fever OPD isolation triage expanded with 50 emergency beds.",
            "Free platelet and prophylactic doxycycline supply dispatched to municipal dispensaries."
        ] if is_surge else ["Routine larvicide spraying maintained on schedule."],
        "timestamp": now_iso
    }
