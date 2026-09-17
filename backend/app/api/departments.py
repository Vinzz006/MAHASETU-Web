from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.integrations import get_connector, get_all_connectors
from backend.app.services.transformation import DataTransformationEngine

router = APIRouter(prefix="/api/integrations", tags=["Department Integrations"])

@router.post("/{department}/verify")
def verify_department_data(
    department: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    try:
        connector = get_connector(department.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Determine whether it's identity or eligibility verification
    if department.upper() in ["DEPT_A", "LEGACY_01"]:
        res = connector.verify_identity(payload)
    elif department.upper() == "DEPT_B":
        res = connector.verify_eligibility(payload)
    else:
        res = connector.verify_identity(payload)

    return res

@router.post("/{department}/submit")
def submit_department_data(
    department: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    try:
        connector = get_connector(department.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    res = connector.submit_application(payload)
    return res

@router.get("/{department}/status")
def get_department_status(department: str):
    try:
        connector = get_connector(department.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return connector.get_status("system-probe")

@router.post("/transform/trace")
def trace_transformation(req: Dict[str, Any]):
    """
    Simulates and traces canonical transformations between any two departments.
    Essential for judge demo of interoperability mechanics.
    """
    src = req.get("source_department", "DEPT_A")
    tgt = req.get("target_department", "DEPT_B")
    raw_input = req.get("payload")

    if not raw_input:
        if src == "DEPT_A":
            raw_input = {
                "citizen_name": "Demo Citizen",
                "mobile_no": "9999999999",
                "dob": "1998-05-12",
                "district": "Pune",
                "annual_income": 180000
            }
        elif src == "LEGACY_01":
            raw_input = "CIT001|Demo Citizen|Pune|MH"
        else:
            raw_input = {
                "fullName": "Demo Citizen",
                "phone": "9999999999",
                "date_of_birth": "1998-05-12",
                "residence_district": "Pune",
                "income_bracket": "BELOW_2L",
                "employment_category": "JOB_SEEKER"
            }

    trace = DataTransformationEngine.trace_transformation(src, tgt, raw_input)
    return trace
