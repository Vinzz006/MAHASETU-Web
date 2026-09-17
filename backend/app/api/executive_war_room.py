from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/war-room", tags=["Chief Minister's Executive War Room (MahaDrishti)"])

REGIONAL_GOVERNANCE_DIVISIONS = [
    {
        "division_name": "Pune Division (Western Maharashtra)",
        "districts_count": 5,
        "active_applications": 284500,
        "disbursed_funds_cr": 680.4,
        "sla_compliance_pct": 99.1,
        "critical_escalations": 0,
        "status": "EXEMPLARY_GREEN"
    },
    {
        "division_name": "Konkan Division (Mumbai & Coastal)",
        "districts_count": 7,
        "active_applications": 412000,
        "disbursed_funds_cr": 940.2,
        "sla_compliance_pct": 98.6,
        "critical_escalations": 1,
        "status": "OPTIMAL_GREEN"
    },
    {
        "division_name": "Nagpur & Amravati Divisions (Vidarbha)",
        "districts_count": 11,
        "active_applications": 320100,
        "disbursed_funds_cr": 512.8,
        "sla_compliance_pct": 96.2,
        "critical_escalations": 2,
        "status": "MONITORED_YELLOW"
    },
    {
        "division_name": "Chh. Sambhaji Nagar Division (Marathwada)",
        "districts_count": 8,
        "active_applications": 268400,
        "disbursed_funds_cr": 420.5,
        "sla_compliance_pct": 94.8,
        "critical_escalations": 1,
        "status": "EXPEDITED_ATTENTION"
    },
    {
        "division_name": "Nashik Division (North Maharashtra / Khandesh)",
        "districts_count": 5,
        "active_applications": 197900,
        "disbursed_funds_cr": 291.7,
        "sla_compliance_pct": 95.4,
        "critical_escalations": 0,
        "status": "OPTIMAL_GREEN"
    }
]

class PolicyShiftRequest(BaseModel):
    welfare_budget_multiplier: float = 1.25
    income_ceiling_expansion_pct: float = 15.0
    fast_track_sla_days: int = 2

@router.get("/macro-pulse")
def get_executive_macro_pulse():
    """
    Returns real-time macro-governance pulse for the Chief Minister & Chief Secretary.
    """
    total_apps = sum(d["active_applications"] for d in REGIONAL_GOVERNANCE_DIVISIONS)
    total_funds_cr = sum(d["disbursed_funds_cr"] for d in REGIONAL_GOVERNANCE_DIVISIONS)
    avg_sla = round(sum(d["sla_compliance_pct"] for d in REGIONAL_GOVERNANCE_DIVISIONS) / len(REGIONAL_GOVERNANCE_DIVISIONS), 2)

    return {
        "portal": "MahaDrishti — Chief Minister's Executive War Room",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "statewide_macro_metrics": {
            "total_citizen_transactions_processed": total_apps,
            "total_direct_benefit_disbursed_crores": round(total_funds_cr, 2),
            "statewide_sla_compliance_pct": avg_sla,
            "average_turnaround_time_days": 3.2,
            "baseline_turnaround_prior_to_mahasetu_days": 21.0,
            "turnaround_velocity_improvement_pct": 84.7,
            "total_divisions_monitored": len(REGIONAL_GOVERNANCE_DIVISIONS)
        },
        "regional_breakdown": REGIONAL_GOVERNANCE_DIVISIONS,
        "governance_mandate": "Zero Red-Tape Public Delivery & 100% Direct Citizen Credit"
    }

@router.post("/simulate-policy-shift")
def simulate_policy_shift(req: PolicyShiftRequest):
    """
    Simulates macroeconomic impacts of expanding welfare eligibility and tightening SLAs.
    """
    projected_additional_beneficiaries = int(142000 * (req.income_ceiling_expansion_pct / 10.0))
    projected_additional_fiscal_cr = round(projected_additional_beneficiaries * 0.015 * req.welfare_budget_multiplier, 2)

    return {
        "status": "SIMULATION_COMPLETED",
        "input_parameters": {
            "budget_multiplier": req.welfare_budget_multiplier,
            "income_expansion": f"+{req.income_ceiling_expansion_pct}%",
            "target_sla_days": req.fast_track_sla_days
        },
        "projected_impacts": {
            "additional_citizens_covered": projected_additional_beneficiaries,
            "projected_additional_fiscal_outlay_cr": projected_additional_fiscal_cr,
            "estimated_rural_economic_stimulus_index": "HIGH (+18.4%)",
            "required_gramin_csc_edge_nodes": 450,
            "feasibility_verdict": "FEASIBLE: MahaSetu mesh possesses 8.4x head-room capacity to absorb surge."
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
