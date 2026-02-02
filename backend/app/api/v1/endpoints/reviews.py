from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
import math

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor
from app.models.user import User
from app.models.vendor import Vendor
from app.models.product import Product
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.schemas.review import (
    ReviewCreate, ReviewUpdate, ReviewResponse, ReviewUserResponse,
    VendorReviewResponse, ReviewVoteRequest, ReviewStatsResponse
)
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/product/{product_id}")
async def get_product_reviews(
    product_id: UUID,
    skip: int = 0,
    limit: int = 20,
    page: int = 1,
    sort_by: str = "created_at",
    sort: str = None,  # Frontend sends 'sort' parameter
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a product with stats"""
    # Use sort parameter if provided (frontend compatibility)
    actual_sort = sort or sort_by

    query = select(Review).where(
        Review.product_id == product_id,
        Review.is_approved == True
    ).options(selectinload(Review.user))

    if actual_sort == "rating_high" or actual_sort == "highest":
        query = query.order_by(Review.rating.desc())
    elif actual_sort == "rating_low" or actual_sort == "lowest":
        query = query.order_by(Review.rating.asc())
    elif actual_sort == "helpful":
        query = query.order_by(Review.helpful_count.desc())
    elif actual_sort == "oldest":
        query = query.order_by(Review.created_at.asc())
    else:  # newest or default
        query = query.order_by(Review.created_at.desc())

    actual_skip = skip if skip > 0 else (page - 1) * limit
    query = query.offset(actual_skip).limit(limit)
    result = await db.execute(query)
    reviews = result.scalars().all()

    # Get stats
    stats_result = await db.execute(
        select(
            func.avg(Review.rating),
            func.count(Review.id)
        ).where(
            Review.product_id == product_id,
            Review.is_approved == True
        )
    )
    avg_rating, total_reviews = stats_result.one()

    # Get rating distribution
    dist_result = await db.execute(
        select(Review.rating, func.count(Review.id))
        .where(
            Review.product_id == product_id,
            Review.is_approved == True
        )
        .group_by(Review.rating)
    )
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in dist_result.all():
        distribution[rating] = count

    review_list = [
        ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            product_id=r.product_id,
            rating=r.rating,
            title=r.title,
            content=r.content,
            images=r.images,
            is_verified_purchase=r.is_verified_purchase,
            is_approved=r.is_approved,
            sentiment_label=r.sentiment_label,
            helpful_count=r.helpful_count,
            not_helpful_count=r.not_helpful_count,
            vendor_response=r.vendor_response,
            vendor_response_at=r.vendor_response_at,
            created_at=r.created_at,
            user=ReviewUserResponse(
                id=r.user.id,
                first_name=r.user.first_name,
                last_name=r.user.last_name,
                full_name=f"{r.user.first_name} {r.user.last_name or ''}".strip(),
                avatar_url=r.user.avatar_url,
                avatar=r.user.avatar_url  # Alias for frontend
            ) if r.user else None
        )
        for r in reviews
    ]

    # Return format expected by frontend
    return {
        "reviews": [r.model_dump() for r in review_list],
        "results": [r.model_dump() for r in review_list],  # Alias for frontend compatibility
        "stats": {
            "averageRating": float(avg_rating or 0),
            "totalReviews": total_reviews or 0,
            "distribution": distribution
        },
        "total": total_reviews or 0,
        "page": page,
        "page_size": limit,
        "total_pages": math.ceil((total_reviews or 1) / limit),
        "has_next": page < math.ceil((total_reviews or 1) / limit),
        "has_prev": page > 1,
    }


@router.get("/product/{product_id}/stats", response_model=ReviewStatsResponse)
async def get_product_review_stats(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get review statistics for a product"""
    # Get average rating and count
    result = await db.execute(
        select(
            func.avg(Review.rating),
            func.count(Review.id)
        ).where(
            Review.product_id == product_id,
            Review.is_approved == True
        )
    )
    avg_rating, total_reviews = result.one()

    # Get rating distribution
    dist_result = await db.execute(
        select(Review.rating, func.count(Review.id))
        .where(
            Review.product_id == product_id,
            Review.is_approved == True
        )
        .group_by(Review.rating)
    )
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in dist_result.all():
        distribution[rating] = count

    return ReviewStatsResponse(
        average_rating=float(avg_rating or 0),
        total_reviews=total_reviews or 0,
        rating_distribution=distribution
    )


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new review"""
    # Check product exists
    product_result = await db.execute(
        select(Product).where(Product.id == review_data.product_id)
    )
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user already reviewed this product
    existing_result = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.product_id == review_data.product_id
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # Check if verified purchase
    is_verified = False
    if review_data.order_id:
        order_result = await db.execute(
            select(OrderItem).where(
                OrderItem.order_id == review_data.order_id,
                OrderItem.product_id == review_data.product_id
            )
        )
        if order_result.scalar_one_or_none():
            is_verified = True

    review = Review(
        user_id=current_user.id,
        product_id=review_data.product_id,
        order_id=review_data.order_id,
        rating=review_data.rating,
        title=review_data.title,
        content=review_data.content,
        images=review_data.images,
        is_verified_purchase=is_verified
    )
    db.add(review)

    # Update product rating
    await db.flush()
    rating_result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.product_id == review_data.product_id, Review.is_approved == True)
    )
    avg_rating, review_count = rating_result.one()
    product.rating = float(avg_rating or 0)
    product.review_count = review_count or 0

    # Update vendor rating
    if product.vendor:
        vendor_rating_result = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .join(Product)
            .where(Product.vendor_id == product.vendor_id, Review.is_approved == True)
        )
        vendor_avg, vendor_count = vendor_rating_result.one()
        product.vendor.rating = float(vendor_avg or 0)
        product.vendor.total_reviews = vendor_count or 0

    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        product_id=review.product_id,
        rating=review.rating,
        title=review.title,
        content=review.content,
        images=review.images,
        is_verified_purchase=review.is_verified_purchase,
        is_approved=review.is_approved,
        sentiment_label=review.sentiment_label,
        helpful_count=review.helpful_count,
        not_helpful_count=review.not_helpful_count,
        vendor_response=review.vendor_response,
        vendor_response_at=review.vendor_response_at,
        created_at=review.created_at,
        user=None
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: UUID,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a review"""
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == current_user.id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)

    await db.commit()
    await db.refresh(review)

    return ReviewResponse.model_validate(review)


