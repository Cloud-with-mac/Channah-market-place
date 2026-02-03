from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, text
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel
from datetime import datetime
import time
import logging

from app.core.database import get_db
from app.core.sanitize import sanitize_search_query
from app.models.product import Product, ProductStatus
from app.models.category import Category
from app.models.vendor import Vendor, VendorStatus
from app.models.search_query import SearchQuery
from app.services.search import SearchService

router = APIRouter()
logger = logging.getLogger(__name__)


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
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Global search across products, categories, and vendors using FTS5"""
    start_time = time.time()
    q = sanitize_search_query(q) or q

    # Initialize search service
    search_service = SearchService(db)

    # Search products using FTS5
    try:
        products_data, total_products = await search_service.search_products(q, limit=limit)

        # Get full product objects for images
        if products_data:
            product_ids = [p["id"] for p in products_data]
            product_result = await db.execute(
                select(Product)
                .where(Product.id.in_(product_ids))
                .options(selectinload(Product.images))
            )
            products_map = {str(p.id): p for p in product_result.scalars().all()}

            # Enrich product data with images
            for p_data in products_data:
                product = products_map.get(p_data["id"])
                if product and product.images:
                    p_data["image"] = product.images[0].url
    except Exception as e:
        logger.error(f"FTS5 product search failed: {e}")
        # Fallback to simple search
        search_term = f"%{q}%"
        product_result = await db.execute(
            select(Product)
            .where(
                Product.status == ProductStatus.ACTIVE,
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                )
            )
            .options(selectinload(Product.images))
            .order_by(Product.rating.desc())
            .limit(limit)
        )
        products = product_result.scalars().all()
        products_data = [
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
        ]

    # Search categories
    search_term = f"%{q}%"
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

    # Log search query
    search_time_ms = int((time.time() - start_time) * 1000)
    search_log = SearchQuery(
        query=q,
        results_count=len(products_data) + len(categories) + len(vendors),
        search_time_ms=search_time_ms,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(search_log)
    try:
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log search query: {e}")
        await db.rollback()

    return SearchResponse(
        products=[
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "slug": p.get("slug"),
                "price": p.get("price"),
                "image": p.get("image"),
                "rating": p.get("rating"),
                "review_count": p.get("review_count")
            }
            for p in products_data
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
        total_results=len(products_data) + len(categories) + len(vendors),
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
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Advanced product search with filters and FTS5 support"""
    start_time = time.time()

    # Use FTS5 for text search if available
    if q and sort == "relevance":
        search_service = SearchService(db)
        try:
            # Get FTS5 results
            offset = (page - 1) * page_size
            fts_results, fts_total = await search_service.search_products_fts5(
                q, limit=page_size * 3, offset=0  # Get more results for filtering
            )

            # Apply filters to FTS5 results
            filtered_ids = []
            for result in fts_results:
                # We need to get full product to apply filters
                prod_result = await db.execute(
                    select(Product)
                    .where(Product.id == result["id"])
                    .options(
                        selectinload(Product.vendor),
                        selectinload(Product.category)
                    )
                )
                prod = prod_result.scalar_one_or_none()
                if not prod:
                    continue

                # Apply filters
                if category:
                    cat_result = await db.execute(
                        select(Category).where(Category.slug == category)
                    )
                    cat = cat_result.scalar_one_or_none()
                    if cat and prod.category_id != cat.id:
                        continue

                if vendor:
                    vendor_result = await db.execute(
                        select(Vendor).where(Vendor.slug == vendor)
                    )
                    v = vendor_result.scalar_one_or_none()
                    if v and prod.vendor_id != v.id:
                        continue

                if min_price is not None and prod.price < min_price:
                    continue
                if max_price is not None and prod.price > max_price:
                    continue
                if rating is not None and prod.rating < rating:
                    continue
                if in_stock and prod.quantity <= 0:
                    continue
                if on_sale and not (prod.compare_at_price and prod.compare_at_price > prod.price):
                    continue

                filtered_ids.append(str(prod.id))

            # Get paginated subset
            paginated_ids = filtered_ids[offset:offset + page_size]

            # Fetch full products
            if paginated_ids:
                product_result = await db.execute(
                    select(Product)
                    .where(Product.id.in_(paginated_ids))
                    .options(
                        selectinload(Product.images),
                        selectinload(Product.vendor),
                        selectinload(Product.category)
                    )
                )
                products = product_result.scalars().all()
                # Sort by FTS5 rank order
                products = sorted(products, key=lambda p: paginated_ids.index(str(p.id)))
            else:
                products = []

            total = len(filtered_ids)

        except Exception as e:
            logger.warning(f"FTS5 search failed, falling back to LIKE: {e}")
            # Fall back to standard search
            products, total = await _standard_product_search(
                db, q, category, vendor, min_price, max_price,
                rating, in_stock, on_sale, sort, page, page_size
            )

    else:
        # Standard search with filters
        products, total = await _standard_product_search(
            db, q, category, vendor, min_price, max_price,
            rating, in_stock, on_sale, sort, page, page_size
        )

    # Log search query
    if q:
        search_time_ms = int((time.time() - start_time) * 1000)
        search_log = SearchQuery(
            query=q,
            results_count=total,
            search_time_ms=search_time_ms,
            filters_applied=str({
                "category": category,
                "vendor": vendor,
                "min_price": float(min_price) if min_price else None,
                "max_price": float(max_price) if max_price else None,
                "rating": rating,
                "in_stock": in_stock,
                "on_sale": on_sale
            }),
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        db.add(search_log)
        try:
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to log search query: {e}")
            await db.rollback()

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
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
        filters=filters
    )


