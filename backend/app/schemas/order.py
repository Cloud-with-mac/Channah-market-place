from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from app.schemas.common import BaseSchema


class ShippingAddress(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    address_line1: str = Field(..., min_length=1)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=1)
    state: Optional[str] = None
    postal_code: str = Field(..., min_length=1)
    country: str = Field(..., min_length=1)


class BillingAddress(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    address_line1: str = Field(..., min_length=1)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=1)
    state: Optional[str] = None
    postal_code: str = Field(..., min_length=1)
    country: str = Field(..., min_length=1)


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    billing_address: Optional[BillingAddress] = None
    billing_same_as_shipping: bool = True
    shipping_method: Optional[str] = None
    payment_method: str  # stripe, paypal, flutterwave, razorpay
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None
    currency: Optional[str] = "USD"  # User's selected currency


class OrderItemResponse(BaseSchema):
    id: UUID
    product_id: Optional[UUID]
    vendor_id: Optional[UUID]
    product_name: str
    product_sku: Optional[str]
    product_image: Optional[str]
    variant_name: Optional[str]
    quantity: int
    unit_price: Decimal
    total: Decimal
    status: str
    tracking_number: Optional[str]


class OrderStatusHistoryResponse(BaseSchema):
    id: UUID
    status: str
    notes: Optional[str]
    created_at: datetime


class OrderResponse(BaseSchema):
    id: UUID
    order_number: str
    user_id: Optional[UUID]
    status: str
    payment_status: str

    subtotal: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    currency: str

    coupon_code: Optional[str]

    # Shipping
    shipping_first_name: str
    shipping_last_name: str
    shipping_email: str
    shipping_phone: Optional[str]
    shipping_address_line1: str
    shipping_address_line2: Optional[str]
    shipping_city: str
    shipping_state: Optional[str]
    shipping_postal_code: str
    shipping_country: str

    shipping_method: Optional[str]
    tracking_number: Optional[str]
    carrier: Optional[str]
    estimated_delivery: Optional[datetime]

    payment_method: Optional[str]
    customer_notes: Optional[str]

    created_at: datetime
    paid_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]

    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []


class OrderListResponse(BaseSchema):
    id: UUID
    order_number: str
    status: str
    payment_status: str
    total: Decimal
    currency: str
    item_count: int
    created_at: datetime


class OrderUpdateStatus(BaseModel):
    status: str
    notes: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None


class OrderTrackingItemResponse(BaseModel):
    id: UUID
    product_name: str
    quantity: int
    price: Decimal
    status: str
    tracking_number: Optional[str] = None


class OrderTrackingResponse(BaseModel):
    order_number: str
    status: str
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Shipping address
    shipping_first_name: str
    shipping_last_name: str
    shipping_city: str
    shipping_state: Optional[str]
    shipping_country: str

    # Prices
    subtotal: Decimal
    shipping_cost: Decimal
    tax: Decimal
    total: Decimal
    currency: str

    # Tracking info
    tracking_number: Optional[str]
    carrier: Optional[str]
    estimated_delivery: Optional[datetime]

    # Items
    items: List[OrderTrackingItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []


class RefundRequest(BaseModel):
    order_item_ids: Optional[List[UUID]] = None  # None means full refund
    reason: str
    amount: Optional[Decimal] = None  # None means full amount
