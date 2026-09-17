import io
import csv
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.auth import require_roles
from backend.app.services.audit import verify_audit_log_integrity

router = APIRouter(prefix="/api/audit-logs", tags=["Audit & Statutory Compliance"])

AUDIT_ROLES = ["AUDITOR", "ADMIN", "SYSTEM_ADMIN"]

@router.get("")
def query_audit_logs(
    application_id: Optional[str] = Query(None, description="Filter by Application ID"),
    actor_id: Optional[str] = Query(None, description="Filter by Actor / Officer ID"),
    action: Optional[str] = Query(None, description="Filter by Action Type"),
    resource: Optional[str] = Query(None, description="Filter by Resource Category"),
    search: Optional[str] = Query(None, description="Free-text search in action, actor, or resource"),
    from_date: Optional[str] = Query(None, description="ISO from date"),
    to_date: Optional[str] = Query(None, description="ISO to date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(AUDIT_ROLES))
):
    """
    Queries immutable audit records with comprehensive statutory filters.
    Strictly append-only: No delete or update routes exist.
    """
    query = db.query(AuditLog)

    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(search_pattern),
                AuditLog.actor_id.ilike(search_pattern),
                AuditLog.resource.ilike(search_pattern),
                AuditLog.application_id.ilike(search_pattern)
            )
        )
    if from_date:
        try:
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(AuditLog.timestamp >= dt_from)
        except ValueError:
            pass
    if to_date:
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(AuditLog.timestamp <= dt_to)
        except ValueError:
            pass

    total = query.count()
    records = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    formatted = []
    for r in records:
        is_verified = verify_audit_log_integrity(r)
        formatted.append({
            "id": r.id,
            "application_id": r.application_id,
            "actor_id": r.actor_id,
            "action": r.action,
            "resource": r.resource,
            "metadata": r.metadata_json or {},
            "tamper_hash": r.tamper_hash or "PRE_MIGRATION_ENTRY",
            "tamper_verified": is_verified,
            "timestamp": r.timestamp.isoformat()
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": formatted
    }

@router.get("/summary")
def get_audit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(AUDIT_ROLES))
):
    """Returns statutory compliance scorecard and category counts."""
    total = db.query(AuditLog).count()
    all_logs = db.query(AuditLog).all()

    action_counts: Dict[str, int] = {}
    resource_counts: Dict[str, int] = {}
    verified_count = 0

    for l in all_logs:
        action_counts[l.action] = action_counts.get(l.action, 0) + 1
        resource_counts[l.resource] = resource_counts.get(l.resource, 0) + 1
        if verify_audit_log_integrity(l):
            verified_count += 1

    verification_rate = (verified_count / total * 100) if total > 0 else 100.0

    return {
        "total_audit_events": total,
        "tamper_verified_count": verified_count,
        "tamper_verification_rate": round(verification_rate, 2),
        "statutory_compliance_status": "FULLY_COMPLIANT" if verification_rate >= 99.9 else "AUDIT_WARNING",
        "events_by_action": action_counts,
        "events_by_resource": resource_counts,
        "immutable_storage_policy": "APPEND_ONLY_CRYPTOGRAPHICALLY_VERIFIED",
        "compliance_standard": "MAHARASHTRA_CYBER_AND_DPDP_ACT_2023"
    }

@router.get("/export/csv")
def export_audit_csv(
    application_id: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(AUDIT_ROLES))
):
    """Streams a formal compliance audit trail CSV export."""
    query = db.query(AuditLog)

    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)

    records = query.order_by(AuditLog.timestamp.desc()).limit(2000).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Compliance CSV Header
    writer.writerow([
        "Timestamp_UTC",
        "Log_UUID",
        "Actor_ID",
        "Action_Type",
        "Resource_Domain",
        "Application_Reference",
        "SHA256_Tamper_Hash",
        "Integrity_Verified",
        "Metadata_JSON"
    ])

    for r in records:
        is_verified = verify_audit_log_integrity(r)
        meta_str = json.dumps(r.metadata_json or {}, separators=(",", ":"))
        writer.writerow([
            r.timestamp.isoformat(),
            r.id,
            r.actor_id,
            r.action,
            r.resource,
            r.application_id or "N/A",
            r.tamper_hash or "PRE_MIGRATION",
            "VERIFIED" if is_verified else "TAMPER_DETECTED",
            meta_str
        ])

    csv_data = output.getvalue()
    filename = f"mahasetu_compliance_audit_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Compliance-Standard": "MH-GOV-AUDIT-v2.1"
        }
    )

@router.get("/export/json")
def export_audit_json(
    application_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(AUDIT_ROLES))
):
    """Streams a formal JSON compliance audit export."""
    query = db.query(AuditLog)
    if application_id:
        query = query.filter(AuditLog.application_id == application_id)
    if action:
        query = query.filter(AuditLog.action == action)

    records = query.order_by(AuditLog.timestamp.desc()).limit(2000).all()

    dump = {
        "export_metadata": {
            "jurisdiction": "Government of Maharashtra",
            "system": "MahaSetu Statutory Audit Ledger",
            "exported_by": current_user.name,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "record_count": len(records),
            "integrity_policy": "APPEND_ONLY_SHA256"
        },
        "records": [
            {
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "actor_id": r.actor_id,
                "action": r.action,
                "resource": r.resource,
                "application_id": r.application_id,
                "tamper_hash": r.tamper_hash,
                "tamper_verified": verify_audit_log_integrity(r),
                "metadata": r.metadata_json or {}
            }
            for r in records
        ]
    }

    json_str = json.dumps(dump, indent=2)
    filename = f"mahasetu_audit_dump_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"

    return StreamingResponse(
        io.BytesIO(json_str.encode("utf-8")),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
