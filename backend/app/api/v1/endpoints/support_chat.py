from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, Dict, Set
from uuid import UUID
import json
import asyncio

from app.core.database import get_db
from app.core.security import get_current_user, decode_token
from app.models.user import User, UserRole
from app.models.support_chat import SupportChat, SupportChatMessage, SupportChatStatus, SenderRole

router = APIRouter()


# ---- Pydantic schemas ----

class CreateChatRequest(BaseModel):
    subject: str
    message: str


class SendMessageRequest(BaseModel):
    content: str


class ChatResponse(BaseModel):
    id: str
    customer_id: str
    admin_id: Optional[str] = None
    status: str
    subject: str
    created_at: str
    updated_at: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    admin_name: Optional[str] = None
    last_message: Optional[str] = None
    unread_count: int = 0


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    sender_role: str
    sender_name: Optional[str] = None
    content: str
    is_read: bool
    created_at: str


# ---- WebSocket connection manager ----

class SupportChatConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: str):
        # Accept is now called before auth in the websocket handler
        if websocket.client_state.name != "CONNECTED":
            await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(websocket)

    def disconnect(self, websocket: WebSocket, chat_id: str):
        if chat_id in self.active_connections:
            self.active_connections[chat_id].discard(websocket)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast_to_chat(self, chat_id: str, message: dict, exclude: Optional[WebSocket] = None):
        if chat_id in self.active_connections:
            disconnected = set()
            for ws in self.active_connections[chat_id]:
                if ws is exclude:
                    continue
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.add(ws)
            for ws in disconnected:
                self.disconnect(ws, chat_id)


support_ws_manager = SupportChatConnectionManager()


# ---- Helper to serialize ----

def serialize_chat(chat: SupportChat, unread_count: int = 0, last_message: Optional[str] = None) -> dict:
    return {
        "id": str(chat.id),
        "customer_id": str(chat.customer_id),
        "admin_id": str(chat.admin_id) if chat.admin_id else None,
        "status": chat.status.value if hasattr(chat.status, 'value') else chat.status,
        "subject": chat.subject,
        "created_at": chat.created_at.isoformat(),
        "updated_at": chat.updated_at.isoformat(),
        "customer_name": chat.customer.full_name if chat.customer else None,
        "customer_email": chat.customer.email if chat.customer else None,
        "admin_name": chat.admin.full_name if chat.admin else None,
        "last_message": last_message,
        "unread_count": unread_count,
    }


def serialize_message(msg: SupportChatMessage) -> dict:
    return {
        "id": str(msg.id),
        "chat_id": str(msg.chat_id),
        "sender_id": str(msg.sender_id),
        "sender_role": msg.sender_role.value if hasattr(msg.sender_role, 'value') else msg.sender_role,
        "sender_name": msg.sender.full_name if msg.sender else None,
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat(),
    }


# ---- REST endpoints ----

