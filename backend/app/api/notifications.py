from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models.notification import Notification
from backend.app.models.user import User
from backend.app.schemas.notification import NotificationResponse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Retrieves chronological in-app notifications for the authenticated user."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notifications


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a single notification as read."""
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id, Notification.user_id == current_user.id
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Marks all notifications for the current user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "SUCCESS", "message": "All notifications marked as read"}
