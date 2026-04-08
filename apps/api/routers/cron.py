"""
Cron router — protected endpoint for triggering scheduled IndexNow submission.
Primary execution is via Railway cron worker (scripts/submit_recent_indexnow.py).
This endpoint exists for manual reruns and emergency triggers.

Protect with: Authorization: Bearer <CRON_SECRET>
"""

import os
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from services.database import get_db
from services.indexnow import submit_urls

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cron", tags=["Cron"])

BASE_URL = "https://traderefer.au"


def _verify_secret(authorization: str | None = Header(default=None)) -> None:
    secret = os.getenv("CRON_SECRET", "")
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing cron authorization",
        )


@router.post("/submit-recent")
async def submit_recent_indexnow(
    since_hours: int = 24,
    _: None = Depends(_verify_secret),
    db: AsyncSession = Depends(get_db),
):
    """
    Query businesses updated in the last `since_hours` hours and submit their
    profile URLs to IndexNow (Bing / Yandex ecosystem).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=since_hours)

    result = await db.execute(
        text("""
            SELECT slug
            FROM businesses
            WHERE status = 'active'
              AND slug IS NOT NULL
              AND slug != ''
              AND updated_at > :cutoff
            ORDER BY updated_at DESC
        """),
        {"cutoff": cutoff},
    )
    slugs = [row.slug for row in result]

    if not slugs:
        logger.info("cron/submit-recent: no businesses updated since %s", cutoff.isoformat())
        return {
            "ok": True,
            "since_hours": since_hours,
            "found": 0,
            "submitted": 0,
        }

    urls = [f"{BASE_URL}/b/{slug}" for slug in slugs]
    logger.info("cron/submit-recent: submitting %d URLs to IndexNow", len(urls))

    ok = await submit_urls(urls)

    return {
        "ok": ok,
        "since_hours": since_hours,
        "found": len(urls),
        "submitted": len(urls) if ok else 0,
    }
