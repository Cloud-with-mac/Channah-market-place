"""
Notification service for Channah Marketplace.

Creates in-app notifications and triggers associated emails.
"""

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.services.email import (
    send_welcome_email,
    send_order_confirmation_email,
    send_order_status_email,
    send_password_reset_email,
)

logger = logging.getLogger(__name__)


async def _create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    action_url: Optional[str] = None,
    is_email_sent: bool = False,
) -> Notification:
    """Create and persist a notification record."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
        is_email_sent=is_email_sent,
    )
    db.add(notification)
    await db.flush()
    return notification


# ---------------------------------------------------------------------------
# High-level notification helpers (DB notification + email)
# ---------------------------------------------------------------------------

async def notify_welcome(
    db: AsyncSession,
    user_id: UUID,
    email: str,
    first_name: str,
) -> None:
    """Send welcome notification + email after registration."""
    email_sent = send_welcome_email(email, first_name)

    await _create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.SYSTEM,
        title="Welcome to Channah!",
        message=f"Hi {first_name}, welcome to Channah! Start exploring products from trusted vendors around the world.",
        is_email_sent=email_sent,
    )


async def notify_order_confirmed(
    db: AsyncSession,
    user_id: UUID,
    email: str,
    first_name: str,
    order_id: UUID,
    order_number: str,
    items: list,
    subtotal: float,
    shipping: float,
    tax: float,
    total: float,
    currency: str = "USD",
    estimated_delivery: Optional[str] = None,
) -> None:
    """Send order confirmation notification + email."""
    email_sent = send_order_confirmation_email(
        to_email=email,
        first_name=first_name,
        order_number=order_number,
        items=items,
        subtotal=subtotal,
        shipping=shipping,
        tax=tax,
        total=total,
        currency=currency,
        estimated_delivery=estimated_delivery,
    )

    await _create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.ORDER_PLACED,
        title="Order Confirmed",
        message=f"Your order #{order_number} has been confirmed. Total: {currency} {total:.2f}",
        entity_type="order",
        entity_id=order_id,
        action_url=f"/account/orders/{order_number}",
        is_email_sent=email_sent,
    )


async def notify_order_status_change(
    db: AsyncSession,
    user_id: UUID,
    email: str,
    first_name: str,
    order_id: UUID,
    order_number: str,
    new_status: str,
    tracking_number: Optional[str] = None,
    carrier: Optional[str] = None,
) -> None:
    """Send order status update notification + email."""
    status_display = new_status.replace("_", " ").title()

    email_sent = send_order_status_email(
        to_email=email,
        first_name=first_name,
        order_number=order_number,
        new_status=new_status,
        tracking_number=tracking_number,
        carrier=carrier,
    )

    # Map status string to NotificationType
    type_map = {
        "confirmed": NotificationType.ORDER_CONFIRMED,
        "shipped": NotificationType.ORDER_SHIPPED,
        "delivered": NotificationType.ORDER_DELIVERED,
        "cancelled": NotificationType.ORDER_CANCELLED,
    }
    n_type = type_map.get(new_status, NotificationType.SYSTEM)

    await _create_notification(
        db=db,
        user_id=user_id,
        notification_type=n_type,
        title=f"Order {status_display}",
        message=f"Your order #{order_number} has been {new_status.replace('_', ' ')}.",
        entity_type="order",
        entity_id=order_id,
        action_url=f"/account/orders/{order_number}",
        is_email_sent=email_sent,
    )


def trigger_password_reset_email(
    email: str,
    first_name: str,
    reset_token: str,
) -> bool:
    """Send password reset email (no DB notification for this)."""
    return send_password_reset_email(email, first_name, reset_token)
