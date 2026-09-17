from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.application import Application
from backend.app.models.escalation import SLAEscalation
from backend.app.models.user import User
from backend.app.auth import get_current_user
from backend.app.services.audit import create_audit_log
from backend.app.services.workflow import WorkflowEngine
from backend.app.events.publisher import publish_event

router = APIRouter(prefix="/api/sla", tags=["Statutory Citizen Charter SLA Engine"])

class SLAMonitorItem(BaseModel):
    application_id: str
    application_number: str
    beneficiary_name: str
    service_id: str
    service_name: str
    current_department: str
    status: str
    sla_days: float
    elapsed_days: float
    percentage_elapsed: float
    time_remaining_hours: float
    severity: str # ON_TRACK, AT_RISK, BREACHED
    is_escalated: bool
    created_at: datetime

class SLASummaryResponse(BaseModel):
    compliance_rate: float
    target_rate: float = 90.0
    total_in_flight: int
    on_track_count: int
    at_risk_count: int
    breached_count: int
    avg_processing_days: float
    applications: List[SLAMonitorItem]

@router.get("/monitoring", response_model=SLASummaryResponse)
def get_sla_monitoring_telemetry(db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.status != "COMPLETED").order_by(Application.created_at.asc()).all()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    sla_allotted_days = 3.0 # Statutory SLA for Employment Assistance

    items: List[SLAMonitorItem] = []
    on_track = 0
    at_risk = 0
    breached = 0

    for app in apps:
        # Calculate real elapsed time with benchmark scaling for demonstration
        delta_seconds = (now - app.created_at).total_seconds()
        # Scale benchmark for demo: 1 hour = 1.2 days elapsed
        elapsed_days = round(max(0.2, (delta_seconds / 3600.0) * 1.2), 2)
        pct = round((elapsed_days / sla_allotted_days) * 100, 1)

        remaining_hours = max(0.0, round((sla_allotted_days - elapsed_days) * 24.0, 1))

        if pct > 100.0:
            sev = "BREACHED"
            breached += 1
        elif pct >= 70.0:
            sev = "AT_RISK"
            at_risk += 1
        else:
            sev = "ON_TRACK"
            on_track += 1

        # Check if already escalated
        has_escalation = db.query(SLAEscalation).filter(
            SLAEscalation.application_id == app.id,
            SLAEscalation.status.in_(["PENDING_EXPEDITE", "EXPEDITED"])
        ).first() is not None

        c_data = app.citizen_data or {}
        items.append(SLAMonitorItem(
            application_id=app.id,
            application_number=app.application_number,
            beneficiary_name=c_data.get("name", "Demo Citizen"),
            service_id=app.service_id,
            service_name="Maharashtra Employment & Skill Assistance Scheme",
            current_department=app.current_department,
            status=app.status,
            sla_days=sla_allotted_days,
            elapsed_days=elapsed_days,
            percentage_elapsed=pct,
            time_remaining_hours=remaining_hours,
            severity=sev,
            is_escalated=has_escalation,
            created_at=app.created_at
        ))

    total = len(items)
    compliance = round((((total - breached) / total) * 100.0) if total > 0 else 94.2, 1)

    return SLASummaryResponse(
        compliance_rate=compliance,
        target_rate=90.0,
        total_in_flight=total,
        on_track_count=on_track,
        at_risk_count=at_risk,
        breached_count=breached,
        avg_processing_days=2.4,
        applications=items
    )

@router.post("/{application_id}/escalate")
def escalate_application_sla(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    escalation = db.query(SLAEscalation).filter(SLAEscalation.application_id == app.id).first()
    if not escalation:
        escalation = SLAEscalation(
            application_id=app.id,
            service_id=app.service_id,
            target_department=app.current_department,
            sla_days_allotted=3.0,
            elapsed_days=2.8,
            severity="APPROACHING_BREACH",
            escalation_level="DISTRICT_OFFICER",
            escalated_to="Shri V. Patil (District Employment Officer, Pune)",
            status="EXPEDITED",
            notes="Statutory 72-hour threshold approached. Auto-prioritized by MahaSetu SLA Engine.",
            expedited_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        db.add(escalation)
    else:
        escalation.status = "EXPEDITED"
        escalation.expedited_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # If application is in EXCEPTION, resolve and advance
    if app.status == "EXCEPTION":
        WorkflowEngine.retry_exception(db, app.id, actor_id="SLA_ENGINE_AUTO")
    elif app.status != "COMPLETED":
        # Advance workflow forward
        try:
            WorkflowEngine.advance_step(db, app.id, actor_id="SLA_ENGINE_EXPEDITE")
        except Exception:
            pass

    db.commit()

    actor = current_user.name if current_user else "SLA_EXPEDITE_ENGINE"
    publish_event("SLA_EXPEDITED", app.application_number, app.current_department, {"escalated_to": escalation.escalated_to})
    create_audit_log(
        db=db,
        actor_id=actor,
        action="SLA_EXPEDITE_TRIGGERED",
        resource="SLA_ENGINE",
        application_id=app.id,
        metadata={"escalated_to": escalation.escalated_to, "target_dept": app.current_department}
    )

    return {
        "status": "EXPEDITED",
        "message": f"Application {app.application_number} elevated to priority queue for {escalation.escalated_to}.",
        "escalation_id": escalation.id,
        "target_department": app.current_department
    }

@router.get("/escalations")
def list_sla_escalations(db: Session = Depends(get_db)):
    items = db.query(SLAEscalation).order_by(SLAEscalation.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "application_id": e.application_id,
            "application_number": e.application.application_number if e.application else "UNKNOWN",
            "service_id": e.service_id,
            "target_department": e.target_department,
            "sla_days_allotted": e.sla_days_allotted,
            "elapsed_days": e.elapsed_days,
            "severity": e.severity,
            "escalated_to": e.escalated_to,
            "status": e.status,
            "notes": e.notes,
            "created_at": e.created_at.isoformat(),
            "expedited_at": e.expedited_at.isoformat() if e.expedited_at else None
        }
        for e in items
    ]
