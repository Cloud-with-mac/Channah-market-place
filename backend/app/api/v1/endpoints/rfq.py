from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.vendor import Vendor
from app.models.rfq import RFQ, RFQQuote, RFQStatus, QuoteStatus
from app.schemas.common import MessageResponse, BaseSchema

router = APIRouter()


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class RFQCreate(BaseModel):
    title: str
    description: Optional[str] = None
    product_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    quantity: int
    unit: str = "pieces"
    target_price: Optional[float] = None
    currency: str = "GBP"
    delivery_deadline: Optional[datetime] = None
    shipping_address: Optional[str] = None
    specifications: Optional[str] = None
    attachments: Optional[str] = None
    status: Optional[RFQStatus] = RFQStatus.DRAFT


class RFQUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    product_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    target_price: Optional[float] = None
    currency: Optional[str] = None
    delivery_deadline: Optional[datetime] = None
    shipping_address: Optional[str] = None
    specifications: Optional[str] = None
    attachments: Optional[str] = None
    status: Optional[RFQStatus] = None


class QuoteCreate(BaseModel):
    unit_price: float
    total_price: float
    currency: str = "GBP"
    lead_time_days: int
    minimum_order_quantity: Optional[int] = None
    notes: Optional[str] = None
    valid_until: datetime


class QuoteResponse(BaseSchema):
    id: UUID
    rfq_id: UUID
    vendor_id: UUID
    unit_price: float
    total_price: float
    currency: str
    lead_time_days: int
    minimum_order_quantity: Optional[int] = None
    notes: Optional[str] = None
    valid_until: datetime
    status: QuoteStatus
    created_at: datetime
    updated_at: datetime


class RFQResponse(BaseSchema):
    id: UUID
    buyer_id: UUID
    title: str
    description: Optional[str] = None
    product_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    quantity: int
    unit: str
    target_price: Optional[float] = None
    currency: str
    delivery_deadline: Optional[datetime] = None
    shipping_address: Optional[str] = None
    specifications: Optional[str] = None
    attachments: Optional[str] = None
    status: RFQStatus
    quotes: List[QuoteResponse] = []
    created_at: datetime
    updated_at: datetime


class RFQListResponse(BaseSchema):
    id: UUID
    buyer_id: UUID
    title: str
    quantity: int
    unit: str
    target_price: Optional[float] = None
    currency: str
    status: RFQStatus
    quote_count: int = 0
    created_at: datetime


# ── Helpers ────────────────────────────────────────────────────────────────────

