import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID


class BannerImage(Base):
    __tablename__ = "banner_images"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    banner_id = Column(GUID(), ForeignKey("banners.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    alt_text = Column(String(200), nullable=True)  # Optional alt text for accessibility

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    banner = relationship("Banner", back_populates="banner_images")

    def __repr__(self):
        return f"<BannerImage {self.image_url}>"
