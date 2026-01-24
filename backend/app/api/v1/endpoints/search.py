from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel

from app.core.database import get_db
from app.models.product import Product, ProductStatus
from app.models.category import Category
from app.models.vendor import Vendor, VendorStatus

router = APIRouter()


class SearchResult(BaseModel):
    type: str  # product, category, vendor
    id: str
    name: str
    slug: str
    image: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    description: Optional[str] = None


class SearchResponse(BaseModel):
    products: List[dict]
    categories: List[dict]
    vendors: List[dict]
    total_results: int
    query: str


class ProductSearchResponse(BaseModel):
    products: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int
    filters: dict


@router.get("/", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Global search across products, categories, and vendors"""
    search_term = f"%{q}%"

    # Search products
    product_result = await db.execute(
        select(Product)
        .where(
            Product.status == ProductStatus.ACTIVE,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.tags.any(q.lower())
            )
        )
        .options(selectinload(Product.images))
        .order_by(Product.rating.desc())
        .limit(limit)
    )
    products = product_result.scalars().all()

    # Search categories
    category_result = await db.execute(
        select(Category)
        .where(
            Category.is_active == True,
            or_(
                Category.name.ilike(search_term),
                Category.description.ilike(search_term)
            )
        )
        .limit(5)
    )
    categories = category_result.scalars().all()

    # Search vendors
    vendor_result = await db.execute(
        select(Vendor)
        .where(
            Vendor.status == VendorStatus.APPROVED,
            or_(
                Vendor.business_name.ilike(search_term),
                Vendor.description.ilike(search_term)
            )
        )
        .limit(5)
    )
    vendors = vendor_result.scalars().all()

    return SearchResponse(
        products=[
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "price": float(p.price),
                "image": p.images[0].url if p.images else None,
                "rating": p.rating,
                "review_count": p.review_count
            }
            for p in products
        ],
        categories=[
            {
                "id": str(c.id),
                "name": c.name,
                "slug": c.slug,
                "image": c.image_url
            }
            for c in categories
        ],
        vendors=[
            {
                "id": str(v.id),
                "name": v.business_name,
                "slug": v.slug,
                "logo": v.logo_url,
                "rating": v.rating
            }
            for v in vendors
        ],
        total_results=len(products) + len(categories) + len(vendors),
        query=q
    )


@router.get("/products", response_model=ProductSearchResponse)
async def search_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    rating: Optional[float] = None,
    in_stock: Optional[bool] = None,
    on_sale: Optional[bool] = None,
    sort: str = "relevance",
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Advanced product search with filters"""
    query = select(Product).where(Product.status == ProductStatus.ACTIVE)

    # Text search
    if q:
        search_term = f"%{q}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.short_description.ilike(search_term)
            )
        )

    # Category filter
    if category:
        cat_result = await db.execute(
            select(Category).where(Category.slug == category)
        )
        cat = cat_result.scalar_one_or_none()
        if cat:
            # Include subcategories
            query = query.where(
                or_(
                    Product.category_id == cat.id,
                    Product.category.has(Category.parent_id == cat.id)
                )
            )

    # Vendor filter
    if vendor:
        vendor_result = await db.execute(
            select(Vendor).where(Vendor.slug == vendor)
        )
        v = vendor_result.scalar_one_or_none()
        if v:
            query = query.where(Product.vendor_id == v.id)

    # Price filter
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    # Rating filter
    if rating is not None:
        query = query.where(Product.rating >= rating)

    # Stock filter
    if in_stock:
        query = query.where(Product.quantity > 0)

    # On sale filter
    if on_sale:
        query = query.where(Product.compare_at_price > Product.price)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Sorting
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort == "best_selling":
        query = query.order_by(Product.sales_count.desc())
    else:  # relevance
        query = query.order_by(Product.rating.desc(), Product.sales_count.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.options(
        selectinload(Product.images),
        selectinload(Product.vendor),
        selectinload(Product.category)
    ).offset(offset).limit(page_size)

    result = await db.execute(query)
    products = result.scalars().all()

    # Get filter options
    filters = {
        "price_range": {"min": 0, "max": 10000},
        "categories": [],
        "ratings": [1, 2, 3, 4, 5]
    }

    return ProductSearchResponse(
        products=[
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "price": float(p.price),
                "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
                "currency": p.currency,
                "image": p.images[0].url if p.images else None,
                "rating": p.rating,
                "review_count": p.review_count,
                "in_stock": p.quantity > 0,
                "vendor_name": p.vendor.business_name if p.vendor else None,
                "category_name": p.category.name if p.category else None
            }
            for p in products
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
        filters=filters
    )


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    limit: int = 8,
    db: AsyncSession = Depends(get_db)
):
    """Autocomplete suggestions"""
    search_term = f"{q}%"

    # Get product names
    product_result = await db.execute(
        select(Product.name)
        .where(
            Product.status == ProductStatus.ACTIVE,
            Product.name.ilike(search_term)
        )
        .distinct()
        .limit(limit)
    )
    products = [row[0] for row in product_result.all()]

    # Get category names
    category_result = await db.execute(
        select(Category.name)
        .where(
            Category.is_active == True,
            Category.name.ilike(search_term)
        )
        .limit(3)
    )
    categories = [row[0] for row in category_result.all()]

    return {
        "suggestions": products[:limit],
        "categories": categories
    }


@router.get("/trending")
async def trending_searches(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get trending search terms"""
    # In production, this would be based on actual search analytics
    # For now, return top-rated product categories

    result = await db.execute(
        select(Category.name)
        .where(Category.is_active == True, Category.is_featured == True)
        .limit(limit)
    )
    categories = [row[0] for row in result.all()]

    # Also get some popular product names
    product_result = await db.execute(
        select(Product.name)
        .where(Product.status == ProductStatus.ACTIVE)
        .order_by(Product.sales_count.desc())
        .limit(limit)
    )
    products = [row[0] for row in product_result.all()]

    return {
        "trending": categories + products[:5],
        "popular_categories": categories
    }
