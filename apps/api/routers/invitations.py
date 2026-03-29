"""
Invitations router — friends invite friends to join TradeRefer.
Referrers can invite businesses or other referrers via email, SMS, or Google Contacts.
Milestones: 5 active invitees = $25 Prezee gift card.
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

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


class InviteRequest(BaseModel):
    invitees: List[dict]  # [{"name": "...", "email": "...", "phone": "...", "type": "referrer|business"}]
    method: str = "email"  # email | sms | google_contacts | manual


class MarkActiveRequest(BaseModel):
    invite_code: str


async def _get_referrer_id(user: AuthenticatedUser, db: AsyncSession) -> uuid.UUID:
    res = await db.execute(
        text("SELECT id FROM referrers WHERE user_id = :uid"),
        {"uid": uuid.UUID(user.id)}
    )
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Referrer account not found")
    return row[0]


@router.post("/send")
async def send_invitations(
    data: InviteRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Send invitations to a list of friends (email + SMS)."""
    referrer_id = await _get_referrer_id(user, db)

    # Get referrer details for personalisation
    ref_res = await db.execute(
        text("SELECT full_name, onboarding_invite_code FROM referrers WHERE id = :id"),
        {"id": referrer_id}
    )
    ref = ref_res.mappings().first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer not found")

    ref_name = ref["full_name"] or "A friend"
    ref_invite_code = ref["onboarding_invite_code"] or str(uuid.uuid4())[:8].upper()

    sent = []
    errors = []

    for invitee in data.invitees:
        invitee_name = invitee.get("name") or "Friend"
        invitee_email = (invitee.get("email") or "").strip().lower() or None
        invitee_phone = (invitee.get("phone") or "").strip() or None
        invitation_type = invitee.get("type", "referrer")

        if not invitee_email and not invitee_phone:
            errors.append({"name": invitee_name, "error": "No email or phone provided"})
            continue

        # Each invitee gets unique code so we can track who joined from whom
        referral_code = f"{ref_invite_code}-{str(uuid.uuid4())[:6].upper()}"

        # Upsert invitation
        try:
            await db.execute(text("""
                INSERT INTO user_invitations
                    (inviter_id, invitee_name, invitee_email, invitee_phone,
                     invitation_type, invitation_method, referral_code, status, inviter_type)
                VALUES
                    (:inviter_id, :name, :email, :phone,
                     :type, :method, :code, 'pending', 'referrer')
                ON CONFLICT (inviter_id, invitee_email, inviter_type)
                    DO UPDATE SET invited_at = now(), referral_code = EXCLUDED.referral_code
            """), {
                "inviter_id": referrer_id,
                "name": invitee_name,
                "email": invitee_email,
                "phone": invitee_phone,
                "type": invitation_type,
                "method": data.method,
                "code": referral_code,
            })
            await db.commit()
        except Exception as e:
            error_logger.warning(f"Failed to store invitation for {invitee_email}: {e}")
            await db.rollback()
            errors.append({"name": invitee_name, "error": str(e)})
            continue

        signup_url = f"{FRONTEND_URL}/onboarding/{invitation_type}?invite={referral_code}"

        # Send email invitation
        if invitee_email:
            try:
                from services.email import send_invitation_email
                await send_invitation_email(
                    to_email=invitee_email,
                    invitee_name=invitee_name,
                    inviter_name=ref_name,
                    invitation_type=invitation_type,
                    signup_url=signup_url,
                )
                sent.append({"name": invitee_name, "method": "email"})
            except Exception as e:
                error_logger.warning(f"Invite email failed for {invitee_email}: {e}")

        # Send SMS invitation
        if invitee_phone:
            try:
                from services.sms import _send_sms
                if invitation_type == "business":
                    sms_body = (
                        f"Hi {invitee_name}! {ref_name} invited you to join TradeRefer "
                        f"and get more leads for your business. It's free to get started: {signup_url}"
                    )
                else:
                    sms_body = (
                        f"Hi {invitee_name}! {ref_name} invited you to join TradeRefer "
                        f"and earn gift cards by referring tradies. Sign up free: {signup_url}"
                    )
                await _send_sms(invitee_phone, sms_body)
                sent.append({"name": invitee_name, "method": "sms"})
            except Exception as e:
                error_logger.warning(f"Invite SMS failed for {invitee_phone}: {e}")

    return {"sent": sent, "errors": errors, "total": len(sent)}


