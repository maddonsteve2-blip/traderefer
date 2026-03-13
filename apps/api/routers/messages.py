from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from typing import Optional, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db, AsyncSessionLocal
from services.auth import get_current_user, AuthenticatedUser, get_jwks
from services.email import send_new_message_notification
from jose import jwt
import uuid
import os
import json
from utils.logging_config import error_logger

router = APIRouter()


# ─── WebSocket Connection Manager ──────────────────────────────────────────────

class ConnectionManager:
    """Manages active WebSocket connections per conversation room."""
    
    def __init__(self):
        # Maps conversation_id -> list of (websocket, user_id) tuples
        self._rooms: Dict[str, List[tuple]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if conversation_id not in self._rooms:
            self._rooms[conversation_id] = []
        self._rooms[conversation_id].append((websocket, user_id))

    def disconnect(self, conversation_id: str, websocket: WebSocket):
        if conversation_id in self._rooms:
            self._rooms[conversation_id] = [
                (ws, uid) for ws, uid in self._rooms[conversation_id] if ws is not websocket
            ]
            if not self._rooms[conversation_id]:
                del self._rooms[conversation_id]

    async def broadcast(self, conversation_id: str, message: dict, exclude_ws: WebSocket = None, exclude_user_id: str = None):
        """Send a message to all connected clients in a conversation room."""
        if conversation_id not in self._rooms:
            return
        dead = []
        for ws, uid in self._rooms[conversation_id]:
            if ws is exclude_ws or (exclude_user_id and uid == exclude_user_id):
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        # Cleanup dead connections
        for ws in dead:
            self.disconnect(conversation_id, ws)

    def active_count(self, conversation_id: str) -> int:
        return len(self._rooms.get(conversation_id, []))


# Global singleton — lives for the lifetime of the process
manager = ConnectionManager()


async def _verify_ws_token(token: str) -> Optional[str]:
    """Verify a Clerk JWT from a WebSocket query param. Returns user_id or None."""
    try:
        jwks = await get_jwks()
        header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
        if not rsa_key:
            return None
        payload = jwt.decode(
            token, rsa_key, algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False, "verify_sub": True}
        )
        clerk_id = payload.get("sub")
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, clerk_id)) if clerk_id else None
    except Exception as e:
        error_logger.warning(f"WS auth error: {e}")
        return None



class SendMessage(BaseModel):
    body: str
    image_url: Optional[str] = None


async def _get_user_identity(db: AsyncSession, user: AuthenticatedUser):
    """Determine if the authenticated user is a business owner, referrer, or both."""
    user_uuid = uuid.UUID(user.id)

    biz_result = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid}
    )
    biz = biz_result.mappings().first()

    ref_result = await db.execute(
        text("SELECT id FROM referrers WHERE user_id = :uid"), {"uid": user_uuid}
    )
    ref = ref_result.mappings().first()

    return {
        "business_id": biz["id"] if biz else None,
        "referrer_id": ref["id"] if ref else None,
    }


# ─── WebSocket Endpoint ──────────────────────────────────────────────────────

@router.websocket("/ws/{conversation_id}")
async def websocket_conversation(
    websocket: WebSocket,
    conversation_id: str,
    token: str = Query(...),
):
    """
    Real-time WebSocket endpoint for a conversation.
    
    Connect with: ws://host/messages/ws/{conversation_id}?token=<clerk_jwt>
    
    The server will push new messages as JSON objects in the shape:
        { "type": "message", "data": { ...message fields... } }
    
    Clients can also ping to keep the connection alive:
        Send: { "type": "ping" }
        Receive: { "type": "pong" }
    """
    # 1. Authenticate
    user_id = await _verify_ws_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # 2. Authorize — check user is part of this conversation
    async with AsyncSessionLocal() as db:
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            await websocket.close(code=4004, reason="Invalid conversation ID")
            return

        user_uuid = uuid.UUID(user_id)
        biz_result = await db.execute(
            text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid}
        )
        biz = biz_result.mappings().first()
        ref_result = await db.execute(
            text("SELECT id FROM referrers WHERE user_id = :uid"), {"uid": user_uuid}
        )
        ref = ref_result.mappings().first()

        biz_id = biz["id"] if biz else None
        ref_id = ref["id"] if ref else None

        conv_result = await db.execute(
            text("SELECT business_id, referrer_id FROM conversations WHERE id = :cid"),
            {"cid": conv_uuid},
        )
        conv = conv_result.mappings().first()
        if not conv:
            await websocket.close(code=4004, reason="Conversation not found")
            return

        if conv["business_id"] != biz_id and conv["referrer_id"] != ref_id:
            await websocket.close(code=4003, reason="Forbidden")
            return

        my_type = "business" if conv["business_id"] == biz_id else "referrer"

    # 3. Join the room
    await manager.connect(conversation_id, websocket, user_id)
    
    try:
        # Send a "connected" handshake
        await websocket.send_json({"type": "connected", "conversation_id": conversation_id})
        
        # 4. Listen loop — handle pings, typing events, and detect disconnects
        while True:
            try:
                data = await websocket.receive_json()
                if not isinstance(data, dict):
                    continue
                    
                msg_type = data.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "typing":
                    # Broadcast typing status to the partner only (exclude all of the sender's own devices)
                    await manager.broadcast(
                        conversation_id, 
                        {
                            "type": "typing",
                            "user_id": user_id,
                            "is_typing": data.get("is_typing", True)
                        },
                        exclude_ws=websocket,
                        exclude_user_id=user_id
                    )
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(conversation_id, websocket)


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get total unread message count for notification badge."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    ref_id = identity["referrer_id"]

    if not biz_id and not ref_id:
        return {"unread_count": 0}

    my_type = "business" if biz_id else "referrer"
    my_id = biz_id if biz_id else ref_id

    # Count unread messages where sender_type != my_type
    result = await db.execute(
        text("""
            SELECT COUNT(*) as unread_count
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (
                (c.business_id = :my_id AND m.sender_type != 'business' AND m.is_read = false)
                OR
                (c.referrer_id = :my_id AND m.sender_type != 'referrer' AND m.is_read = false)
            )
        """),
        {"my_id": my_id}
    )
    row = result.mappings().first()
    return {"unread_count": row["unread_count"] if row else 0}


@router.get("/contacts")
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List ALL linked contacts with conversation info. Shows every referrer (for business)
    or every business (for referrer), sorted by last message time then newest link."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    ref_id = identity["referrer_id"]

    if not biz_id and not ref_id:
        raise HTTPException(status_code=404, detail="No business or referrer profile found")

    my_type = "business" if biz_id else "referrer"

    if biz_id:
        # Business sees all their referrers
        query = text("""
            SELECT
                rl.referrer_id,
                r.full_name as contact_name,
                NULL as contact_logo,
                rl.created_at as linked_since,
                c.id as conversation_id,
                c.last_message_at,
                (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT image_url FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_image,
                (SELECT sender_type FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_sender_type,
                COALESCE(
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false AND m.sender_type != 'business'),
                    0
                ) as unread_count
            FROM referral_links rl
            JOIN referrers r ON rl.referrer_id = r.id
            LEFT JOIN conversations c ON c.business_id = rl.business_id AND c.referrer_id = rl.referrer_id
            WHERE rl.business_id = :my_id AND rl.is_active = true
            ORDER BY c.last_message_at DESC NULLS LAST, rl.created_at DESC
        """)
        params = {"my_id": biz_id}
    else:
        # Referrer sees all their businesses
        query = text("""
            SELECT
                rl.business_id as contact_entity_id,
                b.business_name as contact_name,
                b.logo_url as contact_logo,
                rl.created_at as linked_since,
                c.id as conversation_id,
                c.last_message_at,
                (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT image_url FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_image,
                (SELECT sender_type FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_sender_type,
                COALESCE(
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false AND m.sender_type != 'referrer'),
                    0
                ) as unread_count
            FROM referral_links rl
            JOIN businesses b ON rl.business_id = b.id
            LEFT JOIN conversations c ON c.business_id = rl.business_id AND c.referrer_id = rl.referrer_id
            WHERE rl.referrer_id = :my_id AND rl.is_active = true
            ORDER BY c.last_message_at DESC NULLS LAST, rl.created_at DESC
        """)
        params = {"my_id": ref_id}

    result = await db.execute(query, params)
    rows = result.mappings().all()

    contacts = []
    for row in rows:
        contact_id = str(row["referrer_id"]) if biz_id else str(row["contact_entity_id"])
        last_msg = row["last_message"]
        if not last_msg and row["last_image"]:
            last_msg = "📷 Image"
        contacts.append({
            "contact_id": contact_id,
            "contact_name": row["contact_name"],
            "contact_logo": row["contact_logo"],
            "conversation_id": str(row["conversation_id"]) if row["conversation_id"] else None,
            "last_message": last_msg,
            "last_sender_type": row["last_sender_type"],
            "last_message_at": str(row["last_message_at"]) if row["last_message_at"] else None,
            "linked_since": str(row["linked_since"]) if row["linked_since"] else None,
            "unread_count": row["unread_count"],
        })

    return {"contacts": contacts, "my_type": my_type}


@router.get("/conversations/{conversation_id}")
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get all messages in a conversation. Marks incoming messages as read."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    ref_id = identity["referrer_id"]
    conv_uuid = uuid.UUID(conversation_id)

    # Verify user is part of this conversation
    conv_result = await db.execute(
        text("SELECT business_id, referrer_id FROM conversations WHERE id = :cid"),
        {"cid": conv_uuid},
    )
    conv = conv_result.mappings().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["business_id"] != biz_id and conv["referrer_id"] != ref_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    my_type = "business" if conv["business_id"] == biz_id else "referrer"

    # Mark incoming messages as read
    await db.execute(
        text("""
            UPDATE messages SET is_read = true
            WHERE conversation_id = :cid AND sender_type != :my_type AND is_read = false
        """),
        {"cid": conv_uuid, "my_type": my_type},
    )
    await db.commit()

    # Fetch messages
    msg_result = await db.execute(
        text("""
            SELECT id, sender_type, sender_id, body, image_url, is_read, created_at
            FROM messages
            WHERE conversation_id = :cid
            ORDER BY created_at ASC
        """),
        {"cid": conv_uuid},
    )
    messages = []
    for m in msg_result.mappings().all():
        messages.append({
            "id": str(m["id"]),
            "sender_type": m["sender_type"],
            "sender_id": str(m["sender_id"]),
            "body": m["body"],
            "image_url": m["image_url"],
            "is_read": m["is_read"],
            "created_at": str(m["created_at"]),
            "is_mine": m["sender_type"] == my_type,
        })

    # Get participant info
    biz_result = await db.execute(
        text("SELECT business_name, logo_url FROM businesses WHERE id = :id"),
        {"id": conv["business_id"]},
    )
    biz_info = biz_result.mappings().first()

    ref_result = await db.execute(
        text("SELECT full_name FROM referrers WHERE id = :id"),
        {"id": conv["referrer_id"]},
    )
    ref_info = ref_result.mappings().first()

    return {
        "messages": messages,
        "my_type": my_type,
        "business_name": biz_info["business_name"] if biz_info else "Unknown",
        "business_logo": biz_info["logo_url"] if biz_info else None,
        "referrer_name": ref_info["full_name"] if ref_info else "Unknown",
    }