async def get_vendor_for_user(user: User, db: AsyncSession) -> Vendor:
    """Get vendor profile for a user, raise 403 if not a vendor."""
    result = await db.execute(
        select(Vendor).where(Vendor.user_id == user.id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=403, detail="Vendor profile not found")
    return vendor


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
async def create_rfq(
    data: RFQCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new RFQ (buyer, auth required)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    rfq = RFQ(
        buyer_id=current_user.id,
        title=data.title,
        description=data.description,
        product_id=data.product_id,
        category_id=data.category_id,
        quantity=data.quantity,
        unit=data.unit,
        target_price=data.target_price,
        currency=data.currency,
        delivery_deadline=data.delivery_deadline,
        shipping_address=data.shipping_address,
        specifications=data.specifications,
        attachments=data.attachments,
        status=data.status or RFQStatus.DRAFT,
    )
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)

    # Reload with relationships
    result = await db.execute(
        select(RFQ).where(RFQ.id == rfq.id).options(selectinload(RFQ.quotes))
    )
    rfq = result.scalar_one()
    return rfq


@router.get("/", response_model=List[RFQListResponse])
async def list_rfqs(
    status_filter: Optional[RFQStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List RFQs.
    - Buyers see their own RFQs.
    - Vendors see OPEN RFQs (optionally filtered to their categories).
    - Admins see all.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    query = select(RFQ).options(selectinload(RFQ.quotes))

    if current_user.role == UserRole.ADMIN:
        pass  # no filter
    elif current_user.role == UserRole.VENDOR:
        # Vendors see OPEN rfqs
        query = query.where(RFQ.status == RFQStatus.OPEN)
    else:
        # Buyers see their own
        query = query.where(RFQ.buyer_id == current_user.id)

    if status_filter:
        query = query.where(RFQ.status == status_filter)

    query = query.order_by(RFQ.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    rfqs = result.scalars().all()

    return [
        RFQListResponse(
            id=r.id,
            buyer_id=r.buyer_id,
            title=r.title,
            quantity=r.quantity,
            unit=r.unit,
            target_price=r.target_price,
            currency=r.currency,
            status=r.status,
            quote_count=len(r.quotes),
            created_at=r.created_at,
        )
        for r in rfqs
    ]


@router.get("/{rfq_id}", response_model=RFQResponse)
async def get_rfq(
    rfq_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get RFQ detail."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.execute(
        select(RFQ).where(RFQ.id == rfq_id).options(selectinload(RFQ.quotes))
    )
    rfq = result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    # Buyers can see their own; vendors can see OPEN+; admins can see all
    if current_user.role == UserRole.ADMIN:
        pass
    elif rfq.buyer_id == current_user.id:
        pass
    elif current_user.role == UserRole.VENDOR and rfq.status != RFQStatus.DRAFT:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this RFQ")

    return rfq


@router.put("/{rfq_id}", response_model=RFQResponse)
async def update_rfq(
    rfq_id: UUID,
    data: RFQUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update RFQ (buyer only, only if DRAFT or OPEN)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.execute(
        select(RFQ).where(RFQ.id == rfq_id).options(selectinload(RFQ.quotes))
    )
    rfq = result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if rfq.status not in (RFQStatus.DRAFT, RFQStatus.OPEN):
        raise HTTPException(status_code=400, detail="RFQ can only be updated in DRAFT or OPEN status")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rfq, field, value)

    await db.commit()
    await db.refresh(rfq)

    # Reload with relationships
    result = await db.execute(
        select(RFQ).where(RFQ.id == rfq.id).options(selectinload(RFQ.quotes))
    )
    rfq = result.scalar_one()
    return rfq


@router.delete("/{rfq_id}", response_model=MessageResponse)
async def cancel_rfq(
    rfq_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an RFQ (buyer only)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    rfq.status = RFQStatus.CANCELLED
    await db.commit()

    return MessageResponse(message="RFQ cancelled successfully")


@router.post("/{rfq_id}/quotes", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def submit_quote(
    rfq_id: UUID,
    data: QuoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a quote for an RFQ (vendor, auth required)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    vendor = await get_vendor_for_user(current_user, db)

    # Verify RFQ exists and is open
    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.status not in (RFQStatus.OPEN, RFQStatus.QUOTED, RFQStatus.NEGOTIATING):
        raise HTTPException(status_code=400, detail="RFQ is not accepting quotes")

    # Check vendor hasn't already quoted
    existing = await db.execute(
        select(RFQQuote).where(
            RFQQuote.rfq_id == rfq_id,
            RFQQuote.vendor_id == vendor.id,
            RFQQuote.status == QuoteStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a pending quote for this RFQ")

    quote = RFQQuote(
        rfq_id=rfq_id,
        vendor_id=vendor.id,
        unit_price=data.unit_price,
        total_price=data.total_price,
        currency=data.currency,
        lead_time_days=data.lead_time_days,
        minimum_order_quantity=data.minimum_order_quantity,
        notes=data.notes,
        valid_until=data.valid_until,
    )
    db.add(quote)

    # Update RFQ status to QUOTED if it was OPEN
    if rfq.status == RFQStatus.OPEN:
        rfq.status = RFQStatus.QUOTED

    await db.commit()
    await db.refresh(quote)

    return quote


@router.get("/{rfq_id}/quotes", response_model=List[QuoteResponse])
async def list_quotes(
    rfq_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List quotes for an RFQ."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify RFQ exists
    rfq_result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = rfq_result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    # Buyers see all quotes on their RFQ; vendors see only their own
    query = select(RFQQuote).where(RFQQuote.rfq_id == rfq_id)

    if current_user.role == UserRole.VENDOR:
        vendor = await get_vendor_for_user(current_user, db)
        query = query.where(RFQQuote.vendor_id == vendor.id)
    elif rfq.buyer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = query.order_by(RFQQuote.created_at.desc())
    result = await db.execute(query)
    quotes = result.scalars().all()

    return quotes


@router.put("/{rfq_id}/quotes/{quote_id}/accept", response_model=QuoteResponse)
async def accept_quote(
    rfq_id: UUID,
    quote_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a quote (buyer only)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify RFQ ownership
    rfq_result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = rfq_result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get quote
    quote_result = await db.execute(
        select(RFQQuote).where(RFQQuote.id == quote_id, RFQQuote.rfq_id == rfq_id)
    )
    quote = quote_result.scalar_one_or_none()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote.status != QuoteStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quote is not in pending status")

    # Accept this quote
    quote.status = QuoteStatus.ACCEPTED

    # Reject all other pending quotes for this RFQ
    other_quotes_result = await db.execute(
        select(RFQQuote).where(
            RFQQuote.rfq_id == rfq_id,
            RFQQuote.id != quote_id,
            RFQQuote.status == QuoteStatus.PENDING,
        )
    )
    for other_quote in other_quotes_result.scalars().all():
        other_quote.status = QuoteStatus.REJECTED

    # Update RFQ status
    rfq.status = RFQStatus.AWARDED

    await db.commit()
    await db.refresh(quote)

    return quote


@router.put("/{rfq_id}/quotes/{quote_id}/reject", response_model=QuoteResponse)
async def reject_quote(
    rfq_id: UUID,
    quote_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a quote (buyer only)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify RFQ ownership
    rfq_result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = rfq_result.scalar_one_or_none()

    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get quote
    quote_result = await db.execute(
        select(RFQQuote).where(RFQQuote.id == quote_id, RFQQuote.rfq_id == rfq_id)
    )
    quote = quote_result.scalar_one_or_none()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote.status != QuoteStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quote is not in pending status")

    quote.status = QuoteStatus.REJECTED
    await db.commit()
    await db.refresh(quote)

    return quote
