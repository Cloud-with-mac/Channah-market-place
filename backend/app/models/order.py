import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Enum, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    FAILED = "failed"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)

    # Status
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    # Pricing
    subtotal = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    shipping_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)

    # Coupon
    coupon_code = Column(String(50), nullable=True)

    # Shipping Address
    shipping_first_name = Column(String(100), nullable=False)
    shipping_last_name = Column(String(100), nullable=False)
    shipping_email = Column(String(255), nullable=False)
    shipping_phone = Column(String(20), nullable=True)
    shipping_address_line1 = Column(String(255), nullable=False)
    shipping_address_line2 = Column(String(255), nullable=True)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=False)
    shipping_country = Column(String(100), nullable=False)

    # Billing Address
    billing_same_as_shipping = Column(Boolean, default=True, nullable=False)
    billing_first_name = Column(String(100), nullable=True)
    billing_last_name = Column(String(100), nullable=True)
    billing_address_line1 = Column(String(255), nullable=True)
    billing_address_line2 = Column(String(255), nullable=True)
    billing_city = Column(String(100), nullable=True)
    billing_state = Column(String(100), nullable=True)
    billing_postal_code = Column(String(20), nullable=True)
    billing_country = Column(String(100), nullable=True)

    # Shipping Details
    shipping_method = Column(String(100), nullable=True)
    tracking_number = Column(String(255), nullable=True)
    carrier = Column(String(100), nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)

    # Payment
    payment_method = Column(String(50), nullable=True)  # stripe, paypal, flutterwave, razorpay
    payment_intent_id = Column(String(255), nullable=True)
    transaction_id = Column(String(255), nullable=True)

    # Notes
    customer_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)

    # AI Fraud Detection
    fraud_score = Column(Float, nullable=True)
    fraud_flags = Column(Text, nullable=True)  # JSON string
    is_flagged = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusHistory.created_at.desc()")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order {self.order_number}>"

    @staticmethod
    def generate_order_number():
        """Generate unique order number"""
        import random
        import string
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD-{timestamp}-{random_str}"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    variant_id = Column(GUID(), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)

    # Product snapshot (in case product is deleted)
    product_name = Column(String(500), nullable=False)
    product_sku = Column(String(100), nullable=True)
    product_image = Column(String(500), nullable=True)
    variant_name = Column(String(255), nullable=True)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)

    # Vendor commission
    commission_rate = Column(Float, nullable=False)
    commission_amount = Column(Numeric(12, 2), nullable=False)
    vendor_amount = Column(Numeric(12, 2), nullable=False)

    # Item status (for partial fulfillment)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    tracking_number = Column(String(255), nullable=True)

    # Refund
    refund_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    refund_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    vendor = relationship("Vendor")
    variant = relationship("ProductVariant")

    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)

    status = Column(Enum(OrderStatus), nullable=False)
    notes = Column(Text, nullable=True)
    changed_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="status_history")

    def __repr__(self):
        return f"<OrderStatusHistory {self.status}>"
