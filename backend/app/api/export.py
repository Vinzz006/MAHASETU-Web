import csv
import io
from datetime import datetime, timezone

from backend.app.api.services import get_service_name
from backend.app.auth import require_roles
from backend.app.database import get_db
from backend.app.models.application import Application
from backend.app.models.audit import AuditLog
from backend.app.models.user import User
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/export", tags=["Statutory Reporting & Data Export"])

EXPORT_ROLES = ["OFFICER", "ADMIN", "SYSTEM_ADMIN", "AUDITOR"]


@router.get("/applications.csv")
def export_applications_csv(
    status: str | None = None,
    department: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(EXPORT_ROLES)),
):
    """Generates an official departmental CSV report for filtered applications."""
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    if department:
        query = query.filter(Application.current_department == department)

    apps = query.order_by(Application.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Application Number",
            "Citizen Name",
            "Citizen Mobile",
            "Service Name",
            "Current Status",
            "Assigned Department",
            "Created At",
            "Last Updated At",
        ]
    )

    for a in apps:
        c_name = (a.citizen_data or {}).get("name") or (
            a.citizen.name if a.citizen else "Citizen"
        )
        c_mobile = (a.citizen_data or {}).get("mobile") or (
            a.citizen.mobile if a.citizen else "N/A"
        )
        s_name = get_service_name(a.service_id)
        writer.writerow(
            [
                a.application_number,
                c_name,
                c_mobile,
                s_name,
                a.status,
                a.current_department,
                a.created_at.isoformat() if a.created_at else "",
                a.updated_at.isoformat() if a.updated_at else "",
            ]
        )

    output.seek(0)
    filename = f"mahasetu_applications_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/audit-logs.csv")
def export_audit_logs_csv(
    application_id: str | None = None,
    action: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(EXPORT_ROLES)),
):
    """Generates an official compliance audit trail CSV for parliamentary and judicial reporting."""
    query = db.query(AuditLog)
    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Log ID",
            "Application ID",
            "Actor ID",
            "Action",
            "Resource",
            "Tamper Hash",
            "Timestamp",
        ]
    )

    for r in logs:
        writer.writerow(
            [
                r.id,
                r.application_id or "PLATFORM",
                r.actor_id or "SYSTEM",
                r.action,
                r.resource,
                r.tamper_hash or "SHA-256",
                r.timestamp.isoformat() if r.timestamp else "",
            ]
        )

    output.seek(0)
    filename = f"mahasetu_audit_trail_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
