from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor, get_current_admin
from app.core.config import settings
from app.models.user import User
from app.models.vendor import Vendor
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderListResponse, OrderItemResponse,
    OrderUpdateStatus, OrderTrackingResponse, OrderTrackingItemResponse,
    OrderStatusHistoryResponse, RefundRequest
)
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new order from cart"""
    # Get user's cart
    cart_result = await db.execute(
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.product)
            .selectinload(Product.vendor),
            selectinload(Cart.items)
            .selectinload(CartItem.product)
            .selectinload(Product.images)
        )
    )
    cart = cart_result.scalar_one_or_none()

    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate totals
    subtotal = Decimal("0")
    shipping_amount = Decimal("0")
    for item in cart.items:
        if item.product.track_inventory and item.product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}"
            )
        subtotal += item.price * item.quantity
        # Vendor-set shipping cost per product
        product_shipping = Decimal(str(item.product.shipping_cost or 0))
        shipping_amount += product_shipping * item.quantity

    tax_amount = subtotal * Decimal("0.08")  # 8% tax
    discount_amount = cart.discount_amount
    total = subtotal + tax_amount + shipping_amount - discount_amount

    # Create order
    order = Order(
        user_id=current_user.id,
        order_number=Order.generate_order_number(),
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        paid_at=datetime.utcnow(),
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        discount_amount=discount_amount,
        total=total,
        currency=order_data.currency or "USD",
        coupon_code=cart.coupon_code,
        shipping_first_name=order_data.shipping_address.first_name,
        shipping_last_name=order_data.shipping_address.last_name,
        shipping_email=order_data.shipping_address.email,
        shipping_phone=order_data.shipping_address.phone,
        shipping_address_line1=order_data.shipping_address.address_line1,
        shipping_address_line2=order_data.shipping_address.address_line2,
        shipping_city=order_data.shipping_address.city,
        shipping_state=order_data.shipping_address.state,
        shipping_postal_code=order_data.shipping_address.postal_code,
        shipping_country=order_data.shipping_address.country,
        billing_same_as_shipping=order_data.billing_same_as_shipping,
        shipping_method=order_data.shipping_method,
        payment_method=order_data.payment_method,
        customer_notes=order_data.customer_notes
    )

    # Calculate estimated delivery from vendor processing + shipping days
    max_processing = max((item.product.vendor.processing_days or 2 for item in cart.items), default=2)
    max_shipping = max((item.product.vendor.shipping_days or 5 for item in cart.items), default=5)
    order.estimated_delivery = datetime.utcnow() + timedelta(days=max_processing + max_shipping)

    if not order_data.billing_same_as_shipping and order_data.billing_address:
        order.billing_first_name = order_data.billing_address.first_name
        order.billing_last_name = order_data.billing_address.last_name
        order.billing_address_line1 = order_data.billing_address.address_line1
        order.billing_address_line2 = order_data.billing_address.address_line2
        order.billing_city = order_data.billing_address.city
        order.billing_state = order_data.billing_address.state
        order.billing_postal_code = order_data.billing_address.postal_code
        order.billing_country = order_data.billing_address.country

    db.add(order)
    await db.flush()

    # Create order items
    for cart_item in cart.items:
        product = cart_item.product
        vendor = product.vendor

        commission_rate = vendor.commission_rate if vendor else settings.PLATFORM_COMMISSION_PERCENT
        item_total = cart_item.price * cart_item.quantity
        commission_amount = item_total * Decimal(str(commission_rate / 100))
        vendor_amount = item_total - commission_amount

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            vendor_id=vendor.id if vendor else None,
            product_name=product.name,
            product_sku=product.sku,
            product_image=product.images[0].url if product.images and len(product.images) > 0 else None,
            variant_name=None,
            quantity=cart_item.quantity,
            unit_price=cart_item.price,
            total=item_total,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            vendor_amount=vendor_amount,
            status=OrderStatus.CONFIRMED
        )
        db.add(order_item)

        # Update product inventory
        if product.track_inventory:
            product.quantity -= cart_item.quantity
            product.sales_count += cart_item.quantity

    # Add status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.CONFIRMED,
        notes="Order placed and confirmed"
    )
    db.add(status_history)

    # Clear cart
    for item in cart.items:
        await db.delete(item)
    cart.coupon_code = None
    cart.discount_amount = 0

    await db.commit()
    await db.refresh(order)

    # Load order with relationships
    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
    )
    order = result.scalar_one()

    # Send order confirmation email + notification in background
    order_items_for_email = [
        {"name": item.product_name, "quantity": item.quantity, "unit_price": float(item.unit_price)}
        for item in order.items
    ]
    background_tasks.add_task(
        _send_order_confirmation_background,
        user_id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        order_id=order.id,
        order_number=order.order_number,
        items=order_items_for_email,
        subtotal=float(order.subtotal),
        shipping=float(order.shipping_amount),
        tax=float(order.tax_amount),
        total=float(order.total),
        currency=order.currency,
        estimated_delivery=order.estimated_delivery.strftime("%B %d, %Y") if order.estimated_delivery else None,
    )

    return OrderResponse.model_validate(order)


@router.get("/", response_model=List[OrderListResponse])
async def get_my_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's orders"""
    query = select(Order).where(Order.user_id == current_user.id).options(selectinload(Order.items))

    if status:
        query = query.where(Order.status == status)

    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        OrderListResponse(
            id=o.id,
            order_number=o.order_number,
            status=o.status.value,
            payment_status=o.payment_status.value,
            total=o.total,
            currency=o.currency,
            item_count=len(o.items) if o.items else 0,
            created_at=o.created_at
        )
        for o in orders
    ]


