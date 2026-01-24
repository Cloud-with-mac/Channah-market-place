from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.common import BaseSchema


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    is_featured: bool = False


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class CategoryResponse(BaseSchema):
    id: UUID
    parent_id: Optional[UUID]
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    icon: Optional[str]
    meta_title: Optional[str]
    meta_description: Optional[str]
    sort_order: int
    is_active: bool
    is_featured: bool
    created_at: datetime


class CategoryChildResponse(BaseSchema):
    """Subcategory response without nested children"""
    id: UUID
    parent_id: Optional[UUID]
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    icon: Optional[str]
    is_active: bool
    product_count: int = 0


class CategoryDetailResponse(CategoryResponse):
    """Category with children for detail view"""
    children: List[CategoryChildResponse] = []


class CategoryTreeResponse(CategoryResponse):
    children: List['CategoryTreeResponse'] = []
    product_count: int = 0


CategoryTreeResponse.model_rebuild()
