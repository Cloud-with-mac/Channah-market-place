import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from app.core.database import Base
from app.models.types import GUID


class SearchQuery(Base):
    """Model to log search queries for analytics"""
    __tablename__ = "search_queries"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    query = Column(String(500), nullable=False, index=True)
    results_count = Column(Integer, default=0, nullable=False)

    # Track which filters were applied
    filters_applied = Column(Text, nullable=True)  # JSON string

    # Track user session/IP for anonymous users
    session_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Track if user clicked on any result
    clicked = Column(Integer, default=0, nullable=False)  # Count of clicks

    # Performance metrics
    search_time_ms = Column(Integer, nullable=True)  # Time taken to search

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<SearchQuery '{self.query}' - {self.results_count} results>"
