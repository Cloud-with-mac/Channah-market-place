from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.common import BaseSchema


class ReviewCreate(BaseModel):
    product_id: UUID
    order_id: Optional[UUID] = None
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    images: Optional[List[str]] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    images: Optional[List[str]] = None


class ReviewUserResponse(BaseSchema):
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    full_name: Optional[str] = None  # Computed: first_name + last_name
    avatar_url: Optional[str]
    avatar: Optional[str] = None  # Alias for avatar_url (frontend compatibility)


class ReviewResponse(BaseSchema):
    id: UUID
    user_id: UUID
    product_id: UUID
    rating: int
    title: Optional[str]
    content: Optional[str]
    images: Optional[List[str]]
    is_verified_purchase: bool
    is_approved: bool
    sentiment_label: Optional[str]
    helpful_count: int
    not_helpful_count: int
    vendor_response: Optional[str]
    vendor_response_at: Optional[datetime]
    created_at: datetime
    user: Optional[ReviewUserResponse]


class VendorReviewResponse(BaseModel):
    response: str


class ReviewVoteRequest(BaseModel):
    helpful: bool


class ReviewStatsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict  # {1: count, 2: count, ...}
