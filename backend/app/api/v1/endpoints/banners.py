from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
import json
import os
import uuid as uuid_lib

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
    images: Optional[List[str]] = None
    is_active: bool
    is_featured: bool = False
    sort_order: int
    countdown_end: Optional[datetime] = None
    countdown_label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj):
        # Parse images JSON string to list
        data = {}
        for field in cls.model_fields:
            value = getattr(obj, field, None)
            if field == 'images' and isinstance(value, str):
                try:
                    data[field] = json.loads(value) if value else []
                except:
                    data[field] = []
            else:
                data[field] = value
        return cls(**data)


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = "flash"
    color_from: str = "#3b82f6"
    color_to: str = "#1d4ed8"
    link_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
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
    is_featured: Optional[bool] = None
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


@router.get("/featured", response_model=BannerResponse)
async def get_featured_banner(db: AsyncSession = Depends(get_db)):
    """Get the active featured banner for large ad slot"""
    query = select(Banner).where(
        Banner.is_active == True,
        Banner.is_featured == True
    ).order_by(Banner.sort_order, Banner.created_at.desc()).limit(1)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    if not banner:
        # Return a default banner
        return BannerResponse(
            id=UUID('00000000-0000-0000-0000-000000000000'),
            title="Up to 70% Off Everything",
            subtitle="Limited time offer on thousands of products from verified suppliers worldwide",
            icon="sparkles",
            color_from="#9333ea",
            color_to="#ef4444",
            link_url="/products",
            image_url=None,
            is_active=True,
            is_featured=True,
            sort_order=0,
            countdown_end=None,
            countdown_label=None,
            created_at=datetime.utcnow()
        )
    return BannerResponse.model_validate(banner)


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
