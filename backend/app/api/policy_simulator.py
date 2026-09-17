from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/simulator", tags=["AI Policy Impact Simulator"])

class PolicySimulationRequest(BaseModel):
    scheme_id: str = "employment-support"
    income_ceiling_inr: int = 250000
    target_districts_count: int = 36
    sla_target_hours: int = 72
    include_legacy_sync: bool = True

SCHEME_BASELINES = {
    "employment-support": {"base_beneficiaries": 18000, "benefit_amount_inr": 60000, "adapter_weight": 1.0},
    "farmer-dbt": {"base_beneficiaries": 45000, "benefit_amount_inr": 12000, "adapter_weight": 1.4},
    "urban-housing": {"base_beneficiaries": 8500, "benefit_amount_inr": 250000, "adapter_weight": 1.8},
    "smart-ration": {"base_beneficiaries": 92000, "benefit_amount_inr": 4800, "adapter_weight": 0.9}
}

@router.post("/evaluate")
def evaluate_policy_scenario(req: PolicySimulationRequest):
    baseline = SCHEME_BASELINES.get(req.scheme_id, SCHEME_BASELINES["employment-support"])

    # Elasticity modeling: Higher income ceilings increase eligible population
    income_multiplier = (req.income_ceiling_inr / 200000.0) ** 0.82
    district_ratio = req.target_districts_count / 36.0

    projected_beneficiaries = int(baseline["base_beneficiaries"] * income_multiplier * district_ratio)
    total_budget_outlay_cr = round((projected_beneficiaries * baseline["benefit_amount_inr"]) / 10000000.0, 2)

    # Interoperability infrastructure load modeling
    daily_transactions = projected_beneficiaries * 4  # 4 department adapter steps per citizen
    peak_throughput_tps = round(daily_transactions / (8 * 3600), 2)  # 8-hour operational window

    # SLA risk calculation: Shorter SLA + higher load increases risk
    sla_pressure = (72.0 / max(12, req.sla_target_hours)) * (peak_throughput_tps / 8.0)
    sla_breach_probability = min(98.5, max(1.2, round(sla_pressure * 4.2, 1)))

    return {
        "scenario_input": req.model_dump(),
        "projections": {
            "eligible_beneficiaries_statewide": projected_beneficiaries,
            "total_fiscal_outlay_crores": total_budget_outlay_cr,
            "annual_citizen_hours_saved": int(projected_beneficiaries * 14.5),
            "estimated_direct_savings_crores": round(total_budget_outlay_cr * 0.12, 2)
        },
        "infrastructure_capacity_impact": {
            "daily_interop_transactions": daily_transactions,
            "peak_transactions_per_second": peak_throughput_tps,
            "hub_capacity_utilization_pct": min(95.0, round(peak_throughput_tps * 6.5, 1)),
            "sla_breach_risk_pct": sla_breach_probability,
            "adapter_load_breakdown": {
                "dept_a_rest_identity": "32%",
                "dept_b_custom_json_eligibility": "30%",
                "dept_c_sanction_authority": "22%",
                "legacy_mainframe_pipe_stream": "16%" if req.include_legacy_sync else "0%"
            }
        },
        "policy_recommendation": (
            "OPTIMAL_FOR_DEPLOYMENT: System capacity easily handles this scenario within existing 72h SLA thresholds."
            if sla_breach_probability < 30 else
            "CAUTION: High transaction concurrency may require scaling Dept B and Legacy 7/12 adapter pools to prevent queue delays."
        )
    }
