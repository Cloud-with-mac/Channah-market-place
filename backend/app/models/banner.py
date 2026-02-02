import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from app.core.database import Base
from app.models.types import GUID


class Banner(Base):
    __tablename__ = "banners"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)  # Ionicons icon name
    color_from = Column(String(7), default="#3b82f6", nullable=False)  # Gradient start
    color_to = Column(String(7), default="#1d4ed8", nullable=False)  # Gradient end
    link_url = Column(String(500), nullable=True)  # Optional deep link or URL
    image_url = Column(String(500), nullable=True)  # Optional banner image
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Flash deal / countdown support
    countdown_end = Column(DateTime, nullable=True)  # If set, shows countdown timer
    countdown_label = Column(String(100), nullable=True)  # e.g. "Flash Sale Ends In"

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Banner {self.title}>"
