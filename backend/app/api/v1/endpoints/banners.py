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
from app.models.banner_image import BannerImage

router = APIRouter()


# Schemas
class BannerImageResponse(BaseModel):
    id: UUID
    image_url: str
    sort_order: int
    alt_text: Optional[str] = None

    model_config = {"from_attributes": True}


class BannerResponse(BaseModel):
    id: UUID
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    color_from: str
    color_to: str
    link_url: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None  # For backward compatibility, derived from banner_images
    banner_images: Optional[List[BannerImageResponse]] = None
    is_active: bool
    is_featured: bool = False
    sort_order: int
    countdown_end: Optional[datetime] = None
    countdown_label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj):
        # Build data from object
        data = {}
        for field in cls.model_fields:
            value = getattr(obj, field, None)

            if field == 'images':
                # Backward compatibility: derive from banner_images relationship
                if hasattr(obj, 'banner_images') and obj.banner_images:
                    data[field] = [img.image_url for img in obj.banner_images]
                elif isinstance(value, str):
                    # Fallback to legacy JSON field
                    try:
                        data[field] = json.loads(value) if value else []
                    except:
                        data[field] = []
                else:
                    data[field] = []
            elif field == 'banner_images':
                # Convert relationship objects to response models
                if hasattr(obj, 'banner_images') and obj.banner_images:
                    data[field] = [BannerImageResponse.model_validate(img) for img in obj.banner_images]
                else:
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
    images: Optional[str] = None  # JSON string of image URLs for backward compatibility
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
    images: Optional[str] = None  # JSON string of image URLs for backward compatibility
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
    banner_data = data.model_dump()

    # Extract images if provided (backward compatibility)
    images_json = banner_data.pop('images', None)

    banner = Banner(**banner_data)
    db.add(banner)
    await db.flush()  # Flush to get banner.id

    # Handle images: parse JSON string and create BannerImage records
    if images_json:
        try:
            image_urls = json.loads(images_json) if isinstance(images_json, str) else images_json
            if isinstance(image_urls, list):
                for idx, url in enumerate(image_urls[:10]):  # Max 10 images
                    banner_image = BannerImage(
                        banner_id=banner.id,
                        image_url=url,
                        sort_order=idx
                    )
                    db.add(banner_image)
        except Exception as e:
            # Silently fail if JSON parsing fails
            pass

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

    update_data = data.model_dump(exclude_unset=True)

    # Handle images separately
    images_json = update_data.pop('images', None)

    # Update banner fields
    for field, value in update_data.items():
        setattr(banner, field, value)

    # Update banner images if provided
    if images_json is not None:
        # Delete existing banner images
        await db.execute(
            select(BannerImage).where(BannerImage.banner_id == banner_id)
        )
        for img in banner.banner_images:
            await db.delete(img)

        # Create new banner images
        try:
            image_urls = json.loads(images_json) if isinstance(images_json, str) else images_json
            if isinstance(image_urls, list):
                for idx, url in enumerate(image_urls[:10]):  # Max 10 images
                    banner_image = BannerImage(
                        banner_id=banner.id,
                        image_url=url,
                        sort_order=idx
                    )
                    db.add(banner_image)
        except Exception as e:
            # Silently fail if JSON parsing fails
            pass

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
