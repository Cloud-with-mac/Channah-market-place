import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class PaymentType(str, enum.Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    PAYOUT = "payout"


class PaymentGateway(str, enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    FLUTTERWAVE = "flutterwave"
    RAZORPAY = "razorpay"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)

    type = Column(Enum(PaymentType), default=PaymentType.PAYMENT, nullable=False)
    gateway = Column(Enum(PaymentGateway), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    fee = Column(Numeric(12, 2), default=0.00, nullable=False)  # Gateway fee

    # Gateway-specific IDs
    gateway_transaction_id = Column(String(255), nullable=True)
    gateway_payment_intent = Column(String(255), nullable=True)
    gateway_customer_id = Column(String(255), nullable=True)

    # Card details (masked)
    card_brand = Column(String(50), nullable=True)
    card_last4 = Column(String(4), nullable=True)
    card_exp_month = Column(String(2), nullable=True)
    card_exp_year = Column(String(4), nullable=True)

    # Response
    gateway_response = Column(Text, nullable=True)  # JSON string
    failure_reason = Column(Text, nullable=True)

    # Metadata
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")

    def __repr__(self):
        return f"<Payment {self.id} - {self.amount} {self.currency}>"


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    gateway = Column(Enum(PaymentGateway), nullable=False)
    gateway_customer_id = Column(String(255), nullable=True)
    gateway_payment_method_id = Column(String(255), nullable=True)

    type = Column(String(50), nullable=False)  # card, bank_account, wallet
    brand = Column(String(50), nullable=True)
    last4 = Column(String(4), nullable=True)
    exp_month = Column(String(2), nullable=True)
    exp_year = Column(String(4), nullable=True)
    holder_name = Column(String(255), nullable=True)

    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="payment_methods")

    def __repr__(self):
        return f"<PaymentMethod {self.type} - {self.last4}>"
