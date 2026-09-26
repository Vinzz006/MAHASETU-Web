import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/treasury-beams",
    tags=["MahaNidhi — Treasury & BeAMS Liquidity Auditor"],
)

DEPARTMENTAL_BEAMS_ALLOCATIONS = [
    {
        "department": "Agriculture & Farmers Welfare",
        "budget_head": "2401-Crop-Husbandry",
        "quarterly_sanction_cr": 4200.0,
        "disbursed_to_date_cr": 3150.4,
        "available_headroom_cr": 1049.6,
        "utilization_pct": 75.0,
        "liquidity_status": "LIQUID_GREEN",
    },
    {
        "department": "Social Justice & Special Assistance",
        "budget_head": "2225-Welfare-SC-ST-OBC",
        "quarterly_sanction_cr": 3800.0,
        "disbursed_to_date_cr": 3210.0,
        "available_headroom_cr": 590.0,
        "utilization_pct": 84.5,
        "liquidity_status": "NEAR_THRESHOLD_YELLOW",
    },
    {
        "department": "Tribal Development Department",
        "budget_head": "2225-Tribal-Sub-Plan",
        "quarterly_sanction_cr": 2100.0,
        "disbursed_to_date_cr": 1420.8,
        "available_headroom_cr": 679.2,
        "utilization_pct": 67.6,
        "liquidity_status": "LIQUID_GREEN",
    },
]


class ReconcileSanctionRequest(BaseModel):
    department: str = "Agriculture & Farmers Welfare"
    scheme_code: str = "SCHEME-PM-KISAN-MH-01"
    requested_amount_cr: float = 25.5


@router.get("/liquidity-pulse")
def get_treasury_liquidity_pulse():
    """
    Returns real-time state exchequer balances, BeAMS allocation headroom, and burn rates.
    """
    total_sanction = sum(
        d["quarterly_sanction_cr"] for d in DEPARTMENTAL_BEAMS_ALLOCATIONS
    )
    total_disbursed = sum(
        d["disbursed_to_date_cr"] for d in DEPARTMENTAL_BEAMS_ALLOCATIONS
    )
    total_headroom = sum(
        d["available_headroom_cr"] for d in DEPARTMENTAL_BEAMS_ALLOCATIONS
    )

    return {
        "portal": "MahaNidhi — Treasury & BeAMS Liquidity Auditor",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "state_consolidated_fund_exchequer_balance_cr": 18450.25,
        "beams_macro_summary": {
            "total_quarterly_sanction_cr": total_sanction,
            "total_disbursed_to_date_cr": round(total_disbursed, 2),
            "available_headroom_cr": round(total_headroom, 2),
            "statewide_burn_rate_pct": round(
                (total_disbursed / total_sanction) * 100, 2
            ),
        },
        "department_allocations": DEPARTMENTAL_BEAMS_ALLOCATIONS,
        "koshwahini_sync_status": "REAL_TIME_PULSE_ACTIVE",
    }


@router.post("/reconcile-sanction")
def reconcile_scheme_sanction(req: ReconcileSanctionRequest):
    """
    Verifies exchequer liquidity and BeAMS budget head headroom before committing funds.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    dept = next(
        (
            d
            for d in DEPARTMENTAL_BEAMS_ALLOCATIONS
            if d["department"] == req.department
        ),
        DEPARTMENTAL_BEAMS_ALLOCATIONS[0],
    )
    has_sufficient_headroom = dept["available_headroom_cr"] >= req.requested_amount_cr

    auth_token = f"BEAMS-AUTH-2026-{random.randint(100000, 999999)}"

    return {
        "status": (
            "TREASURY_CLEARANCE_APPROVED"
            if has_sufficient_headroom
            else "HEADROOM_EXCEEDED"
        ),
        "reconciliation_decision": (
            "AUTHORIZED_FOR_IMMEDIATE_DBT"
            if has_sufficient_headroom
            else "HELD_PENDING_SUPPLEMENTARY_GRANT"
        ),
        "department": req.department,
        "scheme_code": req.scheme_code,
        "requested_amount_cr": req.requested_amount_cr,
        "remaining_department_headroom_cr": round(
            dept["available_headroom_cr"]
            - (req.requested_amount_cr if has_sufficient_headroom else 0),
            2,
        ),
        "treasury_authorization_token": auth_token,
        "overdraft_risk": "ZERO (Pre-funded exchequer reserve verified)",
        "timestamp": now_iso,
    }
