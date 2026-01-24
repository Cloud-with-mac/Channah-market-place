import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="wishlist")
    product = relationship("Product", back_populates="wishlists")

    def __repr__(self):
        return f"<Wishlist {self.user_id} - {self.product_id}>"
