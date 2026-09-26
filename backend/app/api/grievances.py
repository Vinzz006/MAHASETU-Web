from datetime import datetime, timezone

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.events.publisher import publish_event
from backend.app.models.application import Application
from backend.app.models.grievance import Grievance
from backend.app.models.user import User
from backend.app.services.audit import create_audit_log
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/grievances", tags=["Consolidated Grievance Redressal"])


class GrievanceCreate(BaseModel):
    application_id: str
    department_id: str = "HUB"
    category: str  # IDENTITY_MISMATCH, ELIGIBILITY_DISCREPANCY, SANCTION_DELAY, TECHNICAL_EXCEPTION
    description: str


class GrievanceResolve(BaseModel):
    resolution_notes: str


class GrievanceResponse(BaseModel):
    id: str
    ticket_number: str
    application_id: str
    application_number: str
    citizen_id: str
    citizen_name: str
    department_id: str
    category: str
    description: str
    status: str
    resolution_notes: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


@router.post("", response_model=GrievanceResponse)
def create_grievance(
    req: GrievanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = (
        db.query(Application)
        .filter(
            (Application.id == req.application_id)
            | (Application.application_number == req.application_id)
        )
        .first()
    )

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    citizen_id = current_user.id

    # Generate ticket number e.g. MH-GRV-2026-00412
    count = db.query(Grievance).count()
    ticket_no = f"MH-GRV-2026-{(412 + count):05d}"

    grievance = Grievance(
        ticket_number=ticket_no,
        application_id=app.id,
        citizen_id=citizen_id,
        department_id=req.department_id,
        category=req.category,
        description=req.description,
        status="OPEN",
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    publish_event(
        "GRIEVANCE_RAISED",
        app.application_number,
        req.department_id,
        {"ticket": ticket_no},
    )
    create_audit_log(
        db=db,
        actor_id=citizen_id,
        action="GRIEVANCE_RAISED",
        resource="GRIEVANCE",
        application_id=app.id,
        metadata={
            "ticket_number": ticket_no,
            "category": req.category,
            "department": req.department_id,
        },
    )

    return GrievanceResponse(
        id=grievance.id,
        ticket_number=grievance.ticket_number,
        application_id=grievance.application_id,
        application_number=app.application_number,
        citizen_id=grievance.citizen_id,
        citizen_name=grievance.citizen.name if grievance.citizen else "Citizen",
        department_id=grievance.department_id,
        category=grievance.category,
        description=grievance.description,
        status=grievance.status,
        resolution_notes=grievance.resolution_notes,
        created_at=grievance.created_at,
        resolved_at=grievance.resolved_at,
    )


@router.get("", response_model=list[GrievanceResponse])
def list_grievances(
    status: str | None = None,
    application_id: str | None = None,
    department_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Grievance)

    if current_user.role == "CITIZEN":
        query = query.filter(Grievance.citizen_id == current_user.id)
    if status:
        query = query.filter(Grievance.status == status)
    if application_id:
        query = query.filter(Grievance.application_id == application_id)
    if department_id:
        query = query.filter(Grievance.department_id == department_id)

    items = query.order_by(Grievance.created_at.desc()).all()

    return [
        GrievanceResponse(
            id=g.id,
            ticket_number=g.ticket_number,
            application_id=g.application_id,
            application_number=(
                g.application.application_number if g.application else "UNKNOWN"
            ),
            citizen_id=g.citizen_id,
            citizen_name=g.citizen.name if g.citizen else "Citizen",
            department_id=g.department_id,
            category=g.category,
            description=g.description,
            status=g.status,
            resolution_notes=g.resolution_notes,
            created_at=g.created_at,
            resolved_at=g.resolved_at,
        )
        for g in items
    ]


@router.post("/{grievance_id}/resolve", response_model=GrievanceResponse)
def resolve_grievance(
    grievance_id: str,
    req: GrievanceResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"])),
):
    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance ticket not found")

    grievance.status = "RESOLVED"
    grievance.resolution_notes = req.resolution_notes
    grievance.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(grievance)

    actor = current_user.name if current_user else "OFFICER"
    publish_event(
        "GRIEVANCE_RESOLVED",
        grievance.application.application_number,
        grievance.department_id,
        {"ticket": grievance.ticket_number},
    )
    create_audit_log(
        db=db,
        actor_id=actor,
        action="GRIEVANCE_RESOLVED",
        resource="GRIEVANCE",
        application_id=grievance.application_id,
        metadata={
            "ticket_number": grievance.ticket_number,
            "resolution": req.resolution_notes,
        },
    )

    return GrievanceResponse(
        id=grievance.id,
        ticket_number=grievance.ticket_number,
        application_id=grievance.application_id,
        application_number=grievance.application.application_number,
        citizen_id=grievance.citizen_id,
        citizen_name=grievance.citizen.name,
        department_id=grievance.department_id,
        category=grievance.category,
        description=grievance.description,
        status=grievance.status,
        resolution_notes=grievance.resolution_notes,
        created_at=grievance.created_at,
        resolved_at=grievance.resolved_at,
    )
