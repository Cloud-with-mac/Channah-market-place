from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.common import BaseSchema


# ============ Chat Schemas ============
class ChatCreate(BaseModel):
    vendor_id: UUID
    order_id: Optional[UUID] = None
    subject: Optional[str] = None
    initial_message: str


class ChatResponse(BaseSchema):
    id: UUID
    customer_id: UUID
    vendor_id: UUID
    order_id: Optional[UUID]
    subject: Optional[str]
    status: str
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    last_message_sender_id: Optional[UUID]
    unread_by_customer: bool
    unread_by_vendor: bool
    created_at: datetime
    updated_at: datetime

    # Additional computed fields
    customer_name: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_business_name: Optional[str] = None
    order_number: Optional[str] = None


# ============ Message Schemas ============
class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    file_url: Optional[str] = None
    file_name: Optional[str] = None


class MessageResponse(BaseSchema):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    message_type: str
    content: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    # Additional fields
    sender_name: Optional[str] = None
    is_customer: bool = False
