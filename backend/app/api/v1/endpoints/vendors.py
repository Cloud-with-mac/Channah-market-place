from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
from slugify import slugify

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor, get_approved_vendor, get_current_admin
from app.models.user import User, UserRole
from app.models.vendor import Vendor, VendorStatus, VendorPayout, PayoutStatus
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.vendor import (
    VendorCreate, VendorUpdate, VendorResponse, VendorBankDetails,
    VendorDashboardStats, VendorPayoutRequest, VendorPayoutResponse
)
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


@router.post("/register", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def register_vendor(
    vendor_data: VendorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register as a vendor"""
    # Check if user is already a vendor
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered as a vendor"
        )

    # Generate unique slug
    base_slug = slugify(vendor_data.business_name)
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Vendor).where(Vendor.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create vendor with PENDING status - requires admin approval
    vendor = Vendor(
        user_id=current_user.id,
        business_name=vendor_data.business_name,
        slug=slug,
        business_email=vendor_data.business_email,
        business_phone=vendor_data.business_phone,
        description=vendor_data.description,
        business_address=vendor_data.business_address,
        city=vendor_data.city,
        state=vendor_data.state,
        country=vendor_data.country,
        postal_code=vendor_data.postal_code,
        tax_id=vendor_data.tax_id,
        status=VendorStatus.PENDING,  # Requires admin approval
        verified_at=None
    )
    db.add(vendor)

    # Update user role
    current_user.role = UserRole.VENDOR
    await db.commit()
    await db.refresh(vendor)

    return VendorResponse.model_validate(vendor)


@router.get("/me", response_model=VendorResponse)
async def get_my_vendor_profile(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get current vendor profile"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    return VendorResponse.model_validate(vendor)


@router.put("/me", response_model=VendorResponse)
async def update_my_vendor_profile(
    vendor_data: VendorUpdate,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update current vendor profile"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    update_data = vendor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)

    await db.commit()
    await db.refresh(vendor)

    return VendorResponse.model_validate(vendor)


@router.get("/me/dashboard", response_model=VendorDashboardStats)
async def get_vendor_dashboard(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor dashboard statistics"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Get product stats
    product_result = await db.execute(
        select(func.count(Product.id)).where(Product.vendor_id == vendor.id)
    )
    total_products = product_result.scalar() or 0

    active_product_result = await db.execute(
        select(func.count(Product.id)).where(
            Product.vendor_id == vendor.id,
            Product.status == "active"
        )
    )
    active_products = active_product_result.scalar() or 0

    # Get order stats
    order_result = await db.execute(
        select(func.count(OrderItem.id)).where(OrderItem.vendor_id == vendor.id)
    )
    total_orders = order_result.scalar() or 0

    pending_order_result = await db.execute(
        select(func.count(OrderItem.id)).where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.status.in_([OrderStatus.PENDING, OrderStatus.PROCESSING])
        )
    )
    pending_orders = pending_order_result.scalar() or 0

    return VendorDashboardStats(
        total_products=total_products,
        active_products=active_products,
        total_orders=total_orders,
        pending_orders=pending_orders,
        total_revenue=vendor.total_sales,
        this_month_revenue=vendor.total_sales,  # TODO: Calculate monthly
        pending_balance=vendor.balance,
        average_rating=vendor.rating,
        total_reviews=vendor.total_reviews
    )


@router.get("/me/revenue-chart")
async def get_vendor_revenue_chart(
    days: int = Query(default=30, ge=7, le=90),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue chart data for vendor"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get daily revenue and order counts
    daily_stats = await db.execute(
        select(
            cast(OrderItem.created_at, Date).label('date'),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label('revenue'),
            func.count(OrderItem.id).label('orders')
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.created_at >= start_date,
            Order.status.in_([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        )
        .group_by(cast(OrderItem.created_at, Date))
        .order_by(cast(OrderItem.created_at, Date))
    )

    stats_dict = {row.date: {'revenue': float(row.revenue), 'orders': row.orders} for row in daily_stats}

    # Fill in missing dates with zeros
    chart_data = []
    current_date = start_date.date()
    while current_date <= end_date.date():
        stats = stats_dict.get(current_date, {'revenue': 0, 'orders': 0})
        chart_data.append({
            'date': current_date.strftime('%d %b'),
            'revenue': stats['revenue'],
            'orders': stats['orders']
        })
        current_date += timedelta(days=1)

    return chart_data


@router.get("/me/top-products")
async def get_vendor_top_products(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get top selling products for vendor"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Get top products by sales
    top_products_result = await db.execute(
        select(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('sales'),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label('revenue')
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Product.vendor_id == vendor.id,
            Order.status.in_([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        )
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )

    return [
        {
            'id': str(row.id),
            'name': row.name,
            'sales': int(row.sales),
            'revenue': float(row.revenue)
        }
        for row in top_products_result
    ]


@router.get("/me/category-stats")
async def get_vendor_category_stats(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get sales by category for vendor"""
    from app.models.category import Category

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Get category distribution
    category_stats = await db.execute(
        select(
            Category.name,
            func.sum(OrderItem.quantity).label('sales'),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label('revenue')
        )
        .join(Product, OrderItem.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Product.vendor_id == vendor.id,
            Order.status.in_([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        )
        .group_by(Category.name)
        .order_by(func.sum(OrderItem.quantity).desc())
    )

    colors = ['#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']
    return [
        {
            'name': row.name,
            'value': int(row.sales),
            'revenue': float(row.revenue),
            'color': colors[i % len(colors)]
        }
        for i, row in enumerate(category_stats)
    ]


@router.put("/me/bank-details", response_model=MessageResponse)
async def update_bank_details(
    bank_data: VendorBankDetails,
    current_user: User = Depends(get_approved_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update vendor bank details for payouts (requires approved vendor)"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    vendor.bank_name = bank_data.bank_name
    vendor.bank_account_name = bank_data.bank_account_name
    vendor.bank_account_number = bank_data.bank_account_number
    vendor.bank_routing_number = bank_data.bank_routing_number
    vendor.bank_country = bank_data.bank_country
    await db.commit()

    return MessageResponse(message="Bank details updated successfully")


@router.post("/me/payouts", response_model=VendorPayoutResponse)
async def request_payout(
    payout_data: VendorPayoutRequest,
    current_user: User = Depends(get_approved_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Request a payout (requires approved vendor)"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    if vendor.balance < payout_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )

    if payout_data.amount < 50:  # Minimum payout
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum payout amount is $50"
        )

    payout = VendorPayout(
        vendor_id=vendor.id,
        amount=payout_data.amount,
        payment_method=payout_data.payment_method,
        status=PayoutStatus.PENDING
    )
    db.add(payout)

    # Deduct from balance
    vendor.balance -= payout_data.amount
    await db.commit()
    await db.refresh(payout)

    return VendorPayoutResponse.model_validate(payout)


@router.get("/me/payouts", response_model=List[VendorPayoutResponse])
async def get_my_payouts(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor payouts history"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    result = await db.execute(
        select(VendorPayout)
        .where(VendorPayout.vendor_id == vendor.id)
        .order_by(VendorPayout.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    payouts = result.scalars().all()

    return [VendorPayoutResponse.model_validate(p) for p in payouts]


# Public endpoints

@router.get("/", response_model=List[VendorResponse])
async def list_vendors(
    skip: int = 0,
    limit: int = 20,
    featured: bool = None,
    db: AsyncSession = Depends(get_db)
):
    """List all approved vendors"""
    query = select(Vendor).where(Vendor.status == VendorStatus.APPROVED)

    if featured:
        query = query.where(Vendor.is_featured == True)

    query = query.order_by(Vendor.rating.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    vendors = result.scalars().all()

    return [VendorResponse.model_validate(v) for v in vendors]


@router.get("/{slug}", response_model=VendorResponse)
async def get_vendor(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get vendor by slug"""
    result = await db.execute(
        select(Vendor).where(
            Vendor.slug == slug,
            Vendor.status == VendorStatus.APPROVED
        )
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )

    return VendorResponse.model_validate(vendor)


# Admin endpoints

@router.get("/admin/pending", response_model=List[VendorResponse])
async def list_pending_vendors(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List pending vendor applications (admin only)"""
    result = await db.execute(
        select(Vendor)
        .where(Vendor.status == VendorStatus.PENDING)
        .order_by(Vendor.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    vendors = result.scalars().all()

    return [VendorResponse.model_validate(v) for v in vendors]


@router.put("/admin/{vendor_id}/approve", response_model=VendorResponse)
async def approve_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve vendor application (admin only)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )

    vendor.status = VendorStatus.APPROVED
    vendor.verified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(vendor)

    return VendorResponse.model_validate(vendor)


@router.put("/admin/{vendor_id}/reject", response_model=VendorResponse)
async def reject_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject vendor application (admin only)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )

    vendor.status = VendorStatus.REJECTED
    await db.commit()
    await db.refresh(vendor)

    return VendorResponse.model_validate(vendor)


@router.put("/admin/{vendor_id}/suspend", response_model=VendorResponse)
async def suspend_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Suspend vendor (admin only)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )

    vendor.status = VendorStatus.SUSPENDED
    await db.commit()
    await db.refresh(vendor)

    return VendorResponse.model_validate(vendor)


# ============ VENDOR PRODUCTS ENDPOINTS ============

@router.get("/me/products")
async def get_vendor_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    status: str = Query(default=None),
    category: str = Query(default=None),
    ordering: str = Query(default="-created_at"),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor's products with pagination and filters"""
    from app.models.category import Category
    from app.models.product import ProductImage

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    query = select(Product).where(Product.vendor_id == vendor.id)

    # Apply filters
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if status:
        query = query.where(Product.status == status)
    if category:
        query = query.join(Category).where(Category.slug == category)

    # Apply ordering
    if ordering:
        desc_order = ordering.startswith("-")
        order_field = ordering.lstrip("-")
        order_column = getattr(Product, order_field, Product.created_at)
        query = query.order_by(order_column.desc() if desc_order else order_column.asc())

    # Count total
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit).options(selectinload(Product.images), selectinload(Product.category))

    result = await db.execute(query)
    products = result.scalars().all()

    return {
        "items": [
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "price": float(p.price),
                "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
                "status": p.status.value if hasattr(p.status, 'value') else p.status,
                "stock": p.quantity,
                "sku": p.sku,
                "category": {"id": str(p.category.id), "name": p.category.name} if p.category else None,
                "images": [{"id": str(img.id), "url": img.url, "is_primary": img.is_primary} for img in p.images] if p.images else [],
                "created_at": p.created_at.isoformat(),
            }
            for p in products
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0
    }


@router.post("/me/products")
async def create_vendor_product(
    product_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new product"""
    from app.models.product import ProductImage
    from app.models.category import Category

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Generate slug
    base_slug = slugify(product_data.get("name", "product"))
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Product).where(Product.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create product
    product = Product(
        vendor_id=vendor.id,
        name=product_data.get("name"),
        slug=slug,
        description=product_data.get("description"),
        short_description=product_data.get("short_description"),
        price=product_data.get("price", 0),
        compare_at_price=product_data.get("compare_at_price"),
        cost_price=product_data.get("cost_price"),
        sku=product_data.get("sku"),
        barcode=product_data.get("barcode"),
        quantity=product_data.get("stock", 0),
        low_stock_threshold=product_data.get("low_stock_threshold", 5),
        weight=product_data.get("weight"),
        category_id=product_data.get("category_id"),
        status=product_data.get("status", "draft"),
        is_featured=product_data.get("is_featured", False),
    )
    db.add(product)
    await db.flush()

    # Add images if provided
    images = product_data.get("images", [])
    for i, img in enumerate(images):
        product_image = ProductImage(
            product_id=product.id,
            url=img.get("url"),
            alt_text=img.get("alt_text", product.name),
            is_primary=i == 0
        )
        db.add(product_image)

    await db.commit()
    await db.refresh(product)

    return {"id": str(product.id), "slug": product.slug, "message": "Product created successfully"}


@router.get("/me/products/{product_id}")
async def get_vendor_product(
    product_id: str,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific product by ID"""
    from app.models.product import ProductImage

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.vendor_id == vendor.id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": str(product.id),
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "short_description": product.short_description,
        "price": float(product.price),
        "compare_at_price": float(product.compare_at_price) if product.compare_at_price else None,
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "sku": product.sku,
        "barcode": product.barcode,
        "stock": product.quantity,
        "low_stock_threshold": product.low_stock_threshold,
        "weight": float(product.weight) if product.weight else None,
        "status": product.status.value if hasattr(product.status, 'value') else product.status,
        "is_featured": product.is_featured,
        "category_id": str(product.category_id) if product.category_id else None,
        "category": {"id": str(product.category.id), "name": product.category.name} if product.category else None,
        "images": [{"id": str(img.id), "url": img.url, "alt_text": img.alt_text, "is_primary": img.is_primary} for img in product.images],
        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat() if product.updated_at else None
    }


@router.put("/me/products/{product_id}")
async def update_vendor_product(
    product_id: str,
    product_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update a product"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.vendor_id == vendor.id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update fields - map 'stock' from frontend to 'quantity' in model
    updatable_fields = [
        "name", "description", "short_description", "price", "compare_at_price",
        "cost_price", "sku", "barcode", "low_stock_threshold", "weight",
        "category_id", "status", "is_featured"
    ]

    for field in updatable_fields:
        if field in product_data:
            setattr(product, field, product_data[field])

    # Handle stock -> quantity mapping
    if "stock" in product_data:
        product.quantity = product_data["stock"]

    product.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Product updated successfully"}


@router.delete("/me/products/{product_id}")
async def delete_vendor_product(
    product_id: str,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.vendor_id == vendor.id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()

    return {"message": "Product deleted successfully"}


# ============ VENDOR ORDERS ENDPOINTS ============

@router.get("/me/orders")
async def get_vendor_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: str = Query(default=None),
    date_from: str = Query(default=None),
    date_to: str = Query(default=None),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor's orders with pagination"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Query order items for this vendor
    query = (
        select(OrderItem, Order)
        .join(Order, OrderItem.order_id == Order.id)
        .where(OrderItem.vendor_id == vendor.id)
    )

    if status:
        query = query.where(OrderItem.status == status)
    if date_from:
        query = query.where(Order.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(Order.created_at <= datetime.fromisoformat(date_to))

    query = query.order_by(Order.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    order_items = result.all()

    return {
        "items": [
            {
                "id": str(item.OrderItem.id),
                "order_id": str(item.Order.id),
                "order_number": item.Order.order_number,
                "product_name": item.OrderItem.product_name,
                "product_image": item.OrderItem.product_image,
                "quantity": item.OrderItem.quantity,
                "unit_price": float(item.OrderItem.unit_price),
                "total": float(item.OrderItem.unit_price * item.OrderItem.quantity),
                "status": item.OrderItem.status.value if hasattr(item.OrderItem.status, 'value') else item.OrderItem.status,
                "customer_name": f"{item.Order.shipping_first_name} {item.Order.shipping_last_name}",
                "customer_email": item.Order.shipping_email,
                "shipping_address": f"{item.Order.shipping_address_line1}, {item.Order.shipping_city}",
                "created_at": item.Order.created_at.isoformat(),
            }
            for item in order_items
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0
    }


@router.get("/me/orders/{order_item_id}")
async def get_vendor_order_detail(
    order_item_id: str,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get order item detail"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(OrderItem, Order)
        .join(Order, OrderItem.order_id == Order.id)
        .where(OrderItem.id == order_item_id, OrderItem.vendor_id == vendor.id)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    item, order = row.OrderItem, row.Order

    return {
        "id": str(item.id),
        "order_id": str(order.id),
        "order_number": order.order_number,
        "product_id": str(item.product_id) if item.product_id else None,
        "product_name": item.product_name,
        "product_image": item.product_image,
        "variant_name": item.variant_name,
        "quantity": item.quantity,
        "unit_price": float(item.unit_price),
        "total": float(item.unit_price * item.quantity),
        "status": item.status.value if hasattr(item.status, 'value') else item.status,
        "tracking_number": item.tracking_number,
        "tracking_carrier": item.tracking_carrier,
        "customer": {
            "name": f"{order.shipping_first_name} {order.shipping_last_name}",
            "email": order.shipping_email,
            "phone": order.shipping_phone
        },
        "shipping": {
            "address": order.shipping_address,
            "city": order.shipping_city,
            "state": order.shipping_state,
            "postal_code": order.shipping_postal_code,
            "country": order.shipping_country
        },
        "created_at": order.created_at.isoformat()
    }


@router.put("/me/orders/{order_item_id}/status")
async def update_vendor_order_status(
    order_item_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update order item status"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(OrderItem).where(OrderItem.id == order_item_id, OrderItem.vendor_id == vendor.id)
    )
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = status_data.get("status")
    if new_status:
        order_item.status = OrderStatus(new_status)
        order_item.updated_at = datetime.utcnow()

        if new_status == "shipped":
            order_item.shipped_at = datetime.utcnow()
        elif new_status == "delivered":
            order_item.delivered_at = datetime.utcnow()

    await db.commit()
    return {"message": "Order status updated successfully"}


@router.post("/me/orders/{order_item_id}/tracking")
async def add_tracking_info(
    order_item_id: str,
    tracking_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Add tracking information to order"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(OrderItem).where(OrderItem.id == order_item_id, OrderItem.vendor_id == vendor.id)
    )
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(status_code=404, detail="Order not found")

    order_item.tracking_number = tracking_data.get("tracking_number")
    order_item.tracking_carrier = tracking_data.get("carrier")
    order_item.status = OrderStatus.SHIPPED
    order_item.shipped_at = datetime.utcnow()

    await db.commit()
    return {"message": "Tracking information added successfully"}


# ============ VENDOR ANALYTICS ENDPOINTS ============

@router.get("/me/analytics/sales")
async def get_vendor_sales_analytics(
    period: str = Query(default="30d"),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get sales analytics for vendor"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Parse period
    days = int(period.rstrip("d")) if period.endswith("d") else 30
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get revenue
    revenue_result = await db.execute(
        select(func.sum(OrderItem.unit_price * OrderItem.quantity))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.created_at >= start_date,
            Order.status.in_([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        )
    )
    total_revenue = revenue_result.scalar() or 0

    # Get order count
    order_count_result = await db.execute(
        select(func.count(OrderItem.id))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.created_at >= start_date
        )
    )
    total_orders = order_count_result.scalar() or 0

    # Get unique customers
    customer_result = await db.execute(
        select(func.count(func.distinct(Order.user_id)))
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(
            OrderItem.vendor_id == vendor.id,
            OrderItem.created_at >= start_date
        )
    )
    unique_customers = customer_result.scalar() or 0

    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "unique_customers": unique_customers,
        "avg_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0,
        "period": period
    }


@router.get("/me/analytics/customers")
async def get_vendor_customer_analytics(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get customer analytics for vendor"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Get unique customers (all time)
    customer_result = await db.execute(
        select(func.count(func.distinct(Order.user_id)))
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(OrderItem.vendor_id == vendor.id)
    )
    total_customers = customer_result.scalar() or 0

    # Get repeat customers
    repeat_result = await db.execute(
        select(func.count())
        .select_from(
            select(Order.user_id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .where(OrderItem.vendor_id == vendor.id)
            .group_by(Order.user_id)
            .having(func.count(Order.id) > 1)
            .subquery()
        )
    )
    repeat_customers = repeat_result.scalar() or 0

    return {
        "total_customers": total_customers,
        "repeat_customers": repeat_customers,
        "repeat_rate": (repeat_customers / total_customers * 100) if total_customers > 0 else 0
    }


# ============ VENDOR BALANCE ENDPOINT ============

@router.get("/me/balance")
async def get_vendor_balance(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor balance information"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Get pending payouts
    pending_result = await db.execute(
        select(func.sum(VendorPayout.amount))
        .where(
            VendorPayout.vendor_id == vendor.id,
            VendorPayout.status == PayoutStatus.PENDING
        )
    )
    pending_amount = pending_result.scalar() or 0

    # Get total paid
    paid_result = await db.execute(
        select(func.sum(VendorPayout.amount))
        .where(
            VendorPayout.vendor_id == vendor.id,
            VendorPayout.status == PayoutStatus.COMPLETED
        )
    )
    total_paid = paid_result.scalar() or 0

    return {
        "available_balance": float(vendor.balance),
        "pending_balance": float(pending_amount),
        "total_paid": float(total_paid),
        "total_earnings": float(vendor.total_sales)
    }


# ============ VENDOR REVIEWS ENDPOINTS ============

@router.get("/me/reviews")
async def get_vendor_reviews(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    rating: int = Query(default=None, ge=1, le=5),
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for vendor's products"""
    from app.models.review import Review

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Get reviews for vendor's products
    query = (
        select(Review, Product, User)
        .join(Product, Review.product_id == Product.id)
        .join(User, Review.user_id == User.id)
        .where(Product.vendor_id == vendor.id)
    )

    if rating:
        query = query.where(Review.rating == rating)

    query = query.order_by(Review.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    reviews = result.all()

    return {
        "items": [
            {
                "id": str(row.Review.id),
                "product_id": str(row.Product.id),
                "product_name": row.Product.name,
                "user_name": f"{row.User.first_name} {row.User.last_name}",
                "rating": row.Review.rating,
                "title": row.Review.title,
                "comment": row.Review.comment,
                "vendor_response": row.Review.vendor_response,
                "is_verified_purchase": row.Review.is_verified_purchase,
                "created_at": row.Review.created_at.isoformat()
            }
            for row in reviews
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0
    }


@router.post("/me/reviews/{review_id}/respond")
async def respond_to_review(
    review_id: str,
    response_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Respond to a review"""
    from app.models.review import Review

    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Verify review is for vendor's product
    result = await db.execute(
        select(Review)
        .join(Product, Review.product_id == Product.id)
        .where(Review.id == review_id, Product.vendor_id == vendor.id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.vendor_response = response_data.get("response")
    review.vendor_responded_at = datetime.utcnow()

    await db.commit()
    return {"message": "Response added successfully"}


# ============ VENDOR SETTINGS ENDPOINTS ============

@router.get("/me/payment-settings")
async def get_vendor_payment_settings(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor payment settings"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "bank_name": vendor.bank_name,
        "bank_account_name": vendor.bank_account_name,
        "bank_account_number": vendor.bank_account_number[-4:] if vendor.bank_account_number else None,  # Only last 4 digits
        "bank_routing_number": vendor.bank_routing_number[-4:] if vendor.bank_routing_number else None,
        "bank_country": vendor.bank_country,
        "paypal_email": vendor.paypal_email if hasattr(vendor, 'paypal_email') else None
    }


@router.put("/me/payment-settings")
async def update_vendor_payment_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update vendor payment settings"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if "bank_name" in settings_data:
        vendor.bank_name = settings_data["bank_name"]
    if "bank_account_name" in settings_data:
        vendor.bank_account_name = settings_data["bank_account_name"]
    if "bank_account_number" in settings_data:
        vendor.bank_account_number = settings_data["bank_account_number"]
    if "bank_routing_number" in settings_data:
        vendor.bank_routing_number = settings_data["bank_routing_number"]
    if "bank_country" in settings_data:
        vendor.bank_country = settings_data["bank_country"]

    await db.commit()
    return {"message": "Payment settings updated successfully"}


@router.get("/me/notification-settings")
async def get_vendor_notification_settings(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor notification settings"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Return default settings if not set
    return {
        "email_new_order": getattr(vendor, 'email_new_order', True),
        "email_order_updates": getattr(vendor, 'email_order_updates', True),
        "email_reviews": getattr(vendor, 'email_reviews', True),
        "email_payouts": getattr(vendor, 'email_payouts', True),
        "email_promotions": getattr(vendor, 'email_promotions', False)
    }


@router.put("/me/notification-settings")
async def update_vendor_notification_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update vendor notification settings"""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Store settings (you may need to add these fields to the Vendor model)
    for key in ['email_new_order', 'email_order_updates', 'email_reviews', 'email_payouts', 'email_promotions']:
        if key in settings_data and hasattr(vendor, key):
            setattr(vendor, key, settings_data[key])

    await db.commit()
    return {"message": "Notification settings updated successfully"}
