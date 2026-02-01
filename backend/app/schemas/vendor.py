from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from app.schemas.common import BaseSchema


class VendorCreate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    business_email: EmailStr
    business_phone: Optional[str] = None
    description: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_id: Optional[str] = None


class VendorUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=255)
    business_email: Optional[EmailStr] = None
    business_phone: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    website: Optional[str] = None
    certifications: Optional[List[str]] = None
    main_products: Optional[List[str]] = None
    monthly_output: Optional[str] = None
    export_percentage: Optional[str] = None
    main_markets: Optional[List[str]] = None
    employees: Optional[str] = None
    year_established: Optional[int] = None
    response_time: Optional[str] = None
    processing_days: Optional[int] = None
    shipping_days: Optional[int] = None


class VendorBankDetails(BaseModel):
    bank_name: str
    bank_account_name: str
    bank_account_number: str
    bank_routing_number: Optional[str] = None
    bank_country: str


class VendorResponse(BaseSchema):
    id: UUID
    user_id: UUID
    business_name: str
    slug: str
    description: Optional[str]
    logo_url: Optional[str]
    banner_url: Optional[str]
    business_email: str
    business_phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    status: str
    commission_rate: float
    balance: Decimal
    total_earnings: Decimal
    total_sales: Decimal
    rating: float
    total_reviews: int
    is_featured: bool
    website: Optional[str] = None
    certifications: Optional[List[str]] = None
    main_products: Optional[List[str]] = None
    monthly_output: Optional[str] = None
    export_percentage: Optional[str] = None
    main_markets: Optional[List[str]] = None
    employees: Optional[str] = None
    year_established: Optional[int] = None
    response_rate: Optional[float] = None
    response_time: Optional[str] = None
    processing_days: int = 2
    shipping_days: int = 5
    created_at: datetime
    verified_at: Optional[datetime]


class VendorDashboardStats(BaseModel):
    total_products: int
    active_products: int
    total_orders: int
    pending_orders: int
    total_revenue: Decimal
    this_month_revenue: Decimal
    pending_balance: Decimal
    average_rating: float
    total_reviews: int


class VendorPayoutRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method: str  # bank_transfer, stripe, paypal


class VendorPayoutResponse(BaseSchema):
    id: UUID
    vendor_id: UUID
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    transaction_id: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime
