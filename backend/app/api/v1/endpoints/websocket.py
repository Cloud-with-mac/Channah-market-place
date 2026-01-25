from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Set
import json
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.customer_vendor_chat import CustomerVendorChat, ChatMessage, MessageType

router = APIRouter()

# Store active WebSocket connections: {user_id: Set[WebSocket]}
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections"""

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()

        if user_id not in active_connections:
            active_connections[user_id] = set()

        active_connections[user_id].add(websocket)
        print(f"User {user_id} connected. Total connections: {self.get_connection_count()}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in active_connections:
            active_connections[user_id].discard(websocket)

            if len(active_connections[user_id]) == 0:
                del active_connections[user_id]

        print(f"User {user_id} disconnected. Total connections: {self.get_connection_count()}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user (all their active connections)"""
        if user_id in active_connections:
            disconnected = set()
            for connection in active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending to {user_id}: {e}")
                    disconnected.add(connection)

            # Clean up disconnected sockets
            for conn in disconnected:
                self.disconnect(conn, user_id)

    def is_online(self, user_id: str) -> bool:
        """Check if a user is currently online"""
        return user_id in active_connections and len(active_connections[user_id]) > 0

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in active_connections.values())


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for real-time messaging and call signaling"""

    # Authenticate user
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    # Connect
    await manager.connect(websocket, user_id)

    try:
        # Send online status to user
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected successfully"
        })

        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "ping":
                # Heartbeat
                await websocket.send_json({"type": "pong"})

            elif message_type == "typing":
                # User is typing
                chat_id = data.get("chat_id")
                if chat_id:
                    # Get chat participants
                    chat_result = await db.execute(
                        select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                    )
                    chat = chat_result.scalar_one_or_none()
                    if chat:
                        # Send typing indicator to other participant
                        other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                        await manager.send_personal_message({
                            "type": "typing",
                            "chat_id": chat_id,
                            "user_id": user_id
                        }, other_user_id)

            elif message_type == "message_sent":
                # New message sent
                chat_id = data.get("chat_id")
                message_id = data.get("message_id")

                if chat_id and message_id:
                    # Get chat and message
                    chat_result = await db.execute(
                        select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                    )
                    chat = chat_result.scalar_one_or_none()

                    message_result = await db.execute(
                        select(ChatMessage).where(ChatMessage.id == message_id)
                    )
                    message = message_result.scalar_one_or_none()

                    if chat and message:
                        # Send to other participant
                        other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                        await manager.send_personal_message({
                            "type": "new_message",
                            "chat_id": str(chat_id),
                            "message": {
                                "id": str(message.id),
                                "content": message.content,
                                "sender_id": str(message.sender_id),
                                "created_at": message.created_at.isoformat(),
                                "message_type": message.message_type.value
                            }
                        }, other_user_id)

            elif message_type == "call_initiate":
                # Initiate voice/video call
                chat_id = data.get("chat_id")
                call_type = data.get("call_type")  # "voice" or "video"
                offer = data.get("offer")  # WebRTC offer

                chat_result = await db.execute(
                    select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                )
                chat = chat_result.scalar_one_or_none()

                if chat:
                    other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                    await manager.send_personal_message({
                        "type": "incoming_call",
                        "chat_id": str(chat_id),
                        "call_type": call_type,
                        "caller_id": user_id,
                        "caller_name": user.full_name,
                        "offer": offer
                    }, other_user_id)

            elif message_type == "call_answer":
                # Answer to call
                chat_id = data.get("chat_id")
                answer = data.get("answer")  # WebRTC answer

                chat_result = await db.execute(
                    select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                )
                chat = chat_result.scalar_one_or_none()

                if chat:
                    other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                    await manager.send_personal_message({
                        "type": "call_answered",
                        "chat_id": str(chat_id),
                        "answer": answer
                    }, other_user_id)

            elif message_type == "ice_candidate":
                # ICE candidate exchange
                chat_id = data.get("chat_id")
                candidate = data.get("candidate")

                chat_result = await db.execute(
                    select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                )
                chat = chat_result.scalar_one_or_none()

                if chat:
                    other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                    await manager.send_personal_message({
                        "type": "ice_candidate",
                        "chat_id": str(chat_id),
                        "candidate": candidate
                    }, other_user_id)

            elif message_type == "call_end":
                # End call
                chat_id = data.get("chat_id")

                chat_result = await db.execute(
                    select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                )
                chat = chat_result.scalar_one_or_none()

                if chat:
                    other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                    await manager.send_personal_message({
                        "type": "call_ended",
                        "chat_id": str(chat_id),
                        "ended_by": user_id
                    }, other_user_id)

            elif message_type == "call_decline":
                # Decline call
                chat_id = data.get("chat_id")

                chat_result = await db.execute(
                    select(CustomerVendorChat).where(CustomerVendorChat.id == chat_id)
                )
                chat = chat_result.scalar_one_or_none()

                if chat:
                    other_user_id = chat.vendor.user_id if str(chat.customer_id) == user_id else str(chat.customer_id)
                    await manager.send_personal_message({
                        "type": "call_declined",
                        "chat_id": str(chat_id)
                    }, other_user_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
