from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from services.stripe_service import StripeService
from services.email import send_referrer_welcome, send_referrer_payout_processed, send_business_new_review, send_referrer_review_request
import uuid
import os
import random
import asyncio
from datetime import datetime, timedelta
from utils.logging_config import error_logger, general_logger

router = APIRouter()

# In-memory OTP store (keyed by phone number). Fine for single-instance Railway deployment.
# Format: { "+61412345678": {"code": "123456", "expires_at": datetime} }
_otp_store: dict = {}

class ReferrerOnboarding(BaseModel):
    full_name: Optional[str] = None
    phone: str
    street_address: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = "VIC"
    postcode: Optional[str] = None
    phone_verified: Optional[bool] = False
    invite_code: Optional[str] = None

class OTPSendRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    code: str

class ReviewCreate(BaseModel):
    business_slug: str
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewBusiness(BaseModel):
    business_slug: str
    rating: int  # 1-5
    comment: Optional[str] = None

@router.post("/otp/send")
async def send_otp(data: OTPSendRequest):
    """Send a 6-digit OTP to the given phone number via Twilio SMS."""
    from services.sms import _send_sms
    phone = data.phone.strip()
    code = str(random.randint(100000, 999999))
    _otp_store[phone] = {"code": code, "expires_at": datetime.utcnow() + timedelta(minutes=10)}
    try:
        await _send_sms(phone, f"Your TradeRefer verification code is: {code}\nExpires in 10 minutes.")
        return {"sent": True}
    except Exception as e:
        error_logger.error(f"OTP send failed for {phone}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP")


