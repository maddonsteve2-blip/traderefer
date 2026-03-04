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
A consumer has been sent 3 questions about their job enquiry. Your job is to classify the quality of their responses.

Trade category: {trade_category}

Classify as:
- PASS: The consumer has provided a genuine job request that matches the trade category. They've described what they need, when they need it, and the general scope. Don't overthink it - if it's a real job request, PASS it.
- UNCLEAR: Only use this if the consumer's responses are extremely vague (e.g., just "yes" or "maybe") OR they haven't actually described what work they need. If they've mentioned a specific problem or task, that's enough to PASS.
- FAIL: The job is clearly wrong category, spam, test data, gibberish, or the consumer is unresponsive/rude.

IMPORTANT: Be practical, not perfectionist. A blocked toilet, leaking tap, broken fence, etc. are all clear enough to PASS. Don't ask follow-up questions unless the consumer literally hasn't told you what work they need.

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
