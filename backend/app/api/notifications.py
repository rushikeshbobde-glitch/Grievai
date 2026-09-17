from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import get_current_user
from app.models.all_models import User
from app.schemas.all_schemas import NotificationOut
from app.services.notification_service import (
    get_user_notifications, mark_notification_read, mark_all_notifications_read
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut], summary="Get current user notifications")
def list_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves chronological in-app notifications for the logged in user."""
    return get_user_notifications(db, user_id=current_user.id, limit=limit)


@router.patch("/{notification_id}/read", response_model=NotificationOut, summary="Mark notification as read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a specific notification as read."""
    notif = mark_notification_read(db, notification_id=notification_id, user_id=current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return notif


@router.patch("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks all unread notifications of the user as read."""
    updated = mark_all_notifications_read(db, user_id=current_user.id)
    return {"status": "success", "count": updated}
