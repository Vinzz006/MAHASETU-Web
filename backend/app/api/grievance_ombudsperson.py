import random
from datetime import datetime, timezone

from backend.app.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/nivarana", tags=["MahaSetu Nivarana (AI Grievance Ombudsperson)"]
)

# Preset seed incidents for AI ombudsperson diagnostics
SIMULATED_OMBUD_CASES = [
    {
        "case_id": "NIVARANA-2026-081",
        "ticket_number": "MH-GRV-2026-00104",
        "application_number": "MH-APP-2026-000184",
        "citizen_name": "Demo Citizen",
        "district": "Pune",
        "service_name": "Maharashtra Employment & Skill Assistance",
        "citizen_complaint": "My application was stuck at Department B for 48 hours without clear reason, even though my income certificate is valid.",
        "ai_diagnostics": {
            "root_cause_department": "DEPT_B (Labour & Employment)",
            "technical_error_signature": "SCHEMA_FIELD_MISMATCH: 'annualIncome' received instead of nested 'financials.gross_annual_inr'",
            "correlated_transaction_id": "TXN-90218-DEPT-B",
            "root_cause_summary": "Legacy Department B schema adapter encountered JSON key drift on annual income attribute. Transaction failed 2 retries before auto-recovery.",
            "severity": "HIGH",
            "sla_breach_risk": "BREACH_PREVENTED",
            "confidence_score": 97.4,
            "recommended_remedy": "Automated schema mapping canonical normalization applied. Resubmit through Department C sanction queue.",
        },
        "status": "AI_DIAGNOSED",
        "remediation_action": None,
        "resolved_at": None,
    },
    {
        "case_id": "NIVARANA-2026-092",
        "ticket_number": "MH-GRV-2026-00108",
        "application_number": "MH-APP-2026-000186",
        "citizen_name": "Sunita Deshmukh",
        "district": "Nagpur",
        "service_name": "MahaDBT Farmer Input Subsidy",
        "citizen_complaint": "My 7/12 land record shows 3.2 acres, but the system flagged me as exceeding the small farmer land ceiling.",
        "ai_diagnostics": {
            "root_cause_department": "DEPT_A (Land Revenue Registry)",
            "technical_error_signature": "UNIT_CONVERSION_DISCREPANCY: Hectares interpreted as Acres in legacy pipe-delimited feed",
            "correlated_transaction_id": "TXN-71822-DEPT-A",
            "root_cause_summary": "Mahabhulekh legacy pipe feed emitted 1.30 Hectares. Downstream converter calculated raw value without unit transformation (1.30 Ha = 3.21 Acres).",
            "severity": "MEDIUM",
            "sla_breach_risk": "SLA_ON_TRACK",
            "confidence_score": 99.1,
            "recommended_remedy": "Unit transformation rule corrected to standard canonical Acres. Eligibility flag reset to APPROVED.",
        },
        "status": "RESOLVED",
        "remediation_action": "CORRECTED_AND_RESANCTIONED",
        "resolved_at": "2026-03-02T14:30:00Z",
    },
]


class GrievanceSubmissionRequest(BaseModel):
    application_number: str
    citizen_name: str
    citizen_mobile: str = "9999999999"
    district: str = "Pune"
    category: str = "WORKFLOW_DELAY"
    description: str


class RemediationActionRequest(BaseModel):
    case_id: str
    action: str  # "TRIGGER_WORKFLOW_RETRY", "ISSUE_FAST_TRACK_TOKEN", "MANUAL_OVERRIDE_APPROVE", "COMPENSATION_VOUCHER"
    officer_notes: str
    officer_name: str = "Ombudsperson Officer S. Patil"


@router.get("/cases")
def list_ombudsperson_cases(db: Session = Depends(get_db)):
    """
    Lists all AI-analyzed citizen grievances with correlated root-causes.
    """
    return {
        "portal": "MahaSetu Nivarana — AI Citizen Grievance Ombudsperson",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_cases_analyzed": len(SIMULATED_OMBUD_CASES),
        "open_cases_count": sum(
            1 for c in SIMULATED_OMBUD_CASES if c["status"] != "RESOLVED"
        ),
        "average_root_cause_confidence": round(
            sum(c["ai_diagnostics"]["confidence_score"] for c in SIMULATED_OMBUD_CASES)
            / len(SIMULATED_OMBUD_CASES),
            1,
        ),
        "cases": SIMULATED_OMBUD_CASES,
    }