async def _standard_product_search(
    db: AsyncSession,
    q: Optional[str],
    category: Optional[str],
    vendor: Optional[str],
    min_price: Optional[Decimal],
    max_price: Optional[Decimal],
    rating: Optional[float],
    in_stock: Optional[bool],
    on_sale: Optional[bool],
    sort: str,
    page: int,
    page_size: int
) -> tuple:
    """Standard product search using LIKE queries"""
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

    return products, total


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    limit: int = 8,
    db: AsyncSession = Depends(get_db)
):
    """Autocomplete suggestions using FTS5"""
    search_service = SearchService(db)

    # Get suggestions from FTS5 or fallback
    suggestions = await search_service.get_suggestions(q, limit=limit)

    # Get category suggestions
    search_term = f"{q}%"
    category_result = await db.execute(
        select(Category.name)
        .where(
            Category.is_active == True,
            Category.name.ilike(search_term)
        )
        .limit(3)
    )
    categories = [row[0] for row in category_result.all()]

    # Get "Did you mean?" suggestion
    did_you_mean = None
    if len(suggestions) == 0:
        did_you_mean = await search_service.get_did_you_mean(q)

    return {
        "suggestions": suggestions,
        "categories": categories,
        "did_you_mean": did_you_mean
    }


@router.get("/trending")
async def trending_searches(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get trending search terms based on actual search analytics"""
    search_service = SearchService(db)

    # Get popular searches from analytics
    popular = await search_service.get_popular_searches(limit=limit)

    # Also get some popular product categories
    result = await db.execute(
        select(Category.name)
        .where(Category.is_active == True, Category.is_featured == True)
        .limit(5)
    )
    categories = [row[0] for row in result.all()]

    return {
        "trending": [item["query"] for item in popular],
        "popular_searches": popular,
        "popular_categories": categories
    }


@router.get("/analytics/popular")
async def popular_searches(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get popular search queries with analytics"""
    search_service = SearchService(db)
    return {
        "popular_searches": await search_service.get_popular_searches(limit=limit)
    }


@router.get("/analytics/zero-results")
async def zero_result_queries(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get search queries that returned zero results"""
    search_service = SearchService(db)
    return {
        "zero_result_queries": await search_service.get_zero_result_queries(limit=limit)
    }
