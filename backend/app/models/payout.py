import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"


class Payout(Base):
    """Enhanced payout model with more detailed tracking"""
    __tablename__ = "payouts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False)

    # Payment details
    payment_method = Column(String(50), nullable=False)  # bank_transfer, stripe, paypal
    stripe_transfer_id = Column(String(255), nullable=True)  # Stripe transfer ID
    transaction_id = Column(String(255), nullable=True)  # External transaction reference

    # Scheduling
    scheduled_date = Column(DateTime, nullable=True)  # When payout is scheduled
    paid_date = Column(DateTime, nullable=True)  # When payout was completed

    # Notes and metadata
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    vendor = relationship("Vendor", back_populates="payouts")
    items = relationship("PayoutItem", back_populates="payout", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Payout {self.id} - {self.amount} {self.currency}>"


class PayoutItem(Base):
    """Individual order items included in a payout"""
    __tablename__ = "payout_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    payout_id = Column(GUID(), ForeignKey("payouts.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    # Commission details
    order_amount = Column(Numeric(12, 2), nullable=False)  # Total order item amount
    commission_amount = Column(Numeric(12, 2), nullable=False)  # Platform commission
    vendor_amount = Column(Numeric(12, 2), nullable=False)  # Amount vendor receives

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    payout = relationship("Payout", back_populates="items")
    order = relationship("Order")

    def __repr__(self):
        return f"<PayoutItem {self.id}>"
