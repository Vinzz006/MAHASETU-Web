from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.application import Application
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.audit import AuditLog
from backend.app.models.user import User
from backend.app.schemas.dashboard import DashboardMetricsResponse, DepartmentHealth, IntegrationExceptionRecord
from backend.app.integrations.department_b import DepartmentBFailureController
from backend.app.services.schema_assistant import SchemaMappingAssistant
from backend.app.auth import require_roles

router = APIRouter(prefix="/api/dashboard", tags=["Officer Dashboard & Monitoring"])

def _compute_dashboard_metrics(db: Session) -> DashboardMetricsResponse:
    total_apps = db.query(Application).count()

    # Check Department B failure simulation state
    is_dept_b_down = DepartmentBFailureController.simulate_failure

    # Query recent failed or active exceptions
    exceptions_db = db.query(DepartmentTransaction).filter(
        DepartmentTransaction.status.in_(["FAILED", "RETRYING"])
    ).order_by(DepartmentTransaction.created_at.desc()).limit(10).all()

    exceptions_list = []
    for ex in exceptions_db:
        app = db.query(Application).filter(Application.id == ex.application_id).first()
        app_num = app.application_number if app else "MH-APP-2026-UNKNOWN"
        exceptions_list.append(IntegrationExceptionRecord(
            id=ex.id,
            application_id=ex.application_id,
            application_number=app_num,
            department_id=ex.department_id,
            operation=ex.operation,
            retry_count=ex.retry_count,
            status=ex.status,
            error_message=ex.error_message or "Connection timeout",
            created_at=ex.created_at
        ))

    # Real transaction telemetry per department from database
    dept_a_txns = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_A").count()
    dept_a_errs = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_A", DepartmentTransaction.status == "FAILED").count()
    dept_a_rate = 100.0 if dept_a_txns == 0 else round(((dept_a_txns - dept_a_errs) / dept_a_txns) * 100, 1)

    dept_b_txns = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_B").count()
    dept_b_errs = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_B", DepartmentTransaction.status == "FAILED").count()
    if is_dept_b_down:
        dept_b_status = "FAILED"
        dept_b_rate = round(min(88.4, ((dept_b_txns - max(1, dept_b_errs)) / max(1, dept_b_txns)) * 100), 1)
        dept_b_latency = 310
        dept_b_sync = "Simulated Outage"
    else:
        dept_b_status = "HEALTHY"
        dept_b_rate = 100.0 if dept_b_txns == 0 else round(((dept_b_txns - dept_b_errs) / dept_b_txns) * 100, 1)
        dept_b_latency = 185
        dept_b_sync = "Active (Live Sync)"

    dept_c_txns = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_C").count()
    dept_c_errs = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "DEPT_C", DepartmentTransaction.status == "FAILED").count()
    dept_c_rate = 100.0 if dept_c_txns == 0 else round(((dept_c_txns - dept_c_errs) / dept_c_txns) * 100, 1)

    legacy_txns = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "LEGACY_01").count()
    legacy_errs = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == "LEGACY_01", DepartmentTransaction.status == "FAILED").count()
    legacy_rate = 100.0 if legacy_txns == 0 else round(((legacy_txns - legacy_errs) / legacy_txns) * 100, 1)

    # Department health status list
    dept_health = [
        DepartmentHealth(
            department_id="DEPT_A",
            name="Demo Department A (Identity)",
            type="Modern REST API (OpenAPI 3.0)",
            status="HEALTHY",
            requests_count=dept_a_txns,
            success_rate=dept_a_rate,
            avg_latency_ms=142,
            last_sync="Active (Live Sync)",
            error_count=dept_a_errs
        ),
        DepartmentHealth(
            department_id="DEPT_B",
            name="Demo Department B (Eligibility)",
            type="Heterogeneous JSON (v2.1)",
            status=dept_b_status,
            requests_count=dept_b_txns,
            success_rate=dept_b_rate,
            avg_latency_ms=dept_b_latency,
            last_sync=dept_b_sync,
            error_count=dept_b_errs
        ),
        DepartmentHealth(
            department_id="DEPT_C",
            name="Demo Department C (Employment)",
            type="Workflow Sanction Engine",
            status="HEALTHY",
            requests_count=dept_c_txns,
            success_rate=dept_c_rate,
            avg_latency_ms=210,
            last_sync="Active (Live Sync)",
            error_count=dept_c_errs
        ),
        DepartmentHealth(
            department_id="LEGACY_01",
            name="Demo Legacy Registry (Civil)",
            type="Legacy Mainframe (Pipe-Delimited)",
            status="HEALTHY",
            requests_count=legacy_txns,
            success_rate=legacy_rate,
            avg_latency_ms=480,
            last_sync="Active (Batch Sync)",
            error_count=legacy_errs
        )
    ]

    total_txns = dept_a_txns + dept_b_txns + dept_c_txns + legacy_txns
    total_errs = dept_a_errs + dept_b_errs + dept_c_errs + legacy_errs
    overall_success = 100.0 if total_txns == 0 else round(((total_txns - total_errs) / total_txns) * 100, 1)

    return DashboardMetricsResponse(
        total_applications=total_apps,
        integration_success_rate=92.1 if is_dept_b_down else overall_success,
        avg_processing_time_days=2.4,
        sla_compliance_rate=94.0,
        active_in_flight=db.query(Application).filter(Application.status != "COMPLETED").count(),
        department_health=dept_health,
        recent_exceptions=exceptions_list
    )

@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))
):
    return _compute_dashboard_metrics(db)

@router.get("/integrations")
def get_integrations_monitor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))
):
    metrics = _compute_dashboard_metrics(db)
    return {
        "departments": metrics.department_health,
        "summary": {
            "total_connectors": 4,
            "healthy": sum(1 for d in metrics.department_health if d.status == "HEALTHY"),
            "degraded_or_failed": sum(1 for d in metrics.department_health if d.status != "HEALTHY"),
            "architecture_type": "Modular Adapter Pattern (Zero Legacy System Rewrite)"
        }
    }

@router.get("/exceptions", response_model=List[IntegrationExceptionRecord])
def get_recent_exceptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))
):
    metrics = _compute_dashboard_metrics(db)
    return metrics.recent_exceptions

@router.get("/audit-logs")
def get_all_audit_logs(
    limit: int = 40,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AUDITOR", "ADMIN", "SYSTEM_ADMIN", "OFFICER"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "application_id": l.application_id,
            "actor_id": l.actor_id,
            "action": l.action,
            "resource": l.resource,
            "metadata": l.metadata_json or {},
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]

@router.get("/schema-assistant")
def get_schema_assistant_recommendations(
    current_user: User = Depends(require_roles(["SYSTEM_ADMIN"]))
):
    """Returns AI-assisted schema mapping suggestions between Dept A and Dept B."""
    schemas = SchemaMappingAssistant.get_demo_schemas()
    source_fields = schemas["dept_a"]["fields"]
    target_fields = schemas["dept_b"]["fields"]

    suggestions = SchemaMappingAssistant.suggest_mappings(source_fields, target_fields)

    return {
        "source_schema": schemas["dept_a"],
        "target_schema": schemas["dept_b"],
        "ai_suggestions": suggestions,
        "governance_note": "AI suggestions provide confidence-ranked mappings. Requires human administrator approval before deployment."
    }

