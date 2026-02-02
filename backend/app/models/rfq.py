import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID


class RFQStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    QUOTED = "quoted"
    NEGOTIATING = "negotiating"
    AWARDED = "awarded"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class QuoteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(GUID(), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    quantity = Column(Integer, nullable=False)
    unit = Column(String(50), default="pieces", nullable=False)
    target_price = Column(Float, nullable=True)
    currency = Column(String(3), default="GBP", nullable=False)

    delivery_deadline = Column(DateTime, nullable=True)
    shipping_address = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)  # JSON string
    attachments = Column(Text, nullable=True)  # JSON array of file URLs

    status = Column(Enum(RFQStatus), default=RFQStatus.DRAFT, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    buyer = relationship("User", backref="rfqs")
    product = relationship("Product", backref="rfqs")
    category = relationship("Category", backref="rfqs")
    quotes = relationship("RFQQuote", back_populates="rfq", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RFQ {self.title}>"


class RFQQuote(Base):
    __tablename__ = "rfq_quotes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(GUID(), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    currency = Column(String(3), default="GBP", nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    minimum_order_quantity = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    valid_until = Column(DateTime, nullable=False)

    status = Column(Enum(QuoteStatus), default=QuoteStatus.PENDING, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    rfq = relationship("RFQ", back_populates="quotes")
    vendor = relationship("Vendor", backref="rfq_quotes")

    def __repr__(self):
        return f"<RFQQuote {self.id}>"
