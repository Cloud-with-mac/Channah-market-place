from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor, get_current_admin
from app.models.user import User
from app.models.vendor import Vendor
from app.models.payout import Payout, PayoutItem, PayoutStatus
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.schemas.payout import (
    PayoutResponse, PayoutDetailResponse, PayoutRequest,
    EarningsResponse, PayoutApprove, PayoutReject, PayoutItemResponse
)
from app.schemas.common import MessageResponse

router = APIRouter()


# ==================== VENDOR ENDPOINTS ====================

@router.get("/vendors/earnings", response_model=EarningsResponse)
async def get_vendor_earnings(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor's current earnings and balance"""
    # Get vendor
    result = await db.execute(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Get pending payouts amount
    pending_payouts_result = await db.execute(
        select(func.sum(Payout.amount)).where(
            Payout.vendor_id == vendor.id,
            Payout.status.in_([PayoutStatus.PENDING, PayoutStatus.PROCESSING])
        )
    )
    pending_balance = pending_payouts_result.scalar() or Decimal("0")

    # Get pending orders (delivered but not yet in payout)
    pending_orders_result = await db.execute(
        select(
            func.count(OrderItem.id),
            func.sum(OrderItem.vendor_amount)
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.status == OrderStatus.DELIVERED,
            Order.payment_status == PaymentStatus.PAID
        )
    )
    pending_order_stats = pending_orders_result.first()
    pending_orders_count = pending_order_stats[0] or 0
    pending_orders_value = pending_order_stats[1] or Decimal("0")

    # Get this month's earnings
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_result = await db.execute(
        select(func.sum(OrderItem.vendor_amount))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.status == OrderStatus.DELIVERED,
            Order.payment_status == PaymentStatus.PAID,
            OrderItem.created_at >= month_start
        )
    )
    this_month_earnings = this_month_result.scalar() or Decimal("0")

    return EarningsResponse(
        current_balance=vendor.balance,
        pending_balance=pending_balance,
        lifetime_earnings=vendor.total_earnings,
        this_month_earnings=this_month_earnings,
        pending_orders_count=pending_orders_count,
        pending_orders_value=pending_orders_value
    )


@router.get("/vendors/payouts", response_model=List[PayoutResponse])
async def get_vendor_payouts(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor's payout history"""
    # Get vendor
    result = await db.execute(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Build query
    query = select(Payout).where(Payout.vendor_id == vendor.id)

    if status:
        query = query.where(Payout.status == PayoutStatus(status))

    query = query.order_by(Payout.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    payouts = result.scalars().all()

    return [PayoutResponse.model_validate(p) for p in payouts]


@router.post("/vendors/payouts/request", response_model=PayoutResponse, status_code=status.HTTP_201_CREATED)
async def request_payout(
    payout_data: PayoutRequest,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Request a new payout"""
    # Get vendor
    result = await db.execute(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Validate minimum payout amount
    if payout_data.amount < 10:
        raise HTTPException(
            status_code=400,
            detail="Minimum payout amount is $10"
        )

    # Check if vendor has sufficient balance
    if vendor.balance < payout_data.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Available: ${vendor.balance}, Requested: ${payout_data.amount}"
        )

    # Check for pending bank details
    if payout_data.payment_method == "bank_transfer":
        if not vendor.bank_account_number or not vendor.bank_name:
            raise HTTPException(
                status_code=400,
                detail="Bank details not configured. Please update your payment settings."
            )

    # Create payout
    payout = Payout(
        vendor_id=vendor.id,
        amount=payout_data.amount,
        currency="USD",
        status=PayoutStatus.PENDING,
        payment_method=payout_data.payment_method
    )
    db.add(payout)

    # Deduct from vendor balance
    vendor.balance -= payout_data.amount

    await db.commit()
    await db.refresh(payout)

    return PayoutResponse.model_validate(payout)


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/payouts", response_model=List[PayoutDetailResponse])
async def get_all_payouts(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    vendor_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all payouts (admin only)"""
    # Build query
    query = select(Payout).options(
        selectinload(Payout.vendor),
        selectinload(Payout.items)
    )

    if status:
        query = query.where(Payout.status == PayoutStatus(status))

    if vendor_id:
        query = query.where(Payout.vendor_id == vendor_id)

    query = query.order_by(Payout.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    payouts = result.scalars().all()

    # Convert to response with vendor names
    response_payouts = []
    for payout in payouts:
        payout_dict = PayoutDetailResponse.model_validate(payout).model_dump()
        payout_dict['vendor_name'] = payout.vendor.business_name if payout.vendor else "Unknown"
        response_payouts.append(PayoutDetailResponse(**payout_dict))

    return response_payouts


@router.get("/admin/payouts/{payout_id}", response_model=PayoutDetailResponse)
async def get_payout_detail(
    payout_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get payout details (admin only)"""
    result = await db.execute(
        select(Payout)
        .where(Payout.id == payout_id)
        .options(
            selectinload(Payout.vendor),
            selectinload(Payout.items)
        )
    )
    payout = result.scalar_one_or_none()

    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    payout_dict = PayoutDetailResponse.model_validate(payout).model_dump()
    payout_dict['vendor_name'] = payout.vendor.business_name if payout.vendor else "Unknown"

    return PayoutDetailResponse(**payout_dict)


@router.put("/admin/payouts/{payout_id}/approve", response_model=PayoutResponse)
async def approve_payout(
    payout_id: UUID,
    approval_data: PayoutApprove,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve and process payout (admin only)"""
    result = await db.execute(
        select(Payout)
        .where(Payout.id == payout_id)
        .options(selectinload(Payout.vendor))
    )
    payout = result.scalar_one_or_none()

    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    if payout.status != PayoutStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve payout with status: {payout.status}"
        )

    # Update payout status
    payout.status = PayoutStatus.PROCESSING
    payout.admin_notes = approval_data.notes
    payout.stripe_transfer_id = approval_data.stripe_transfer_id
    payout.transaction_id = approval_data.transaction_id

    # TODO: Integrate with actual payment gateway (Stripe, PayPal, etc.)
    # For now, we'll simulate successful payment

    # Mark as paid immediately (in production, this would be done after payment confirmation)
    payout.status = PayoutStatus.PAID
    payout.paid_date = datetime.utcnow()

    await db.commit()
    await db.refresh(payout)

    # TODO: Send notification to vendor
    # background_tasks.add_task(send_payout_notification, payout.vendor.user_id, payout.id)

    return PayoutResponse.model_validate(payout)


@router.put("/admin/payouts/{payout_id}/reject", response_model=PayoutResponse)
async def reject_payout(
    payout_id: UUID,
    rejection_data: PayoutReject,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject payout and refund balance (admin only)"""
    result = await db.execute(
        select(Payout)
        .where(Payout.id == payout_id)
        .options(selectinload(Payout.vendor))
    )
    payout = result.scalar_one_or_none()

    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    if payout.status not in [PayoutStatus.PENDING, PayoutStatus.PROCESSING]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject payout with status: {payout.status}"
        )

    # Refund amount to vendor balance
    vendor = payout.vendor
    vendor.balance += payout.amount

    # Update payout
    payout.status = PayoutStatus.FAILED
    payout.failure_reason = rejection_data.reason
    payout.admin_notes = rejection_data.reason

    await db.commit()
    await db.refresh(payout)

    # TODO: Send notification to vendor
    # background_tasks.add_task(send_payout_rejection_notification, vendor.user_id, payout.id, rejection_data.reason)

    return PayoutResponse.model_validate(payout)


# ==================== COMMISSION CALCULATION HELPER ====================

async def calculate_and_update_vendor_balance(
    db: AsyncSession,
    order_item: OrderItem,
    vendor: Vendor
):
    """
    Calculate commission and update vendor balance when order is delivered.
    This should be called from order status update endpoint.
    """
    if order_item.status == OrderStatus.DELIVERED:
        # Update vendor balance and total earnings
        vendor.balance += order_item.vendor_amount
        vendor.total_earnings += order_item.vendor_amount
        vendor.total_sales += order_item.total

        await db.commit()
