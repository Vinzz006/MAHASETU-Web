from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.application import Application
from backend.app.models.workflow import WorkflowStep
from backend.app.schemas.workflow import WorkflowStepResponse, WorkflowStatusResponse, AdminReviewRequest, AuditorReviewRequest
from backend.app.services.workflow import WorkflowEngine
from backend.app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/workflow", tags=["Workflow Engine"])

@router.get("/{application_id}", response_model=WorkflowStatusResponse)
def get_workflow_status(
    application_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    steps = WorkflowEngine.get_application_workflow(db, app.id)

    step_responses = [
        WorkflowStepResponse(
            id=s.id,
            step_name=s.step_name,
            department_id=s.department_id,
            status=s.status,
            started_at=s.started_at,
            completed_at=s.completed_at,
            timestamp=s.timestamp,
            verifier_id=s.verifier_id,
            comments=s.comments,
            rejection_reason=s.rejection_reason,
            details=s.details or {}
        )
        for s in steps
    ]

    is_completed = app.status == "COMPLETED"
    is_exception = app.status == "EXCEPTION"

    return WorkflowStatusResponse(
        application_id=app.id,
        application_number=app.application_number,
        current_status=app.status,
        current_department=app.current_department,
        is_completed=is_completed,
        is_exception=is_exception,
        steps=step_responses
    )

@router.post("/{application_id}/advance")
def advance_workflow_step(
    application_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    actor = current_user.name if current_user else "SYSTEM"
    res = WorkflowEngine.advance_step(db, app.id, actor_id=actor)
    return res

@router.post("/{application_id}/admin-review")
def admin_review_application(
    application_id: str,
    req: AdminReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["ADMIN"]))
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    actor = current_user.name or current_user.id
    res = WorkflowEngine.admin_review(
        db=db,
        application_id=app.id,
        decision=req.decision,
        comments=req.comments,
        rejection_reason=req.rejection_reason,
        actor_id=actor
    )
    return res

@router.post("/{application_id}/auditor-review")
def auditor_review_application(
    application_id: str,
    req: AuditorReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["AUDITOR", "ADMIN"]))
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    actor = current_user.name or current_user.id
    res = WorkflowEngine.auditor_review(
        db=db,
        application_id=app.id,
        decision=req.decision,
        comments=req.comments,
        actor_id=actor
    )
    return res

@router.post("/{application_id}/run-all")
def run_full_workflow(
    application_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    actor = current_user.name if current_user else "SYSTEM"
    res = WorkflowEngine.run_full_pipeline(db, app.id, actor_id=actor)
    return res

@router.post("/{application_id}/retry")
def retry_failed_step(
    application_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    actor = current_user.name if current_user else "OFFICER"
    res = WorkflowEngine.retry_exception(db, app.id, actor_id=actor)
    return res
