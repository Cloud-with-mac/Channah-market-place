from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from app.schemas.common import BaseSchema


class CartItemCreate(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int = Field(default=1, ge=1)
    custom_options: Optional[Dict[str, str]] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemProductResponse(BaseSchema):
    id: UUID
    name: str
    slug: str
    price: Decimal
    primary_image: Optional[str]
    quantity: int  # Available stock
    vendor_name: str
    shipping_cost: Decimal = Decimal("0")


class CartItemResponse(BaseSchema):
    id: UUID
    product_id: UUID
    variant_id: Optional[UUID]
    quantity: int
    price: Decimal
    total: Decimal
    custom_options: Optional[Dict[str, str]]
    product: CartItemProductResponse
    variant_name: Optional[str]
    created_at: datetime


class CartResponse(BaseSchema):
    id: UUID
    user_id: Optional[UUID]
    session_id: Optional[str]
    items: List[CartItemResponse]
    item_count: int
    subtotal: Decimal
    discount_amount: Decimal
    total: Decimal
    coupon_code: Optional[str]
    updated_at: datetime


class ApplyCouponRequest(BaseModel):
    coupon_code: str


class BulkCartSyncRequest(BaseModel):
    """Request to sync multiple cart items at once (fixes N+1 query issue)"""
    items: List[CartItemCreate]
    coupon_code: Optional[str] = None
    clear_existing: bool = True  # Whether to clear existing items before syncing


class CartVendorGroup(BaseModel):
    vendor_id: UUID
    vendor_name: str
    items: List[CartItemResponse]
    subtotal: Decimal
