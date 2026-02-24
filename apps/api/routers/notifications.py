from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
import uuid

router = APIRouter()


async def create_notification(db: AsyncSession, user_id: str, type: str, title: str, body: str = None, link: str = None):
    """Helper to create an in-app notification for a user."""
    await db.execute(
        text("""
            INSERT INTO in_app_notifications (user_id, type, title, body, link)
            VALUES (:uid, :type, :title, :body, :link)
        """),
        {"uid": uuid.UUID(user_id), "type": type, "title": title, "body": body, "link": link}
    )
    await db.commit()


async def notify_all_referrers_for_business(db: AsyncSession, business_id, type: str, title: str, body: str = None, link: str = None):
    """Send a notification to all referrers connected to a business."""
    result = await db.execute(
        text("""
            SELECT DISTINCT r.user_id
            FROM referrer_links rl
            JOIN referrers r ON r.id = rl.referrer_id
            WHERE rl.business_id = :bid
        """),
        {"bid": business_id}
    )
    for row in result.fetchall():
        await db.execute(
            text("""
                INSERT INTO in_app_notifications (user_id, type, title, body, link)
                VALUES (:uid, :type, :title, :body, :link)
            """),
            {"uid": row[0], "type": type, "title": title, "body": body, "link": link}
        )
    await db.commit()


@router.get("/notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    result = await db.execute(
        text("""
            SELECT id, type, title, body, link, is_read, created_at
            FROM in_app_notifications
            WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT 30
        """),
        {"uid": user_uuid}
    )
    notifs = []
    for row in result.mappings().all():
        n = dict(row)
        n["id"] = str(n["id"])
        n["created_at"] = str(n["created_at"])
        notifs.append(n)
    return notifs


@router.get("/notifications/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    result = await db.execute(
        text("SELECT COUNT(*) FROM in_app_notifications WHERE user_id = :uid AND is_read = false"),
        {"uid": user_uuid}
    )
    return {"count": result.scalar() or 0}


@router.patch("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    await db.execute(
        text("UPDATE in_app_notifications SET is_read = true WHERE id = :nid AND user_id = :uid"),
        {"nid": uuid.UUID(notification_id), "uid": user_uuid}
    )
    await db.commit()
    return {"message": "Marked as read"}


@router.patch("/notifications/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    await db.execute(
        text("UPDATE in_app_notifications SET is_read = true WHERE user_id = :uid AND is_read = false"),
        {"uid": user_uuid}
    )
    await db.commit()
    return {"message": "All marked as read"}
