from typing import Dict, Any
from backend.app.events.publisher import subscribe_event
from backend.app.database import SessionLocal
from backend.app.models.application import Application
from backend.app.models.user import User
from backend.app.models.notification import Notification
from backend.app.services.sms import send_sms

# Real-time event notifications queue for dashboard / citizen alerts
ACTIVE_NOTIFICATIONS = []

EVENT_NOTIFICATION_MAP = {
    "APPLICATION_CREATED": {
        "title": "Application Registered",
        "template": "Your application {app_id} has been registered on MahaSetu."
    },
    "CONSENT_GRANTED": {
        "title": "Digital Consent Recorded",
        "template": "Digital consent recorded for {app_id}. Cross-departmental exchange initiated."
    },
    "IDENTITY_VERIFIED": {
        "title": "Identity Verified",
        "template": "Department A (Identity) has successfully verified your identity for application {app_id}."
    },
    "ELIGIBILITY_VERIFIED": {
        "title": "Eligibility Verified",
        "template": "Department B (Eligibility) has confirmed scheme criteria for application {app_id}."
    },
    "APPROVAL_STARTED": {
        "title": "Approval In Progress",
        "template": "Department C (Approval) is reviewing sanction for application {app_id}."
    },
    "ADMIN_APPROVED": {
        "title": "Admin Review Signed Off",
        "template": "State Administrator signed off on application {app_id}."
    },
    "AUDITOR_CONFIRMED": {
        "title": "Audit Compliance Confirmed",
        "template": "Independent Auditor confirmed compliance for application {app_id}."
    },
    "AUDITOR_FLAGGED": {
        "title": "Audit Flagged",
        "template": "Auditor noted an irregularity for application {app_id}."
    },
    "REWORK_REQUESTED": {
        "title": "Rework Requested",
        "template": "Application {app_id} requires rework: {reason}. Please update your application."
    },
    "APPLICATION_RESUBMITTED": {
        "title": "Application Resubmitted",
        "template": "Application {app_id} resubmitted for verification."
    },
    "APPLICATION_COMPLETED": {
        "title": "Application Sanctioned",
        "template": "Application {app_id} is completed and sanctioned!"
    },
}

def event_logger_handler(event: Dict[str, Any]):
    """Default handler that formats notifications and logs activity."""
    event_type = event.get("eventType")
    app_id = event.get("applicationId")
    dept_id = event.get("departmentId")

    notification = {
        "id": f"notif-{len(ACTIVE_NOTIFICATIONS) + 1}",
        "type": event_type,
        "title": f"{event_type.replace('_', ' ').title() if event_type else 'Event'}",
        "message": f"Application {app_id} processed by {dept_id}",
        "timestamp": event.get("timestamp"),
        "read": False
    }

    ACTIVE_NOTIFICATIONS.append(notification)
    if len(ACTIVE_NOTIFICATIONS) > 100:
        ACTIVE_NOTIFICATIONS.pop(0)

    print(f"[MAHASETU EVENT] {event_type} | App: {app_id} | Dept: {dept_id}")

def notification_and_sms_handler(event: Dict[str, Any]):
    """
    Listens to lifecycle events, persists an in-app Notification for the citizen,
    and dispatches SMS alert via Twilio / demo fallback.
    """
    event_type = event.get("eventType")
    app_id = event.get("applicationId")
    metadata = event.get("metadata") or {}

    if not event_type or not app_id or event_type not in EVENT_NOTIFICATION_MAP:
        return

    mapping = EVENT_NOTIFICATION_MAP[event_type]
    title = mapping["title"]
    reason = metadata.get("rejection_reason", metadata.get("comments", "Action required"))
    message = mapping["template"].format(app_id=app_id, reason=reason)

    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.application_number == app_id).first()
        if not app or not app.citizen_id:
            return

        citizen = db.query(User).filter(User.id == app.citizen_id).first()
        if not citizen:
            return

        # 1. Create In-App Notification
        notif = Notification(
            user_id=citizen.id,
            title=title,
            message=message,
            notification_type=event_type,
            reference_id=app.application_number,
            is_read=False
        )
        db.add(notif)
        db.commit()

        # 2. Dispatch SMS
        if citizen.mobile:
            try:
                send_sms(to_phone=citizen.mobile, message_body=f"[MahaSetu] {title}: {message}")
            except Exception as sms_err:
                print(f"[SMS Error]: {sms_err}")
    except Exception as err:
        print(f"[NotificationHandler Error]: {err}")
    finally:
        db.close()

def register_default_handlers():
    subscribe_event(event_logger_handler)
    subscribe_event(notification_and_sms_handler)

