import asyncio
import json
import uuid
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from backend.app.api.services import get_service_name
from backend.app.auth import get_current_user
from backend.app.database import SessionLocal, get_db
from backend.app.events.publisher import publish_event
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.notification import Notification
from backend.app.models.resident_profile import ResidentProfile
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.user import User
from backend.app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationSummaryResponse,
)
from backend.app.schemas.workflow import ApplicationResubmitRequest
from backend.app.services.audit import create_audit_log
from backend.app.services.consent import ConsentManager
from backend.app.services.workflow import WORKFLOW_PIPELINE, WorkflowEngine
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/applications", tags=["Applications"])


# ---------------------------------------------------------------------------
# Citizen Dashboard Summary
# ---------------------------------------------------------------------------
@router.get("/citizen-summary")
def get_citizen_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns an aggregated citizen-facing dashboard summary:
    application status counts, profile completion %, unread notification count,
    consent count, and the most recent activity timestamp.
    Scoped strictly to the authenticated citizen's own data.
    """
    apps = db.query(Application).filter(Application.citizen_id == current_user.id).all()

    # Status distribution
    status_counts: dict = {}
    latest_updated_at = None
    for a in apps:
        status_counts[a.status] = status_counts.get(a.status, 0) + 1
        if latest_updated_at is None or a.updated_at > latest_updated_at:
            latest_updated_at = a.updated_at

    # Action required: rework pending
    rework_count = status_counts.get("REWORK", 0)
    completed_count = status_counts.get("COMPLETED", 0)
    in_progress_count = (
        len(apps) - rework_count - completed_count - status_counts.get("EXCEPTION", 0)
    )

    # Profile completion (8 sections)
    profile = (
        db.query(ResidentProfile)
        .filter(ResidentProfile.user_id == current_user.id)
        .first()
    )
    completed_sections = 0
    if profile:
        if profile.legal_name and profile.date_of_birth and profile.gender:
            completed_sections += 1
        if profile.district and profile.state and profile.full_address:
            completed_sections += 1
        if profile.aadhaar_last_four or profile.pan_number:
            completed_sections += 1
        if profile.father_name or profile.mother_name or profile.spouse_name:
            completed_sections += 1
        if profile.phone or profile.email:
            completed_sections += 1
        if profile.educational_qualification:
            completed_sections += 1
        if hasattr(profile, "bank_name") and getattr(profile, "bank_name", None):
            completed_sections += 1
        if profile.community_caste:
            completed_sections += 1
    profile_pct = round((completed_sections / 8) * 100)

    # Unread notifications
    unread_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )

    # Active consents
    consent_count = (
        db.query(Consent).filter(Consent.citizen_id == current_user.id).count()
    )

    # Recent active app
    latest_app = None
    if apps:
        sorted_apps = sorted(apps, key=lambda a: a.updated_at, reverse=True)
        a = sorted_apps[0]
        sname = get_service_name(a.service_id)
        latest_app = {
            "id": a.id,
            "application_number": a.application_number,
            "service_name": sname,
            "status": a.status,
            "current_department": a.current_department,
            "updated_at": a.updated_at.isoformat(),
        }

    return {
        "citizen_id": current_user.id,
        "citizen_name": current_user.name,
        "citizen_role": current_user.role,
        "total_applications": len(apps),
        "status_breakdown": {
            "in_progress": in_progress_count,
            "completed": completed_count,
            "rework_required": rework_count,
            "exception": status_counts.get("EXCEPTION", 0),
        },
        "profile_completion_pct": profile_pct,
        "profile_sections_completed": completed_sections,
        "has_profile": profile is not None,
        "unread_notifications": unread_notifications,
        "active_consents": consent_count,
        "action_required": rework_count > 0,
        "latest_application": latest_app,
        "last_activity_at": (
            latest_updated_at.isoformat() if latest_updated_at else None
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# SSE Live Feed — application status stream for the citizen dashboard
# ---------------------------------------------------------------------------
_MAX_CONCURRENT_SSE = 100
_sse_semaphore = asyncio.Semaphore(_MAX_CONCURRENT_SSE)


def _query_citizen_apps_summary(citizen_id: str) -> list[dict]:
    """Helper executed in worker thread to prevent event-loop blocking, using short-lived session."""
    with SessionLocal() as session:
        apps = (
            session.query(Application)
            .filter(Application.citizen_id == citizen_id)
            .all()
        )
        return [
            {
                "id": a.id,
                "application_number": a.application_number,
                "status": a.status,
                "current_department": a.current_department,
                "updated_at": a.updated_at.isoformat() if a.updated_at else "",
            }
            for a in apps
        ]


async def _application_event_stream(
    citizen_id: str, request: Request, max_events: int | None = None
) -> AsyncIterator[str]:
    """
    Streams Server-Sent Events with the citizen's latest application status every 4 seconds.
    Non-blocking: offloads DB queries to threadpool via asyncio.to_thread and releases connections immediately.
    Terminates instantly if client disconnects.
    """
    try:
        await asyncio.wait_for(_sse_semaphore.acquire(), timeout=2.0)
    except asyncio.TimeoutError:
        yield 'data: {"type": "ERROR", "message": "Server SSE capacity reached. Please refresh dashboard."}\n\n'
        return

    try:
        total_ticks = max_events if max_events is not None else 30
        for _ in range(total_ticks):  # max ticks per connection
            if await request.is_disconnected():
                break

            try:
                apps_data = await asyncio.to_thread(
                    _query_citizen_apps_summary, citizen_id
                )
                payload = {
                    "type": "STATUS_UPDATE",
                    "applications": apps_data,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                yield f"data: {json.dumps(payload)}\n\n"
            except Exception:  # noqa: BLE001 - SSE heartbeat fallback
                yield 'data: {"type": "HEARTBEAT"}\n\n'

            # If bounded to a single event or done, don't sleep
            if max_events is not None and max_events <= 1:
                break

            # Sleep in 1-second chunks to react quickly if client disconnects
            for _ in range(4):
                if await request.is_disconnected():
                    return
                await asyncio.sleep(1)

        yield 'data: {"type": "STREAM_CLOSED"}\n\n'
    finally:
        _sse_semaphore.release()


@router.get("/live-feed")
async def application_live_feed(
    request: Request,
    max_events: int | None = None,
    current_user: User = Depends(get_current_user),
):
    """
    Server-Sent Events (SSE) live feed for a citizen's real-time application status.
    Streams updates every 4 seconds. Max 2 minutes per connection.
    Guaranteed non-blocking on the event loop with short-lived session pooling.
    Accepts optional max_events parameter to limit number of ticks.
    """
    return StreamingResponse(
        _application_event_stream(current_user.id, request, max_events=max_events),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Phase 14: Pre-submission eligibility validation
# ---------------------------------------------------------------------------
ELIGIBILITY_RULES = {
    "employment-support": {
        "income_cap": 300000,
        "statuses": ["UNEMPLOYED", "STUDENT", "SELF_EMPLOYED"],
    },
    "farmer-dbt": {"income_cap": 500000, "statuses": ["UNEMPLOYED", "SELF_EMPLOYED"]},
    "urban-housing": {
        "income_cap": 600000,
        "statuses": ["UNEMPLOYED", "STUDENT", "SELF_EMPLOYED"],
    },
    "smart-ration": {
        "income_cap": 200000,
        "statuses": ["UNEMPLOYED", "STUDENT", "SELF_EMPLOYED"],
    },
}


@router.post("/validate-eligibility")
def validate_eligibility(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Phase 14: Lightweight eligibility pre-check for the smart application wizard.
    Validates annual income against service-specific caps and employment status rules.
    Returns a JSON verdict before the citizen proceeds to the consent step.
    """
    service_id = payload.get("service_id", "employment-support")
    annual_income = payload.get("annual_income", 0)
    employment_status = payload.get("employment_status", "UNEMPLOYED")

    rules = ELIGIBILITY_RULES.get(service_id, ELIGIBILITY_RULES["employment-support"])
    income_cap = rules["income_cap"]
    income_eligible = annual_income <= income_cap
    status_eligible = employment_status in rules["statuses"]

    # Suggest alternative service if income is too high for requested service
    alternative = None
    if not income_eligible:
        for svc_id, rule in ELIGIBILITY_RULES.items():
            if svc_id != service_id and annual_income <= rule["income_cap"]:
                alternative = svc_id
                break

    return {
        "service_id": service_id,
        "eligible": income_eligible and status_eligible,
        "income_eligible": income_eligible,
        "status_eligible": status_eligible,
        "income_cap": income_cap,
        "income_pct_of_cap": round((annual_income / income_cap) * 100, 1),
        "alternative_service": alternative,
        "verdict": (
            "ELIGIBLE" if (income_eligible and status_eligible) else "INELIGIBLE"
        ),
        "reason": (
            None
            if (income_eligible and status_eligible)
            else (
                f"Income ₹{annual_income:,} exceeds scheme ceiling ₹{income_cap:,}"
                if not income_eligible
                else f"Employment status '{employment_status}' not eligible for this scheme"
            )
        ),
    }


