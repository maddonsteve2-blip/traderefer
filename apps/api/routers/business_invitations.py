"""
Business invitations router — businesses invite referrers and other businesses.
Milestones: 5 active invitees = $25 Prezzee gift card (same reward service as referrers).
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from utils.logging_config import error_logger, general_logger
import uuid
import os
import httpx

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")


class BusinessInviteRequest(BaseModel):
    invitees: List[dict]  # [{"name": "...", "email": "...", "phone": "...", "type": "referrer|business"}]
    method: str = "email"  # email | sms | manual


class BusinessMarkActiveRequest(BaseModel):
    invite_code: str


async def _get_business_id(user: AuthenticatedUser, db: AsyncSession) -> str:
    res = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"),
        {"uid": uuid.UUID(user.id)}
    )
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return str(row[0])


@router.post("/send")
async def send_business_invitations(
    data: BusinessInviteRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Send invitations from a business to referrers or other businesses."""
    from services.email import send_invitation_email
    from services.sms import _send_sms

    business_id = await _get_business_id(user, db)

    # Get business name for email copy
    biz_res = await db.execute(
        text("SELECT business_name, onboarding_invite_code FROM businesses WHERE id = :id"),
        {"id": business_id}
    )
    biz_row = biz_res.mappings().first()
    inviter_name = biz_row["business_name"] if biz_row else "A TradeRefer business"
    invite_code = biz_row["onboarding_invite_code"] if biz_row else ""

    sent = []
    errors = []

    for invitee in data.invitees:
        name = invitee.get("name", "").strip()
        email = invitee.get("email", "").strip()
        phone = invitee.get("phone", "").strip()
        inv_type = invitee.get("type", "referrer")  # "referrer" | "business"

        if not (email or phone):
            continue

        referral_code = str(uuid.uuid4())[:8].upper()
        signup_url = (
            f"{FRONTEND_URL}/join/{inv_type}?invite={referral_code}"
            if inv_type == "referrer"
            else f"{FRONTEND_URL}/join/business?invite={referral_code}"
        )

        try:
            await db.execute(text("""
                INSERT INTO user_invitations (
                    id, inviter_id, invitee_name, invitee_email, invitee_phone,
                    invitation_type, invitation_method, referral_code,
                    status, invited_at, inviter_type
                ) VALUES (
                    gen_random_uuid(), :inviter_id, :name, :email, :phone,
                    :inv_type, :method, :code,
                    'pending', now(), 'business'
                )
                ON CONFLICT (inviter_id, invitee_email, inviter_type)
                DO UPDATE SET
                    status = CASE WHEN user_invitations.status = 'pending' THEN 'pending' ELSE user_invitations.status END,
                    invited_at = CASE WHEN user_invitations.status = 'pending' THEN now() ELSE user_invitations.invited_at END
            """), {
                "inviter_id": business_id,
                "name": name,
                "email": email or None,
                "phone": phone or None,
                "inv_type": inv_type,
                "method": data.method,
                "code": referral_code,
            })
            await db.commit()

            # Send email/SMS
            if email and data.method in ("email", "manual"):
                try:
                    await send_invitation_email(
                        to_email=email,
                        invitee_name=name or email.split("@")[0],
                        inviter_name=inviter_name,
                        invitation_type=inv_type,
                        signup_url=signup_url,
                    )
                except Exception as e:
                    error_logger.warning(f"Invitation email failed (non-fatal): {e}")

            if phone and data.method == "sms":
                try:
                    msg = (
                        f"{inviter_name} invited you to join traderefer.au. "
                        f"Sign up here: {signup_url}"
                    )
                    await _send_sms(phone, msg)
                except Exception as e:
                    error_logger.warning(f"Invitation SMS failed (non-fatal): {e}")

            sent.append(email or phone)

        except Exception as e:
            error_logger.error(f"Invitation insert failed for {email or phone}: {e}", exc_info=True)
            errors.append(email or phone)

    return {"sent": len(sent), "errors": len(errors)}


