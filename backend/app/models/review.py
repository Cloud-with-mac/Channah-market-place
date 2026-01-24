import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID, StringArray


class Review(Base):
    __tablename__ = "reviews"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    images = Column(StringArray(), nullable=True)  # Review images

    # Moderation
    is_verified_purchase = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    # AI Sentiment Analysis
    sentiment_score = Column(Integer, nullable=True)  # -100 to 100
    sentiment_label = Column(String(50), nullable=True)  # positive, negative, neutral
    ai_summary = Column(Text, nullable=True)

    # Helpful votes
    helpful_count = Column(Integer, default=0, nullable=False)
    not_helpful_count = Column(Integer, default=0, nullable=False)

    # Vendor response
    vendor_response = Column(Text, nullable=True)
    vendor_response_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

    def __repr__(self):
        return f"<Review {self.id} - {self.rating} stars>"
