import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID
import enum


class SupportChatStatus(str, enum.Enum):
    OPEN = "open"
    ACTIVE = "active"
    CLOSED = "closed"


class SenderRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class SupportChat(Base):
    __tablename__ = "support_chats"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    customer_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(SupportChatStatus), default=SupportChatStatus.OPEN, nullable=False)
    subject = Column(String(255), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    admin = relationship("User", foreign_keys=[admin_id])
    messages = relationship(
        "SupportChatMessage",
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="SupportChatMessage.created_at",
    )

    def __repr__(self):
        return f"<SupportChat {self.id}>"


class SupportChatMessage(Base):
    __tablename__ = "support_chat_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    chat_id = Column(GUID(), ForeignKey("support_chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(Enum(SenderRole), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    chat = relationship("SupportChat", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

    def __repr__(self):
        return f"<SupportChatMessage {self.id}>"