@router.post("")
async def create_support_chat(
    body: CreateChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Customer creates a new support chat."""
    chat = SupportChat(
        customer_id=current_user.id,
        subject=body.subject,
        status=SupportChatStatus.OPEN,
    )
    db.add(chat)
    await db.flush()

    message = SupportChatMessage(
        chat_id=chat.id,
        sender_id=current_user.id,
        sender_role=SenderRole.CUSTOMER,
        content=body.message,
    )
    db.add(message)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(SupportChat)
        .options(selectinload(SupportChat.customer), selectinload(SupportChat.admin))
        .where(SupportChat.id == chat.id)
    )
    chat = result.scalar_one()

    await db.commit()

    return serialize_chat(chat, unread_count=0, last_message=body.message)


@router.get("")
async def get_support_chats(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get support chats. Customers see their own, admins see all."""
    query = (
        select(SupportChat)
        .options(selectinload(SupportChat.customer), selectinload(SupportChat.admin))
    )

    if current_user.role == UserRole.ADMIN:
        pass  # admin sees all
    else:
        query = query.where(SupportChat.customer_id == current_user.id)

    if status:
        query = query.where(SupportChat.status == status)

    query = query.order_by(SupportChat.updated_at.desc())
    result = await db.execute(query)
    chats = result.scalars().all()

    chat_list = []
    for chat in chats:
        # Get unread count for the current user
        if current_user.role == UserRole.ADMIN:
            unread_role = SenderRole.CUSTOMER
        else:
            unread_role = SenderRole.ADMIN

        unread_result = await db.execute(
            select(func.count(SupportChatMessage.id)).where(
                SupportChatMessage.chat_id == chat.id,
                SupportChatMessage.sender_role == unread_role,
                SupportChatMessage.is_read == False,
            )
        )
        unread_count = unread_result.scalar() or 0

        # Get last message
        last_msg_result = await db.execute(
            select(SupportChatMessage)
            .where(SupportChatMessage.chat_id == chat.id)
            .order_by(SupportChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        chat_list.append(
            serialize_chat(chat, unread_count=unread_count, last_message=last_msg.content if last_msg else None)
        )

    return chat_list


@router.get("/{chat_id}/messages")
async def get_chat_messages(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a support chat."""
    # Verify access
    result = await db.execute(
        select(SupportChat).where(SupportChat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if current_user.role != UserRole.ADMIN and str(chat.customer_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark messages as read (messages from the other party)
    if current_user.role == UserRole.ADMIN:
        read_role = SenderRole.CUSTOMER
    else:
        read_role = SenderRole.ADMIN

    await db.execute(
        update(SupportChatMessage)
        .where(
            SupportChatMessage.chat_id == chat_id,
            SupportChatMessage.sender_role == read_role,
            SupportChatMessage.is_read == False,
        )
        .values(is_read=True)
    )
    await db.flush()

    # Fetch messages
    msg_result = await db.execute(
        select(SupportChatMessage)
        .options(selectinload(SupportChatMessage.sender))
        .where(SupportChatMessage.chat_id == chat_id)
        .order_by(SupportChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()

    return [serialize_message(m) for m in messages]


@router.post("/{chat_id}/messages")
async def send_chat_message(
    chat_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to a support chat."""
    result = await db.execute(
        select(SupportChat).where(SupportChat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if current_user.role != UserRole.ADMIN and str(chat.customer_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Determine sender role
    if current_user.role == UserRole.ADMIN:
        sender_role = SenderRole.ADMIN
        # Assign admin if not yet assigned, and set to active
        if not chat.admin_id:
            chat.admin_id = current_user.id
        if chat.status == SupportChatStatus.OPEN:
            chat.status = SupportChatStatus.ACTIVE
    else:
        sender_role = SenderRole.CUSTOMER

    message = SupportChatMessage(
        chat_id=chat.id,
        sender_id=current_user.id,
        sender_role=sender_role,
        content=body.content,
    )
    db.add(message)
    await db.flush()

    # Reload message with sender
    msg_result = await db.execute(
        select(SupportChatMessage)
        .options(selectinload(SupportChatMessage.sender))
        .where(SupportChatMessage.id == message.id)
    )
    message = msg_result.scalar_one()

    msg_data = serialize_message(message)

    # Commit before broadcast so polling clients can see the message
    await db.commit()

    # Broadcast via WebSocket (use str to ensure consistent chat_id format)
    await support_ws_manager.broadcast_to_chat(str(chat_id), {
        "type": "new_message",
        "message": msg_data,
    })

    return msg_data


@router.put("/{chat_id}/close")
async def close_support_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Close a support chat."""
    result = await db.execute(
        select(SupportChat).where(SupportChat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if current_user.role != UserRole.ADMIN and str(chat.customer_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    chat.status = SupportChatStatus.CLOSED
    await db.flush()

    # Broadcast closure
    await support_ws_manager.broadcast_to_chat(chat_id, {
        "type": "chat_closed",
        "chat_id": chat_id,
    })

    return {"message": "Chat closed"}


# ---- WebSocket endpoint ----

@router.websocket("/ws/{chat_id}")
async def support_chat_websocket(
    websocket: WebSocket,
    chat_id: str,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket for real-time support chat messages.
    Supports token via query param (legacy) or via initial auth message after connect.
    """
    await websocket.accept()

    # Support both query param (legacy) and message-based auth
    if not token:
        try:
            auth_data = await asyncio.wait_for(websocket.receive_json(), timeout=10.0)
            if auth_data.get("type") == "auth":
                token = auth_data.get("token")
        except Exception:
            await websocket.close(code=4001, reason="Authentication timeout")
            return

    if not token:
        await websocket.close(code=4001, reason="No token provided")
        return

    # Authenticate
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    # Verify access to chat
    chat_result = await db.execute(select(SupportChat).where(SupportChat.id == chat_id))
    chat = chat_result.scalar_one_or_none()
    if not chat:
        await websocket.close(code=4004, reason="Chat not found")
        return

    if user.role != UserRole.ADMIN and str(chat.customer_id) != str(user.id):
        await websocket.close(code=4003, reason="Access denied")
        return

    await support_ws_manager.connect(websocket, chat_id)

    try:
        await websocket.send_json({
            "type": "connected",
            "chat_id": chat_id,
            "user_id": str(user.id),
        })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "typing":
                await support_ws_manager.broadcast_to_chat(chat_id, {
                    "type": "typing",
                    "user_id": str(user.id),
                    "sender_name": user.full_name,
                }, exclude=websocket)

    except WebSocketDisconnect:
        support_ws_manager.disconnect(websocket, chat_id)
    except Exception:
        support_ws_manager.disconnect(websocket, chat_id)