@router.post("/conversations/{conversation_id}")
async def send_message(
    conversation_id: str,
    data: SendMessage,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Send a message in a conversation."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    ref_id = identity["referrer_id"]
    conv_uuid = uuid.UUID(conversation_id)

    if not data.body.strip() and not data.image_url:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Verify user is part of this conversation
    conv_result = await db.execute(
        text("SELECT business_id, referrer_id FROM conversations WHERE id = :cid"),
        {"cid": conv_uuid},
    )
    conv = conv_result.mappings().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["business_id"] != biz_id and conv["referrer_id"] != ref_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    sender_type = "business" if conv["business_id"] == biz_id else "referrer"
    sender_id = biz_id if sender_type == "business" else ref_id

    # Insert message
    body_text = data.body.strip() if data.body else ""
    msg_result = await db.execute(
        text("""
            INSERT INTO messages (conversation_id, sender_type, sender_id, body, image_url)
            VALUES (:cid, :stype, :sid, :body, :image_url)
            RETURNING id, created_at
        """),
        {"cid": conv_uuid, "stype": sender_type, "sid": sender_id, "body": body_text, "image_url": data.image_url},
    )
    msg = msg_result.mappings().first()

    # Update conversation last_message_at
    await db.execute(
        text("UPDATE conversations SET last_message_at = now() WHERE id = :cid"),
        {"cid": conv_uuid},
    )
    await db.commit()

    # Notify the recipient via in-app, email and SMS ONLY IF they aren't already in the room
    is_active = manager.active_count(conversation_id) >= 2
    
    try:
        from services.sms import _send_sms

        if sender_type == "business":
            # Notify the referrer
            ref_info = await db.execute(
                text("SELECT r.email, r.phone, r.full_name, r.user_id, b.business_name FROM referrers r, businesses b WHERE r.id = :rid AND b.id = :bid"),
                {"rid": conv["referrer_id"], "bid": conv["business_id"]}
            )
            row = ref_info.mappings().first()
            if row and body_text:
                # In-app notification (always send this)
                if row["user_id"]:
                    await db.execute(
                        text("""
                            INSERT INTO in_app_notifications (user_id, type, title, body, link)
                            VALUES (:uid, 'new_message', :title, :body, :link)
                        """),
                        {
                            "uid": row["user_id"],
                            "title": f"New message from {row['business_name']}",
                            "body": body_text[:100] + "..." if len(body_text) > 100 else body_text,
                            "link": "/dashboard/referrer/messages",
                        }
                    )
                    await db.commit()
                
                # Heavily skip if they are active
                if not is_active:
                    # Email notification
                    if row["email"]:
                        await send_new_message_notification(
                            email=row["email"],
                            recipient_name=row["full_name"] or row["email"],
                            sender_name=row["business_name"],
                            message_preview=body_text,
                            conversation_url="/dashboard/referrer/messages",
                        )
                    # SMS notification
                    if row["phone"]:
                        sms_preview = body_text[:100] + "..." if len(body_text) > 100 else body_text
                        await _send_sms(
                            row["phone"],
                            f"💬 New message from {row['business_name']}: {sms_preview}\n\nReply at traderefer.au/dashboard/referrer/messages"
                        )
        else:
            # Notify the business
            biz_info = await db.execute(
                text("SELECT b.business_email, b.business_phone, b.business_name, b.user_id, r.full_name as ref_name FROM businesses b, referrers r WHERE b.id = :bid AND r.id = :rid"),
                {"bid": conv["business_id"], "rid": conv["referrer_id"]}
            )
            row = biz_info.mappings().first()
            if row and body_text:
                # In-app notification
                if row["user_id"]:
                    await db.execute(
                        text("""
                            INSERT INTO in_app_notifications (user_id, type, title, body, link)
                            VALUES (:uid, 'new_message', :title, :body, :link)
                        """),
                        {
                            "uid": row["user_id"],
                            "title": f"New message from {row['ref_name'] or 'a referrer'}",
                            "body": body_text[:100] + "..." if len(body_text) > 100 else body_text,
                            "link": "/dashboard/business/messages",
                        }
                    )
                    await db.commit()
                
                if not is_active:
                    # Email notification
                    if row["business_email"]:
                        await send_new_message_notification(
                            email=row["business_email"],
                            recipient_name=row["business_name"],
                            sender_name=row["ref_name"] or "A referrer",
                            message_preview=body_text,
                            conversation_url="/dashboard/business/messages",
                        )
                    # SMS notification
                    if row["business_phone"]:
                        sms_preview = body_text[:100] + "..." if len(body_text) > 100 else body_text
                        await _send_sms(
                            row["business_phone"],
                            f"💬 New message from {row['ref_name'] or 'a referrer'}: {sms_preview}\n\nReply at traderefer.au/dashboard/business/messages"
                        )
    except Exception as notify_err:
        error_logger.warning(f"Message notification error (non-fatal): {notify_err}")

    # ─── WebSocket Broadcast ─────────────────────────────────────────────────────
    # Push the new message to all OTHER connected clients in this conversation
    ws_payload = {
        "type": "message",
        "data": {
            "id": str(msg["id"]),
            "sender_type": sender_type,
            "sender_id": str(sender_id),
            "body": body_text,
            "image_url": data.image_url,
            "is_read": False,
            "created_at": str(msg["created_at"]),
            "is_mine": False,  # from recipient's perspective
        }
    }
    try:
        # Broadcast to all connected clients in the room (including other devices of the same user)
        # Duplicate detection on the sender's device is handled by msg.id checks on the frontend
        await manager.broadcast(conversation_id, ws_payload)
    except Exception as ws_err:
        error_logger.warning(f"WebSocket broadcast error (non-fatal): {ws_err}")

    return {
        "id": str(msg["id"]),
        "sender_type": sender_type,
        "body": body_text,
        "image_url": data.image_url,
        "created_at": str(msg["created_at"]),
        "is_mine": True,
    }


@router.post("/conversations/start/{referrer_id}")
async def start_conversation_business(
    referrer_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Business starts or gets existing conversation with a referrer."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    if not biz_id:
        raise HTTPException(status_code=403, detail="Only business owners can start conversations from this endpoint")

    ref_uuid = uuid.UUID(referrer_id)

    # Verify referrer is linked to this business
    link_check = await db.execute(
        text("SELECT id FROM referral_links WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_id, "ref_id": ref_uuid},
    )
    if not link_check.fetchone():
        raise HTTPException(status_code=404, detail="Referrer not linked to your business")

    # Check for existing conversation
    existing = await db.execute(
        text("SELECT id FROM conversations WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_id, "ref_id": ref_uuid},
    )
    row = existing.mappings().first()
    if row:
        return {"conversation_id": str(row["id"]), "is_new": False}

    # Create new conversation
    new_conv = await db.execute(
        text("""
            INSERT INTO conversations (business_id, referrer_id)
            VALUES (:biz_id, :ref_id)
            RETURNING id
        """),
        {"biz_id": biz_id, "ref_id": ref_uuid},
    )
    conv = new_conv.mappings().first()
    await db.commit()

    return {"conversation_id": str(conv["id"]), "is_new": True}


@router.post("/conversations/start-with-business/{business_id}")
async def start_conversation_referrer(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Referrer starts or gets existing conversation with a business."""
    identity = await _get_user_identity(db, user)
    ref_id = identity["referrer_id"]
    if not ref_id:
        raise HTTPException(status_code=403, detail="Only referrers can start conversations from this endpoint")

    biz_uuid = uuid.UUID(business_id)

    # Verify referrer is linked to this business
    link_check = await db.execute(
        text("SELECT id FROM referral_links WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_uuid, "ref_id": ref_id},
    )
    if not link_check.fetchone():
        raise HTTPException(status_code=404, detail="You are not linked to this business")

    # Check for existing conversation
    existing = await db.execute(
        text("SELECT id FROM conversations WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_uuid, "ref_id": ref_id},
    )
    row = existing.mappings().first()
    if row:
        return {"conversation_id": str(row["id"]), "is_new": False}

    # Create new conversation
    new_conv = await db.execute(
        text("""
            INSERT INTO conversations (business_id, referrer_id)
            VALUES (:biz_id, :ref_id)
            RETURNING id
        """),
        {"biz_id": biz_uuid, "ref_id": ref_id},
    )
    conv = new_conv.mappings().first()
    await db.commit()

    return {"conversation_id": str(conv["id"]), "is_new": True}


