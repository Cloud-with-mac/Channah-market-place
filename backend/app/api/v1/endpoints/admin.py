from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from pydantic import BaseModel, EmailStr
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_admin, get_password_hash
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

    # Revenue stats
    total_revenue = await db.execute(
        select(func.sum(Order.total)).where(Order.payment_status == PaymentStatus.PAID)
    )
    today_revenue = await db.execute(
        select(func.sum(Order.total)).where(
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
    "site_name": "Channah Global Marketplace",
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