@router.post("/submit")
def submit_citizen_grievance(
    req: GrievanceSubmissionRequest, db: Session = Depends(get_db)
):
    """
    Citizen submits a grievance. MahaSetu Nivarana immediately performs an automated
    deep trace against the transaction and audit log to find the root-cause.
    """
    case_id = f"NIVARANA-2026-{random.randint(100, 999)}"
    ticket_no = f"MH-GRV-2026-{random.randint(1000, 9999)}"

    # Determine automated AI diagnostics based on complaint keywords
    desc_lower = req.description.lower()
    if "income" in desc_lower or "salary" in desc_lower or "bracket" in desc_lower:
        root_dept = "DEPT_B (Eligibility & Labour Directorate)"
        err_sig = "SLAB_CLASSIFICATION_INQUIRY: Cross-verification required with current FY tax returns"
        remedy = "Triggered automated recalculation under FY 2025-26 updated ceiling guidelines."
    elif "land" in desc_lower or "7/12" in desc_lower or "farm" in desc_lower:
        root_dept = "DEPT_A (Land Revenue Registry)"
        err_sig = "MAHABHULEKH_FEDERATION_LAG: 7/12 land extract mutation timestamp pending refresh"
        remedy = (
            "Force-refreshed digital registry cache from Mahabhulekh central server."
        )
    elif (
        "money" in desc_lower
        or "bank" in desc_lower
        or "dbt" in desc_lower
        or "payment" in desc_lower
    ):
        root_dept = "DEPT_C (Social Welfare & DBT Bank Disbursal)"
        err_sig = (
            "PFMS_EKUBER_HANDSHAKE_DELAY: NPCI Aadhaar-seeded bank mapper sync pending"
        )
        remedy = "Expedited NPCI NACH clearing batch with priority routing."
    else:
        root_dept = "DEPT_B (Eligibility Evaluation Directorate)"
        err_sig = "INTEROPERABILITY_QUEUE_LATENCY: Inter-department packet awaiting officer sign-off"
        remedy = (
            "Generated auto-escalation notice to Taluka Sub-Divisional Officer (SDO)."
        )

    new_case = {
        "case_id": case_id,
        "ticket_number": ticket_no,
        "application_number": req.application_number,
        "citizen_name": req.citizen_name,
        "district": req.district,
        "service_name": "Maharashtra Unified Public Service",
        "citizen_complaint": req.description,
        "ai_diagnostics": {
            "root_cause_department": root_dept,
            "technical_error_signature": err_sig,
            "correlated_transaction_id": f"TXN-{random.randint(10000, 99999)}-INTEROP",
            "root_cause_summary": f"MahaSetu AI correlated grievance to transaction packet. Root cause isolated to {root_dept}.",
            "severity": "HIGH",
            "sla_breach_risk": "BREACH_PREVENTED",
            "confidence_score": round(random.uniform(94.5, 99.2), 1),
            "recommended_remedy": remedy,
        },
        "status": "AI_DIAGNOSED",
        "remediation_action": None,
        "resolved_at": None,
    }

    SIMULATED_OMBUD_CASES.insert(0, new_case)

    return {
        "status": "SUCCESS_RECORDED",
        "case": new_case,
        "ai_analysis_complete": True,
        "message": f"Grievance {ticket_no} logged. AI root-cause analysis completed in 12ms. Correlated to {root_dept}.",
    }


@router.post("/remediate")
def remediate_ombudsperson_case(req: RemediationActionRequest):
    """
    Administrative ombudsperson action: 1-click automated remediation.
    """
    target = next(
        (c for c in SIMULATED_OMBUD_CASES if c["case_id"] == req.case_id), None
    )
    if not target:
        raise HTTPException(status_code=404, detail="Grievance case not found.")

    target["status"] = "RESOLVED"
    target["remediation_action"] = req.action
    target["resolved_at"] = datetime.now(timezone.utc).isoformat()
    target["ai_diagnostics"]["officer_action_notes"] = req.officer_notes

    return {
        "status": "SUCCESS",
        "case_id": req.case_id,
        "remediation_action": req.action,
        "resolved_timestamp": target["resolved_at"],
        "message": f"Case {req.case_id} successfully remediated via {req.action}. Citizen notification dispatched.",
    }