@router.post("/otp/verify")
async def verify_otp(data: OTPVerifyRequest):
    """Verify a previously sent OTP code."""
    phone = data.phone.strip()
    entry = _otp_store.get(phone)
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP found for this number. Please request a new code.")
    if datetime.utcnow() > entry["expires_at"]:
        _otp_store.pop(phone, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
    if entry["code"] != data.code.strip():
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")
    _otp_store.pop(phone, None)
    return {"verified": True}


@router.post("/onboarding")
async def onboarding(
    data: ReferrerOnboarding,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)

    # Check if existing
    check_query = text("SELECT id FROM referrers WHERE user_id = :user_id")
    result = await db.execute(check_query, {"user_id": user_uuid})
    if result.fetchone():
        return {"status": "already_exists"}

    email = user.email or f"user_{user.id}@clerk.com"
    full_name = data.full_name or email.split("@")[0].replace(".", " ").title()

    # Resolve invited_by referrer id from invite code
    invited_by_id = None
    if data.invite_code:
        inv_res = await db.execute(
            text("SELECT id FROM referrers WHERE onboarding_invite_code = :code"),
            {"code": data.invite_code}
        )
        inv_row = inv_res.fetchone()
        if inv_row:
            invited_by_id = inv_row[0]

    query = text("""
        INSERT INTO referrers (
            user_id, full_name, email, phone, region,
            street_address, suburb, state, postcode,
            phone_verified, invited_by_referrer_id,
            status, stripe_account_id
        ) VALUES (
            :user_id, :full_name, :email, :phone, :suburb,
            :street_address, :suburb, :state, :postcode,
            :phone_verified, :invited_by_id,
            'active', :stripe_account_id
        ) RETURNING id
    """)

    try:
        result = await db.execute(query, {
            "user_id": user_uuid,
            "full_name": full_name,
            "email": email,
            "phone": data.phone,
            "street_address": data.street_address,
            "suburb": data.suburb or "",
            "state": data.state or "VIC",
            "postcode": data.postcode,
            "phone_verified": data.phone_verified or False,
            "invited_by_id": invited_by_id,
            "stripe_account_id": f"acct_mock_ref_{user.id[:8]}"
        })
        await db.commit()
        row = result.fetchone()
        referrer_id = str(row[0])

        # Generate unique invite code for this referrer
        invite_code = str(uuid.uuid4())[:8].upper()
        await db.execute(
            text("UPDATE referrers SET onboarding_invite_code = :code WHERE id = :id"),
            {"code": invite_code, "id": referrer_id}
        )
        await db.commit()

        # If invited, mark the invitation as accepted and check for reward
        if invited_by_id and data.invite_code:
            await db.execute(text("""
                UPDATE user_invitations
                SET status = 'accepted', accepted_at = now()
                WHERE inviter_id = :inv_id AND referral_code = :code AND status = 'pending'
            """), {"inv_id": invited_by_id, "code": data.invite_code})
            await db.commit()

        try:
            await send_referrer_welcome(email, full_name)
        except Exception as email_err:
            error_logger.warning(f"Welcome email failed (non-fatal): {email_err}")
        return {"id": referrer_id, "invite_code": invite_code}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create referrer: {str(e)}")

class ReferralLinkCreate(BaseModel):
    business_id: str

@router.post("/links")
async def create_referral_link(
    link: ReferralLinkCreate, 
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # Get referrer_id for this user
    user_uuid = uuid.UUID(user.id)
    ref_query = text("SELECT id FROM referrers WHERE user_id = :user_id")
    ref_result = await db.execute(ref_query, {"user_id": user_uuid})
    ref = ref_result.mappings().first()
    
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer account not found. Please complete onboarding.")

    referrer_id = ref["id"]
    business_id = uuid.UUID(link.business_id)

    # Check if link already exists
    check_query = text("""
        SELECT link_code FROM referral_links 
        WHERE referrer_id = :referrer_id AND business_id = :business_id
        LIMIT 1
    """)
    result = await db.execute(check_query, {"referrer_id": referrer_id, "business_id": business_id})
    existing = result.fetchone()
    if existing:
        return {"link_code": existing[0]}

    # Create new link
    link_code = str(uuid.uuid4())[:12] # Short code
    insert_query = text("""
        INSERT INTO referral_links (referrer_id, business_id, link_code)
        VALUES (:referrer_id, :business_id, :link_code)
        RETURNING link_code
    """)
    try:
        result = await db.execute(insert_query, {
            "referrer_id": referrer_id,
            "business_id": business_id,
            "link_code": link_code
        })
        await db.commit()

        # Check if this is the referrer's first link — if so, mark them active in
        # the invitation system so their inviter's milestone counter increments.
        count_res = await db.execute(
            text("SELECT COUNT(*) FROM referral_links WHERE referrer_id = :id"),
            {"id": referrer_id}
        )
        total_links = count_res.scalar() or 0
        if total_links == 1:
            # Find any pending accepted invitation for this referrer
            inv_res = await db.execute(text("""
                SELECT ui.referral_code
                FROM user_invitations ui
                JOIN referrers r ON r.invited_by_referrer_id = ui.inviter_id
                WHERE r.id = :rid AND ui.status = 'accepted'
                LIMIT 1
            """), {"rid": referrer_id})
            inv_row = inv_res.fetchone()
            if inv_row:
                try:
                    from services.referral_rewards import check_and_reward
                    upd = await db.execute(text("""
                        UPDATE user_invitations
                        SET status = 'active', became_active_at = now()
                        WHERE referral_code = :code AND status = 'accepted'
                        RETURNING inviter_id
                    """), {"code": inv_row[0]})
                    upd_row = upd.fetchone()
                    await db.commit()
                    if upd_row:
                        await check_and_reward(str(upd_row[0]), db)
                except Exception as reward_err:
                    error_logger.warning(f"Reward check on first link (non-fatal): {reward_err}")

        return {"link_code": link_code}
    except Exception as e:
        await db.rollback()
        error_logger.error(f"Error creating link: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create referral link")

@router.get("/dashboard")
async def get_referrer_dashboard(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    try:
        user_uuid = uuid.UUID(user.id)
        
        # 0. Get referrer
        ref_query = text("SELECT id, wallet_balance_cents, pending_cents, total_earned_cents, stripe_account_id FROM referrers WHERE user_id = :user_id")
        ref_result = await db.execute(ref_query, {"user_id": user_uuid})
        ref = ref_result.mappings().first()
        
        if not ref:
            raise HTTPException(status_code=404, detail="Referrer account not found")

        referrer_id = ref["id"]
        
        # 1. Get active links
        links_query = text("""
            SELECT 
                rl.link_code, 
                rl.clicks, 
                rl.leads_created, 
                rl.total_earned_cents,
                b.id as business_id,
                b.business_name, 
                b.trade_category, 
                b.suburb, 
                b.slug,
                b.logo_url,
                b.referral_fee_cents,
                b.is_verified
            FROM referral_links rl
            JOIN businesses b ON rl.business_id = b.id
            WHERE rl.referrer_id = :referrer_id
              AND rl.is_active = true
              AND b.status = 'active'
            ORDER BY rl.created_at DESC
        """)
        links_result = await db.execute(links_query, {"referrer_id": referrer_id})
        links_data = links_result.mappings().all()
        
        # Format link objects for frontend
        formatted_links = []
        for l in links_data:
            formatted_links.append({
                "name": l["business_name"],
                "sub": f"{l['trade_category']} • {l['suburb']}",
                "trade_category": l["trade_category"],
                "clicks": l.get("clicks", 0),
                "leads": l.get("leads_created", 0),
                "earned": (l.get("total_earned_cents") or 0) / 100,
                "slug": l["slug"],
                "code": l["link_code"],
                "logo_url": l.get("logo_url"),
                "referral_fee_cents": l.get("referral_fee_cents", 0),
                "is_verified": l.get("is_verified", False),
                "business_id": str(l["business_id"]),
            })
        
        return {
            "referrer": {
                "id": str(referrer_id),
                "stripe_connected": ref["stripe_account_id"] is not None
            },
            "stats": {
                "wallet_balance": (ref["wallet_balance_cents"] or 0) / 100,
                "pending": (ref["pending_cents"] or 0) / 100,
                "total_earned": (ref["total_earned_cents"] or 0) / 100
            },
            "links": formatted_links
        }
    except HTTPException:
        raise
    except Exception as e:
        error_logger.error(f"Error in dashboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.get("/leads")
async def get_referrer_leads(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Fetches all leads generated by the authenticated referrer."""
    user_uuid = uuid.UUID(user.id)
    
    # 0. Get referrer
    ref_query = text("SELECT id FROM referrers WHERE user_id = :user_id")
    ref_result = await db.execute(ref_query, {"user_id": user_uuid})
    ref = ref_result.mappings().first()
    
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer account not found")

    referrer_id = ref["id"]

    query = text("""
        SELECT 
            l.id, 
            l.consumer_name, 
            l.status, 
            l.referrer_payout_amount_cents,
            b.business_name,
            b.trade_category
        FROM leads l
        JOIN businesses b ON l.business_id = b.id
        WHERE l.referrer_id = :rid
        ORDER BY l.created_at DESC
    """)
    res = await db.execute(query, {"rid": referrer_id})
    leads = res.mappings().all()

    return [
        {
            "id": str(l["id"]),
            "customer_name": l["consumer_name"],
            "business_name": l["business_name"],
            "trade_category": l["trade_category"],
            "status": l["status"],
            "amount": (l["referrer_payout_amount_cents"] or 0) / 100
        } for l in leads
    ]


@router.get("/payouts")
async def get_payout_history(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Fetches payout history for the authenticated referrer."""
    user_uuid = uuid.UUID(user.id)
    
    # Get referrer_id
    ref_query = text("SELECT id FROM referrers WHERE user_id = :user_id")
    result = await db.execute(ref_query, {"user_id": user_uuid})
    ref = result.mappings().first()
    
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")
        
    query = text("""
        SELECT id, amount_cents, method, destination, destination_email, status,
               processed_at, payment_ref, created_at
        FROM payout_requests
        WHERE referrer_id = :rid
        ORDER BY created_at DESC
    """)
    res = await db.execute(query, {"rid": ref["id"]})
    payouts = res.mappings().all()

    return [
        {
            "id": str(p["id"]),
            "amount": p["amount_cents"] / 100,
            "amount_cents": p["amount_cents"],
            "method": p["method"],
            "destination": p["destination"],
            "destination_email": p["destination_email"],
            "status": p["status"],
            "processed_at": p["processed_at"],
            "payment_ref": p["payment_ref"],
            "created_at": p["created_at"],
            "date": p["created_at"]
        } for p in payouts
    ]

@router.get("/me")
async def get_my_referrer(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Fetches the referrer profile associated with the authenticated user."""
    query = text("SELECT * FROM referrers WHERE user_id = :user_id")
    result = await db.execute(query, {"user_id": uuid.UUID(user.id)})
    ref = result.mappings().first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")
    return dict(ref)

TIER_THRESHOLDS = {
    "bronze":   {"min": 0,  "max": 4,      "split": 80,   "next": "silver"},
    "silver":   {"min": 5,  "max": 9,      "split": 82.5, "next": "gold"},
    "gold":     {"min": 10, "max": 19,     "split": 85,   "next": "platinum"},
    "platinum": {"min": 20, "max": 999999, "split": 90,   "next": None},
}

def calculate_tier(monthly_referrals: int) -> str:
    """Tier based on confirmed referrals in the rolling last 30 days."""
    if monthly_referrals >= 20: return "platinum"
    if monthly_referrals >= 10: return "gold"
    if monthly_referrals >= 5:  return "silver"
    return "bronze"


class MonthlyGoalUpdate(BaseModel):
    monthly_goal_cents: Optional[int] = None


@router.get("/stats")
async def get_referrer_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Full earnings stats, tier info, and per-business breakdown for the referrer dashboard."""
    user_uuid = uuid.UUID(user.id)

    ref_result = await db.execute(
        text("SELECT * FROM referrers WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    ref = ref_result.mappings().first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")

    ref_id = ref["id"]

    # Lifetime confirmed referrals (for display)
    count_result = await db.execute(
        text("SELECT COUNT(*) as cnt FROM leads WHERE referrer_id = :rid AND status IN ('CONFIRMED','CONFIRMED_SUCCESS')"),
        {"rid": ref_id}
    )
    total_referrals = count_result.scalar() or 0

    # Rolling 30-day confirmed referrals (used for tier calculation)
    monthly_count_result = await db.execute(
        text("SELECT COUNT(*) as cnt FROM leads WHERE referrer_id = :rid AND status IN ('CONFIRMED','CONFIRMED_SUCCESS') AND created_at >= now() - interval '30 days'"),
        {"rid": ref_id}
    )
    monthly_referrals = monthly_count_result.scalar() or 0

    # Earnings: this week, this month, lifetime
    earnings_result = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', now()) THEN unlock_fee_cents ELSE 0 END), 0) as week_cents,
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) THEN unlock_fee_cents ELSE 0 END), 0) as month_cents,
                COALESCE(SUM(unlock_fee_cents), 0) as lifetime_cents,
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now()) THEN unlock_fee_cents ELSE 0 END), 0) as last_month_cents
            FROM leads
            WHERE referrer_id = :rid AND status IN ('UNLOCKED', 'CONFIRMED', 'ON_THE_WAY',
                  'MEETING_VERIFIED', 'VALID_LEAD', 'PAYMENT_PENDING_CONFIRMATION', 'CONFIRMED_SUCCESS')
        """),
        {"rid": ref_id}
    )
    earnings = earnings_result.mappings().first()

    # Pending earnings (leads not yet confirmed)
    pending_result = await db.execute(
        text("SELECT COALESCE(SUM(unlock_fee_cents), 0) as pending FROM leads WHERE referrer_id = :rid AND status IN ('UNLOCKED','ON_THE_WAY','MEETING_VERIFIED','VALID_LEAD','PAYMENT_PENDING_CONFIRMATION')"),
        {"rid": ref_id}
    )
    pending_cents = pending_result.scalar() or 0

    # Per-business breakdown (top 10)
    biz_result = await db.execute(
        text("""
            SELECT b.business_name, b.slug, b.trade_category,
                   COUNT(l.id) as lead_count,
                   COALESCE(SUM(l.unlock_fee_cents), 0) as earned_cents
            FROM leads l
            JOIN businesses b ON b.id = l.business_id
            WHERE l.referrer_id = :rid AND l.status IN ('UNLOCKED', 'CONFIRMED', 'ON_THE_WAY',
                  'MEETING_VERIFIED', 'VALID_LEAD', 'PAYMENT_PENDING_CONFIRMATION', 'CONFIRMED_SUCCESS')
            GROUP BY b.id, b.business_name, b.slug, b.trade_category
            ORDER BY earned_cents DESC
            LIMIT 10
        """),
        {"rid": ref_id}
    )
    per_business = [
        {
            "business_name": row["business_name"],
            "slug": row["slug"],
            "trade_category": row["trade_category"],
            "lead_count": row["lead_count"],
            "earned_cents": row["earned_cents"],
        }
        for row in biz_result.mappings().all()
    ]

    # Tier calculation based on rolling 30-day referral count
    tier = calculate_tier(monthly_referrals)
    tier_info = TIER_THRESHOLDS[tier]
    next_tier = tier_info["next"]
    next_threshold = TIER_THRESHOLDS[next_tier]["min"] if next_tier else None
    referrals_to_next = (next_threshold - monthly_referrals) if next_threshold else 0

    # Update tier + total_referrals in DB if changed
    if tier != ref.get("tier") or total_referrals != ref.get("total_referrals"):
        await db.execute(
            text("UPDATE referrers SET tier = :tier, total_referrals = :tr WHERE id = :rid"),
            {"tier": tier, "tr": total_referrals, "rid": ref_id}
        )
        await db.commit()

    week_cents = earnings["week_cents"] if earnings else 0
    month_cents = earnings["month_cents"] if earnings else 0
    lifetime_cents = earnings["lifetime_cents"] if earnings else 0
    last_month_cents = earnings["last_month_cents"] if earnings else 0

    # Monthly trend
    month_trend = 0
    if last_month_cents > 0:
        month_trend = round(((month_cents - last_month_cents) / last_month_cents) * 100)

    # Goal progress
    monthly_goal_cents = ref.get("monthly_goal_cents")
    goal_progress = None
    if monthly_goal_cents and monthly_goal_cents > 0:
        goal_progress = round((month_cents / monthly_goal_cents) * 100)

    return {
        "tier": tier,
        "tier_split": tier_info["split"],
        "next_tier": next_tier,
        "referrals_to_next": max(0, referrals_to_next),
        "total_referrals": total_referrals,
        "monthly_referrals": monthly_referrals,
        "earnings": {
            "this_week": week_cents,
            "this_month": month_cents,
            "last_month": last_month_cents,
            "lifetime": lifetime_cents,
            "pending": pending_cents,
            "month_trend": month_trend,
        },
        "monthly_goal_cents": monthly_goal_cents,
        "goal_progress": goal_progress,
        "per_business": per_business,
    }


@router.patch("/goal")
async def update_monthly_goal(
    data: MonthlyGoalUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    await db.execute(
        text("UPDATE referrers SET monthly_goal_cents = :goal WHERE user_id = :uid"),
        {"goal": data.monthly_goal_cents, "uid": user_uuid}
    )
    await db.commit()
    return {"message": "Goal updated"}


class WithdrawalRequest(BaseModel):
    method: str

@router.post("/withdraw")
async def withdraw_funds(
    request: WithdrawalRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Processes a withdrawal request for a referrer."""
    user_uuid = uuid.UUID(user.id)
    
    # 1. Get referrer and balance
    ref_query = text("SELECT id, wallet_balance_cents, stripe_account_id FROM referrers WHERE user_id = :user_id")
    result = await db.execute(ref_query, {"user_id": user_uuid})
    ref = result.mappings().first()
    
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")
    
    if not ref["stripe_account_id"]:
        raise HTTPException(status_code=400, detail="Please connect your Stripe account first")
        
    amount = ref["wallet_balance_cents"]
    if amount <= 0:
        raise HTTPException(status_code=400, detail="No funds available for withdrawal")

    # 2. Process Stripe Transfer
    # For instant payouts, Stripe handles the timing if the account supports it.
    # Here we just move funds from platform to connected account.
    try:
        transfer_id = await StripeService.create_transfer(
            amount=amount,
            destination_account_id=ref["stripe_account_id"],
            description=f"TradeRefer {request.method.capitalize()} Withdrawal"
        )
        
        # 3. Update DB: zero out balance, log request
        await db.execute(text("""
            UPDATE referrers 
            SET wallet_balance_cents = 0,
                updated_at = now()
            WHERE id = :id
        """), {"id": ref["id"]})
        
        # Log Payout Request
        await db.execute(text("""
            INSERT INTO payout_requests (referrer_id, amount_cents, method, destination, status, processed_at, payment_ref)
            VALUES (:rid, :amount, :method, :dest, 'COMPLETED', now(), :ref)
        """), {
            "rid": ref["id"],
            "amount": amount,
            "method": request.method,
            "dest": ref["stripe_account_id"],
            "ref": transfer_id
        })

        # Log internal transaction record if a wallet_transactions table for referrers or general exists.
        # Currently the schema only has wallet_transactions for businesses. 
        # I will skip the wallet_transactions insert for referrers to avoid foreign key errors 
        # but ensure the payout_requests record is solid.
        
        await db.commit()
        send_referrer_payout_processed(
            email=ref["email"],
            full_name=ref["full_name"] or ref["email"],
            amount_dollars=amount / 100,
            method=request.method,
        )
        return {"status": "success", "amount": amount / 100}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Withdrawal failed: {str(e)}")


@router.get("/is-linked/{slug}")
async def is_linked_to_business(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Check whether the authenticated referrer has an active referral link for this business."""
    user_uuid = uuid.UUID(user.id)
    result = await db.execute(
        text("""
            SELECT rl.id FROM referral_links rl
            JOIN referrers r ON r.id = rl.referrer_id
            JOIN businesses b ON b.id = rl.business_id
            WHERE r.user_id = :uid AND b.slug = :slug
            LIMIT 1
        """),
        {"uid": user_uuid, "slug": slug}
    )
    return {"linked": result.fetchone() is not None}


@router.post("/review-business")
async def review_business(
    data: ReviewBusiness,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Referrer sends an internal review of a business — delivered as a private notification to the business owner."""
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    user_uuid = uuid.UUID(user.id)
    stars = "★" * data.rating + "☆" * (5 - data.rating)

    ref_res = await db.execute(
        text("SELECT id, full_name FROM referrers WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    ref = ref_res.mappings().fetchone()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")

    biz_res = await db.execute(
        text("SELECT id, user_id, business_name, slug, business_email FROM businesses WHERE slug = :slug"),
        {"slug": data.business_slug}
    )
    biz = biz_res.mappings().fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    referrer_name = ref["full_name"] or "A referrer"
    comment_part = f" — \"{data.comment}\"" if data.comment else ""

    from routers.notifications import create_notification
    await create_notification(
        db,
        str(biz["user_id"]),
        "review",
        f"{referrer_name} rated you {stars}",
        f"{data.rating}/5{comment_part}",
        "/dashboard/business"
    )

    if biz["business_email"]:
        send_business_new_review(
            email=biz["business_email"],
            business_name=biz["business_name"],
            referrer_name=referrer_name,
            rating=data.rating,
            comment=data.comment,
            slug=biz["slug"]
        )

    return {"message": "Review sent to business"}


class PrivateFeedback(BaseModel):
    business_slug: str
    message: str
    category: str = "general"  # general, response_time, quality, communication


@router.post("/feedback")
async def submit_private_feedback(
    data: PrivateFeedback,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Submit private feedback to a business (only visible to the business)."""
    user_uuid = uuid.UUID(user.id)
    ref_res = await db.execute(
        text("SELECT id, full_name FROM referrers WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    ref = ref_res.fetchone()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer not found")

    biz_res = await db.execute(
        text("SELECT id, user_id FROM businesses WHERE slug = :slug"),
        {"slug": data.business_slug}
    )
    biz = biz_res.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    # Store as an in-app notification to the business owner
    from routers.notifications import create_notification
    await create_notification(
        db,
        str(biz[1]),  # business user_id
        "feedback",
        f"Private feedback from {ref[1]}",
        f"[{data.category.upper()}] {data.message}",
        "/dashboard/business"
    )
    return {"message": "Feedback sent privately to the business"}