@router.get("/list")
async def list_invitations(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all invitations sent by this referrer with their status."""
    referrer_id = await _get_referrer_id(user, db)

    res = await db.execute(text("""
        SELECT
            id, invitee_name, invitee_email, invitee_phone,
            invitation_type, invitation_method, referral_code,
            status, invited_at, accepted_at, became_active_at
        FROM user_invitations
        WHERE inviter_id = :id
        ORDER BY invited_at DESC
    """), {"id": referrer_id})

    rows = res.mappings().all()
    return {
        "invitations": [dict(r) for r in rows],
        "total": len(rows),
        "pending": sum(1 for r in rows if r["status"] == "pending"),
        "accepted": sum(1 for r in rows if r["status"] in ("accepted", "active")),
        "active": sum(1 for r in rows if r["status"] == "active"),
    }


@router.get("/progress")
async def get_reward_progress(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get referral reward progress (toward $25 Prezee gift card milestones)."""
    referrer_id = await _get_referrer_id(user, db)

    # Count active invitees
    active_res = await db.execute(text("""
        SELECT COUNT(*) as active_count
        FROM user_invitations
        WHERE inviter_id = :id AND status = 'active'
    """), {"id": referrer_id})
    active_count = active_res.scalar() or 0

    # Count rewards already issued
    rewards_res = await db.execute(text("""
        SELECT milestone, reward_amount_cents, issued_at
        FROM referral_rewards
        WHERE referrer_id = :id
        ORDER BY milestone
    """), {"id": referrer_id})
    rewards = [dict(r) for r in rewards_res.mappings().all()]

    milestones_completed = len(rewards)
    next_milestone_at = (milestones_completed + 1) * 5
    progress_to_next = active_count - (milestones_completed * 5)

    return {
        "active_invitees": active_count,
        "milestones_completed": milestones_completed,
        "next_milestone_at": next_milestone_at,
        "progress_to_next": max(0, progress_to_next),
        "rewards_earned": rewards,
        "reward_amount_dollars": 25,
    }


@router.post("/mark-active")
async def mark_invitee_active(
    data: MarkActiveRequest,
    db: AsyncSession = Depends(get_db),
):
    """Called when an invited user creates their first lead/referral link (becomes active)."""
    res = await db.execute(text("""
        UPDATE user_invitations
        SET status = 'active', became_active_at = now()
        WHERE referral_code = :code AND status = 'accepted'
        RETURNING inviter_id
    """), {"code": data.invite_code})
    row = res.fetchone()
    if not row:
        return {"updated": False}

    await db.commit()
    inviter_id = str(row[0])

    # Check if milestone reached — run in background
    try:
        from services.referral_rewards import check_and_reward
        await check_and_reward(inviter_id, db)
    except Exception as e:
        error_logger.warning(f"Reward check failed (non-fatal): {e}")

    return {"updated": True}


@router.get("/google-contacts")
async def get_google_contacts(
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Proxy to Google People API using the user's Google OAuth token from Clerk.
    Requires the contacts.readonly scope added to Clerk's Google OAuth config.
    The client must pass the Google access_token in the X-Google-Token header.
    """
    import httpx

    # Expect the frontend to pass the Google OAuth access token
    # (obtained via Clerk's user.getOauthAccessToken('oauth_google'))
    google_token = request.headers.get("X-Google-Token")

    if not google_token:
        error_logger.warning("Google Contacts request missing X-Google-Token header")
        return {"contacts": [], "error": "google_token_missing"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://people.googleapis.com/v1/people/me/connections",
                params={
                    "personFields": "names,emailAddresses,phoneNumbers",
                    "pageSize": 200,
                },
                headers={"Authorization": f"Bearer {google_token}"},
            )
            if resp.status_code != 200:
                error_logger.warning(f"Google People API error: {resp.status_code} {resp.text[:200]}")
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
