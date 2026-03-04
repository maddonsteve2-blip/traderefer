"""
AI SMS Lead Screening using Z.AI GLM (same API as deals.py).
Classifies consumer replies as PASS / UNCLEAR / FAIL.
"""
import os
import httpx
from utils.logging_config import lead_logger, error_logger

ZAI_API_KEY = os.getenv("ZAI_API_KEY", "")
ZAI_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"
ZAI_MODEL = "glm-5"


async def classify_screening(conversation: list[dict], trade_category: str) -> dict:
    """
    Given the conversation so far (list of {role, content} dicts) and the trade category,
    classify the consumer's intent.

    Returns:
        {
            "status": "PASS" | "UNCLEAR" | "FAIL",
            "reason": str,
            "follow_up": str | None   # only when UNCLEAR
        }
    """
    if not ZAI_API_KEY:
        lead_logger.warning("ZAI_API_KEY not set — auto-passing screening")
        return {"status": "PASS", "reason": "AI screening not configured", "follow_up": None}

    system_prompt = f"""You are a lead quality classifier for TradeRefer, an Australian trade referral platform.

Trade category: {trade_category}

Act like a receptionist at a busy trade business. Your job is to quickly assess if a job enquiry is genuine and worth sending to the tradesperson.

CLASSIFICATION RULES:

PASS ✅ - Any genuine job request that matches the trade category.
Be generous. If someone says "blocked toilet", "leaking tap", "broken fence", "install ceiling fan", "fix power outlet" - that's ENOUGH. A real customer doesn't need to write an essay.

Examples of PASS:
- "toilet blocked" / "urgent" / "repair" → PASS
- "leaking tap in kitchen" / "this week" / "fix it" → PASS
- "fence is broken" / "flexible" / "replace section" → PASS
- "power outlet not working" / "asap" / "fix it" → PASS

UNCLEAR ⚠️ - Only if the response is so vague you literally cannot tell what work they need.
Use this sparingly. Examples: "yes" / "maybe" / "idk" OR "help" / "soon" / "stuff"
If UNCLEAR, ask ONE short clarifying question (max 20 words).

DO NOT mark as UNCLEAR just because they didn't provide exact measurements, every detail, or you think they should provide more info.

FAIL ❌ - Spam, wrong category, gibberish, or clearly not a real job.
Examples: Wrong trade category, "asdfghjkl", "test test test", "just browsing"

CRITICAL RULES:
❌ NEVER suggest the customer do the work themselves ("Have you tried fixing it yourself?", "Is this a minor blockage you could clear?")
✅ Default to PASS - Better to send a light-detail job than lose a genuine customer
✅ Think like a receptionist - Would a human receptionist book this job? If yes, PASS it.

We are trying to CAPTURE jobs, not discourage them.

Return ONLY a valid JSON object with keys: "status" ("PASS", "UNCLEAR", or "FAIL"), "reason" (1 sentence), "follow_up" (string or null).
No markdown, no explanation, just the JSON object."""

    messages = [{"role": "system", "content": system_prompt}] + conversation

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                ZAI_URL,
                headers={"Authorization": f"Bearer {ZAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": ZAI_MODEL, "messages": messages},
            )
            resp.raise_for_status()
            raw = resp.json()
            content = raw["choices"][0]["message"]["content"].strip()

            import json
            # Strip markdown fences if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)
            status = result.get("status", "UNCLEAR").upper()
            if status not in ("PASS", "UNCLEAR", "FAIL"):
                status = "UNCLEAR"

            lead_logger.info(f"AI screening result: {status} | reason: {result.get('reason')}")
            return {
                "status": status,
                "reason": result.get("reason", ""),
                "follow_up": result.get("follow_up"),
            }

    except Exception as e:
        error_logger.error(f"AI screening error: {e}", exc_info=True)
        # Default to PASS on error so leads don't stall
        return {"status": "PASS", "reason": f"AI error — auto-passed: {e}", "follow_up": None}
