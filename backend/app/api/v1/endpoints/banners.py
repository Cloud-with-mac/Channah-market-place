from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.banner import Banner

router = APIRouter()


# Schemas
class BannerResponse(BaseModel):
    id: UUID
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    color_from: str
    color_to: str
    link_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    sort_order: int
    countdown_end: Optional[datetime] = None
    countdown_label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = "flash"
    color_from: str = "#3b82f6"
    color_to: str = "#1d4ed8"
    link_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    countdown_end: Optional[datetime] = None
    countdown_label: Optional[str] = None


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    color_from: Optional[str] = None
    color_to: Optional[str] = None
    link_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    countdown_end: Optional[datetime] = None
    countdown_label: Optional[str] = None


# Public endpoints
@router.get("/", response_model=List[BannerResponse])
async def list_banners(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get all banners (public)"""
    query = select(Banner).order_by(Banner.sort_order, Banner.created_at.desc())
    if active_only:
        query = query.where(Banner.is_active == True)
    result = await db.execute(query)
    banners = result.scalars().all()
    return [BannerResponse.model_validate(b) for b in banners]


# Admin endpoints
@router.post("/", response_model=BannerResponse, status_code=status.HTTP_201_CREATED)
async def create_banner(
    data: BannerCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a banner (admin only)"""
    banner = Banner(**data.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return BannerResponse.model_validate(banner)


@router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: UUID,
    data: BannerUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a banner (admin only)"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)

    await db.commit()
    await db.refresh(banner)
    return BannerResponse.model_validate(banner)


@router.delete("/{banner_id}")
async def delete_banner(
    banner_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a banner (admin only)"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    await db.delete(banner)
    await db.commit()
    return {"message": "Banner deleted"}
