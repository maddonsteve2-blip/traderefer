from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from services.email import send_new_message_notification
import uuid

router = APIRouter()


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

    # Email the recipient a nudge
    try:
        if sender_type == "business":
            # Notify the referrer
            ref_info = await db.execute(
                text("SELECT r.email, r.full_name, b.business_name FROM referrers r, businesses b WHERE r.id = :rid AND b.id = :bid"),
                {"rid": conv["referrer_id"], "bid": conv["business_id"]}
            )
            row = ref_info.mappings().first()
            if row and row["email"] and body_text:
                send_new_message_notification(
                    email=row["email"],
                    recipient_name=row["full_name"] or row["email"],
                    sender_name=row["business_name"],
                    message_preview=body_text,
                    conversation_url="/dashboard/referrer/messages",
                )
        else:
            # Notify the business
            biz_info = await db.execute(
                text("SELECT b.business_email, b.business_name, r.full_name as ref_name FROM businesses b, referrers r WHERE b.id = :bid AND r.id = :rid"),
                {"bid": conv["business_id"], "rid": conv["referrer_id"]}
            )
            row = biz_info.mappings().first()
            if row and row["business_email"] and body_text:
                send_new_message_notification(
                    email=row["business_email"],
                    recipient_name=row["business_name"],
                    sender_name=row["ref_name"] or "A referrer",
                    message_preview=body_text,
                    conversation_url="/dashboard/business/messages",
                )
    except Exception as email_err:
        print(f"Message notification email error (non-fatal): {email_err}")

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


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get total unread message count for the authenticated user."""
    identity = await _get_user_identity(db, user)
    biz_id = identity["business_id"]
    ref_id = identity["referrer_id"]

    if not biz_id and not ref_id:
        return {"unread_count": 0}

    conditions = []
    params = {}
    my_type = "business" if biz_id else "referrer"
    params["my_type"] = my_type

    if biz_id:
        conditions.append("c.business_id = :biz_id")
        params["biz_id"] = biz_id
    if ref_id:
        conditions.append("c.referrer_id = :ref_id")
        params["ref_id"] = ref_id

    where_clause = " OR ".join(conditions)

    result = await db.execute(
        text(f"""
            SELECT COUNT(*) FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE ({where_clause}) AND m.sender_type != :my_type AND m.is_read = false
        """),
        params,
    )
    count = result.scalar() or 0
    return {"unread_count": count}
