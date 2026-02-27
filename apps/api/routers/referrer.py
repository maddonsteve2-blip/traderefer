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

router = APIRouter()

class ReferrerOnboarding(BaseModel):
    full_name: Optional[str] = None
    phone: str
    region: str

class ReviewCreate(BaseModel):
    business_slug: str
    rating: int  # 1-5
    comment: Optional[str] = None

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

    # Use email from token if available, or placeholder
    email = user.email or f"user_{user.id}@clerk.com"
    
    query = text("""
        INSERT INTO referrers (
            user_id, full_name, email, phone, region, status, stripe_account_id
        ) VALUES (
            :user_id, :full_name, :email, :phone, :region, 'active', :stripe_account_id
        ) RETURNING id
    """)
    
    try:
        result = await db.execute(query, {
            "user_id": user_uuid,
            "full_name": data.full_name or email.split("@")[0].replace(".", " ").title(),
            "email": email,
            "phone": data.phone,
            "region": data.region,
            "stripe_account_id": f"acct_mock_ref_{user.id[:8]}"
        })
        await db.commit()
        row = result.fetchone()
        send_referrer_welcome(email, data.full_name or email.split("@")[0].replace(".", " ").title())
        return {"id": str(row[0])}
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
        return {"link_code": link_code}
    except Exception as e:
        await db.rollback()
        print(f"Error creating link: {e}")
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
                "is_verified": l.get("is_verified", False)
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
        print(f"Error in dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

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
        SELECT amount_cents, method, destination, status, processed_at, payment_ref, created_at
        FROM payout_requests 
        WHERE referrer_id = :rid
        ORDER BY created_at DESC
    """)
    res = await db.execute(query, {"rid": ref["id"]})
    payouts = res.mappings().all()
    
    return [
        {
            "amount": p["amount_cents"] / 100,
            "method": p["method"],
            "destination": p["destination"],
            "status": p["status"],
            "processed_at": p["processed_at"],
            "payment_ref": p["payment_ref"],
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
    "starter": {"min": 0, "max": 5, "split": 80, "next": "pro"},
    "pro": {"min": 6, "max": 20, "split": 85, "next": "elite"},
    "elite": {"min": 21, "max": 50, "split": 90, "next": "ambassador"},
    "ambassador": {"min": 51, "max": 999999, "split": 90, "next": None},
}

def calculate_tier(total_referrals: int) -> str:
    if total_referrals >= 51: return "ambassador"
    if total_referrals >= 21: return "elite"
    if total_referrals >= 6: return "pro"
    return "starter"


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

    # Count confirmed leads as total referrals
    count_result = await db.execute(
        text("SELECT COUNT(*) as cnt FROM leads WHERE referrer_id = :rid AND status = 'CONFIRMED'"),
        {"rid": ref_id}
    )
    total_referrals = count_result.scalar() or 0

    # Earnings: this week, this month, lifetime
    earnings_result = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', now()) THEN unlock_fee_cents ELSE 0 END), 0) as week_cents,
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) THEN unlock_fee_cents ELSE 0 END), 0) as month_cents,
                COALESCE(SUM(unlock_fee_cents), 0) as lifetime_cents,
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now()) THEN unlock_fee_cents ELSE 0 END), 0) as last_month_cents
            FROM leads
            WHERE referrer_id = :rid AND status IN ('UNLOCKED', 'CONFIRMED', 'ON_THE_WAY')
        """),
        {"rid": ref_id}
    )
    earnings = earnings_result.mappings().first()

    # Pending earnings (leads not yet confirmed)
    pending_result = await db.execute(
        text("SELECT COALESCE(SUM(unlock_fee_cents), 0) as pending FROM leads WHERE referrer_id = :rid AND status = 'UNLOCKED'"),
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
            WHERE l.referrer_id = :rid AND l.status IN ('UNLOCKED', 'CONFIRMED', 'ON_THE_WAY')
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

    # Tier calculation
    tier = calculate_tier(total_referrals)
    tier_info = TIER_THRESHOLDS[tier]
    next_tier = tier_info["next"]
    next_threshold = TIER_THRESHOLDS[next_tier]["min"] if next_tier else None
    referrals_to_next = (next_threshold - total_referrals) if next_threshold else 0

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


@router.post("/reviews")
async def submit_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Submit or update a referrer review of a business."""
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    user_uuid = uuid.UUID(user.id)

    # Get referrer ID
    ref_result = await db.execute(
        text("SELECT id FROM referrers WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    ref = ref_result.fetchone()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer profile not found")

    # Get business ID from slug
    biz_result = await db.execute(
        text("SELECT id FROM businesses WHERE slug = :slug"),
        {"slug": data.business_slug}
    )
    biz = biz_result.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    # Get business email + slug and referrer name for email notifications
    biz_details = await db.execute(
        text("SELECT business_email, business_name, slug FROM businesses WHERE id = :bid"),
        {"bid": biz[0]}
    )
    biz_row = biz_details.mappings().fetchone()

    ref_details = await db.execute(
        text("SELECT full_name, email FROM referrers WHERE id = :rid"),
        {"rid": ref[0]}
    )
    ref_row = ref_details.mappings().fetchone()

    # Upsert review (one review per referrer per business)
    await db.execute(
        text("""
            INSERT INTO referrer_reviews (business_id, referrer_id, rating, comment)
            VALUES (:bid, :rid, :rating, :comment)
            ON CONFLICT (business_id, referrer_id)
            DO UPDATE SET rating = :rating, comment = :comment, created_at = now()
        """),
        {
            "bid": biz[0],
            "rid": ref[0],
            "rating": data.rating,
            "comment": data.comment
        }
    )
    await db.commit()

    # Email: notify business of new review
    if biz_row and biz_row["business_email"]:
        referrer_name = ref_row["full_name"] if ref_row else "A referrer"
        send_business_new_review(
            email=biz_row["business_email"],
            business_name=biz_row["business_name"],
            referrer_name=referrer_name,
            rating=data.rating,
            comment=data.comment,
            slug=biz_row["slug"]
        )

    return {"message": "Review submitted"}


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