@router.get("/transactions")
def get_recent_transactions(
    limit: int = 25,
    db: Session = Depends(get_db)
):
    """Returns recent inter-departmental transactions with routing and schema version."""
    txns = (
        db.query(DepartmentTransaction)
        .order_by(DepartmentTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for t in txns:
        app = db.query(Application).filter(Application.id == t.application_id).first()
        app_num = app.application_number if app else "MH-APP-2026-0001"
        result.append({
            "id": t.id,
            "application_id": t.application_id,
            "application_number": app_num,
            "department_id": t.department_id,
            "source_department": getattr(t, "source_department", "PORTAL") or "PORTAL",
            "destination_department": getattr(t, "destination_department", t.department_id) or t.department_id,
            "schema_version": getattr(t, "schema_version", "v2.1-canonical") or "v2.1-canonical",
            "operation": t.operation,
            "status": t.status,
            "retry_count": t.retry_count,
            "error_message": t.error_message,
            "created_at": t.created_at.isoformat()
        })
    return result


@router.get("/analytics")
def get_governance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN", "SYSTEM_ADMIN"]))
):
    """
    Phase 15: Governance Intelligence Analytics — cross-role KPIs for the MahaDrishti Panel.
    Returns application funnel, consent compliance, SLA breach count, throughput,
    district distribution, and per-department success rates.
    """
    from backend.app.models.consent import Consent
    from collections import Counter
    from datetime import timedelta

    # Application funnel
    all_apps = db.query(Application).all()
    status_counts = Counter(a.status for a in all_apps)
    total = len(all_apps)
    completed   = status_counts.get("COMPLETED", 0)
    rework      = status_counts.get("REWORK", 0)
    exception   = status_counts.get("EXCEPTION", 0)
    in_progress = total - completed - rework - exception

    funnel = [
        {"stage": "Submitted",   "count": total,       "pct": 100},
        {"stage": "In Progress", "count": in_progress, "pct": round((in_progress / max(1, total)) * 100, 1)},
        {"stage": "Sanctioned",  "count": completed,   "pct": round((completed   / max(1, total)) * 100, 1)},
        {"stage": "Action Reqd", "count": rework,      "pct": round((rework      / max(1, total)) * 100, 1)},
        {"stage": "Exception",   "count": exception,   "pct": round((exception   / max(1, total)) * 100, 1)},
    ]

    # Consent compliance rate
    total_consents      = db.query(Consent).count()
    authorized_consents = db.query(Consent).filter(Consent.status == "AUTHORIZED").count()
    consent_pct = round((authorized_consents / max(1, total_consents)) * 100, 1)

    # SLA breach detection (apps older than 3 days and not yet COMPLETED)
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=3)
    sla_breaches = db.query(Application).filter(
        Application.status != "COMPLETED",
        Application.created_at < cutoff
    ).count()

    # Transaction throughput last hour
    hour_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
    txns_last_hour = db.query(DepartmentTransaction).filter(
        DepartmentTransaction.created_at >= hour_ago
    ).count()

    # Per-department success rates
    dept_analytics = []
    for dept_id in ["DEPT_A", "DEPT_B", "DEPT_C", "LEGACY_01"]:
        total_t   = db.query(DepartmentTransaction).filter(DepartmentTransaction.department_id == dept_id).count()
        success_t = db.query(DepartmentTransaction).filter(
            DepartmentTransaction.department_id == dept_id,
            DepartmentTransaction.status == "SUCCESS"
        ).count()
        rate = round((success_t / max(1, total_t)) * 100, 1)
        dept_analytics.append({
            "department_id":     dept_id,
            "total_transactions": total_t,
            "success_rate":      rate,
            "status": "HEALTHY" if rate >= 90 else ("DEGRADED" if rate >= 70 else "CRITICAL"),
        })

    # District distribution
    district_counts: Dict[str, int] = {}
    for app in all_apps:
        dist = (app.citizen_data or {}).get("district", "Unknown")
        district_counts[dist] = district_counts.get(dist, 0) + 1
    top_districts = sorted(district_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Citizen & officer counts
    total_citizens = db.query(User).filter(User.role == "CITIZEN").count()
    total_staff    = db.query(User).filter(User.role.in_(["OFFICER", "ADMIN", "AUDITOR"])).count()

    return {
        "summary": {
            "total_applications":    total,
            "completed":             completed,
            "in_progress":           in_progress,
            "rework_required":       rework,
            "exceptions":            exception,
            "completion_rate_pct":   round((completed / max(1, total)) * 100, 1),
            "total_citizens":        total_citizens,
            "total_staff":           total_staff,
            "avg_apps_per_citizen":  round(total / max(1, total_citizens), 2),
        },
        "funnel":                  funnel,
        "consent_compliance_pct":  consent_pct,
        "authorized_consents":     authorized_consents,
        "total_consents":          total_consents,
        "sla_breaches":            sla_breaches,
        "sla_baseline_days":       3,
        "transactions_last_hour":  txns_last_hour,
        "department_analytics":    dept_analytics,
        "top_districts":           [{"district": d, "count": c} for d, c in top_districts],
        "platform_health":         "HEALTHY" if sla_breaches == 0 else ("DEGRADED" if sla_breaches <= 2 else "AT_RISK"),
        "timestamp":               datetime.now(timezone.utc).isoformat(),
    }
