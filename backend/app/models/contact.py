import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text
from app.core.database import Base
from app.models.types import GUID


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    order_number = Column(String(100), nullable=True)
    status = Column(String(50), default="pending")  # pending, replied, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ContactSubmission {self.subject} - {self.email}>"


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime, default=datetime.utcnow)
    unsubscribed_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<NewsletterSubscriber {self.email}>"
