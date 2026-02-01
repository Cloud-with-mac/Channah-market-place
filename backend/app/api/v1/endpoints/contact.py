from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.models.contact import ContactSubmission, NewsletterSubscriber
from app.schemas.common import MessageResponse

router = APIRouter()


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    order_number: Optional[str] = None


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr


class NewsletterUnsubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/contact", response_model=MessageResponse)
async def create_contact_submission(
    data: ContactFormRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submit a contact form (no auth required)"""
    submission = ContactSubmission(
        name=data.name,
        email=data.email,
        subject=data.subject,
        message=data.message,
        order_number=data.order_number,
    )
    db.add(submission)
    await db.commit()

    return MessageResponse(message="Your message has been submitted successfully. We'll get back to you soon.")


@router.post("/newsletter/subscribe", response_model=MessageResponse)
async def newsletter_subscribe(
    data: NewsletterSubscribeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to newsletter (no auth required)"""
    # Check if already subscribed
    result = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == data.email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.is_active:
            return MessageResponse(message="You are already subscribed to our newsletter.")
        else:
            # Re-subscribe
            existing.is_active = True
            existing.unsubscribed_at = None
            existing.subscribed_at = datetime.utcnow()
            await db.commit()
            return MessageResponse(message="Welcome back! You have been re-subscribed to our newsletter.")

    subscriber = NewsletterSubscriber(email=data.email)
    db.add(subscriber)
    await db.commit()

    return MessageResponse(message="Thank you for subscribing to our newsletter!")


@router.post("/newsletter/unsubscribe", response_model=MessageResponse)
async def newsletter_unsubscribe(
    data: NewsletterUnsubscribeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Unsubscribe from newsletter (no auth required)"""
    result = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == data.email)
    )
    subscriber = result.scalar_one_or_none()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Email not found in our subscriber list")

    if not subscriber.is_active:
        return MessageResponse(message="You are already unsubscribed.")

    subscriber.is_active = False
    subscriber.unsubscribed_at = datetime.utcnow()
    await db.commit()

    return MessageResponse(message="You have been successfully unsubscribed from our newsletter.")
