from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
import uuid
import random
import os
import httpx
import json

router = APIRouter()


class DealCreate(BaseModel):
    title: str
    description: Optional[str] = None
    discount_text: Optional[str] = None
    terms: Optional[str] = None
    expires_at: Optional[str] = None  # ISO date string


class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    discount_text: Optional[str] = None
    terms: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[str] = None


class AIGenerateRequest(BaseModel):
    business_name: str
    trade_category: str
    description: Optional[str] = None
    prompt_hint: Optional[str] = None  # e.g. "seasonal", "first-time customer", "discount"


async def _get_business_id(user_id: str, db: AsyncSession):
    """Get the business ID for the authenticated user."""
    result = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"),
        {"uid": uuid.UUID(user_id)}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Business not found")
    return row[0]


@router.post("/deals")
async def create_deal(
    data: DealCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)

    query = text("""
        INSERT INTO deals (business_id, title, description, discount_text, terms, expires_at)
        VALUES (:biz_id, :title, :description, :discount_text, :terms, :expires_at)
        RETURNING id, title, created_at
    """)

    result = await db.execute(query, {
        "biz_id": biz_id,
        "title": data.title,
        "description": data.description,
        "discount_text": data.discount_text,
        "terms": data.terms,
        "expires_at": data.expires_at
    })
    await db.commit()
    row = result.fetchone()
    return {"id": str(row[0]), "title": row[1], "created_at": str(row[2])}


@router.get("/deals")
async def get_my_deals(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)

    result = await db.execute(
        text("""
            SELECT id, title, description, discount_text, terms, is_active, expires_at, created_at
            FROM deals WHERE business_id = :biz_id
            ORDER BY created_at DESC
        """),
        {"biz_id": biz_id}
    )
    deals = []
    for row in result.mappings().all():
        deals.append({
            "id": str(row["id"]),
            "title": row["title"],
            "description": row["description"],
            "discount_text": row["discount_text"],
            "terms": row["terms"],
            "is_active": row["is_active"],
            "expires_at": str(row["expires_at"]) if row["expires_at"] else None,
            "created_at": str(row["created_at"])
        })
    return deals


@router.patch("/deals/{deal_id}")
async def update_deal(
    deal_id: str,
    data: DealUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)

    # Verify ownership
    check = await db.execute(
        text("SELECT id FROM deals WHERE id = :did AND business_id = :bid"),
        {"did": uuid.UUID(deal_id), "bid": biz_id}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Deal not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No changes"}

    fields = []
    params = {"did": uuid.UUID(deal_id)}
    for k, v in update_data.items():
        fields.append(f"{k} = :{k}")
        params[k] = v

    await db.execute(
        text(f"UPDATE deals SET {', '.join(fields)}, updated_at = now() WHERE id = :did"),
        params
    )
    await db.commit()
    return {"message": "Deal updated"}


@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)

    result = await db.execute(
        text("DELETE FROM deals WHERE id = :did AND business_id = :bid"),
        {"did": uuid.UUID(deal_id), "bid": biz_id}
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Deal deleted"}


# ── AI Deal Generator (Z.AI GLM Coding API) ───────────────────

ZAI_API_KEY = os.getenv("ZAI_API_KEY", "")
ZAI_CODING_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"


async def _generate_deals_ai(business_name: str, trade_category: str, description: str = None, hint: str = None):
    """Generate 3 deal suggestions using Z.AI GLM coding model."""

    hint_part = f'\nThe business owner wants deals focused on: "{hint}"' if hint else ""
    desc_part = f"\nBusiness description: {description}" if description else ""

    prompt = f"""You are a marketing expert for Australian trade businesses on the TradeRefer referral platform.

Generate exactly 3 unique, compelling deal/offer suggestions for this business:
- Business name: {business_name}
- Trade category: {trade_category}{desc_part}{hint_part}

These deals will be shared by referrers to attract new customers. Make them specific to the trade, realistic, and appealing. Use Australian English and AUD currency.

Return ONLY a valid JSON array with exactly 3 objects. Each object must have these exact keys:
- "title": Short catchy deal headline (max 60 chars)
- "description": 1-2 sentence description of the offer (max 200 chars)  
- "discount_text": Short badge text for the deal card (max 40 chars, e.g. "15% off first job")
- "terms": One sentence about redemption terms

Return ONLY the JSON array, no markdown, no code fences, no explanation."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ZAI_CODING_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZAI_API_KEY}"
                },
                json={
                    "model": "glm-5",
                    "messages": [
                        {"role": "system", "content": "You are a JSON API that returns only valid JSON arrays. Never include markdown formatting or code fences."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.8,
                    "stream": False
                }
            )

            if response.status_code != 200:
                print(f"Z.AI API error: {response.status_code} - {response.text}")
                return None

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Clean up response — strip markdown fences if present
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
            if content.endswith("```"):
                content = content.rsplit("```", 1)[0]
            content = content.strip()

            suggestions = json.loads(content)

            # Validate structure
            if not isinstance(suggestions, list) or len(suggestions) == 0:
                return None

            validated = []
            for s in suggestions[:3]:
                validated.append({
                    "title": str(s.get("title", ""))[:60],
                    "description": str(s.get("description", ""))[:200],
                    "discount_text": str(s.get("discount_text", ""))[:40],
                    "terms": str(s.get("terms", f"Available for TradeRefer referrals only. Contact {business_name} to redeem."))
                })
            return validated

    except Exception as e:
        print(f"Z.AI generation error: {e}")
        return None


def _generate_deals_fallback(business_name: str, trade_category: str, hint: str = None):
    """Fallback template-based generator if AI is unavailable."""
    service = trade_category
    service_lower = trade_category.lower()
    pcts = [10, 15, 20]
    amounts = [25, 50, 75]

    templates = [
        {
            "title": f"{random.choice(pcts)}% Off Your First {service} Job",
            "description": f"New customers get a discount on their first {service_lower} job when referred through TradeRefer.",
            "discount_text": f"{random.choice(pcts)}% off first job",
            "terms": f"Available for TradeRefer referrals only. Contact {business_name} to redeem.",
        },
        {
            "title": f"Free Quote + Priority Booking",
            "description": f"Get a free on-site quote and jump the queue with priority booking from {business_name}.",
            "discount_text": "Free quote + priority",
            "terms": f"Mention TradeRefer when you call {business_name}.",
        },
        {
            "title": f"Save ${random.choice(amounts)} on {service} This Month",
            "description": f"Book this month and save on any {service_lower} work. Referred customers only.",
            "discount_text": f"${random.choice(amounts)} off this month",
            "terms": f"Available for TradeRefer referrals only. Contact {business_name} to redeem.",
        },
    ]
    return templates


@router.post("/deals/generate")
async def generate_deals_ai(
    data: AIGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Generate AI-powered deal suggestions using Z.AI GLM model, with template fallback."""

    # Try Z.AI first if API key is configured
    if ZAI_API_KEY:
        suggestions = await _generate_deals_ai(
            business_name=data.business_name,
            trade_category=data.trade_category,
            description=data.description,
            hint=data.prompt_hint
        )
        if suggestions:
            return {"suggestions": suggestions, "source": "ai"}

    # Fallback to templates
    suggestions = _generate_deals_fallback(
        business_name=data.business_name,
        trade_category=data.trade_category,
        hint=data.prompt_hint
    )
    return {"suggestions": suggestions, "source": "template"}
