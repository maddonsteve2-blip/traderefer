from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from services.stripe_service import StripeService
import uuid
import os

router = APIRouter()

class ReferrerOnboarding(BaseModel):
    full_name: str
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
            "full_name": data.full_name,
            "email": email,
            "phone": data.phone,
            "region": data.region,
            "stripe_account_id": f"acct_mock_ref_{user.id[:8]}"
        })
        await db.commit()
        row = result.fetchone()
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
                b.slug
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
                "clicks": l.get("clicks", 0),
                "leads": l.get("leads_created", 0),
                "earned": (l.get("total_earned_cents") or 0) / 100,
                "slug": l["slug"],
                "code": l["link_code"]
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
    return {"message": "Review submitted"}
