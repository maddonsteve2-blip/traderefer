from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
import uuid
import random

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


# ── AI Deal Generator ──────────────────────────────────────────

# Templates organized by trade category and deal type
DEAL_TEMPLATES = {
    "discount": [
        {
            "title": "{pct}% Off Your First {service}",
            "description": "New customers get {pct}% off their first {service_lower} job when referred through TradeRefer. Quality work, great price.",
            "discount_text": "{pct}% off first job",
        },
        {
            "title": "Save ${amount} on {service} This Month",
            "description": "Book this month and save ${amount} on any {service_lower} work. Referred customers only — mention TradeRefer when you call.",
            "discount_text": "${amount} off this month",
        },
    ],
    "free_service": [
        {
            "title": "Free Quote + Priority Booking",
            "description": "Get a free on-site quote and jump the queue with priority booking. Referred customers are always our top priority.",
            "discount_text": "Free quote + priority booking",
        },
        {
            "title": "Free {addon} with Any Job Over ${min}",
            "description": "Book a {service_lower} job over ${min} and get a free {addon_lower}. Available exclusively for TradeRefer referrals.",
            "discount_text": "Free {addon_lower} on jobs ${min}+",
        },
    ],
    "seasonal": [
        {
            "title": "{season} {service} Special",
            "description": "Beat the {season_lower} rush! Book your {service_lower} now and get {pct}% off. Limited spots available — referred customers served first.",
            "discount_text": "{pct}% off {season_lower} bookings",
        },
        {
            "title": "End of {season} Clearance — {service}",
            "description": "Last chance for {season_lower} pricing on {service_lower}. Referred customers save an extra ${amount}. Book before spots fill up.",
            "discount_text": "Extra ${amount} off — ends soon",
        },
    ],
    "bundle": [
        {
            "title": "Complete {service} Package Deal",
            "description": "Get the full {service_lower} package — inspection, quote, and job done right. Referred customers get a bundled rate that saves up to {pct}%.",
            "discount_text": "Up to {pct}% off bundled service",
        },
        {
            "title": "Refer a Friend, Both Save",
            "description": "When your referral books a job, they save ${amount} and you earn a reward. Everyone wins with {business_name}.",
            "discount_text": "${amount} off for referred customers",
        },
    ],
}

TRADE_ADDONS = {
    "Plumbing": ["safety inspection", "tap washer replacement", "drain check", "hot water system check"],
    "Electrical": ["safety switch test", "smoke alarm check", "LED downlight upgrade", "powerpoint inspection"],
    "Landscaping": ["garden design consultation", "soil test", "plant health check", "lawn assessment"],
    "Painting": ["colour consultation", "small touch-up", "wallpaper removal quote", "paint sample test"],
    "Carpentry": ["measurement and quote", "timber consultation", "hardware selection", "minor repair"],
    "Roofing": ["roof inspection", "gutter clean", "leak assessment", "roof report"],
    "Cleaning": ["oven deep clean", "window wash", "carpet spot treatment", "fridge clean"],
    "Building": ["site inspection", "feasibility assessment", "3D render", "council advice"],
}

SEASONS = ["Summer", "Autumn", "Winter", "Spring"]


def _generate_deals(business_name: str, trade_category: str, description: str = None, hint: str = None):
    """Generate 3 AI-powered deal suggestions based on business context."""
    service = trade_category
    service_lower = trade_category.lower()
    addons = TRADE_ADDONS.get(trade_category, ["consultation", "inspection", "assessment", "check-up"])

    # Pick deal types based on hint or random
    if hint:
        hint_lower = hint.lower()
        if "discount" in hint_lower or "percent" in hint_lower or "%" in hint_lower:
            deal_types = ["discount", "discount", "bundle"]
        elif "free" in hint_lower:
            deal_types = ["free_service", "free_service", "discount"]
        elif "season" in hint_lower or "summer" in hint_lower or "winter" in hint_lower:
            deal_types = ["seasonal", "seasonal", "discount"]
        elif "bundle" in hint_lower or "package" in hint_lower:
            deal_types = ["bundle", "bundle", "free_service"]
        else:
            deal_types = ["discount", "free_service", "seasonal"]
    else:
        deal_types = ["discount", "free_service", random.choice(["seasonal", "bundle"])]

    results = []
    used_templates = set()

    for dtype in deal_types:
        templates = DEAL_TEMPLATES.get(dtype, DEAL_TEMPLATES["discount"])
        # Pick a template we haven't used yet
        available = [i for i in range(len(templates)) if f"{dtype}_{i}" not in used_templates]
        if not available:
            available = list(range(len(templates)))
        idx = random.choice(available)
        used_templates.add(f"{dtype}_{idx}")
        template = templates[idx]

        pct = random.choice([10, 15, 20])
        amount = random.choice([25, 50, 75, 100])
        min_amount = random.choice([200, 300, 500])
        addon = random.choice(addons)
        season = random.choice(SEASONS)

        replacements = {
            "{business_name}": business_name,
            "{service}": service,
            "{service_lower}": service_lower,
            "{pct}": str(pct),
            "{amount}": str(amount),
            "{min}": str(min_amount),
            "{addon}": addon.title(),
            "{addon_lower}": addon.lower(),
            "{season}": season,
            "{season_lower}": season.lower(),
        }

        def apply(text):
            for k, v in replacements.items():
                text = text.replace(k, v)
            return text

        results.append({
            "title": apply(template["title"]),
            "description": apply(template["description"]),
            "discount_text": apply(template["discount_text"]),
            "terms": f"Available for TradeRefer referrals only. Contact {business_name} to redeem.",
        })

    return results


@router.post("/deals/generate")
async def generate_deals_ai(
    data: AIGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Generate AI-powered deal suggestions based on business context."""
    suggestions = _generate_deals(
        business_name=data.business_name,
        trade_category=data.trade_category,
        description=data.description,
        hint=data.prompt_hint
    )
    return {"suggestions": suggestions}
