from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class PayoutItemResponse(BaseModel):
    id: UUID
    order_id: Optional[UUID]
    order_amount: Decimal
    commission_amount: Decimal
    vendor_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    stripe_transfer_id: Optional[str]
    transaction_id: Optional[str]
    scheduled_date: Optional[datetime]
    paid_date: Optional[datetime]
    notes: Optional[str]
    admin_notes: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayoutDetailResponse(PayoutResponse):
    items: List[PayoutItemResponse] = []
    vendor_name: Optional[str] = None

    class Config:
        from_attributes = True


class PayoutRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Payout amount")
    payment_method: str = Field(..., description="Payment method: bank_transfer, stripe, or paypal")


class EarningsResponse(BaseModel):
    current_balance: Decimal
    pending_balance: Decimal
    lifetime_earnings: Decimal
    this_month_earnings: Decimal
    pending_orders_count: int
    pending_orders_value: Decimal


class PayoutApprove(BaseModel):
    stripe_transfer_id: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class PayoutReject(BaseModel):
    reason: str = Field(..., description="Reason for rejection")