@router.get("/list")
async def list_business_invitations(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all invitations sent by this business."""
    business_id = await _get_business_id(user, db)

    res = await db.execute(text("""
        SELECT
            id, invitee_name, invitee_email, invitee_phone,
            invitation_type, invitation_method, referral_code,
            status, invited_at, accepted_at, became_active_at
        FROM user_invitations
        WHERE inviter_id = :id AND inviter_type = 'business'
        ORDER BY invited_at DESC
    """), {"id": business_id})

    rows = res.mappings().all()
    return {
        "invitations": [dict(r) for r in rows],
        "total": len(rows),
        "pending": sum(1 for r in rows if r["status"] == "pending"),
        "accepted": sum(1 for r in rows if r["status"] in ("accepted", "active")),
        "active": sum(1 for r in rows if r["status"] == "active"),
    }


@router.get("/progress")
async def get_business_reward_progress(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get referral reward progress for a business (toward $25 Prezzee gift card milestones)."""
    business_id = await _get_business_id(user, db)

    counts_res = await db.execute(text("""
        SELECT
            COUNT(*) as total_invited,
            COUNT(*) FILTER (WHERE status = 'active') as active_count
        FROM user_invitations
        WHERE inviter_id = :id AND inviter_type = 'business'
    """), {"id": business_id})
    counts = counts_res.mappings().first()
    total_invited = counts["total_invited"] or 0
    active_count = counts["active_count"] or 0

    rewards_res = await db.execute(text("""
        SELECT COUNT(*) FROM referral_rewards
        WHERE referrer_id = :id
    """), {"id": business_id})
    rewards_issued = rewards_res.scalar() or 0

    milestone_size = 5
    next_milestone = (rewards_issued + 1) * milestone_size
    progress_in_current = active_count - (rewards_issued * milestone_size)
    progress_in_current = max(0, min(progress_in_current, milestone_size))

    return {
        "active_invitees": active_count,
        "total_invited": total_invited,
        "rewards_issued": rewards_issued,
        "next_milestone": next_milestone,
        "progress_in_current": progress_in_current,
        "milestone_size": milestone_size,
        "reward_amount_dollars": 25,
    }


@router.post("/mark-active")
async def mark_business_invitee_active(
    data: BusinessMarkActiveRequest,
    db: AsyncSession = Depends(get_db),
):
    """Called when an invited business unlocks their first lead (becomes active)."""
    res = await db.execute(text("""
        UPDATE user_invitations
        SET status = 'active', became_active_at = now()
        WHERE referral_code = :code AND status = 'accepted' AND inviter_type = 'business'
        RETURNING inviter_id
    """), {"code": data.invite_code})
    row = res.fetchone()
    if not row:
        return {"updated": False}

    await db.commit()
    inviter_id = str(row[0])

    try:
        from services.referral_rewards import check_and_reward
        await check_and_reward(inviter_id, db)
    except Exception as e:
        error_logger.warning(f"Business reward check failed (non-fatal): {e}")

    return {"updated": True}


@router.get("/google-contacts")
async def get_google_contacts_for_business(
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Proxy Google People API for business owners (same as referrer endpoint)."""
    google_token = request.headers.get("X-Google-Token")

    if not google_token:
        return {"contacts": [], "error": "google_token_missing"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://people.googleapis.com/v1/people/me/connections",
                params={"personFields": "names,emailAddresses,phoneNumbers", "pageSize": 200},
                headers={"Authorization": f"Bearer {google_token}"},
            )
            if resp.status_code != 200:
                return {"contacts": [], "error": "google_api_error"}

            data = resp.json()
            contacts = []
            for conn in data.get("connections", []):
                names = conn.get("names", [{}])
                emails = conn.get("emailAddresses", [{}])
                phones = conn.get("phoneNumbers", [{}])
                name = names[0].get("displayName", "") if names else ""
                email = emails[0].get("value", "") if emails else ""
                phone = phones[0].get("value", "") if phones else ""
                if name and (email or phone):
                    contacts.append({"name": name, "email": email, "phone": phone})

            return {"contacts": contacts, "total": len(contacts)}
    except Exception as e:
        error_logger.error(f"Google Contacts fetch failed: {e}", exc_info=True)
        return {"contacts": [], "error": str(e)}