@router.delete("/{review_id}", response_model=MessageResponse)
async def delete_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a review"""
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == current_user.id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    product_id = review.product_id
    await db.delete(review)

    # Update product rating
    product_result = await db.execute(select(Product).where(Product.id == product_id))
    product = product_result.scalar_one_or_none()
    if product:
        rating_result = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.product_id == product_id, Review.is_approved == True)
        )
        avg_rating, review_count = rating_result.one()
        product.rating = float(avg_rating or 0)
        product.review_count = review_count or 0

    await db.commit()

    return MessageResponse(message="Review deleted successfully")


@router.post("/{review_id}/vote", response_model=MessageResponse)
async def vote_review(
    review_id: UUID,
    vote_data: ReviewVoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Vote on a review's helpfulness"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if vote_data.helpful:
        review.helpful_count += 1
    else:
        review.not_helpful_count += 1

    await db.commit()

    return MessageResponse(message="Vote recorded")



@router.post("/{review_id}/helpful", response_model=MessageResponse)
async def mark_review_helpful(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a review as helpful (simple increment, no body needed)"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.helpful_count += 1
    await db.commit()

    return MessageResponse(message="Marked as helpful")


# Vendor endpoints

@router.post("/{review_id}/respond", response_model=ReviewResponse)
async def respond_to_review(
    review_id: UUID,
    response_data: VendorReviewResponse,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Vendor response to a review"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.product))
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.product.vendor_id != vendor.id:
        raise HTTPException(status_code=403, detail="Not your product")

    from datetime import datetime
    review.vendor_response = response_data.response
    review.vendor_response_at = datetime.utcnow()

    await db.commit()
    await db.refresh(review)

    return ReviewResponse.model_validate(review)


@router.get("/vendor/reviews", response_model=List[ReviewResponse])
async def get_vendor_reviews(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews for vendor's products"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await db.execute(
        select(Review)
        .join(Product)
        .where(Product.vendor_id == vendor.id)
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = result.scalars().all()

    return [ReviewResponse.model_validate(r) for r in reviews]
