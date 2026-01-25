from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.vendor import Vendor
from app.models.order import Order, OrderItem
from app.models.customer_vendor_chat import CustomerVendorChat, ChatMessage, ChatStatus, MessageType
from app.schemas.customer_vendor_chat import (
    ChatCreate, ChatResponse, MessageCreate, MessageResponse
)
from app.schemas.common import MessageResponse as APIMessageResponse

router = APIRouter()


@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat with a vendor (customer only)"""

    # Verify vendor exists
    vendor_result = await db.execute(select(Vendor).where(Vendor.id == chat_data.vendor_id))
    vendor = vendor_result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Verify customer has ordered from this vendor
    if chat_data.order_id:
        order_result = await db.execute(
            select(Order).where(
                Order.id == chat_data.order_id,
                Order.user_id == current_user.id
            )
        )
        order = order_result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
    else:
        # Check if customer has ANY orders from this vendor
        orders_result = await db.execute(
            select(Order)
            .join(OrderItem)
            .where(
                Order.user_id == current_user.id,
                OrderItem.vendor_id == chat_data.vendor_id
            )
            .limit(1)
        )
        if not orders_result.scalar_one_or_none():
            raise HTTPException(
                status_code=403,
                detail="You can only contact vendors you have purchased from"
            )

    # Check if chat already exists
    existing_chat = await db.execute(
        select(CustomerVendorChat).where(
            CustomerVendorChat.customer_id == current_user.id,
            CustomerVendorChat.vendor_id == chat_data.vendor_id,
            CustomerVendorChat.status == ChatStatus.ACTIVE
        )
    )
    existing = existing_chat.scalar_one_or_none()
    if existing:
        # Return existing chat
        return ChatResponse.model_validate(existing)

    # Create new chat
    chat = CustomerVendorChat(
        customer_id=current_user.id,
        vendor_id=chat_data.vendor_id,
        order_id=chat_data.order_id,
        subject=chat_data.subject or "Customer inquiry",
        status=ChatStatus.ACTIVE
    )
    db.add(chat)
    await db.flush()

    # Create initial message
    message = ChatMessage(
        chat_id=chat.id,
        sender_id=current_user.id,
        content=chat_data.initial_message,
        message_type=MessageType.TEXT
    )
    db.add(message)

    # Update chat with last message
    chat.last_message = chat_data.initial_message
    chat.last_message_at = datetime.utcnow()
    chat.last_message_sender_id = current_user.id
    chat.unread_by_vendor = True

    await db.commit()
    await db.refresh(chat)

    return ChatResponse.model_validate(chat)


@router.get("/", response_model=List[ChatResponse])
async def list_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all chats for current user (customer or vendor)"""

    # Check if user is a vendor
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if vendor:
        # Vendor: get all chats where they are the vendor
        query = select(CustomerVendorChat).where(
            CustomerVendorChat.vendor_id == vendor.id
        )
    else:
        # Customer: get all chats where they are the customer
        query = select(CustomerVendorChat).where(
            CustomerVendorChat.customer_id == current_user.id
        )

    query = query.options(
        selectinload(CustomerVendorChat.customer),
        selectinload(CustomerVendorChat.vendor),
        selectinload(CustomerVendorChat.order)
    ).order_by(CustomerVendorChat.updated_at.desc())

    result = await db.execute(query)
    chats = result.scalars().all()

    # Enrich with additional data
    chat_responses = []
    for chat in chats:
        chat_dict = ChatResponse.model_validate(chat).model_dump()
        chat_dict['customer_name'] = chat.customer.full_name if chat.customer else None
        chat_dict['vendor_name'] = chat.vendor.user.full_name if chat.vendor and chat.vendor.user else None
        chat_dict['vendor_business_name'] = chat.vendor.business_name if chat.vendor else None
        chat_dict['order_number'] = str(chat.order.id) if chat.order else None
        chat_responses.append(ChatResponse(**chat_dict))

    return chat_responses


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat"""

    # Get chat
    result = await db.execute(
        select(CustomerVendorChat)
        .options(
            selectinload(CustomerVendorChat.customer),
            selectinload(CustomerVendorChat.vendor),
            selectinload(CustomerVendorChat.order)
        )
        .where(CustomerVendorChat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Verify access
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    is_participant = (
        chat.customer_id == current_user.id or
        (vendor and chat.vendor_id == vendor.id)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as read for current user
    if chat.customer_id == current_user.id and chat.unread_by_customer:
        chat.unread_by_customer = False
        await db.commit()
    elif vendor and chat.vendor_id == vendor.id and chat.unread_by_vendor:
        chat.unread_by_vendor = False
        await db.commit()

    chat_dict = ChatResponse.model_validate(chat).model_dump()
    chat_dict['customer_name'] = chat.customer.full_name if chat.customer else None
    chat_dict['vendor_name'] = chat.vendor.user.full_name if chat.vendor and chat.vendor.user else None
    chat_dict['vendor_business_name'] = chat.vendor.business_name if chat.vendor else None
    chat_dict['order_number'] = str(chat.order.id) if chat.order else None

    return ChatResponse(**chat_dict)


@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: UUID,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message in a chat"""

    # Get chat
    result = await db.execute(select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Verify access
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    is_participant = (
        chat.customer_id == current_user.id or
        (vendor and chat.vendor_id == vendor.id)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create message
    message = ChatMessage(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=MessageType(message_data.message_type),
        file_url=message_data.file_url,
        file_name=message_data.file_name
    )
    db.add(message)

    # Update chat
    chat.last_message = message_data.content
    chat.last_message_at = datetime.utcnow()
    chat.last_message_sender_id = current_user.id

    # Set unread flag for recipient
    if chat.customer_id == current_user.id:
        chat.unread_by_vendor = True
    else:
        chat.unread_by_customer = True

    await db.commit()
    await db.refresh(message)

    message_dict = MessageResponse.model_validate(message).model_dump()
    message_dict['sender_name'] = current_user.full_name
    message_dict['is_customer'] = chat.customer_id == current_user.id

    return MessageResponse(**message_dict)


@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    chat_id: UUID,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get messages in a chat"""

    # Get chat
    chat_result = await db.execute(select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id))
    chat = chat_result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Verify access
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    is_participant = (
        chat.customer_id == current_user.id or
        (vendor and chat.vendor_id == vendor.id)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get messages
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()

    # Enrich with sender info
    message_responses = []
    for message in messages:
        message_dict = MessageResponse.model_validate(message).model_dump()
        message_dict['sender_name'] = message.sender.full_name if message.sender else "Unknown"
        message_dict['is_customer'] = message.sender_id == chat.customer_id
        message_responses.append(MessageResponse(**message_dict))

    return message_responses


@router.get("/vendors-contacted", response_model=List[dict])
async def get_contacted_vendors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of vendors the customer has purchased from (can start chat with)"""

    # Get unique vendors from orders
    result = await db.execute(
        select(Vendor, func.count(Order.id).label('order_count'))
        .join(OrderItem, OrderItem.vendor_id == Vendor.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.user_id == current_user.id)
        .group_by(Vendor.id)
        .order_by(func.count(Order.id).desc())
    )

    vendors_data = []
    for vendor, order_count in result.all():
        vendors_data.append({
            "id": str(vendor.id),
            "business_name": vendor.business_name,
            "slug": vendor.slug,
            "logo_url": vendor.logo_url,
            "rating": float(vendor.rating) if vendor.rating else 0.0,
            "order_count": order_count
        })

    return vendors_data
