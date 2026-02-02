from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.wishlist import Wishlist
from app.models.product import Product
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.delete("/me", response_model=MessageResponse)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete current user account"""
    # Soft delete - just deactivate
    current_user.is_active = False
    await db.commit()

    return MessageResponse(message="Account deactivated successfully")


# Admin endpoints

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    role: str = None,
    is_active: bool = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    query = select(User)

    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return [UserResponse.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.model_validate(user)


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Activate/deactivate user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = is_active
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update user role (admin only)"""
    if role not in ["customer", "vendor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = role
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


# ============ WISHLIST ENDPOINTS ============

class WishlistAddRequest(BaseModel):
    product_id: UUID


class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    name: str
    slug: str
    price: float
    compare_at_price: float | None
    image: str | None
    rating: float | None
    review_count: int
    quantity: int
    created_at: str

class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse]


@router.get("/me/wishlist", response_model=WishlistResponse)
async def get_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's wishlist"""
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == current_user.id)
        .options(selectinload(Wishlist.product))
        .order_by(Wishlist.created_at.desc())
    )
    wishlist_items = result.scalars().all()

    items = []
    for item in wishlist_items:
        product = item.product
        if product:
            items.append(WishlistItemResponse(
                id=str(item.id),
                product_id=str(product.id),
                name=product.name,
                slug=product.slug,
                price=float(product.price),
                compare_at_price=float(product.compare_at_price) if product.compare_at_price else None,
                image=product.images[0].url if product.images and len(product.images) > 0 else None,
                rating=float(product.rating) if product.rating else None,
                review_count=product.review_count or 0,
                quantity=product.quantity or 0,
                created_at=item.created_at.isoformat()
            ))

    return WishlistResponse(items=items)


@router.post("/me/wishlist", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    data: WishlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add product to wishlist"""
    product_id = data.product_id
    # Check if product exists
    product_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check if already in wishlist
    existing = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already in wishlist"
        )

    # Add to wishlist
    wishlist_item = Wishlist(
        user_id=current_user.id,
        product_id=product_id
    )
    db.add(wishlist_item)
    await db.commit()

    return MessageResponse(message="Product added to wishlist")


@router.delete("/me/wishlist/{product_id}", response_model=MessageResponse)
async def remove_from_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove product from wishlist"""
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id
        )
    )
    wishlist_item = result.scalar_one_or_none()

    if not wishlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not in wishlist"
        )

    await db.delete(wishlist_item)
    await db.commit()

    return MessageResponse(message="Product removed from wishlist")
