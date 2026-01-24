from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.common import MessageResponse

router = APIRouter()


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    action_url: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCountResponse(BaseModel):
    total: int
    unread: int


class NotificationPreferences(BaseModel):
    email_orders: bool = True
    email_promotions: bool = True
    email_reviews: bool = True
    push_orders: bool = True
    push_promotions: bool = False
    push_reviews: bool = True


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user notifications"""
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.is_read == False)

    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notifications = result.scalars().all()

    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/count", response_model=NotificationCountResponse)
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get notification counts"""
    total_result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id)
    )
    total = total_result.scalar()

    unread_result = await db.execute(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    unread = unread_result.scalar()

    return NotificationCountResponse(total=total, unread=unread)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark notification as read"""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse.model_validate(notification)


@router.put("/read-all", response_model=MessageResponse)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    await db.commit()

    return MessageResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a notification"""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notification)
    await db.commit()

    return MessageResponse(message="Notification deleted")


@router.delete("/", response_model=MessageResponse)
async def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete all notifications"""
    await db.execute(
        Notification.__table__.delete().where(Notification.user_id == current_user.id)
    )
    await db.commit()

    return MessageResponse(message="All notifications deleted")


# Utility function to create notifications
async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    action_url: Optional[str] = None
):
    """Create a new notification"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url
    )
    db.add(notification)
    await db.commit()
    return notification
