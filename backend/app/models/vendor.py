import uuid
from datetime import datetime
from sqlalchemy import Integer, Column, String, Boolean, DateTime, Text, Float, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class VendorStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Business Information
    business_name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)

    # Contact Information
    business_email = Column(String(255), nullable=False)
    business_phone = Column(String(20), nullable=True)
    business_address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)

    # Verification
    status = Column(Enum(VendorStatus), default=VendorStatus.PENDING, nullable=False)
    tax_id = Column(String(100), nullable=True)
    business_registration = Column(String(255), nullable=True)  # Document URL
    verified_at = Column(DateTime, nullable=True)

    # Financial
    commission_rate = Column(Float, default=10.0, nullable=False)  # Platform commission percentage
    balance = Column(Numeric(12, 2), default=0.00, nullable=False)  # Pending payout balance
    total_earnings = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_sales = Column(Numeric(12, 2), default=0.00, nullable=False)

    # Bank Details for Payouts
    bank_name = Column(String(255), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    bank_account_number = Column(String(100), nullable=True)
    bank_routing_number = Column(String(100), nullable=True)
    bank_country = Column(String(100), nullable=True)

    # Stripe Connect for direct payouts
    stripe_account_id = Column(String(255), nullable=True)
    stripe_onboarding_complete = Column(Boolean, default=False)

    # Verification / Trust
    badge_level = Column(String(20), nullable=True, default=None)  # BRONZE, SILVER, GOLD or None
    trust_score = Column(Integer, default=0, nullable=False)  # 0-100
    verification_status = Column(String(20), default="UNVERIFIED", nullable=False)  # UNVERIFIED, PENDING, VERIFIED

    # Ratings
    rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)

    # Store Profile
    website = Column(String(500), nullable=True)
    certifications = Column(Text, nullable=True)  # JSON array of strings
    main_products = Column(Text, nullable=True)  # JSON array of strings
    monthly_output = Column(String(100), nullable=True)
    export_percentage = Column(String(50), nullable=True)
    main_markets = Column(Text, nullable=True)  # JSON array of strings
    employees = Column(String(50), nullable=True)
    year_established = Column(Integer, nullable=True)
    response_rate = Column(Float, default=0.0, nullable=True)
    response_time = Column(String(50), nullable=True)

    # Fulfillment
    processing_days = Column(Integer, default=2, nullable=False)  # Days to process/prepare order
    shipping_days = Column(Integer, default=5, nullable=False)  # Days to ship/deliver

    # Settings
    is_featured = Column(Boolean, default=False, nullable=False)
    auto_approve_products = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="vendor")
    products = relationship("Product", back_populates="vendor", cascade="all, delete-orphan")
    payouts = relationship("Payout", back_populates="vendor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Vendor {self.business_name}>"


class VendorPayout(Base):
    __tablename__ = "vendor_payouts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False)

    payment_method = Column(String(50), nullable=False)  # bank_transfer, stripe, paypal
    transaction_id = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    vendor = relationship("Vendor", back_populates="payouts")

    def __repr__(self):
        return f"<VendorPayout {self.id} - {self.amount}>"
