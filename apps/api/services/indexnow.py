"""
IndexNow service — push URLs to Bing/Yandex/other engines instantly.
Free protocol. Notifies search engines to crawl these URLs right now.
Docs: https://www.indexnow.org/documentation
"""

import httpx
import logging
from typing import Sequence

logger = logging.getLogger(__name__)

INDEXNOW_API    = "https://api.indexnow.org/IndexNow"
INDEXNOW_HOST   = "traderefer.au"
INDEXNOW_KEY    = "0068d2eb419248bca5f302a93103550a"
INDEXNOW_KEY_URL = f"https://traderefer.au/{INDEXNOW_KEY}.txt"
BATCH_LIMIT     = 10_000  # IndexNow max per request


async def submit_urls(urls: Sequence[str]) -> bool:
    """
    Submit one or more URLs to IndexNow.
    Automatically batches if > BATCH_LIMIT.
    Returns True if all batches succeeded.
    """
    if not urls:
        return True

    url_list = list(urls)
    all_ok = True

    for i in range(0, len(url_list), BATCH_LIMIT):
        batch = url_list[i : i + BATCH_LIMIT]
        ok = await _post_batch(batch)
        if not ok:
            all_ok = False

    return all_ok


async def submit_single(url: str) -> bool:
    """Convenience wrapper to submit one URL."""
    return await submit_urls([url])


async def _post_batch(urls: list[str]) -> bool:
    payload = {
        "host": INDEXNOW_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": INDEXNOW_KEY_URL,
        "urlList": urls,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                INDEXNOW_API,
                json=payload,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
        if resp.status_code == 200:
            logger.info(f"IndexNow: submitted {len(urls)} URLs OK")
            return True
        else:
            logger.warning(f"IndexNow: batch returned {resp.status_code} — {resp.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"IndexNow: request failed — {e}")
        return False
