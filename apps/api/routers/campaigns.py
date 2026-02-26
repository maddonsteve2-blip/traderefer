from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from routers.notifications import notify_all_referrers_for_business
from services.email import send_referrer_campaign_notification
import uuid

router = APIRouter()


class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    campaign_type: str = "flat_bonus"  # flat_bonus, multiplier, volume_bonus, first_referral
    bonus_amount_cents: int = 0
    multiplier: float = 1.0
    volume_threshold: Optional[int] = None
    promo_text: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: str


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    bonus_amount_cents: Optional[int] = None
    multiplier: Optional[float] = None
    volume_threshold: Optional[int] = None
    promo_text: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    is_active: Optional[bool] = None


VALID_TYPES = {"flat_bonus", "multiplier", "volume_bonus", "first_referral"}


async def _get_business_id(user_id: str, db: AsyncSession):
    result = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"),
        {"uid": uuid.UUID(user_id)}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Business not found")
    return row[0]


# ── Business CRUD ─────────────────────────────────────────────

@router.get("/campaigns")
async def list_my_campaigns(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)
    result = await db.execute(
        text("""
            SELECT id, title, description, campaign_type, bonus_amount_cents,
                   multiplier, volume_threshold, promo_text, starts_at, ends_at,
                   is_active, created_at
            FROM campaigns
            WHERE business_id = :bid
            ORDER BY created_at DESC
        """),
        {"bid": biz_id}
    )
    campaigns = []
    for row in result.mappings().all():
        c = {k: v for k, v in dict(row).items()}
        c["id"] = str(c["id"])
        for dt_field in ("starts_at", "ends_at", "created_at"):
            if c.get(dt_field):
                c[dt_field] = str(c[dt_field])
        if c.get("multiplier") is not None:
            c["multiplier"] = float(c["multiplier"])
        campaigns.append(c)
    return campaigns


@router.post("/campaigns")
async def create_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    if data.campaign_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of: {', '.join(VALID_TYPES)}")

    biz_id = await _get_business_id(user.id, db)

    result = await db.execute(
        text("""
            INSERT INTO campaigns (
                business_id, title, description, campaign_type,
                bonus_amount_cents, multiplier, volume_threshold,
                promo_text, starts_at, ends_at
            ) VALUES (
                :bid, :title, :desc, :type,
                :bonus, :mult, :vol,
                :promo, COALESCE(:starts, now()), :ends
            ) RETURNING id
        """),
        {
            "bid": biz_id,
            "title": data.title,
            "desc": data.description,
            "type": data.campaign_type,
            "bonus": data.bonus_amount_cents,
            "mult": data.multiplier,
            "vol": data.volume_threshold,
            "promo": data.promo_text,
            "starts": data.starts_at,
            "ends": data.ends_at
        }
    )
    await db.commit()
    row = result.fetchone()

    # Notify all connected referrers about the new campaign
    try:
        biz_name_res = await db.execute(
            text("SELECT business_name, slug FROM businesses WHERE id = :bid"),
            {"bid": biz_id}
        )
        biz_row = biz_name_res.fetchone()
        if biz_row:
            await notify_all_referrers_for_business(
                db, biz_id, "new_campaign",
                f"🔥 New campaign from {biz_row[0]}!",
                data.promo_text or data.title,
                f"/b/{biz_row[1]}/refer"
            )
            # Email each connected referrer about the campaign
            referrer_emails = await db.execute(
                text("""
                    SELECT r.email, r.full_name
                    FROM referral_links rl
                    JOIN referrers r ON r.id = rl.referrer_id
                    WHERE rl.business_id = :bid AND rl.is_active = true AND r.email IS NOT NULL
                """),
                {"bid": biz_id}
            )
            for ref in referrer_emails.mappings().all():
                send_referrer_campaign_notification(
                    email=ref["email"],
                    full_name=ref["full_name"] or ref["email"],
                    business_name=biz_row[0],
                    campaign_title=data.title,
                    promo_text=data.promo_text,
                    business_slug=biz_row[1],
                )
    except Exception as e:
        print(f"Campaign notification error (non-fatal): {e}")

    return {"id": str(row[0]), "message": "Campaign created"}


@router.patch("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)

    # Verify ownership
    check = await db.execute(
        text("SELECT id FROM campaigns WHERE id = :cid AND business_id = :bid"),
        {"cid": uuid.UUID(campaign_id), "bid": biz_id}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No changes"}

    if "campaign_type" in update_data and update_data["campaign_type"] not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Invalid campaign type")

    fields = []
    params = {"cid": uuid.UUID(campaign_id)}
    for k, v in update_data.items():
        fields.append(f"{k} = :{k}")
        params[k] = v

    await db.execute(
        text(f"UPDATE campaigns SET {', '.join(fields)} WHERE id = :cid"),
        params
    )
    await db.commit()
    return {"message": "Campaign updated"}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    biz_id = await _get_business_id(user.id, db)
    result = await db.execute(
        text("DELETE FROM campaigns WHERE id = :cid AND business_id = :bid RETURNING id"),
        {"cid": uuid.UUID(campaign_id), "bid": biz_id}
    )
    await db.commit()
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted"}
