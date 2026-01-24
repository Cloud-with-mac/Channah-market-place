import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Enum, Integer, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationType(str, enum.Enum):
    SUPPORT = "support"
    PRODUCT_INQUIRY = "product_inquiry"
    ORDER_HELP = "order_help"
    GENERAL = "general"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    type = Column(Enum(ConversationType), default=ConversationType.GENERAL, nullable=False)
    title = Column(String(255), nullable=True)

    # Context for AI
    context = Column(Text, nullable=True)  # JSON string with relevant context

    is_active = Column(Boolean, default=True, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)

    # Escalation
    escalated_to_human = Column(Boolean, default=False, nullable=False)
    assigned_to = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    def __repr__(self):
        return f"<Conversation {self.id}>"


class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)

    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)

    # For product/order references in messages
    referenced_products = Column(Text, nullable=True)  # JSON array of product IDs
    referenced_orders = Column(Text, nullable=True)  # JSON array of order IDs

    # AI metadata
    ai_model = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)

    # Actions suggested by AI
    suggested_actions = Column(Text, nullable=True)  # JSON array

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.role} - {self.id}>"
