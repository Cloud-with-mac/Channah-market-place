import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class NotificationType(str, enum.Enum):
    ORDER_PLACED = "order_placed"
    ORDER_CONFIRMED = "order_confirmed"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"
    REFUND_PROCESSED = "refund_processed"
    NEW_REVIEW = "new_review"
    REVIEW_RESPONSE = "review_response"
    PRICE_DROP = "price_drop"
    BACK_IN_STOCK = "back_in_stock"
    NEW_MESSAGE = "new_message"
    VENDOR_APPROVED = "vendor_approved"
    PAYOUT_PROCESSED = "payout_processed"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Link to related entity
    entity_type = Column(String(50), nullable=True)  # order, product, review, etc.
    entity_id = Column(GUID(), nullable=True)
    action_url = Column(String(500), nullable=True)

    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    is_email_sent = Column(Boolean, default=False, nullable=False)
    is_push_sent = Column(Boolean, default=False, nullable=False)

    # Extra data
    extra_data = Column(Text, nullable=True)  # JSON string

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.type} - {self.title}>"