def generate_application_number(db: Session) -> str:
    """Generates high-entropy, non-sequential Universal Application ID collision-safely."""
    for _ in range(20):
        suffix = uuid.uuid4().hex[:8].upper()
        candidate = f"MH-APP-2026-{suffix}"
        if (
            not db.query(Application)
            .filter(Application.application_number == candidate)
            .first()
        ):
            return candidate
    return f"MH-APP-2026-{uuid.uuid4().hex[:10].upper()}"


def _build_application_detail(
    app: Application, db: Session
) -> ApplicationDetailResponse:
    # Fetch active consent
    consent = db.query(Consent).filter(Consent.application_id == app.id).first()
    consent_dict = None
    if consent:
        consent_dict = {
            "id": consent.id,
            "consent_number": consent.consent_number,
            "status": consent.status,
            "requested_by": consent.requested_by,
            "purpose": consent.purpose,
            "data_categories": consent.data_categories,
            "granted_at": (
                consent.granted_at.isoformat() if consent.granted_at else None
            ),
            "consent_hash": consent.consent_hash,
        }

    # Fetch workflow steps
    order_map = {p["step_name"]: idx for idx, p in enumerate(WORKFLOW_PIPELINE)}
    ordered_steps = sorted(
        app.workflow_steps, key=lambda s: order_map.get(s.step_name, 999)
    )
    steps = [
        {
            "id": s.id,
            "step_name": s.step_name,
            "department_id": s.department_id,
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "details": s.details or {},
        }
        for s in ordered_steps
    ]

    # Fetch transactions
    txns = [
        {
            "id": t.id,
            "department_id": t.department_id,
            "source_department": getattr(t, "source_department", "PORTAL") or "PORTAL",
            "destination_department": getattr(
                t, "destination_department", t.department_id
            )
            or t.department_id,
            "schema_version": getattr(t, "schema_version", "v2.1-canonical")
            or "v2.1-canonical",
            "operation": t.operation,
            "status": t.status,
            "retry_count": t.retry_count,
            "request_payload": t.request_payload,
            "response_payload": t.response_payload,
            "error_message": t.error_message,
            "created_at": t.created_at.isoformat(),
        }
        for t in app.transactions
    ]

    # Fetch audit logs
    audits = [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "action": l.action,
            "resource": l.resource,
            "metadata": l.metadata_json or {},
            "timestamp": l.timestamp.isoformat(),
        }
        for l in app.audit_logs
    ]

    citizen_name = (app.citizen_data or {}).get("name") or (
        app.citizen.name if app.citizen else "Citizen"
    )
    citizen_mobile = (app.citizen_data or {}).get("mobile") or (
        app.citizen.mobile if app.citizen else "9999999999"
    )
    service_name = get_service_name(app.service_id)

    return ApplicationDetailResponse(
        id=app.id,
        application_number=app.application_number,
        citizen_id=app.citizen_id,
        citizen_name=citizen_name,
        citizen_mobile=citizen_mobile,
        service_id=app.service_id,
        service_name=service_name,
        status=app.status,
        current_department=app.current_department,
        citizen_data=app.citizen_data or {},
        rejection_reason=app.rejection_reason,
        active_consent=consent_dict,
        workflow_steps=steps,
        transactions=txns,
        audit_logs=audits,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


@router.post("", response_model=ApplicationDetailResponse)
def create_application(
    req: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    citizen = current_user

    citizen_data = {
        "name": req.citizen_name,
        "mobile": req.mobile,
        "dob": req.dob,
        "district": req.district,
        "annual_income": req.annual_income,
        "employment_status": req.employment_status,
    }

    application = None
    for attempt in range(5):
        app_number = generate_application_number(db)
        candidate_app = Application(
            application_number=app_number,
            citizen_id=citizen.id,
            service_id=req.service_id,
            status="APPLICATION_CREATED",
            current_department="PORTAL",
            citizen_data=citizen_data,
        )
        try:
            db.add(candidate_app)
            db.commit()
            db.refresh(candidate_app)
            application = candidate_app
            break
        except IntegrityError:
            db.rollback()
            if attempt == 4:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to allocate unique application number",
                )

    # 1. Initialize workflow pipeline
    WorkflowEngine.initialize_workflow(db, application.id)

    # 2. Issue Consent Request for cross-department exchange
    ConsentManager.request_consent(
        db=db,
        application_id=application.id,
        citizen_id=citizen.id,
        requested_by="Employment Department (DEPT_C)",
        purpose="Eligibility verification and direct benefit sanctioning",
    )

    # 3. Publish Event & Audit
    publish_event("APPLICATION_CREATED", application.application_number, "PORTAL")
    create_audit_log(
        db=db,
        actor_id=citizen.id,
        action="APPLICATION_CREATED",
        resource="APPLICATION",
        application_id=application.id,
        metadata={
            "application_number": application.application_number,
            "service_id": req.service_id,
        },
    )

    return _build_application_detail(application, db)


def _get_dept_candidates(user: User) -> set:
    dept_candidates = set()
    if user.department_id:
        dept_candidates.add(user.department_id)
    if user.role:
        dept_candidates.add(user.role)

    if "DEPARTMENT_A" in dept_candidates or "DEPT_A" in dept_candidates:
        dept_candidates.update(["DEPT_A", "DEPARTMENT_A"])
    if "DEPARTMENT_B" in dept_candidates or "DEPT_B" in dept_candidates:
        dept_candidates.update(["DEPT_B", "DEPARTMENT_B"])
    if (
        "DEPARTMENT_C" in dept_candidates
        or "DEPT_C" in dept_candidates
        or "OFFICER" in dept_candidates
    ):
        dept_candidates.update(["DEPT_C", "DEPARTMENT_C", "OFFICER"])
    return dept_candidates


def _is_department_authorized_for_app(
    app: Application, user: User, db: Session
) -> bool:
    dept_candidates = _get_dept_candidates(user)

    # 1. Application must currently be assigned to this department OR have prior department transaction
    is_assigned = app.current_department in dept_candidates
    if not is_assigned:
        has_txn = any(t.department_id in dept_candidates for t in app.transactions)
        if not has_txn:
            return False

    # 2. Must have an active AUTHORIZED consent record
    consent = (
        db.query(Consent)
        .filter(Consent.application_id == app.id, Consent.status == "AUTHORIZED")
        .first()
    )
    return consent is not None


@router.get("", response_model=list[ApplicationSummaryResponse])
def list_applications(
    response: Response,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page_size = min(max(1, page_size), 100)
    page = max(1, page)
    offset = (page - 1) * page_size

    query = db.query(Application)

    # Citizen: strictly limited to own applications
    if current_user.role == "CITIZEN":
        query = query.filter(Application.citizen_id == current_user.id)

    # Department / Officer: limited to assigned department OR prior department transactions + active AUTHORIZED consent
    elif current_user.role in (
        "DEPARTMENT_A",
        "DEPARTMENT_B",
        "DEPARTMENT_C",
        "OFFICER",
    ):
        dept_candidates = _get_dept_candidates(current_user)
        authorized_app_ids = [
            c.application_id
            for c in db.query(Consent.application_id)
            .filter(Consent.status == "AUTHORIZED")
            .all()
        ]
        apps_with_dept_txns = [
            t.application_id
            for t in db.query(DepartmentTransaction.application_id)
            .filter(DepartmentTransaction.department_id.in_(list(dept_candidates)))
            .all()
        ]
        query = query.filter(
            Application.id.in_(authorized_app_ids),
            (
                Application.current_department.in_(list(dept_candidates))
                | Application.id.in_(apps_with_dept_txns)
            ),
        )

    # Auditor / Admin: broad oversight with audit logging
    elif current_user.role == "AUDITOR":
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_LIST_VIEWED_BY_AUDITOR",
            resource="APPLICATION",
            metadata={"role": "AUDITOR"},
        )
    elif current_user.role in ("ADMIN", "SYSTEM_ADMIN"):
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_LIST_VIEWED_BY_ADMIN",
            resource="APPLICATION",
            metadata={"role": current_user.role},
        )

    if status:
        query = query.filter(Application.status == status)

    total = query.count()
    apps = (
        query.order_by(Application.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Page"] = str(page)
    response.headers["X-Page-Size"] = str(page_size)
    response.headers["X-Total-Pages"] = str(
        max(1, (total + page_size - 1) // page_size)
    )

    summaries = []
    for a in apps:
        c_name = (a.citizen_data or {}).get("name") or (
            a.citizen.name if a.citizen else "Citizen"
        )
        s_name = get_service_name(a.service_id)
        summaries.append(
            ApplicationSummaryResponse(
                id=a.id,
                application_number=a.application_number,
                citizen_id=a.citizen_id,
                citizen_name=c_name,
                service_id=a.service_id,
                service_name=s_name,
                status=a.status,
                current_department=a.current_department,
                rejection_reason=a.rejection_reason,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
        )
    return summaries


@router.get("/{id_or_number}", response_model=ApplicationDetailResponse)
def get_application_by_id(
    id_or_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = (
        db.query(Application)
        .filter(
            (Application.id == id_or_number)
            | (Application.application_number == id_or_number)
        )
        .first()
    )

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # 1. Citizen Ownership
    if current_user.role == "CITIZEN":
        if app.citizen_id != current_user.id:
            create_audit_log(
                db=db,
                actor_id=current_user.id,
                action="APPLICATION_ACCESS_DENIED_OWNERSHIP",
                resource="APPLICATION",
                application_id=app.id,
                metadata={
                    "application_number": app.application_number,
                    "reason": "Citizen attempted to access another citizen's record",
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You cannot view another citizen's application",
            )

    # 2. Department Role Authorization (Department assigned + active AUTHORIZED consent)
    elif current_user.role in (
        "DEPARTMENT_A",
        "DEPARTMENT_B",
        "DEPARTMENT_C",
        "OFFICER",
    ):
        if not _is_department_authorized_for_app(app, current_user, db):
            create_audit_log(
                db=db,
                actor_id=current_user.id,
                action="APPLICATION_ACCESS_DENIED_DEPARTMENT_UNAUTHORIZED",
                resource="APPLICATION",
                application_id=app.id,
                metadata={
                    "application_number": app.application_number,
                    "role": current_user.role,
                    "reason": "Lacks active assignment or citizen consent",
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Department {current_user.role} is not assigned or lacks authorized citizen consent for application {app.application_number}.",
            )

    # 3. Auditor Oversight (Audited)
    elif current_user.role == "AUDITOR":
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_VIEWED_BY_AUDITOR",
            resource="APPLICATION",
            application_id=app.id,
            metadata={"application_number": app.application_number, "role": "AUDITOR"},
        )

    # 4. Admin Oversight (Audited)
    elif current_user.role in ("ADMIN", "SYSTEM_ADMIN"):
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_VIEWED_BY_ADMIN",
            resource="APPLICATION",
            application_id=app.id,
            metadata={
                "application_number": app.application_number,
                "role": current_user.role,
            },
        )

    return _build_application_detail(app, db)


@router.post("/{id_or_number}/resubmit", response_model=ApplicationDetailResponse)
def resubmit_application(
    id_or_number: str,
    req: ApplicationResubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = (
        db.query(Application)
        .filter(
            (Application.id == id_or_number)
            | (Application.application_number == id_or_number)
        )
        .first()
    )

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check ownership if CITIZEN
    if current_user.role == "CITIZEN" and app.citizen_id != current_user.id:
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_RESUBMIT_DENIED_OWNERSHIP",
            resource="APPLICATION",
            application_id=app.id,
            metadata={"application_number": app.application_number},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only resubmit your own applications",
        )

    # If department/officer, must be authorized for this application
    if current_user.role in (
        "DEPARTMENT_A",
        "DEPARTMENT_B",
        "DEPARTMENT_C",
        "OFFICER",
    ) and not _is_department_authorized_for_app(app, current_user, db):
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="APPLICATION_RESUBMIT_DENIED_UNAUTHORIZED",
            resource="APPLICATION",
            application_id=app.id,
            metadata={
                "application_number": app.application_number,
                "role": current_user.role,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Department is not authorized to resubmit this application",
        )

    WorkflowEngine.resubmit_application(
        db=db,
        application_id=app.id,
        citizen_data=req.citizen_data,
        comments=req.comments,
        actor_id=current_user.name or current_user.id,
    )

    db.refresh(app)
    return _build_application_detail(app, db)
