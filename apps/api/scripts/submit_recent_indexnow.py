"""
Railway Cron Worker entrypoint — submit recently updated business URLs to IndexNow.

Run command (Railway cron service start command):
    python scripts/submit_recent_indexnow.py

Cron schedule (Railway dashboard):
    15 0 * * *   →  00:15 UTC daily  (≈ 10:15 AM AEST / 11:15 AM AEDT)

Environment variables required:
    DATABASE_URL   — Neon PostgreSQL connection string
    CRON_SECRET    — shared secret (optional, only needed for HTTP endpoint)
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure the api root is on the path so services.* imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(".env.local")
load_dotenv()

from sqlalchemy import text
from services.database import AsyncSessionLocal
from services.indexnow import submit_urls

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("submit_recent_indexnow")

BASE_URL = "https://traderefer.au"
SINCE_HOURS = 24


async def main() -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=SINCE_HOURS)
    logger.info("Querying businesses updated since %s", cutoff.isoformat())

    async with AsyncSessionLocal() as db:
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
        logger.info("No businesses updated in the last %d hours — nothing to submit.", SINCE_HOURS)
        print(json.dumps({"ok": True, "found": 0, "submitted": 0}))
        return 0

    urls = [f"{BASE_URL}/b/{slug}" for slug in slugs]
    logger.info("Submitting %d URLs to IndexNow…", len(urls))

    ok = await submit_urls(urls)

    summary = {
        "ok": ok,
        "since_hours": SINCE_HOURS,
        "found": len(urls),
        "submitted": len(urls) if ok else 0,
        "cutoff": cutoff.isoformat(),
    }
    print(json.dumps(summary))
    logger.info("Done: %s", summary)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
