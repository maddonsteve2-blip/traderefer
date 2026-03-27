"""
MiniMax M2.7 AI personalisation service.
Generates personalised email opening lines for cold outreach leads.

Base URL : https://api.minimax.io/v1  (OpenAI-compatible)
Model    : MiniMax-M2.7
"""

import os
import httpx
import asyncio

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"
MINIMAX_MODEL = os.getenv("MINIMAX_MODEL", "MiniMax-M2.7")

_SYSTEM_PROMPT = (
    "You write short, natural, personalized opening lines for cold outreach emails. "
    "Each opening must be 1–2 sentences, sound human, reference the business trade or location "
    "in a genuine way, and lead naturally into a pitch about TradeRefer — a referral platform for tradespeople. "
    "Never mention AI. Never be sycophantic. Do not use emojis. Output ONLY the opening line, nothing else."
)


async def generate_ai_opening(
    first_name: str,
    business_name: str,
    trade_category: str,
    suburb: str,
) -> str:
    """
    Call MiniMax M2.7 to generate a personalised email opening for one lead.
    Falls back to an empty string on any error so the caller can use its own default.
    """
    if not MINIMAX_API_KEY:
        return ""

    name_part = first_name.strip() or "there"
    biz_part = business_name.strip() or "your business"
    trade_part = trade_category.strip() or "trade"
    location_part = suburb.strip() or "your area"

    user_prompt = (
        f"Write a personalised opening line for a cold email to {name_part} at {biz_part}, "
        f"a {trade_part} business based in {location_part}, Australia. "
        "The email is about a platform called TradeRefer that connects tradies with local referrers "
        "who earn cash rewards for sending jobs their way."
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(
                f"{MINIMAX_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {MINIMAX_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MINIMAX_MODEL,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 120,
                    "temperature": 0.85,
                },
            )
            if res.is_success:
                data = res.json()
                content = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    or ""
                )
                return content.strip()
    except Exception:
        pass
    return ""


async def batch_generate_ai_openings(
    leads: list[dict],
    concurrency: int = 5,
) -> dict[str, str]:
    """
    Generate AI openings for a list of leads concurrently.

    Args:
        leads: list of dicts with keys: id, first_name, business_name, trade_category, suburb
        concurrency: max parallel requests to MiniMax

    Returns:
        dict mapping lead id -> ai_opening string
    """
    if not MINIMAX_API_KEY:
        return {}

    semaphore = asyncio.Semaphore(concurrency)

    async def _one(lead: dict) -> tuple[str, str]:
        async with semaphore:
            opening = await generate_ai_opening(
                first_name=lead.get("first_name") or "",
                business_name=lead.get("business_name") or "",
                trade_category=lead.get("trade_category") or "",
                suburb=lead.get("suburb") or "",
            )
            return str(lead["id"]), opening

    results = await asyncio.gather(*[_one(l) for l in leads], return_exceptions=True)

    openings: dict[str, str] = {}
    for r in results:
        if isinstance(r, tuple):
            lead_id, opening = r
            openings[lead_id] = opening

    return openings
