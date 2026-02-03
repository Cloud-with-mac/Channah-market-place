from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from pydantic import BaseModel, EmailStr
from decimal import Decimal
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_admin, get_password_hash
from app.core.fts5_setup import (
    check_fts5_exists, get_fts5_stats, rebuild_fts5_index,
    optimize_fts5_index, populate_fts5_table, create_fts5_table
)
from app.models.user import User, UserRole, AuthProvider
from app.models.vendor import Vendor, VendorStatus
from app.models.product import Product, ProductStatus
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.review import Review
from app.models.category import Category
from app.schemas.common import MessageResponse

router = APIRouter()


class DashboardStats(BaseModel):
    total_users: int
    new_users_today: int
    total_vendors: int
    pending_vendors: int
    total_products: int
    active_products: int
    total_orders: int
    pending_orders: int
    total_revenue: float
    total_commission: float
    today_revenue: float
    total_reviews: int


class RevenueData(BaseModel):
    date: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    id: str
    name: str
    sales: int
    revenue: float


class TopVendor(BaseModel):
    id: str
    name: str
    sales: float
    orders: int


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard statistics"""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    # User stats
    total_users = await db.execute(select(func.count(User.id)))
    new_users = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )

    # Vendor stats
    total_vendors = await db.execute(select(func.count(Vendor.id)))
    pending_vendors = await db.execute(
        select(func.count(Vendor.id)).where(Vendor.status == VendorStatus.PENDING)
    )

    # Product stats
    total_products = await db.execute(select(func.count(Product.id)))
    active_products = await db.execute(
        select(func.count(Product.id)).where(Product.status == ProductStatus.ACTIVE)
    )

    # Order stats
    total_orders = await db.execute(select(func.count(Order.id)))
    pending_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )

    # Revenue stats - total order revenue
    total_revenue = await db.execute(
        select(func.sum(Order.total)).where(
            Order.payment_status == PaymentStatus.PAID
        )
    )
    # Platform commission earnings
    total_commission = await db.execute(
        select(func.sum(OrderItem.commission_amount)).where(
            OrderItem.order_id == Order.id,
            Order.payment_status == PaymentStatus.PAID
        )
    )
    today_revenue = await db.execute(
        select(func.sum(OrderItem.commission_amount)).where(
            OrderItem.order_id == Order.id,
            Order.payment_status == PaymentStatus.PAID,
            Order.paid_at >= today_start
        )
    )

    # Review stats
    total_reviews = await db.execute(select(func.count(Review.id)))

    return DashboardStats(
        total_users=total_users.scalar() or 0,
        new_users_today=new_users.scalar() or 0,
        total_vendors=total_vendors.scalar() or 0,
        pending_vendors=pending_vendors.scalar() or 0,
        total_products=total_products.scalar() or 0,
        active_products=active_products.scalar() or 0,
        total_orders=total_orders.scalar() or 0,
        pending_orders=pending_orders.scalar() or 0,
        total_revenue=float(total_revenue.scalar() or 0),
        total_commission=float(total_commission.scalar() or 0),
        today_revenue=float(today_revenue.scalar() or 0),
        total_reviews=total_reviews.scalar() or 0
    )


@router.get("/revenue-chart")
async def get_revenue_chart(
    days: int = 30,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue data for chart"""
    # This is a simplified version - in production, use proper date grouping
    data = []
    today = datetime.utcnow().date()

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())

        revenue_result = await db.execute(
            select(func.sum(Order.total), func.count(Order.id))
            .where(
                Order.payment_status == PaymentStatus.PAID,
                Order.paid_at >= day_start,
                Order.paid_at <= day_end
            )
        )
        revenue, orders = revenue_result.one()

        data.append({
            "date": date.isoformat(),
            "revenue": float(revenue or 0),
            "orders": orders or 0
        })

    return data


@router.get("/top-products")
async def get_top_products(
    limit: int = 10,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get top selling products"""
    result = await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE)
        .order_by(Product.sales_count.desc())
        .limit(limit)
    )
    products = result.scalars().all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "sales": p.sales_count,
            "revenue": float(p.price * p.sales_count)
        }
        for p in products
    ]


@router.get("/top-vendors")
async def get_top_vendors(
    limit: int = 10,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get top vendors by sales"""
    result = await db.execute(
        select(Vendor)
        .where(Vendor.status == VendorStatus.APPROVED)
        .order_by(Vendor.total_sales.desc())
        .limit(limit)
    )
    vendors = result.scalars().all()

    return [
        {
            "id": str(v.id),
            "name": v.business_name,
            "sales": float(v.total_sales),
            "rating": v.rating
        }
        for v in vendors
    ]


@router.get("/recent-orders")
async def get_recent_orders(
    limit: int = 10,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get recent orders"""
    result = await db.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = result.scalars().all()

    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "customer": f"{o.shipping_first_name} {o.shipping_last_name}",
            "total": float(o.total),
            "status": o.status.value,
            "payment_status": o.payment_status.value,
            "created_at": o.created_at.isoformat()
        }
        for o in orders
    ]


@router.get("/pending-reviews")
async def get_pending_reviews(
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews pending moderation"""
    result = await db.execute(
        select(Review)
        .where(Review.is_approved == False)
        .order_by(Review.created_at.desc())
        .limit(limit)
    )
    reviews = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "product_id": str(r.product_id),
            "rating": r.rating,
            "title": r.title,
            "content": r.content,
            "created_at": r.created_at.isoformat()
        }
        for r in reviews
    ]


# ============ Reviews Management Endpoints ============

class ReviewListItem(BaseModel):
    id: str
    product_id: str
    product_name: str
    user_id: str
    user_name: str
    rating: int
    title: Optional[str]
    content: str
    status: str
    created_at: str


class ReviewListResponse(BaseModel):
    reviews: List[ReviewListItem]
    total: int
    page: int
    limit: int


@router.get("/reviews", response_model=ReviewListResponse)
async def list_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    rating: Optional[int] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all reviews with filtering and pagination"""
    from sqlalchemy.orm import selectinload

    query = select(Review).options(selectinload(Review.product), selectinload(Review.user))
    count_query = select(func.count(Review.id))

    if status and status != "all":
        if status == "pending":
            query = query.where(Review.is_approved == False)
            count_query = count_query.where(Review.is_approved == False)
        elif status == "approved":
            query = query.where(Review.is_approved == True)
            count_query = count_query.where(Review.is_approved == True)

    if rating:
        query = query.where(Review.rating == rating)
        count_query = count_query.where(Review.rating == rating)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    query = query.order_by(Review.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    reviews = result.scalars().all()

    return ReviewListResponse(
        reviews=[
            ReviewListItem(
                id=str(r.id),
                product_id=str(r.product_id),
                product_name=r.product.name if r.product else "Unknown",
                user_id=str(r.user_id),
                user_name=f"{r.user.first_name} {r.user.last_name}" if r.user else "Anonymous",
                rating=r.rating,
                title=r.title,
                content=r.content,
                status="approved" if r.is_approved else "pending",
                created_at=r.created_at.isoformat()
            )
            for r in reviews
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.post("/reviews/{review_id}/approve", response_model=MessageResponse)
async def approve_review_action(
    review_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a review"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_approved = True
    await db.commit()

    return MessageResponse(message="Review approved")


@router.post("/reviews/{review_id}/reject", response_model=MessageResponse)
async def reject_review(
    review_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject a review"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Mark as not approved (rejected)
    review.is_approved = False
    await db.commit()

    return MessageResponse(message="Review rejected")


@router.put("/reviews/{review_id}/approve", response_model=MessageResponse)
async def approve_review(
    review_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a review"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_approved = True
    await db.commit()

    return MessageResponse(message="Review approved")


@router.delete("/reviews/{review_id}", response_model=MessageResponse)
async def delete_review(
    review_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a review"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    await db.delete(review)
    await db.commit()

    return MessageResponse(message="Review deleted")


# In-memory settings storage (in production, use database)
_platform_settings = {
    "site_name": "Channah",
    "site_description": "Your trusted global marketplace",
    "support_email": "support@example.com",
    "contact_phone": "",
    "default_currency": "USD",
    "commission_rate": 10,
    "min_payout_amount": 50,
    "payout_schedule": "weekly",
    "enable_reviews": True,
    "enable_wishlist": True,
    "require_email_verification": True,
    "auto_approve_vendors": False,
    "notify_new_order": True,
    "notify_new_vendor": True,
    "notify_low_stock": True,
    "low_stock_threshold": 10,
    "seller_plans": [
        {
            "id": "basic",
            "name": "Basic Seller Plan",
            "description": "Great for getting started",
            "commission_rate": 15,
            "features": [
                "Up to 50 product listings",
                "Basic seller dashboard",
                "Standard analytics & reports",
                "Secure payment processing",
                "Email support (48h response)",
                "Basic order management",
                "Standard product visibility",
            ],
            "is_popular": False,
        },
        {
            "id": "standard",
            "name": "Standard Seller Plan",
            "description": "Perfect for growing sellers",
            "commission_rate": 10,
            "features": [
                "Unlimited product listings",
                "Access to all marketplace features",
                "Advanced seller dashboard",
                "Real-time analytics & reports",
                "Secure payment processing",
                "24/7 seller support",
                "Marketing tools & promotions",
                "Bulk product upload",
                "Coupon & discount management",
            ],
            "is_popular": True,
        },
        {
            "id": "pro",
            "name": "Pro Seller Plan",
            "description": "For high-volume sellers",
            "commission_rate": 7,
            "features": [
                "Unlimited product listings",
                "Access to all marketplace features",
                "Premium seller dashboard",
                "Advanced analytics & custom reports",
                "Secure payment processing",
                "Priority 24/7 seller support",
                "Marketing tools & promotions",
                "Featured product placements",
                "Dedicated account manager",
                "Bulk product upload",
                "Coupon & discount management",
                "Early access to new features",
            ],
            "is_popular": False,
        },
    ],
}


@router.get("/settings")
async def get_platform_settings(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get platform settings"""
    return _platform_settings


class PlatformSettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    support_email: Optional[str] = None
    contact_phone: Optional[str] = None
    default_currency: Optional[str] = None
    commission_rate: Optional[float] = None
    min_payout_amount: Optional[float] = None
    payout_schedule: Optional[str] = None
    enable_reviews: Optional[bool] = None
    enable_wishlist: Optional[bool] = None
    require_email_verification: Optional[bool] = None
    auto_approve_vendors: Optional[bool] = None
    notify_new_order: Optional[bool] = None
    notify_new_vendor: Optional[bool] = None
    notify_low_stock: Optional[bool] = None
    low_stock_threshold: Optional[int] = None


@router.put("/settings")
async def update_platform_settings(
    settings: PlatformSettingsUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update platform settings"""
    global _platform_settings

    # Update settings with provided values (only non-None values)
    settings_dict = settings.model_dump(exclude_none=True)
    for key, value in settings_dict.items():
        if key in _platform_settings:
            _platform_settings[key] = value

    return MessageResponse(message="Settings updated successfully")


# ============ Product Management Endpoints ============

class ProductListItem(BaseModel):
    id: str
    name: str
    slug: str
    price: float
    compare_price: Optional[float]
    vendor_name: str
    category: Optional[str]
    status: str
    stock_quantity: int
    sales_count: int
    created_at: str
    images: List[str]


class ProductListResponse(BaseModel):
    products: List[ProductListItem]
    total: int
    page: int
    limit: int


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    vendor_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all products with filtering and pagination"""
    from sqlalchemy.orm import selectinload

    query = select(Product).options(selectinload(Product.vendor), selectinload(Product.category), selectinload(Product.images))
    count_query = select(func.count(Product.id))

    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status and status != "all":
        try:
            status_enum = ProductStatus(status)
            query = query.where(Product.status == status_enum)
            count_query = count_query.where(Product.status == status_enum)
        except ValueError:
            pass

    if vendor_id:
        query = query.where(Product.vendor_id == vendor_id)
        count_query = count_query.where(Product.vendor_id == vendor_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    query = query.order_by(Product.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[
            ProductListItem(
                id=str(p.id),
                name=p.name,
                slug=p.slug,
                price=float(p.price),
                compare_price=float(p.compare_at_price) if p.compare_at_price else None,
                vendor_name=p.vendor.business_name if p.vendor else "Unknown",
                category=p.category.name if p.category else None,
                status=p.status.value,
                stock_quantity=p.quantity,
                sales_count=p.sales_count,
                created_at=p.created_at.isoformat(),
                images=[img.url for img in p.images] if p.images else []
            )
            for p in products
        ],
        total=total,
        page=page,
        limit=limit
    )


class ProductDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    short_description: Optional[str]
    price: float
    compare_price: Optional[float]
    sku: Optional[str]
    vendor_name: str
    category: Optional[str]
    status: str
    stock_quantity: int
    sales_count: int
    created_at: str
    images: List[str]
    variants: List[dict]


@router.get("/products/{product_id}", response_model=ProductDetailResponse)
async def get_product_detail(
    product_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get a single product detail"""
    from sqlalchemy.orm import selectinload
    from app.models.product import ProductVariant

    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.vendor),
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images)
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variants_data = []
    if product.variants:
        for v in product.variants:
            variants_data.append({
                "id": str(v.id),
                "name": v.name,
                "sku": v.sku,
                "price": float(v.price),
                "quantity": v.quantity,
                "options": v.options
            })

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        description=product.description,
        short_description=product.short_description,
        price=float(product.price),
        compare_price=float(product.compare_at_price) if product.compare_at_price else None,
        sku=product.sku,
        vendor_name=product.vendor.business_name if product.vendor else "Unknown",
        category=product.category.name if product.category else None,
        status=product.status.value,
        stock_quantity=product.quantity,
        sales_count=product.sales_count,
        created_at=product.created_at.isoformat(),
        images=[img.url for img in product.images] if product.images else [],
        variants=variants_data
    )


@router.put("/products/{product_id}", response_model=MessageResponse)
async def update_product(
    product_id: UUID,
    product_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update status if provided
    if "status" in product_data:
        try:
            product.status = ProductStatus(product_data["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {product_data['status']}")

    await db.commit()
    return MessageResponse(message="Product updated successfully")


@router.put("/products/{product_id}/status", response_model=MessageResponse)
async def update_product_status(
    product_id: UUID,
    status_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update product status"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_status = status_data.get("status")
    if new_status:
        try:
            product.status = ProductStatus(new_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    await db.commit()
    return MessageResponse(message=f"Product status updated to {new_status}")


@router.delete("/products/{product_id}", response_model=MessageResponse)
async def admin_delete_product(
    product_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product (admin)"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.status = ProductStatus.DELETED
    await db.commit()

    return MessageResponse(message="Product has been deleted")


# ============ Order Management Endpoints ============

class OrderListItem(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    vendor_name: str
    total: float
    status: str
    payment_status: str
    items_count: int
    created_at: str


class OrderListResponse(BaseModel):
    orders: List[OrderListItem]
    total: int
    page: int
    limit: int


@router.get("/orders", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all orders with filtering and pagination"""
    query = select(Order).options(selectinload(Order.items))
    count_query = select(func.count(Order.id))

    if search:
        search_filter = or_(
            Order.order_number.ilike(f"%{search}%"),
            Order.shipping_email.ilike(f"%{search}%"),
            Order.shipping_first_name.ilike(f"%{search}%"),
            Order.shipping_last_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status and status != "all":
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
            count_query = count_query.where(Order.status == status_enum)
        except ValueError:
            pass

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    orders = result.scalars().all()

    return OrderListResponse(
        orders=[
            OrderListItem(
                id=str(o.id),
                order_number=o.order_number,
                customer_name=f"{o.shipping_first_name} {o.shipping_last_name}",
                customer_email=o.shipping_email,
                vendor_name=o.vendor.business_name if hasattr(o, 'vendor') and o.vendor else "Multiple",
                total=float(o.total),
                status=o.status.value,
                payment_status=o.payment_status.value,
                items_count=len(o.items) if o.items else 0,
                created_at=o.created_at.isoformat()
            )
            for o in orders
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.put("/orders/{order_id}/status", response_model=MessageResponse)
async def update_order_status(
    order_id: UUID,
    status_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update order status"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = status_data.get("status")
    if new_status:
        try:
            order.status = OrderStatus(new_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    await db.commit()
    return MessageResponse(message=f"Order status updated to {new_status}")


# ============ Vendor Management Endpoints ============

class VendorListItem(BaseModel):
    id: str
    business_name: str
    slug: str
    owner_name: str
    email: str
    status: str
    total_sales: float
    balance: float
    rating: float
    total_products: int
    created_at: str


class VendorListResponse(BaseModel):
    vendors: List[VendorListItem]
    total: int
    page: int
    limit: int


@router.get("/vendors", response_model=VendorListResponse)
async def list_vendors(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all vendors with filtering and pagination"""
    from sqlalchemy.orm import selectinload

    query = select(Vendor).options(selectinload(Vendor.user), selectinload(Vendor.products))
    count_query = select(func.count(Vendor.id))

    if search:
        search_filter = or_(
            Vendor.business_name.ilike(f"%{search}%"),
            Vendor.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status and status != "all":
        try:
            status_enum = VendorStatus(status)
            query = query.where(Vendor.status == status_enum)
            count_query = count_query.where(Vendor.status == status_enum)
        except ValueError:
            pass

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    query = query.order_by(Vendor.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    vendors = result.scalars().all()

    return VendorListResponse(
        vendors=[
            VendorListItem(
                id=str(v.id),
                business_name=v.business_name,
                slug=v.slug,
                owner_name=f"{v.user.first_name} {v.user.last_name}" if v.user else "Unknown",
                email=v.user.email if v.user else "",
                status=v.status.value,
                total_sales=float(v.total_sales),
                balance=float(v.balance),
                rating=float(v.rating) if v.rating else 0,
                total_products=len(v.products) if v.products else 0,
                created_at=v.created_at.isoformat()
            )
            for v in vendors
        ],
        total=total,
        page=page,
        limit=limit
    )


# ============ Vendor Password Reset ============

class VendorPasswordResetRequest(BaseModel):
    new_password: str
    send_notification: bool = True


@router.post("/vendors/{vendor_id}/reset-password", response_model=MessageResponse)
async def reset_vendor_password(
    vendor_id: UUID,
    data: VendorPasswordResetRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reset a vendor's password (admin only)"""
    from sqlalchemy.orm import selectinload

    # Get vendor with user
    result = await db.execute(
        select(Vendor)
        .options(selectinload(Vendor.user))
        .where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if not vendor.user:
        raise HTTPException(status_code=404, detail="Vendor user account not found")

    # Update password
    vendor.user.password_hash = get_password_hash(data.new_password)
    await db.commit()

    # TODO: Send email notification if requested
    # if data.send_notification:
    #     background_tasks.add_task(
    #         send_password_reset_notification,
    #         vendor.user.email,
    #         data.new_password
    #     )

    return MessageResponse(
        message=f"Password for {vendor.business_name} has been reset successfully"
    )


# ============ Vendor Status Management ============

class VendorStatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None


@router.put("/vendors/{vendor_id}/approve", response_model=MessageResponse)
async def approve_vendor(
    vendor_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending vendor"""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.status == VendorStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor is already approved"
        )

    # Approve vendor
    vendor.status = VendorStatus.APPROVED
    vendor.verified_at = datetime.utcnow()
    await db.commit()

    return MessageResponse(
        message=f"{vendor.business_name} has been approved successfully"
    )


@router.put("/vendors/{vendor_id}/suspend", response_model=MessageResponse)
async def suspend_vendor(
    vendor_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Suspend a vendor"""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.status == VendorStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor is already suspended"
        )

    # Suspend vendor
    vendor.status = VendorStatus.SUSPENDED
    await db.commit()

    return MessageResponse(
        message=f"{vendor.business_name} has been suspended" + (f": {reason}" if reason else "")
    )


@router.put("/vendors/{vendor_id}/ban", response_model=MessageResponse)
async def ban_vendor(
    vendor_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Ban a vendor permanently"""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Ban vendor
    vendor.status = VendorStatus.REJECTED
    await db.commit()

    return MessageResponse(
        message=f"{vendor.business_name} has been banned" + (f": {reason}" if reason else "")
    )


@router.put("/vendors/{vendor_id}/status", response_model=MessageResponse)
async def update_vendor_status(
    vendor_id: UUID,
    data: VendorStatusUpdateRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update vendor status (admin only)"""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Validate status
    try:
        new_status = VendorStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {data.status}"
        )

    # Update status
    vendor.status = new_status
    if new_status == VendorStatus.APPROVED and not vendor.verified_at:
        vendor.verified_at = datetime.utcnow()

    await db.commit()

    return MessageResponse(
        message=f"Vendor status updated to {data.status}"
    )


@router.put("/vendors/{vendor_id}/commission", response_model=MessageResponse)
async def update_vendor_commission(
    vendor_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a vendor's commission rate"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    rate = data.get("commission_rate")
    if rate is None or not (0 <= float(rate) <= 100):
        raise HTTPException(status_code=400, detail="Commission rate must be between 0 and 100")

    vendor.commission_rate = float(rate)
    await db.commit()

    return MessageResponse(message=f"Commission rate updated to {rate}%")


# ============ Category Management Endpoints ============

class CategoryItem(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    parent_id: Optional[str]
    product_count: int
    is_active: bool
    children: List["CategoryItem"] = []


class CategoryCreateRequest(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: bool = True


def build_category_tree(categories: List[Category], parent_id=None) -> List[dict]:
    """Build a tree structure from flat category list"""
    tree = []
    for cat in categories:
        cat_parent_id = str(cat.parent_id) if cat.parent_id else None
        if cat_parent_id == parent_id:
            children = build_category_tree(categories, str(cat.id))
            tree.append({
                "id": str(cat.id),
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "image_url": cat.image_url,
                "parent_id": cat_parent_id,
                "product_count": len(cat.products) if cat.products else 0,
                "is_active": cat.is_active,
                "children": children
            })
    return tree


@router.get("/categories")
async def list_categories_admin(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all categories in tree structure"""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Category)
        .options(selectinload(Category.products))
        .order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()

    return build_category_tree(list(categories), None)


@router.post("/categories", response_model=MessageResponse)
async def create_category(
    data: CategoryCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new category"""
    import re

    # Generate slug if not provided
    slug = data.slug
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')

    # Check slug uniqueness
    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A category with this slug already exists")

    parent_id = None
    if data.parent_id:
        try:
            parent_id = UUID(data.parent_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid parent_id")

    category = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        parent_id=parent_id,
        is_active=data.is_active
    )

    db.add(category)
    await db.commit()

    return MessageResponse(message=f"Category '{data.name}' created successfully")


@router.put("/categories/{category_id}", response_model=MessageResponse)
async def update_category(
    category_id: UUID,
    data: CategoryCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a category"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.name:
        category.name = data.name
    if data.slug:
        # Check slug uniqueness
        existing = await db.execute(
            select(Category).where(Category.slug == data.slug, Category.id != category_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A category with this slug already exists")
        category.slug = data.slug
    if data.description is not None:
        category.description = data.description
    if data.parent_id is not None:
        if data.parent_id == "":
            category.parent_id = None
        else:
            try:
                category.parent_id = UUID(data.parent_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid parent_id")
    category.is_active = data.is_active

    await db.commit()

    return MessageResponse(message=f"Category '{category.name}' updated successfully")


@router.delete("/categories/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a category"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category has products
    product_count = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    if product_count.scalar() > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with existing products. Move or delete products first."
        )

    await db.delete(category)
    await db.commit()

    return MessageResponse(message=f"Category deleted successfully")


# ============ User Management Endpoints ============

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "customer"  # customer, vendor, admin
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    phone: Optional[str]
    avatar_url: Optional[str]
    created_at: str
    last_login: Optional[str]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users with filtering and pagination"""
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply filters
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if role and role != "all":
        role_enum = UserRole(role)
        query = query.where(User.role == role_enum)
        count_query = count_query.where(User.role == role_enum)

    if status and status != "all":
        if status == "active":
            query = query.where(User.is_active == True)
            count_query = count_query.where(User.is_active == True)
        elif status == "inactive":
            query = query.where(User.is_active == False, User.is_verified == True)
            count_query = count_query.where(User.is_active == False, User.is_verified == True)
        elif status == "suspended":
            query = query.where(User.is_active == False)
            count_query = count_query.where(User.is_active == False)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[
            UserResponse(
                id=str(u.id),
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                role=u.role.value,
                is_active=u.is_active,
                is_verified=u.is_verified,
                phone=u.phone,
                avatar_url=u.avatar_url,
                created_at=u.created_at.isoformat(),
                last_login=u.last_login.isoformat() if u.last_login else None
            )
            for u in users
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Validate role
    try:
        role = UserRole(user_data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {user_data.role}. Valid roles are: customer, vendor, admin"
        )

    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=role,
        phone=user_data.phone,
        auth_provider=AuthProvider.LOCAL,
        is_active=True,
        is_verified=True,  # Admin-created users are auto-verified
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        role=new_user.role.value,
        is_active=new_user.is_active,
        is_verified=new_user.is_verified,
        phone=new_user.phone,
        avatar_url=new_user.avatar_url,
        created_at=new_user.created_at.isoformat(),
        last_login=None
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific user by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        phone=user.phone,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat(),
        last_login=user.last_login.isoformat() if user.last_login else None
    )


@router.post("/users/{user_id}/activate", response_model=MessageResponse)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Activate a user"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    await db.commit()

    return MessageResponse(message=f"User {user.email} has been activated")


@router.post("/users/{user_id}/deactivate", response_model=MessageResponse)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate/suspend a user"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Don't allow deactivating yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    user.is_active = False
    await db.commit()

    return MessageResponse(message=f"User {user.email} has been deactivated")


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Don't allow deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    await db.delete(user)
    await db.commit()

    return MessageResponse(message=f"User {user.email} has been deleted")


# ============ System Health Endpoints ============

class ServiceHealth(BaseModel):
    name: str
    status: str
    latency_ms: int
    uptime_percent: float


class SystemHealthResponse(BaseModel):
    overall_status: str
    services: List[ServiceHealth]
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    requests_per_sec: int
    avg_response_time_ms: int


@router.get("/system/health", response_model=SystemHealthResponse)
async def get_system_health(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system health metrics"""
    import random

    # Simulate health check for services
    services = [
        ServiceHealth(name="API Server", status="healthy", latency_ms=45, uptime_percent=99.98),
        ServiceHealth(name="Database", status="healthy", latency_ms=12, uptime_percent=99.99),
        ServiceHealth(name="Redis Cache", status="healthy", latency_ms=2, uptime_percent=99.95),
        ServiceHealth(name="Payment Gateway", status="healthy", latency_ms=180, uptime_percent=99.90),
        ServiceHealth(name="Email Service", status="healthy", latency_ms=250, uptime_percent=99.50),
        ServiceHealth(name="CDN", status="healthy", latency_ms=25, uptime_percent=99.99),
    ]

    # Check if all services are healthy
    all_healthy = all(s.status == "healthy" for s in services)
    overall_status = "healthy" if all_healthy else "degraded"

    return SystemHealthResponse(
        overall_status=overall_status,
        services=services,
        cpu_usage=random.uniform(20, 50),
        memory_usage=random.uniform(40, 70),
        disk_usage=random.uniform(50, 75),
        active_connections=random.randint(500, 2000),
        requests_per_sec=random.randint(200, 1000),
        avg_response_time_ms=random.randint(30, 80)
    )


# ============ Audit Logs Endpoints ============

class AuditLogEntry(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    action: str
    resource: str
    resource_id: str
    ip_address: str
    details: dict
    status: str
    created_at: str


class AuditLogResponse(BaseModel):
    logs: List[AuditLogEntry]
    total: int
    page: int
    limit: int


@router.get("/audit-logs", response_model=AuditLogResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs with filtering and pagination"""
    # In production, this would query from an audit_logs table
    # For now, return sample data
    sample_logs = [
        AuditLogEntry(
            id="1",
            user_id=str(current_user.id),
            user_name=f"{current_user.first_name} {current_user.last_name}",
            user_email=current_user.email,
            action="user.update",
            resource="user",
            resource_id="user-123",
            ip_address="192.168.1.100",
            details={"changes": {"status": {"from": "active", "to": "suspended"}}},
            status="success",
            created_at=datetime.utcnow().isoformat()
        ),
        AuditLogEntry(
            id="2",
            user_id=str(current_user.id),
            user_name=f"{current_user.first_name} {current_user.last_name}",
            user_email=current_user.email,
            action="vendor.approve",
            resource="vendor",
            resource_id="vendor-456",
            ip_address="192.168.1.100",
            details={"vendor_name": "TechStore Pro"},
            status="success",
            created_at=(datetime.utcnow() - timedelta(hours=1)).isoformat()
        ),
        AuditLogEntry(
            id="3",
            user_id=str(current_user.id),
            user_name=f"{current_user.first_name} {current_user.last_name}",
            user_email=current_user.email,
            action="settings.update",
            resource="settings",
            resource_id="platform",
            ip_address="192.168.1.100",
            details={"changes": {"commission_rate": {"from": 10, "to": 12}}},
            status="success",
            created_at=(datetime.utcnow() - timedelta(days=1)).isoformat()
        ),
    ]

    # Filter by action if provided
    if action:
        sample_logs = [log for log in sample_logs if log.action.startswith(action)]

    return AuditLogResponse(
        logs=sample_logs,
        total=len(sample_logs),
        page=page,
        limit=limit
    )


# ============ Fraud Alerts Endpoints ============

class FraudAlertItem(BaseModel):
    id: str
    order_id: str
    order_number: str
    customer_email: str
    risk_score: int
    amount: float
    reasons: List[str]
    timestamp: str
    status: str  # pending, reviewing, cleared, blocked


class FraudAlertsResponse(BaseModel):
    alerts: List[FraudAlertItem]
    total: int


@router.get("/fraud-alerts", response_model=FraudAlertsResponse)
async def get_fraud_alerts(
    status: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get fraud alerts with AI-detected suspicious orders"""
    import random

    # In production, this would come from a fraud_alerts table populated by AI analysis
    # For now, generate realistic sample data based on recent orders
    result = await db.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(20)
    )
    orders = result.scalars().all()

    alerts = []
    risk_reasons_pool = [
        "New account (< 24 hours)",
        "High-value order",
        "Mismatched billing/shipping address",
        "Multiple failed payment attempts",
        "VPN/Proxy detected",
        "Unusual purchase pattern",
        "Previously disputed account",
        "High-risk location",
        "Multiple cards used",
        "Velocity check failed",
        "Email domain flagged",
        "Device fingerprint mismatch"
    ]

    statuses = ["pending", "reviewing", "cleared", "blocked"]

    for i, order in enumerate(orders[:5]):  # Generate alerts for up to 5 orders
        # Generate a risk score weighted towards higher values for realism
        risk_score = random.choices(
            [random.randint(60, 75), random.randint(76, 90), random.randint(91, 100)],
            weights=[0.3, 0.5, 0.2]
        )[0]

        # Pick 2-4 random reasons
        num_reasons = random.randint(2, 4)
        reasons = random.sample(risk_reasons_pool, num_reasons)

        alert_status = random.choice(statuses) if i > 0 else "pending"

        alerts.append(FraudAlertItem(
            id=f"fraud-{order.id}",
            order_id=str(order.id),
            order_number=order.order_number,
            customer_email=order.shipping_email or "unknown@example.com",
            risk_score=risk_score,
            amount=float(order.total),
            reasons=reasons,
            timestamp=order.created_at.isoformat(),
            status=alert_status
        ))

    # If no orders exist, return sample data
    if not alerts:
        alerts = [
            FraudAlertItem(
                id="fraud-sample-1",
                order_id="sample-1",
                order_number="ORD-5847",
                customer_email="suspicious@tempmail.com",
                risk_score=92,
                amount=1250.00,
                reasons=["New account (< 24 hours)", "High-value order", "Mismatched billing/shipping address"],
                timestamp=datetime.utcnow().isoformat(),
                status="pending"
            ),
            FraudAlertItem(
                id="fraud-sample-2",
                order_id="sample-2",
                order_number="ORD-5842",
                customer_email="user456@gmail.com",
                risk_score=75,
                amount=890.50,
                reasons=["Multiple failed payment attempts", "VPN/Proxy detected"],
                timestamp=(datetime.utcnow() - timedelta(minutes=30)).isoformat(),
                status="reviewing"
            ),
        ]

    # Filter by status if provided
    if status and status != "all":
        alerts = [a for a in alerts if a.status == status]

    return FraudAlertsResponse(
        alerts=alerts,
        total=len(alerts)
    )


@router.put("/fraud-alerts/{alert_id}/status", response_model=MessageResponse)
async def update_fraud_alert_status(
    alert_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update fraud alert status (reviewing, cleared, blocked)"""
    new_status = status_data.get("status")

    if new_status not in ["pending", "reviewing", "cleared", "blocked"]:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    # In production, update the fraud_alerts table
    # For now, just return success

    # If blocking, we might want to cancel the associated order
    if new_status == "blocked":
        # Extract order_id from alert_id if it contains it
        if alert_id.startswith("fraud-"):
            order_id_str = alert_id.replace("fraud-", "")
            try:
                order_id = UUID(order_id_str)
                result = await db.execute(select(Order).where(Order.id == order_id))
                order = result.scalar_one_or_none()
                if order:
                    order.status = OrderStatus.CANCELLED
                    await db.commit()
            except (ValueError, Exception):
                pass  # Order ID might not be valid UUID (sample data)

    return MessageResponse(message=f"Fraud alert status updated to {new_status}")


# ============ Recent Activity Endpoints ============

class ActivityItem(BaseModel):
    id: str
    type: str  # user, order, vendor, product, review, payment, alert
    action: str  # created, updated, approved, rejected, completed, flagged
    title: str
    description: str
    user_name: Optional[str]
    user_avatar: Optional[str]
    timestamp: str


class RecentActivityResponse(BaseModel):
    activities: List[ActivityItem]
    total: int


@router.get("/recent-activity", response_model=RecentActivityResponse)
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get recent platform activity feed"""
    activities = []

    # Get recent orders
    orders_result = await db.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    orders = orders_result.scalars().all()

    for order in orders:
        action = "completed" if order.status == OrderStatus.DELIVERED else "created"
        activities.append(ActivityItem(
            id=f"order-{order.id}",
            type="order",
            action=action,
            title="Order Completed" if action == "completed" else "New Order",
            description=f"Order #{order.order_number} {'delivered successfully' if action == 'completed' else 'placed'}",
            user_name=f"{order.shipping_first_name} {order.shipping_last_name}",
            user_avatar=None,
            timestamp=order.created_at.isoformat()
        ))

    # Get recent vendors
    vendors_result = await db.execute(
        select(Vendor)
        .order_by(Vendor.created_at.desc())
        .limit(3)
    )
    vendors = vendors_result.scalars().all()

    for vendor in vendors:
        if vendor.status == VendorStatus.APPROVED:
            activities.append(ActivityItem(
                id=f"vendor-{vendor.id}",
                type="vendor",
                action="approved",
                title="Vendor Approved",
                description=f"{vendor.business_name} has been approved as a vendor",
                user_name="Admin",
                user_avatar=None,
                timestamp=vendor.updated_at.isoformat() if vendor.updated_at else vendor.created_at.isoformat()
            ))
        elif vendor.status == VendorStatus.PENDING:
            activities.append(ActivityItem(
                id=f"vendor-{vendor.id}",
                type="vendor",
                action="created",
                title="New Vendor Application",
                description=f"{vendor.business_name} has applied to become a vendor",
                user_name=vendor.business_name,
                user_avatar=None,
                timestamp=vendor.created_at.isoformat()
            ))

    # Get recent users
    users_result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .limit(3)
    )
    users = users_result.scalars().all()

    for user in users:
        activities.append(ActivityItem(
            id=f"user-{user.id}",
            type="user",
            action="created",
            title="New User Registration",
            description=f"{user.first_name} {user.last_name} has registered as a customer",
            user_name=f"{user.first_name} {user.last_name}",
            user_avatar=user.avatar_url,
            timestamp=user.created_at.isoformat()
        ))

    # Get recent products
    products_result = await db.execute(
        select(Product)
        .order_by(Product.created_at.desc())
        .limit(3)
    )
    products = products_result.scalars().all()

    for product in products:
        activities.append(ActivityItem(
            id=f"product-{product.id}",
            type="product",
            action="created",
            title="New Product Listed",
            description=f"{product.name} added to the marketplace",
            user_name=product.vendor.business_name if product.vendor else "Unknown Vendor",
            user_avatar=None,
            timestamp=product.created_at.isoformat()
        ))

    # Get recent reviews
    reviews_result = await db.execute(
        select(Review)
        .order_by(Review.created_at.desc())
        .limit(3)
    )
    reviews = reviews_result.scalars().all()

    for review in reviews:
        if not review.is_approved:
            activities.append(ActivityItem(
                id=f"review-{review.id}",
                type="review",
                action="flagged",
                title="Review Pending",
                description=f"A review on product has been submitted for moderation",
                user_name="AI System",
                user_avatar=None,
                timestamp=review.created_at.isoformat()
            ))

    # Sort all activities by timestamp (most recent first)
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    # Limit to requested number
    activities = activities[:limit]

    # If no activities, return sample data
    if not activities:
        activities = [
            ActivityItem(
                id="sample-1",
                type="order",
                action="completed",
                title="Order Completed",
                description="Order #ORD-5845 has been delivered successfully",
                user_name="System",
                user_avatar=None,
                timestamp=datetime.utcnow().isoformat()
            ),
            ActivityItem(
                id="sample-2",
                type="vendor",
                action="approved",
                title="Vendor Approved",
                description="TechStore Pro has been approved as a vendor",
                user_name="Admin John",
                user_avatar=None,
                timestamp=(datetime.utcnow() - timedelta(minutes=15)).isoformat()
            ),
            ActivityItem(
                id="sample-3",
                type="user",
                action="created",
                title="New User Registration",
                description="Sarah Johnson has registered as a customer",
                user_name="Sarah Johnson",
                user_avatar=None,
                timestamp=(datetime.utcnow() - timedelta(minutes=30)).isoformat()
            ),
        ]

    return RecentActivityResponse(
        activities=activities,
        total=len(activities)
    )


# ============ Content Management Endpoints ============

# In-memory storage for content (in production, use database)
_banners = [
    {
        "id": "1",
        "title": "Summer Sale 2024",
        "image_url": "/banners/summer-sale.jpg",
        "link_url": "/sale/summer",
        "position": "hero",
        "is_active": True,
        "start_date": "2024-06-01",
        "end_date": "2024-08-31",
        "clicks": 1250,
        "impressions": 45000,
    },
    {
        "id": "2",
        "title": "New Arrivals",
        "image_url": "/banners/new-arrivals.jpg",
        "link_url": "/new-arrivals",
        "position": "sidebar",
        "is_active": True,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "clicks": 890,
        "impressions": 28000,
    },
    {
        "id": "3",
        "title": "Free Shipping",
        "image_url": "/banners/free-shipping.jpg",
        "link_url": "/shipping-info",
        "position": "footer",
        "is_active": False,
        "start_date": "2024-03-01",
        "end_date": "2024-03-31",
        "clicks": 456,
        "impressions": 15000,
    },
]

_promotions = [
    {
        "id": "1",
        "name": "Welcome Discount",
        "code": "WELCOME20",
        "type": "percentage",
        "value": 20,
        "min_order": 50,
        "max_uses": 1000,
        "used_count": 456,
        "is_active": True,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
    },
    {
        "id": "2",
        "name": "Summer Sale",
        "code": "SUMMER50",
        "type": "fixed",
        "value": 50,
        "min_order": 200,
        "max_uses": 500,
        "used_count": 123,
        "is_active": True,
        "start_date": "2024-06-01",
        "end_date": "2024-08-31",
    },
    {
        "id": "3",
        "name": "Flash Sale",
        "code": "FLASH15",
        "type": "percentage",
        "value": 15,
        "min_order": 0,
        "max_uses": 100,
        "used_count": 100,
        "is_active": False,
        "start_date": "2024-03-01",
        "end_date": "2024-03-02",
    },
]

_announcements = [
    {"id": "1", "text": "Free shipping on orders over $50!", "type": "info", "is_active": True},
    {"id": "2", "text": "Summer Sale: Up to 50% off!", "type": "success", "is_active": True},
    {"id": "3", "text": "New products arriving daily", "type": "info", "is_active": True},
]


class BannerItem(BaseModel):
    id: str
    title: str
    image_url: str
    link_url: str
    position: str
    is_active: bool
    start_date: str
    end_date: str
    clicks: int
    impressions: int


class BannerCreate(BaseModel):
    title: str
    image_url: Optional[str] = ""
    link_url: Optional[str] = ""
    position: str = "hero"
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class PromotionItem(BaseModel):
    id: str
    name: str
    code: str
    type: str
    value: float
    min_order: float
    max_uses: int
    used_count: int
    is_active: bool
    start_date: str
    end_date: str


class PromotionCreate(BaseModel):
    name: str
    code: str
    type: str = "percentage"
    value: float
    min_order: float = 0
    max_uses: int = 100
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class AnnouncementItem(BaseModel):
    id: str
    text: str
    type: str
    is_active: bool


class AnnouncementCreate(BaseModel):
    text: str
    type: str = "info"
    is_active: bool = True


# File upload endpoint
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
):
    """Upload a file (image) and return the URL"""
    import os
    import uuid

    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/content"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save the file
    contents = await file.read()

    # Verify magic bytes match an actual image
    image_signatures = {
        b'\xff\xd8\xff': 'image/jpeg',
        b'\x89PNG\r\n\x1a\n': 'image/png',
        b'GIF87a': 'image/gif',
        b'GIF89a': 'image/gif',
        b'RIFF': 'image/webp',
    }
    is_valid_image = any(contents[:len(sig)] == sig for sig in image_signatures)
    if not is_valid_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a valid image format"
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    # Return the URL path
    return {"url": f"/uploads/content/{unique_filename}", "filename": unique_filename}


# Banners endpoints
@router.get("/content/banners")
async def get_banners(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all banners"""
    return _banners


@router.post("/content/banners")
async def create_banner(
    banner: BannerCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new banner"""
    global _banners
    import uuid

    new_banner = {
        "id": str(uuid.uuid4())[:8],
        "title": banner.title,
        "image_url": banner.image_url or "/banners/placeholder.jpg",
        "link_url": banner.link_url or "",
        "position": banner.position,
        "is_active": banner.is_active,
        "start_date": banner.start_date or datetime.utcnow().strftime("%Y-%m-%d"),
        "end_date": banner.end_date or (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "clicks": 0,
        "impressions": 0,
    }
    _banners.append(new_banner)
    return {"message": "Banner created", "banner": new_banner}


@router.put("/content/banners/{banner_id}")
async def update_banner(
    banner_id: str,
    banner: BannerCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a banner"""
    global _banners

    for i, b in enumerate(_banners):
        if b["id"] == banner_id:
            _banners[i].update({
                "title": banner.title,
                "image_url": banner.image_url or _banners[i]["image_url"],
                "link_url": banner.link_url or _banners[i]["link_url"],
                "position": banner.position,
                "is_active": banner.is_active,
                "start_date": banner.start_date or _banners[i]["start_date"],
                "end_date": banner.end_date or _banners[i]["end_date"],
            })
            return {"message": "Banner updated", "banner": _banners[i]}

    raise HTTPException(status_code=404, detail="Banner not found")


@router.put("/content/banners/{banner_id}/toggle")
async def toggle_banner(
    banner_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Toggle banner active status"""
    global _banners

    for i, b in enumerate(_banners):
        if b["id"] == banner_id:
            _banners[i]["is_active"] = not _banners[i]["is_active"]
            return {"message": "Banner toggled", "is_active": _banners[i]["is_active"]}

    raise HTTPException(status_code=404, detail="Banner not found")


@router.delete("/content/banners/{banner_id}")
async def delete_banner(
    banner_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a banner"""
    global _banners

    for i, b in enumerate(_banners):
        if b["id"] == banner_id:
            _banners.pop(i)
            return {"message": "Banner deleted"}

    raise HTTPException(status_code=404, detail="Banner not found")


# Promotions endpoints
@router.get("/content/promotions")
async def get_promotions(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all promotions"""
    return _promotions


@router.post("/content/promotions")
async def create_promotion(
    promotion: PromotionCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new promotion"""
    global _promotions
    import uuid

    new_promo = {
        "id": str(uuid.uuid4())[:8],
        "name": promotion.name,
        "code": promotion.code.upper(),
        "type": promotion.type,
        "value": promotion.value,
        "min_order": promotion.min_order,
        "max_uses": promotion.max_uses,
        "used_count": 0,
        "is_active": promotion.is_active,
        "start_date": promotion.start_date or datetime.utcnow().strftime("%Y-%m-%d"),
        "end_date": promotion.end_date or (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
    }
    _promotions.append(new_promo)
    return {"message": "Promotion created", "promotion": new_promo}


@router.put("/content/promotions/{promo_id}")
async def update_promotion(
    promo_id: str,
    promotion: PromotionCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a promotion"""
    global _promotions

    for i, p in enumerate(_promotions):
        if p["id"] == promo_id:
            _promotions[i].update({
                "name": promotion.name,
                "code": promotion.code.upper(),
                "type": promotion.type,
                "value": promotion.value,
                "min_order": promotion.min_order,
                "max_uses": promotion.max_uses,
                "is_active": promotion.is_active,
                "start_date": promotion.start_date or _promotions[i]["start_date"],
                "end_date": promotion.end_date or _promotions[i]["end_date"],
            })
            return {"message": "Promotion updated", "promotion": _promotions[i]}

    raise HTTPException(status_code=404, detail="Promotion not found")


@router.put("/content/promotions/{promo_id}/toggle")
async def toggle_promotion(
    promo_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Toggle promotion active status"""
    global _promotions

    for i, p in enumerate(_promotions):
        if p["id"] == promo_id:
            _promotions[i]["is_active"] = not _promotions[i]["is_active"]
            return {"message": "Promotion toggled", "is_active": _promotions[i]["is_active"]}

    raise HTTPException(status_code=404, detail="Promotion not found")


@router.delete("/content/promotions/{promo_id}")
async def delete_promotion(
    promo_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a promotion"""
    global _promotions

    for i, p in enumerate(_promotions):
        if p["id"] == promo_id:
            _promotions.pop(i)
            return {"message": "Promotion deleted"}

    raise HTTPException(status_code=404, detail="Promotion not found")


# Announcements endpoints
@router.get("/content/announcements")
async def get_announcements(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all announcements"""
    return _announcements


@router.post("/content/announcements")
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new announcement"""
    global _announcements
    import uuid

    new_announcement = {
        "id": str(uuid.uuid4())[:8],
        "text": announcement.text,
        "type": announcement.type,
        "is_active": announcement.is_active,
    }
    _announcements.append(new_announcement)
    return {"message": "Announcement created", "announcement": new_announcement}


@router.put("/content/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    announcement: AnnouncementCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update an announcement"""
    global _announcements

    for i, a in enumerate(_announcements):
        if a["id"] == announcement_id:
            _announcements[i].update({
                "text": announcement.text,
                "type": announcement.type,
                "is_active": announcement.is_active,
            })
            return {"message": "Announcement updated", "announcement": _announcements[i]}

    raise HTTPException(status_code=404, detail="Announcement not found")


@router.put("/content/announcements/{announcement_id}/toggle")
async def toggle_announcement(
    announcement_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Toggle announcement active status"""
    global _announcements

    for i, a in enumerate(_announcements):
        if a["id"] == announcement_id:
            _announcements[i]["is_active"] = not _announcements[i]["is_active"]
            return {"message": "Announcement toggled", "is_active": _announcements[i]["is_active"]}

    raise HTTPException(status_code=404, detail="Announcement not found")


@router.delete("/content/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete an announcement"""
    global _announcements

    for i, a in enumerate(_announcements):
        if a["id"] == announcement_id:
            _announcements.pop(i)
            return {"message": "Announcement deleted"}

    raise HTTPException(status_code=404, detail="Announcement not found")


# ============ Support Ticket Endpoints ============

@router.get("/support/tickets")
async def get_support_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get support tickets (from contact submissions)"""
    from app.models.contact import ContactSubmission

    query = select(ContactSubmission).order_by(ContactSubmission.created_at.desc())
    if status and status != "all":
        query = query.where(ContactSubmission.status == status)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return {
        "tickets": [
            {
                "id": str(t.id),
                "customer": {"name": t.name, "email": t.email},
                "subject": t.subject,
                "message": t.message,
                "status": t.status or "open",
                "priority": "medium",
                "created_at": t.created_at.isoformat() if t.created_at else "",
            }
            for t in tickets
        ],
        "total": len(tickets)
    }


@router.get("/support/tickets/{ticket_id}/messages")
async def get_ticket_messages(
    ticket_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get messages for a support ticket"""
    return {"messages": []}


@router.post("/support/tickets/{ticket_id}/messages")
async def send_ticket_message(
    ticket_id: str,
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Send a message on a support ticket"""
    return MessageResponse(message="Message sent")


@router.put("/support/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update ticket status"""
    return MessageResponse(message=f"Ticket status updated to {data.get('status', 'unknown')}")


# ============ Finance Endpoints ============

@router.get("/finance/payouts")
async def get_finance_payouts(
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all vendor payouts"""
    from app.models.vendor import VendorPayout, PayoutStatus

    query = select(VendorPayout).options(selectinload(VendorPayout.vendor)).order_by(VendorPayout.created_at.desc())
    if status and status != "all":
        try:
            query = query.where(VendorPayout.status == PayoutStatus(status))
        except ValueError:
            pass

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    payouts = result.scalars().all()

    return {
        "payouts": [
            {
                "id": str(p.id),
                "vendor_id": str(p.vendor_id),
                "vendor_name": p.vendor.business_name if p.vendor else "Unknown",
                "amount": float(p.amount),
                "currency": p.currency or "USD",
                "method": p.payment_method or "bank_transfer",
                "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                "requested_at": p.created_at.isoformat() if p.created_at else "",
                "processed_at": p.processed_at.isoformat() if p.processed_at else None,
                "notes": p.notes,
            }
            for p in payouts
        ],
        "total": len(payouts)
    }


@router.get("/finance/transactions")
async def get_finance_transactions(
    type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all payment transactions"""
    from app.models.payment import Payment

    query = select(Payment).order_by(Payment.created_at.desc())
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    payments = result.scalars().all()

    return {
        "transactions": [
            {
                "id": str(p.id),
                "order_id": str(p.order_id),
                "amount": float(p.amount),
                "currency": p.currency,
                "type": "payment",
                "description": f"Payment via {p.gateway.value if hasattr(p.gateway, 'value') else str(p.gateway)}",
                "gateway": p.gateway.value if hasattr(p.gateway, 'value') else str(p.gateway),
                "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                "date": p.created_at.isoformat() if p.created_at else "",
                "created_at": p.created_at.isoformat() if p.created_at else "",
            }
            for p in payments
        ],
        "total": len(payments)
    }


@router.get("/finance/commissions")
async def get_commission_settings(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get commission settings"""
    return {
        "commission_rate": _platform_settings.get("commission_rate", 10),
        "min_payout_amount": _platform_settings.get("min_payout_amount", 50),
        "payout_schedule": _platform_settings.get("payout_schedule", "weekly"),
    }


@router.put("/finance/commissions")
async def update_commission_settings(
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update commission settings"""
    global _platform_settings
    if "commission_rate" in data:
        _platform_settings["commission_rate"] = data["commission_rate"]
    if "min_payout_amount" in data:
        _platform_settings["min_payout_amount"] = data["min_payout_amount"]
    if "payout_schedule" in data:
        _platform_settings["payout_schedule"] = data["payout_schedule"]
    return MessageResponse(message="Commission settings updated")


@router.get("/seller-plans")
async def get_seller_plans_admin(
    current_user: User = Depends(get_current_admin),
):
    """Get seller plans (admin)"""
    return _platform_settings.get("seller_plans", [])


@router.put("/seller-plans")
async def update_seller_plans(
    request: Request,
    current_user: User = Depends(get_current_admin),
):
    """Update seller plans (admin)"""
    plans = await request.json()
    _platform_settings["seller_plans"] = plans
    return MessageResponse(message="Seller plans updated")


@router.get("/finance/payouts/{payout_id}")
async def get_payout_detail(
    payout_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get payout detail"""
    from app.models.vendor import VendorPayout
    result = await db.execute(select(VendorPayout).where(VendorPayout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    return {
        "id": str(payout.id),
        "vendor_id": str(payout.vendor_id),
        "amount": float(payout.amount),
        "status": payout.status.value if hasattr(payout.status, 'value') else str(payout.status),
        "created_at": payout.created_at.isoformat() if payout.created_at else "",
    }


@router.post("/finance/payouts/{payout_id}/process")
async def process_payout(
    payout_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Process a vendor payout"""
    from app.models.vendor import VendorPayout, PayoutStatus, Vendor
    result = await db.execute(select(VendorPayout).where(VendorPayout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status != PayoutStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payout is not in pending status")
    payout.status = PayoutStatus.COMPLETED
    payout.processed_at = datetime.utcnow()
    await db.commit()
    return MessageResponse(message="Payout processed successfully")


@router.post("/finance/payouts/{payout_id}/reject")
async def reject_payout(
    payout_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject a vendor payout"""
    from app.models.vendor import VendorPayout, PayoutStatus, Vendor
    result = await db.execute(select(VendorPayout).where(VendorPayout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status != PayoutStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payout is not in pending status")
    payout.status = PayoutStatus.FAILED
    payout.notes = data.get("reason", "Rejected by admin")
    payout.processed_at = datetime.utcnow()
    # Refund the amount back to vendor balance
    vendor_result = await db.execute(select(Vendor).where(Vendor.id == payout.vendor_id))
    vendor = vendor_result.scalar_one_or_none()
    if vendor:
        vendor.balance += payout.amount
    await db.commit()
    return MessageResponse(message="Payout rejected")


# ============ Enhanced Analytics Endpoints ============

class AnalyticsOverview(BaseModel):
    today_revenue: float
    week_revenue: float
    month_revenue: float
    total_revenue: float
    today_orders: int
    week_orders: int
    month_orders: int
    total_orders: int
    new_users_today: int
    new_users_week: int
    new_users_month: int
    total_users: int
    pending_vendors: int
    active_vendors: int


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive analytics overview"""
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), datetime.min.time())
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)

    # Revenue queries
    async def get_revenue_and_orders(start_dt=None):
        q = select(func.coalesce(func.sum(Order.total), 0), func.count(Order.id)).where(
            Order.payment_status == PaymentStatus.PAID
        )
        if start_dt:
            q = q.where(Order.paid_at >= start_dt)
        r = await db.execute(q)
        rev, cnt = r.one()
        return float(rev), cnt

    today_rev, today_ord = await get_revenue_and_orders(today_start)
    week_rev, week_ord = await get_revenue_and_orders(week_start)
    month_rev, month_ord = await get_revenue_and_orders(month_start)
    total_rev, total_ord = await get_revenue_and_orders()

    # User counts
    total_users_r = await db.execute(select(func.count(User.id)))
    new_today_r = await db.execute(select(func.count(User.id)).where(User.created_at >= today_start))
    new_week_r = await db.execute(select(func.count(User.id)).where(User.created_at >= week_start))
    new_month_r = await db.execute(select(func.count(User.id)).where(User.created_at >= month_start))

    # Vendor counts
    pending_v = await db.execute(select(func.count(Vendor.id)).where(Vendor.status == VendorStatus.PENDING))
    active_v = await db.execute(select(func.count(Vendor.id)).where(Vendor.status == VendorStatus.APPROVED))

    return AnalyticsOverview(
        today_revenue=today_rev,
        week_revenue=week_rev,
        month_revenue=month_rev,
        total_revenue=total_rev,
        today_orders=today_ord,
        week_orders=week_ord,
        month_orders=month_ord,
        total_orders=total_ord,
        new_users_today=new_today_r.scalar() or 0,
        new_users_week=new_week_r.scalar() or 0,
        new_users_month=new_month_r.scalar() or 0,
        total_users=total_users_r.scalar() or 0,
        pending_vendors=pending_v.scalar() or 0,
        active_vendors=active_v.scalar() or 0,
    )


@router.get("/analytics/sales-chart")
async def get_sales_chart(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get daily sales data for chart"""
    today = datetime.utcnow().date()
    data = []

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())

        result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total), 0),
                func.count(Order.id)
            ).where(
                Order.created_at >= day_start,
                Order.created_at <= day_end
            )
        )
        revenue, orders = result.one()

        data.append({
            "date": date.isoformat(),
            "revenue": float(revenue or 0),
            "orders": orders or 0,
        })

    return data


@router.get("/analytics/revenue-by-category")
async def get_revenue_by_category(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue breakdown by category"""
    result = await db.execute(
        select(
            Category.name,
            func.coalesce(func.sum(OrderItem.total), 0).label("revenue"),
            func.count(OrderItem.id).label("orders")
        )
        .join(Product, Product.category_id == Category.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Category.name)
        .order_by(func.sum(OrderItem.total).desc())
        .limit(20)
    )
    rows = result.all()
    return [{"category": r[0], "revenue": float(r[1]), "orders": r[2]} for r in rows]


@router.get("/analytics/export-csv")
async def export_sales_csv(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export sales data as CSV"""
    today = datetime.utcnow().date()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Revenue", "Orders"])

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())
        result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total), 0),
                func.count(Order.id)
            ).where(Order.created_at >= day_start, Order.created_at <= day_end)
        )
        revenue, orders = result.one()
        writer.writerow([date.isoformat(), float(revenue or 0), orders or 0])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sales-{today.isoformat()}.csv"}
    )


# ============ Order Detail Endpoint ============

@router.get("/orders/{order_id}")
async def get_order_detail(
    order_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get full order detail for admin"""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_data = []
    for item in (order.items or []):
        items_data.append({
            "id": str(item.id),
            "product_id": str(item.product_id) if item.product_id else None,
            "product_name": item.product_name,
            "product_sku": item.product_sku if hasattr(item, 'product_sku') else "",
            "product_image": item.product_image if hasattr(item, 'product_image') else "",
            "variant_name": item.variant_name if hasattr(item, 'variant_name') else "",
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "total": float(item.total),
            "status": item.status.value if hasattr(item, 'status') and item.status else order.status.value,
            "tracking_number": None,
        })

    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "user_id": str(order.user_id) if order.user_id else None,
        "status": order.status.value,
        "payment_status": order.payment_status.value,
        "subtotal": float(order.subtotal),
        "tax_amount": float(order.tax_amount) if order.tax_amount else 0,
        "shipping_amount": float(order.shipping_amount) if order.shipping_amount else 0,
        "discount_amount": float(order.discount_amount) if order.discount_amount else 0,
        "total": float(order.total),
        "currency": order.currency if hasattr(order, 'currency') and order.currency else "USD",
        "coupon_code": order.coupon_code if hasattr(order, 'coupon_code') else None,
        "shipping_first_name": order.shipping_first_name,
        "shipping_last_name": order.shipping_last_name,
        "shipping_email": order.shipping_email,
        "shipping_phone": order.shipping_phone if hasattr(order, 'shipping_phone') else None,
        "shipping_address_line1": order.shipping_address_line1,
        "shipping_address_line2": order.shipping_address_line2 if hasattr(order, 'shipping_address_line2') else None,
        "shipping_city": order.shipping_city,
        "shipping_state": order.shipping_state if hasattr(order, 'shipping_state') else None,
        "shipping_postal_code": order.shipping_postal_code,
        "shipping_country": order.shipping_country,
        "shipping_method": order.shipping_method if hasattr(order, 'shipping_method') else None,
        "tracking_number": order.tracking_number if hasattr(order, 'tracking_number') else None,
        "carrier": order.carrier if hasattr(order, 'carrier') else None,
        "estimated_delivery": None,
        "payment_method": order.payment_method if hasattr(order, 'payment_method') else None,
        "customer_notes": order.customer_notes if hasattr(order, 'customer_notes') else None,
        "created_at": order.created_at.isoformat(),
        "paid_at": order.paid_at.isoformat() if hasattr(order, 'paid_at') and order.paid_at else None,
        "shipped_at": order.shipped_at.isoformat() if hasattr(order, 'shipped_at') and order.shipped_at else None,
        "delivered_at": order.delivered_at.isoformat() if hasattr(order, 'delivered_at') and order.delivered_at else None,
        "items": items_data,
        "status_history": [],
    }


# ============ Bulk Order Status Update ============

class BulkOrderStatusUpdate(BaseModel):
    order_ids: List[str]
    status: str


@router.put("/orders/bulk-status", response_model=MessageResponse)
async def bulk_update_order_status(
    data: BulkOrderStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update status for multiple orders at once"""
    try:
        new_status = OrderStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")

    updated = 0
    for oid in data.order_ids:
        try:
            order_uuid = UUID(oid)
        except ValueError:
            continue
        result = await db.execute(select(Order).where(Order.id == order_uuid))
        order = result.scalar_one_or_none()
        if order:
            order.status = new_status
            if new_status == OrderStatus.SHIPPED and hasattr(order, 'shipped_at'):
                order.shipped_at = datetime.utcnow()
            if new_status == OrderStatus.DELIVERED and hasattr(order, 'delivered_at'):
                order.delivered_at = datetime.utcnow()
            updated += 1

    await db.commit()
    return MessageResponse(message=f"{updated} orders updated to {data.status}")


# ============ Vendor Approve/Reject/Suspend via POST (for frontend compatibility) ============

@router.post("/vendors/{vendor_id}/approve", response_model=MessageResponse)
async def approve_vendor_post(
    vendor_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a vendor (POST)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = VendorStatus.APPROVED
    vendor.verified_at = datetime.utcnow()
    await db.commit()
    return MessageResponse(message=f"{vendor.business_name} has been approved")


@router.post("/vendors/{vendor_id}/reject", response_model=MessageResponse)
async def reject_vendor_post(
    vendor_id: UUID,
    data: dict = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject a vendor (POST)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = VendorStatus.REJECTED
    await db.commit()
    return MessageResponse(message=f"{vendor.business_name} has been rejected")


@router.post("/vendors/{vendor_id}/suspend", response_model=MessageResponse)
async def suspend_vendor_post(
    vendor_id: UUID,
    data: dict = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Suspend a vendor (POST)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = VendorStatus.SUSPENDED
    await db.commit()
    return MessageResponse(message=f"{vendor.business_name} has been suspended")


# ============ Vendor Detail Endpoint ============

@router.get("/vendors/{vendor_id}")
async def get_vendor_detail(
    vendor_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor detail for admin"""
    result = await db.execute(
        select(Vendor)
        .options(selectinload(Vendor.user), selectinload(Vendor.products))
        .where(Vendor.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "id": str(vendor.id),
        "business_name": vendor.business_name,
        "slug": vendor.slug,
        "description": vendor.description,
        "owner_name": f"{vendor.user.first_name} {vendor.user.last_name}" if vendor.user else "Unknown",
        "email": vendor.user.email if vendor.user else "",
        "phone": vendor.phone if hasattr(vendor, 'phone') else "",
        "status": vendor.status.value,
        "total_sales": float(vendor.total_sales),
        "balance": float(vendor.balance),
        "rating": float(vendor.rating) if vendor.rating else 0,
        "total_reviews": vendor.total_reviews if hasattr(vendor, 'total_reviews') else 0,
        "total_products": len(vendor.products) if vendor.products else 0,
        "commission_rate": float(vendor.commission_rate) if vendor.commission_rate else 10,
        "logo_url": vendor.logo_url if hasattr(vendor, 'logo_url') else None,
        "banner_url": vendor.banner_url if hasattr(vendor, 'banner_url') else None,
        "created_at": vendor.created_at.isoformat(),
        "verified_at": vendor.verified_at.isoformat() if vendor.verified_at else None,
        "address": vendor.address if hasattr(vendor, 'address') else None,
        "city": vendor.city if hasattr(vendor, 'city') else None,
        "country": vendor.country if hasattr(vendor, 'country') else None,
    }


# ============ Test Email Endpoint ============

class TestEmailRequest(BaseModel):
    email_type: str
    recipient_email: EmailStr


@router.post("/test-email")
async def send_test_email(
    request: TestEmailRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Send test emails (admin only).

    Available email types:
    - welcome
    - password_reset
    - order_confirmation
    - order_shipped
    - order_delivered
    - payment_received
    - vendor_new_order
    - payout_request
    - payout_approved
    """
    from app.services import email as email_service

    try:
        if request.email_type == "welcome":
            success = email_service.send_welcome_email(
                to_email=request.recipient_email,
                first_name="John"
            )

        elif request.email_type == "password_reset":
            success = email_service.send_password_reset_email(
                to_email=request.recipient_email,
                first_name="John",
                reset_token="sample-reset-token-123456"
            )

        elif request.email_type == "order_confirmation":
            success = email_service.send_order_confirmation_email(
                to_email=request.recipient_email,
                first_name="John",
                order_number="ORD-2024-001",
                items=[
                    {
                        "name": "Premium Wireless Headphones",
                        "quantity": 1,
                        "unit_price": 149.99,
                        "variant": "Black"
                    },
                    {
                        "name": "USB-C Cable (2m)",
                        "quantity": 2,
                        "unit_price": 12.99,
                        "variant": None
                    }
                ],
                subtotal=175.97,
                shipping=10.00,
                tax=18.60,
                total=204.57,
                shipping_address={
                    "name": "John Doe",
                    "street": "123 Main Street",
                    "apartment": "Apt 4B",
                    "city": "San Francisco",
                    "state": "CA",
                    "zip": "94102",
                    "country": "United States",
                    "phone": "+1 (555) 123-4567"
                },
                estimated_delivery="January 15-18, 2024"
            )

        elif request.email_type == "order_shipped":
            success = email_service.send_order_shipped_email(
                to_email=request.recipient_email,
                first_name="John",
                order_number="ORD-2024-001",
                items=[
                    {
                        "name": "Premium Wireless Headphones",
                        "quantity": 1,
                        "variant": "Black"
                    },
                    {
                        "name": "USB-C Cable (2m)",
                        "quantity": 2,
                        "variant": None
                    }
                ],
                shipping_address={
                    "name": "John Doe",
                    "street": "123 Main Street",
                    "apartment": "Apt 4B",
                    "city": "San Francisco",
                    "state": "CA",
                    "zip": "94102",
                    "country": "United States"
                },
                tracking_number="1Z999AA10123456784",
                carrier="UPS",
                tracking_url="https://www.ups.com/track?tracknum=1Z999AA10123456784",
                estimated_delivery="January 15-18, 2024"
            )

        elif request.email_type == "order_delivered":
            success = email_service.send_order_delivered_email(
                to_email=request.recipient_email,
                first_name="John",
                order_number="ORD-2024-001",
                items=[
                    {
                        "name": "Premium Wireless Headphones",
                        "quantity": 1,
                        "variant": "Black"
                    },
                    {
                        "name": "USB-C Cable (2m)",
                        "quantity": 2,
                        "variant": None
                    }
                ]
            )

        elif request.email_type == "payment_received":
            success = email_service.send_payment_received_email(
                to_email=request.recipient_email,
                first_name="John",
                order_number="ORD-2024-001",
                items=[
                    {
                        "name": "Premium Wireless Headphones",
                        "quantity": 1,
                        "unit_price": 149.99,
                        "variant": "Black"
                    }
                ],
                subtotal=149.99,
                shipping=10.00,
                tax=16.00,
                total=175.99,
                amount=175.99,
                payment_method="Visa •••• 4242",
                transaction_id="ch_1234567890abcdef"
            )

        elif request.email_type == "vendor_new_order":
            success = email_service.send_vendor_new_order_email(
                to_email=request.recipient_email,
                vendor_name="Tech Store",
                order_number="ORD-2024-001",
                customer_name="John Doe",
                customer_email="john@example.com",
                customer_phone="+1 (555) 123-4567",
                items=[
                    {
                        "name": "Premium Wireless Headphones",
                        "quantity": 1,
                        "unit_price": 149.99,
                        "variant": "Black",
                        "sku": "WH-1000XM4-BLK"
                    }
                ],
                subtotal=149.99,
                commission=15.00,
                vendor_earnings=134.99,
                commission_percent=10.0,
                shipping_address={
                    "name": "John Doe",
                    "street": "123 Main Street",
                    "apartment": "Apt 4B",
                    "city": "San Francisco",
                    "state": "CA",
                    "zip": "94102",
                    "country": "United States",
                    "phone": "+1 (555) 123-4567"
                }
            )

        elif request.email_type == "payout_request":
            success = email_service.send_payout_request_email(
                to_email=request.recipient_email,
                vendor_name="Tech Store",
                vendor_email="vendor@techstore.com",
                vendor_phone="+1 (555) 987-6543",
                vendor_id="vendor_123456",
                payout_id="payout_789012",
                payout_amount=1500.00,
                available_balance=2000.00,
                payment_method="Bank Transfer",
                bank_name="Chase Bank",
                account_number="1234567890",
                account_holder="Tech Store LLC"
            )

        elif request.email_type == "payout_approved":
            success = email_service.send_payout_approved_email(
                to_email=request.recipient_email,
                vendor_name="Tech Store",
                payout_id="payout_789012",
                payout_amount=1500.00,
                payment_method="Bank Transfer",
                bank_name="Chase Bank",
                account_number="1234567890",
                account_holder="Tech Store LLC",
                estimated_arrival="3-5 business days"
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown email type: {request.email_type}"
            )

        if success:
            return MessageResponse(
                message=f"Test email '{request.email_type}' sent successfully to {request.recipient_email}"
            )
        else:
            return MessageResponse(
                message=f"Test email '{request.email_type}' logged (SMTP not configured). Check server logs."
            )

    except Exception as e:
        logger.error(f"Failed to send test email: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send test email: {str(e)}"
        )


# ============================================================================
# FTS5 Full-Text Search Management
# ============================================================================


@router.get("/fts5/status")
async def get_fts5_status(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get FTS5 full-text search status and statistics"""
    exists = await check_fts5_exists(db)

    if not exists:
        return {
            "status": "not_initialized",
            "exists": False,
            "message": "FTS5 table has not been created yet"
        }

    stats = await get_fts5_stats(db)

    return {
        "status": "active",
        "exists": True,
        "statistics": stats
    }


@router.post("/fts5/initialize")
async def initialize_fts5(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Initialize FTS5 table and populate with existing products"""
    # Check if already exists
    exists = await check_fts5_exists(db)

    if exists:
        raise HTTPException(
            status_code=400,
            detail="FTS5 table already exists. Use rebuild endpoint to recreate."
        )

    # Create FTS5 table and triggers
    success = await create_fts5_table(db)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to create FTS5 table"
        )

    # Populate with existing products
    count = await populate_fts5_table(db)

    return MessageResponse(
        message=f"FTS5 initialized successfully. Indexed {count} products."
    )


@router.post("/fts5/rebuild")
async def rebuild_fts5(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Rebuild FTS5 index (useful after bulk data changes)"""
    exists = await check_fts5_exists(db)

    if not exists:
        raise HTTPException(
            status_code=404,
            detail="FTS5 table does not exist. Use initialize endpoint first."
        )

    success = await rebuild_fts5_index(db)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to rebuild FTS5 index"
        )

    return MessageResponse(
        message="FTS5 index rebuilt successfully"
    )


@router.post("/fts5/optimize")
async def optimize_fts5(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Optimize FTS5 index for better performance"""
    exists = await check_fts5_exists(db)

    if not exists:
        raise HTTPException(
            status_code=404,
            detail="FTS5 table does not exist. Use initialize endpoint first."
        )

    success = await optimize_fts5_index(db)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to optimize FTS5 index"
        )

    return MessageResponse(
        message="FTS5 index optimized successfully"
    )


@router.post("/fts5/repopulate")
async def repopulate_fts5(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Repopulate FTS5 table from existing products"""
    exists = await check_fts5_exists(db)

    if not exists:
        raise HTTPException(
            status_code=404,
            detail="FTS5 table does not exist. Use initialize endpoint first."
        )

    count = await populate_fts5_table(db)

    return MessageResponse(
        message=f"FTS5 table repopulated with {count} products"
    )
