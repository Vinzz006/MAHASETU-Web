from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.integrations.department_b import DepartmentBFailureController
from backend.app.events.publisher import publish_event

router = APIRouter(prefix="/api/demo", tags=["Demo Controller"])

@router.get("/status")
def get_demo_status():
    return {
        "department_b_failure_simulated": DepartmentBFailureController.simulate_failure,
        "failure_reason": DepartmentBFailureController.failure_reason,
        "system_status": "EXCEPTION_SIMULATION_ACTIVE" if DepartmentBFailureController.simulate_failure else "ALL_SYSTEMS_NOMINAL"
    }

@router.post("/toggle-failure")
def toggle_department_b_failure(enabled: bool = None):
    if enabled is not None:
        DepartmentBFailureController.simulate_failure = enabled
    else:
        DepartmentBFailureController.simulate_failure = not DepartmentBFailureController.simulate_failure

    status_str = "ACTIVATED" if DepartmentBFailureController.simulate_failure else "DEACTIVATED"
    publish_event(
        "DEMO_MODE_CHANGED",
        "SYSTEM",
        "DEPT_B",
        {"simulate_failure": DepartmentBFailureController.simulate_failure}
    )

    return {
        "message": f"Department B failure simulation is now {status_str}.",
        "department_b_failure_simulated": DepartmentBFailureController.simulate_failure,
        "instructions": "Attempt to advance an application to ELIGIBILITY_VERIFICATION to observe retries and exception state."
    }
