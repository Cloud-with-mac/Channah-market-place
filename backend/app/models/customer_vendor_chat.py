import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from app.core.database import Base
from app.models.types import GUID


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class ChatStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    CLOSED = "closed"


class CustomerVendorChat(Base):
    """Chat conversation between customer and vendor about orders"""
    __tablename__ = "customer_vendor_chats"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    # Participants
    customer_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    # Optional: Link to specific order
    order_id = Column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    # Chat metadata
    subject = Column(String(255), nullable=True)  # e.g., "Question about Order #123"
    status = Column(SQLEnum(ChatStatus), default=ChatStatus.ACTIVE, nullable=False)

    # Last message info
    last_message = Column(Text, nullable=True)
    last_message_at = Column(DateTime, nullable=True)
    last_message_sender_id = Column(GUID(), ForeignKey("users.id"), nullable=True)

    # Unread counts
    unread_by_customer = Column(Boolean, default=False, nullable=False)
    unread_by_vendor = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], backref="customer_chats")
    vendor = relationship("Vendor", foreign_keys=[vendor_id], backref="vendor_chats")
    order = relationship("Order", backref="chats")
    last_sender = relationship("User", foreign_keys=[last_message_sender_id])
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

    def __repr__(self):
        return f"<CustomerVendorChat {self.id}>"


class ChatMessage(Base):
    """Individual message in customer-vendor chat"""
    __tablename__ = "chat_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    chat_id = Column(GUID(), ForeignKey("customer_vendor_chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Message content
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT, nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)

    # Read status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    chat = relationship("CustomerVendorChat", back_populates="messages")
    sender = relationship("User", backref="sent_chat_messages")

    def __repr__(self):
        return f"<ChatMessage {self.id}>"
