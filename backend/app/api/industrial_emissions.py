import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/industrial-emissions",
    tags=["MahaVayu — Industrial Emissions & MPCB Compliance"],
)

INDUSTRIAL_CEMS_STACKS = [
    {
        "stack_id": "STACK-TAR-CHEM-01",
        "plant_name": "Konkan PetroChem Refineries Ltd",
        "industrial_zone": "MIDC Tarapur Chemical Zone",
        "district": "Palghar",
        "pm25_ug_m3": 185.4,  # statutory limit 60 ug/m3
        "pm10_ug_m3": 310.0,  # statutory limit 100 ug/m3
        "so2_ppm": 142.0,
        "nox_ppm": 118.0,
        "opacity_pct": 38.5,
        "compliance_status": "STATUTORY_NAAQS_BREACH_CRITICAL",
    },
    {
        "stack_id": "STACK-TAL-DYE-02",
        "plant_name": "Sahyadri Synthetic Pigments Corp",
        "industrial_zone": "MIDC Taloja Industrial Area",
        "district": "Raigad",
        "pm25_ug_m3": 52.0,
        "pm10_ug_m3": 84.0,
        "so2_ppm": 45.0,
        "nox_ppm": 48.0,
        "opacity_pct": 14.0,
        "compliance_status": "COMPLIANT_GREEN",
    },
    {
        "stack_id": "STACK-CHK-AUTO-03",
        "plant_name": "Deccan Heavy Forgings & Alloys",
        "industrial_zone": "MIDC Chakan Phase II",
        "district": "Pune",
        "pm25_ug_m3": 78.0,
        "pm10_ug_m3": 112.0,
        "so2_ppm": 68.0,
        "nox_ppm": 72.0,
        "opacity_pct": 21.0,
        "compliance_status": "MARGINAL_EXCEEDANCE_WATCH",
    },
]


class IssuePenaltyRequest(BaseModel):
    stack_id: str = "STACK-TAR-CHEM-01"


@router.get("/industrial-stacks")
def get_industrial_cems_stacks():
    """
    Returns live Continuous Emission Monitoring System (CEMS) stack data across Maharashtra MIDC belts.
    """
    return {
        "portal": "MahaVayu — Industrial Emissions & MPCB Compliance",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_monitored_cems_stacks": len(INDUSTRIAL_CEMS_STACKS),
        "regulatory_authority": "Maharashtra Pollution Control Board (MPCB) & CPCB Central Grid",
        "emission_standards": "National Ambient Air Quality Standards (NAAQS 2026)",
        "stacks": INDUSTRIAL_CEMS_STACKS,
    }


@router.post("/issue-penalty")
def issue_mpcb_stop_work_notice(req: IssuePenaltyRequest):
    """
    Issues an official statutory MPCB Stop-Work order and environmental damage fine.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    stack = next(
        (s for s in INDUSTRIAL_CEMS_STACKS if s["stack_id"] == req.stack_id),
        INDUSTRIAL_CEMS_STACKS[0],
    )
    stack["compliance_status"] = "STOP_WORK_NOTICE_ENFORCED"

    notice_id = f"MPCB-PENALTY-MH-{random.randint(1000, 9999)}"
    fine_amount_inr = 2500000.0  # ₹25 Lakhs statutory fine

    return {
        "status": "STATUTORY_NOTICE_SERVED",
        "notice_id": notice_id,
        "target_plant": stack["plant_name"],
        "industrial_zone": stack["industrial_zone"],
        "primary_breach": f"PM2.5 exceeded by +{round(((stack['pm25_ug_m3'] - 60) / 60) * 100, 1)}% above NAAQS limit",
        "environmental_damage_fine_inr": fine_amount_inr,
        "enforcement_action": "Power and industrial water supply disconnect directed to MSEDCL & MIDC",
        "statutory_act": "Section 31A of Air (Prevention and Control of Pollution) Act 1981",
        "timestamp": now_iso,
    }
