from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/fraud", tags=["Cross-Department Fraud & Anomaly Detector"]
)

# In-memory store initialized with realistic cross-department benchmark anomalies
ANOMALIES_DB = [
    {
        "id": "ANOM-2026-001",
        "anomaly_type": "CROSS_DEPT_INCOME_DISCREPANCY",
        "severity": "HIGH",
        "risk_score": 88,
        "application_number": "MH-APP-2026-000185",
        "beneficiary_name": "Suresh Patil",
        "district": "Pune",
        "description": "Applicant declared annual income ₹1,80,000 on Welfare Portal, but Dept B (Revenue & Tax) assessed actual income at ₹6,50,000.",
        "discrepancy_details": {
            "portal_declared_income": 180000,
            "department_b_actual_income": 650000,
            "income_differential_pct": 261.1,
            "source_department": "DEPT_B_REVENUE",
        },
        "status": "FLAGGED_FOR_REVIEW",
        "detected_at": "2026-09-02T16:30:00Z",
        "action_taken": None,
    },
    {
        "id": "ANOM-2026-002",
        "anomaly_type": "DUPLICATE_LAND_PARCEL_CLAIM",
        "severity": "HIGH",
        "risk_score": 94,
        "application_number": "MH-APP-2026-000188",
        "beneficiary_name": "Ramesh Deshmukh",
        "district": "Nashik",
        "description": "Mahabhulekh Land 7/12 Parcel (Gat No. 142/A, Niphad) was already claimed in active sanction MH-APP-2026-000172 by another applicant.",
        "discrepancy_details": {
            "gat_number": "142/A",
            "taluka": "Niphad",
            "conflicting_application": "MH-APP-2026-000172",
            "source_department": "LEGACY_MAINFRAME_LAND_712",
        },
        "status": "FLAGGED_FOR_REVIEW",
        "detected_at": "2026-09-02T17:15:00Z",
        "action_taken": None,
    },
    {
        "id": "ANOM-2026-003",
        "anomaly_type": "SYNTHETIC_DEMOGRAPHIC_MISMATCH",
        "severity": "MEDIUM",
        "risk_score": 62,
        "application_number": "MH-APP-2026-000191",
        "beneficiary_name": "Pooja Jadhav",
        "district": "Chhatrapati Sambhajinagar",
        "description": "Date of Birth declared as 1999-04-12, but Department A (Civil Registration) authoritative token indicates 1996-04-12.",
        "discrepancy_details": {
            "portal_dob": "1999-04-12",
            "authoritative_dept_a_dob": "1996-04-12",
            "age_differential_years": 3,
            "source_department": "DEPT_A_CIVIL_REGISTRY",
        },
        "status": "CLEARED_BY_OFFICER",
        "detected_at": "2026-09-02T15:00:00Z",
        "action_taken": "Verified clerical error in portal entry. Birth certificate cross-matched. Cleared by Officer OFF-001.",
    },
]


class AnomalyResolveRequest(BaseModel):
    action: str  # "FREEZE_BENEFIT", "CLEAR_ANOMALY", "REQUEST_CLARIFICATION"
    officer_notes: str


@router.get("/anomalies")
def get_fraud_anomalies():
    total = len(ANOMALIES_DB)
    high_risk = sum(
        1
        for a in ANOMALIES_DB
        if a["severity"] == "HIGH" and a["status"] == "FLAGGED_FOR_REVIEW"
    )
    medium_risk = sum(
        1
        for a in ANOMALIES_DB
        if a["severity"] == "MEDIUM" and a["status"] == "FLAGGED_FOR_REVIEW"
    )
    cleared = sum(1 for a in ANOMALIES_DB if a["status"] == "CLEARED_BY_OFFICER")
    frozen = sum(1 for a in ANOMALIES_DB if a["status"] == "BENEFIT_FROZEN")

    return {
        "summary": {
            "total_anomalies_detected": total,
            "pending_high_risk": high_risk,
            "pending_medium_risk": medium_risk,
            "cleared_by_officer": cleared,
            "benefits_frozen": frozen,
            "estimated_fraud_loss_prevented_inr": 2450000,
        },
        "anomalies": ANOMALIES_DB,
    }


@router.post("/{anomaly_id}/resolve")
def resolve_fraud_anomaly(anomaly_id: str, req: AnomalyResolveRequest):
    anomaly = next((a for a in ANOMALIES_DB if a["id"] == anomaly_id), None)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found")

    if req.action == "FREEZE_BENEFIT":
        anomaly["status"] = "BENEFIT_FROZEN"
        anomaly["action_taken"] = (
            f"Welfare benefit frozen. Legal audit triggered: {req.officer_notes}"
        )
    elif req.action == "CLEAR_ANOMALY":
        anomaly["status"] = "CLEARED_BY_OFFICER"
        anomaly["action_taken"] = (
            f"Anomaly cleared with officer justification: {req.officer_notes}"
        )
    else:
        anomaly["status"] = "PENDING_CLARIFICATION"
        anomaly["action_taken"] = (
            f"Clarification requested from citizen: {req.officer_notes}"
        )

    anomaly["resolved_at"] = datetime.now(timezone.utc).isoformat()
    return {"status": "SUCCESS", "anomaly": anomaly}
