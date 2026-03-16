"""Web Push notification service for TradeRefer."""

import os
import json
from pywebpush import webpush, WebPushException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from utils.logging_config import error_logger

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:hello@traderefer.au"}


async def save_subscription(db: AsyncSession, user_id: str, subscription: dict):
    """Store or update a push subscription for a user."""
    endpoint = subscription.get("endpoint", "")
    keys = subscription.get("keys", {})
    p256dh = keys.get("p256dh", "")
    auth = keys.get("auth", "")

    if not endpoint or not p256dh or not auth:
        return False

    await db.execute(
        text("""
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (:uid, :endpoint, :p256dh, :auth)
            ON CONFLICT (user_id, endpoint) DO UPDATE SET
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                created_at = now()
        """),
        {"uid": user_id, "endpoint": endpoint, "p256dh": p256dh, "auth": auth},
    )
    await db.commit()
    return True


async def send_push_to_user(db: AsyncSession, user_id: str, title: str, body: str, url: str = "/", tag: str = "traderefer-message"):
    """Send a Web Push notification to all of a user's subscribed devices."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        error_logger.warning("VAPID keys not configured, skipping push")
        return

    result = await db.execute(
        text("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = :uid"),
        {"uid": user_id},
    )
    subs = result.mappings().all()

    dead_endpoints = []

    for sub in subs:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": {
                "p256dh": sub["p256dh"],
                "auth": sub["auth"],
            },
        }

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
        })

        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
        except WebPushException as e:
            # 410 Gone or 404 = subscription expired, clean it up
            if hasattr(e, 'response') and e.response is not None and e.response.status_code in (404, 410):
                dead_endpoints.append(sub["endpoint"])
            else:
                error_logger.warning(f"Push send failed: {e}")
        except Exception as e:
            error_logger.warning(f"Push send error: {e}")

    # Clean up expired subscriptions
    for endpoint in dead_endpoints:
        await db.execute(
            text("DELETE FROM push_subscriptions WHERE user_id = :uid AND endpoint = :ep"),
            {"uid": user_id, "ep": endpoint},
        )
    if dead_endpoints:
        await db.commit()
