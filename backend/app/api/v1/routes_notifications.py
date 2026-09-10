from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.notification import Notification
from app.db.models.user import User
from app.schemas.notification import NotificationResponse


router = APIRouter()


@router.get("/notifications/mine", response_model=list[NotificationResponse])
async def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[NotificationResponse]:
    """
    Get all notifications for the current user, ordered by creation date (newest first).
    
    Args:
        current_user: The authenticated user
        db: Database session
        
    Returns:
        List of NotificationResponse objects
    """
    stmt = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc())
    
    result = db.execute(stmt)
    notifications = result.scalars().all()
    
    return [NotificationResponse.model_validate(notif) for notif in notifications]


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> NotificationResponse:
    """
    Mark a notification as read. Only the owning user can mark it read.
    
    Args:
        notification_id: The ID of the notification to mark read
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Updated NotificationResponse
        
    Raises:
        HTTPException: 404 if notification not found
        HTTPException: 403 if user doesn't own the notification
    """
    stmt = select(Notification).where(Notification.id == notification_id)
    result = db.execute(stmt)
    notification = result.scalar_one_or_none()
    
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check permission: user must own the notification
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to mark this notification read"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return NotificationResponse.model_validate(notification)