@router.get("/{order_number}/tracking", response_model=OrderTrackingResponse)
async def track_order(
    order_number: str,
    email: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Track order status. Requires email verification to view full details."""
    result = await db.execute(
        select(Order)
        .where(Order.order_number == order_number)
        .options(
            selectinload(Order.status_history),
            selectinload(Order.items),
            selectinload(Order.user)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify email matches the order owner for security
    if not email or (order.user and order.user.email.lower() != email.lower()):
        # Return limited tracking info without personal details
        return OrderTrackingResponse(
            order_number=order.order_number,
            status=order.status.value,
            payment_status=order.payment_status.value,
            created_at=order.created_at,
            updated_at=order.updated_at,
            shipping_first_name=None,
            shipping_last_name=None,
            shipping_city=None,
            shipping_state=None,
            shipping_country=None,
            subtotal=None,
            shipping_cost=None,
            tax=None,
            total=None,
            currency=order.currency,
            tracking_number=order.tracking_number,
            carrier=order.carrier,
            estimated_delivery=order.estimated_delivery,
            items=[],
            status_history=[
                OrderStatusHistoryResponse(
                    id=h.id,
                    status=h.status.value,
                    notes=h.notes,
                    created_at=h.created_at
                )
                for h in order.status_history
            ]
        )

    return OrderTrackingResponse(
        order_number=order.order_number,
        status=order.status.value,
        payment_status=order.payment_status.value,
        created_at=order.created_at,
        updated_at=order.updated_at,
        # Shipping address
        shipping_first_name=order.shipping_first_name,
        shipping_last_name=order.shipping_last_name,
        shipping_city=order.shipping_city,
        shipping_state=order.shipping_state,
        shipping_country=order.shipping_country,
        # Prices
        subtotal=order.subtotal,
        shipping_cost=order.shipping_amount,
        tax=order.tax_amount,
        total=order.total,
        currency=order.currency,
        # Tracking info
        tracking_number=order.tracking_number,
        carrier=order.carrier,
        estimated_delivery=order.estimated_delivery,
        # Items
        items=[
            OrderTrackingItemResponse(
                id=item.id,
                product_name=item.product_name,
                quantity=item.quantity,
                price=item.unit_price,
                status=item.status.value if hasattr(item.status, 'value') else str(item.status),
                tracking_number=item.tracking_number
            )
            for item in order.items
        ],
        status_history=[
            OrderStatusHistoryResponse(
                id=h.id,
                status=h.status.value,
                notes=h.notes,
                created_at=h.created_at
            )
            for h in order.status_history
        ]
    )


@router.post("/{order_number}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an order"""
    result = await db.execute(
        select(Order)
        .where(Order.order_number == order_number, Order.user_id == current_user.id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")

    # Update order status
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()

    # Add status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.CANCELLED,
        notes="Cancelled by customer",
        changed_by=current_user.id
    )
    db.add(status_history)

    # Restore inventory
    for item in order.items:
        if item.product:
            item.product.quantity += item.quantity
        item.status = OrderStatus.CANCELLED

    await db.commit()
    await db.refresh(order)

    return OrderResponse.model_validate(order)


# Vendor endpoints

@router.get("/vendor/orders", response_model=List[dict])
async def get_vendor_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get orders for current vendor"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    query = select(OrderItem).where(OrderItem.vendor_id == vendor.id).options(
        selectinload(OrderItem.order)
    )

    if status:
        query = query.where(OrderItem.status == status)

    query = query.order_by(OrderItem.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return [
        {
            "id": str(item.id),
            "order_id": str(item.order_id),
            "order_number": item.order.order_number if item.order else None,
            "product_id": str(item.product_id) if item.product_id else None,
            "product_name": item.product_name,
            "product_sku": item.product_sku,
            "product_image": item.product_image,
            "variant_name": item.variant_name,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "total": float(item.total),
            "status": item.status.value,
            "tracking_number": item.tracking_number,
            "customer_name": f"{item.order.shipping_first_name} {item.order.shipping_last_name}" if item.order else "Unknown",
            "customer_email": item.order.shipping_email if item.order else None,
            "currency": item.order.currency if item.order else "USD",
            "created_at": item.created_at.isoformat(),
        }
        for item in items
    ]


@router.get("/vendor/orders/{item_id}", response_model=dict)
async def get_vendor_order_item(
    item_id: UUID,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get single order item with full order details for vendor"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(OrderItem)
        .where(OrderItem.id == item_id, OrderItem.vendor_id == vendor.id)
        .options(selectinload(OrderItem.order))
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    order = item.order
    return {
        "id": str(item.id),
        "order_id": str(item.order_id),
        "order_number": order.order_number,
        "product_id": str(item.product_id) if item.product_id else None,
        "product_name": item.product_name,
        "product_sku": item.product_sku,
        "product_image": item.product_image,
        "variant_name": item.variant_name,
        "quantity": item.quantity,
        "unit_price": float(item.unit_price),
        "total": float(item.total),
        "status": item.status.value,
        "tracking_number": item.tracking_number,
        "commission_rate": item.commission_rate,
        "commission_amount": float(item.commission_amount),
        "vendor_amount": float(item.vendor_amount),
        "created_at": item.created_at.isoformat(),
        # Order details
        "currency": order.currency,
        "customer_name": f"{order.shipping_first_name} {order.shipping_last_name}",
        "customer_email": order.shipping_email,
        "customer_phone": order.shipping_phone,
        "shipping_address": {
            "line1": order.shipping_address_line1,
            "line2": order.shipping_address_line2,
            "city": order.shipping_city,
            "state": order.shipping_state,
            "postal_code": order.shipping_postal_code,
            "country": order.shipping_country,
        },
        "order_status": order.status.value,
        "payment_status": order.payment_status.value,
        "order_created_at": order.created_at.isoformat(),
    }


@router.put("/vendor/orders/{item_id}/status", response_model=OrderItemResponse)
async def update_order_item_status(
    item_id: UUID,
    status_data: OrderUpdateStatus,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update order item status (vendor)"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(OrderItem).where(OrderItem.id == item_id, OrderItem.vendor_id == vendor.id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    old_item_status = item.status
    item.status = OrderStatus(status_data.status)
    if status_data.tracking_number:
        item.tracking_number = status_data.tracking_number

    # Update vendor sales when item is delivered
    if item.status == OrderStatus.DELIVERED and old_item_status != OrderStatus.DELIVERED:
        vendor.total_sales += item.total
        vendor.total_earnings += item.vendor_amount
        vendor.balance += item.vendor_amount

    # Sync parent order status based on all items
    all_items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == item.order_id)
    )
    all_items = all_items_result.scalars().all()

    # Determine order status from item statuses
    # Order follows the "least progressed" item
    status_priority = {
        OrderStatus.PENDING: 0,
        OrderStatus.CONFIRMED: 1,
        OrderStatus.PROCESSING: 2,
        OrderStatus.SHIPPED: 3,
        OrderStatus.OUT_FOR_DELIVERY: 4,
        OrderStatus.DELIVERED: 5,
        OrderStatus.CANCELLED: -1,
        OrderStatus.REFUNDED: -2,
        OrderStatus.FAILED: -3,
    }

    non_cancelled = [i for i in all_items if i.status not in (OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.FAILED)]
    order_result = await db.execute(select(Order).where(Order.id == item.order_id))
    order = order_result.scalar_one_or_none()
    if order:
        if not non_cancelled:
            # All items cancelled/refunded/failed — set order to cancelled
            order.status = OrderStatus.CANCELLED
        else:
            min_status = min(non_cancelled, key=lambda i: status_priority.get(i.status, 0))
            order.status = min_status.status
            # Update timestamps
            if min_status.status == OrderStatus.SHIPPED and not order.shipped_at:
                order.shipped_at = datetime.utcnow()
            elif min_status.status == OrderStatus.DELIVERED and not order.delivered_at:
                order.delivered_at = datetime.utcnow()

    await db.commit()
    await db.refresh(item)

    return OrderItemResponse.model_validate(item)


# Admin endpoints

@router.get("/admin/all")
async def get_all_orders(
    skip: int = 0,
    limit: int = 20,
    page: int = 1,
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all orders (admin only)"""
    query = select(Order).options(selectinload(Order.items))

    if status:
        query = query.where(Order.status == OrderStatus(status))
    if payment_status:
        query = query.where(Order.payment_status == payment_status)
    if search:
        query = query.where(
            Order.order_number.ilike(f"%{search}%") |
            Order.shipping_first_name.ilike(f"%{search}%") |
            Order.shipping_last_name.ilike(f"%{search}%") |
            Order.shipping_email.ilike(f"%{search}%")
        )

    # Count total
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # Calculate offset from page
    offset = (page - 1) * limit if page > 0 else skip
    query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    return {
        "orders": [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "customer_name": f"{o.shipping_first_name} {o.shipping_last_name}",
                "customer_email": o.shipping_email,
                "vendor_name": "Multiple" if o.items and len(set(i.vendor_id for i in o.items)) > 1 else "—",
                "status": o.status.value,
                "payment_status": o.payment_status.value,
                "total": float(o.total),
                "currency": o.currency,
                "items_count": len(o.items) if o.items else 0,
                "created_at": o.created_at.isoformat(),
                "updated_at": o.updated_at.isoformat() if o.updated_at else o.created_at.isoformat(),
            }
            for o in orders
        ],
        "total": total,
    }


@router.get("/admin/{order_id}", response_model=OrderResponse)
async def get_admin_order(
    order_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get single order details (admin only)"""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse.model_validate(order)


@router.put("/admin/{order_id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: UUID,
    status_data: OrderUpdateStatus,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update order status (admin only)"""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.user))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    order.status = OrderStatus(status_data.status)

    if status_data.tracking_number:
        order.tracking_number = status_data.tracking_number
    if status_data.carrier:
        order.carrier = status_data.carrier

    # Update timestamps
    if order.status == OrderStatus.SHIPPED and old_status != OrderStatus.SHIPPED:
        order.shipped_at = datetime.utcnow()
    elif order.status == OrderStatus.DELIVERED and old_status != OrderStatus.DELIVERED:
        order.delivered_at = datetime.utcnow()

    # Add status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        notes=status_data.notes,
        changed_by=current_user.id
    )
    db.add(status_history)

    await db.commit()
    await db.refresh(order)

    # Notify customer of status change
    if order.user and old_status != order.status:
        background_tasks.add_task(
            _send_order_status_background,
            user_id=order.user.id,
            email=order.user.email,
            first_name=order.user.first_name,
            order_id=order.id,
            order_number=order.order_number,
            new_status=status_data.status,
            tracking_number=status_data.tracking_number,
            carrier=status_data.carrier,
        )

    return OrderResponse.model_validate(order)


@router.post("/admin/{order_id}/refund", response_model=OrderResponse)
async def process_refund(
    order_id: UUID,
    refund_data: RefundRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Process order refund (admin only)"""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status != PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order not paid")

    # Calculate refund amount
    refund_amount = refund_data.amount or order.total

    # TODO: Process refund with payment gateway

    order.status = OrderStatus.REFUNDED
    order.payment_status = PaymentStatus.REFUNDED

    status_history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.REFUNDED,
        notes=f"Refund processed: ${refund_amount}. Reason: {refund_data.reason}",
        changed_by=current_user.id
    )
    db.add(status_history)

    await db.commit()
    await db.refresh(order)

    return OrderResponse.model_validate(order)


# Customer order detail - must be last since /{order_number} is a catch-all

@router.get("/{order_number}", response_model=OrderResponse)
async def get_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order by order number"""
    result = await db.execute(
        select(Order)
        .where(Order.order_number == order_number, Order.user_id == current_user.id)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse.model_validate(order)


# ---------------------------------------------------------------------------
# Background task helpers for email/notification dispatch
# ---------------------------------------------------------------------------

async def _send_order_confirmation_background(
    user_id, email, first_name, order_id, order_number,
    items, subtotal, shipping, tax, total, currency, estimated_delivery,
):
    from app.core.database import AsyncSessionLocal
    from app.services.notifications import notify_order_confirmed
    import logging

    async with AsyncSessionLocal() as db:
        try:
            await notify_order_confirmed(
                db=db, user_id=user_id, email=email, first_name=first_name,
                order_id=order_id, order_number=order_number, items=items,
                subtotal=subtotal, shipping=shipping, tax=tax,
                total=total, currency=currency, estimated_delivery=estimated_delivery,
            )
            await db.commit()
        except Exception as exc:
            logging.getLogger(__name__).error("Order confirmation email failed: %s", exc)


async def _send_order_status_background(
    user_id, email, first_name, order_id, order_number,
    new_status, tracking_number=None, carrier=None,
):
    from app.core.database import AsyncSessionLocal
    from app.services.notifications import notify_order_status_change
    import logging

    async with AsyncSessionLocal() as db:
        try:
            await notify_order_status_change(
                db=db, user_id=user_id, email=email, first_name=first_name,
                order_id=order_id, order_number=order_number,
                new_status=new_status, tracking_number=tracking_number, carrier=carrier,
            )
            await db.commit()
        except Exception as exc:
            logging.getLogger(__name__).error("Order status email failed: %s", exc)
