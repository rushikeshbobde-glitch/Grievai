from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import Notification


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    """Creates an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_user_notifications(db: Session, user_id: str, limit: int = 50) -> List[Notification]:
    """Fetches user notifications ordered by newest first."""
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(limit).all()


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Optional[Notification]:
    """Marks a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    """Marks all unread notifications of a user as read."""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return count
