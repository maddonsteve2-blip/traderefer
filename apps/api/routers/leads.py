from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from routers.notifications import create_notification
from services.email import (
    send_business_new_lead, send_consumer_lead_confirmation,
    send_consumer_on_the_way, send_business_lead_unlocked,
    send_referrer_lead_unlocked, send_business_dispute_raised
)
import uuid
import random
import os
from datetime import datetime, timedelta

router = APIRouter()

class LeadCreate(BaseModel):
    business_id: str
    consumer_name: str
    consumer_phone: str
    consumer_email: str
    consumer_suburb: str
    consumer_address: Optional[str] = None
    job_description: str
    lead_urgency: str = "warm"  # warm, hot, cold
    referral_code: Optional[str] = None
    device_hash: Optional[str] = None

class DisputeCreate(BaseModel):
    reason: str
    notes: Optional[str] = None

async def check_ip_velocity(ip: str, db: AsyncSession):
    """
    Limits the number of leads an IP can submit within a rolling window.
    Spec: Max 5 leads per hour per IP to prevent spam/automated abuse.
    """
    if ip == "unknown":
        return True

    query = text("""
        SELECT COUNT(*) 
        FROM leads 
        WHERE consumer_ip = :ip 
          AND created_at > (now() - interval '1 hour')
    """)
    result = await db.execute(query, {"ip": ip})
    count = result.scalar() or 0
    
    if count >= 5:
        print(f"Fraud: IP {ip} blocked (velocity: {count} leads/hr)")
        raise HTTPException(
            status_code=429, 
            detail="Too many lead submissions. Please try again in an hour."
        )
    return True

@router.post("/")
async def create_lead(lead: LeadCreate, request: Request, db: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    
    # 0. Fraud Check (Placeholder)
    await check_ip_velocity(client_ip, db)
    
    referral_link_id = None
    referrer_id = None
    
    # 1. Resolve referral code if provided
    if lead.referral_code:
        ref_query = text("""
            SELECT id, referrer_id FROM referral_links 
            WHERE link_code = :code AND is_active = true
            LIMIT 1
        """)
        ref_result = await db.execute(ref_query, {"code": lead.referral_code})
        ref_data = ref_result.fetchone()
        if ref_data:
            referral_link_id = ref_data[0]
            referrer_id = ref_data[1]

    # 2. Get Business Pricing (Spec Part 3.1)
    biz_query = text("""
        SELECT referral_fee_cents
        FROM businesses WHERE id = :bid LIMIT 1
    """)
    biz_result = await db.execute(biz_query, {"bid": lead.business_id})
    business = biz_result.mappings().first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    referral_fee = business["referral_fee_cents"]
    platform_fee_percent = 20 # Fixed at 20% per spec
    
    # Calculate fees (dynamic markup logic)
    platform_fee = int(referral_fee * (platform_fee_percent / 100))
    total_unlock_fee = referral_fee + platform_fee

    # 3. If a lead already exists for this phone+business, return it (idempotent)
    existing_res = await db.execute(
        text("""
            SELECT id, status
            FROM leads
            WHERE consumer_phone = :phone AND business_id = :bid
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"phone": lead.consumer_phone, "bid": lead.business_id}
    )
    existing = existing_res.mappings().first()
    if existing:
        return {"id": str(existing["id"]), "status": existing["status"]}

    # 4. Insert Lead
    insert_query = text("""
        INSERT INTO leads (
            business_id, 
            referral_link_id, 
            referrer_id, 
            consumer_name, 
            consumer_phone, 
            consumer_email, 
            consumer_suburb,
            consumer_address,
            job_description,
            status,
            unlock_fee_cents,
            referral_fee_snapshot_cents,
            referrer_payout_amount_cents,
            consumer_ip,
            consumer_device_hash,
            lead_urgency
        ) VALUES (
            :business_id, 
            :referral_link_id, 
            :referrer_id, 
            :consumer_name, 
            :consumer_phone, 
            :consumer_email, 
            :consumer_suburb,
            :consumer_address,
            :job_description, 
            'PENDING',
            :total_fee,
            :referral_fee_snapshot,
            :payout_snapshot,
            :ip,
            :device_hash,
            :lead_urgency
        ) RETURNING id
    """)
    
    try:
        result = await db.execute(insert_query, {
            "business_id": lead.business_id,
            "referral_link_id": referral_link_id,
            "referrer_id": referrer_id,
            "consumer_name": lead.consumer_name,
            "consumer_phone": lead.consumer_phone,
            "consumer_email": lead.consumer_email,
            "consumer_suburb": lead.consumer_suburb,
            "consumer_address": lead.consumer_address,
            "job_description": lead.job_description,
            "total_fee": total_unlock_fee,
            "referral_fee_snapshot": referral_fee,
            "payout_snapshot": int(referral_fee * 0.7), # Default 70% payout
            "ip": client_ip,
            "device_hash": lead.device_hash,
            "lead_urgency": lead.lead_urgency
        })
        new_lead_id = result.scalar()
        await db.commit()

        # Fetch business email + name to notify them
        biz_info = await db.execute(
            text("SELECT business_name, business_email, trade_category FROM businesses WHERE id = :id"),
            {"id": lead.business_id}
        )
        biz_row = biz_info.mappings().first()
        if biz_row and biz_row["business_email"]:
            send_business_new_lead(
                email=biz_row["business_email"],
                business_name=biz_row["business_name"],
                consumer_name=lead.consumer_name,
                suburb=lead.consumer_suburb,
                job_description=lead.job_description,
                lead_id=str(new_lead_id),
                unlock_fee_dollars=total_unlock_fee / 100,
            )
        # Notify the consumer
        if lead.consumer_email and biz_row:
            send_consumer_lead_confirmation(
                email=lead.consumer_email,
                consumer_name=lead.consumer_name,
                business_name=biz_row["business_name"],
                trade_category=biz_row["trade_category"],
                job_description=lead.job_description,
            )

        return {"id": str(new_lead_id), "status": "PENDING"}
    except Exception as e:
        await db.rollback()

        # If we raced the unique constraint, return the existing lead instead of 500
        err_str = str(e)
        if "idx_leads_phone_business" in err_str or "UniqueViolationError" in err_str:
            existing_res = await db.execute(
                text("""
                    SELECT id, status
                    FROM leads
                    WHERE consumer_phone = :phone AND business_id = :bid
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"phone": lead.consumer_phone, "bid": lead.business_id}
            )
            existing = existing_res.mappings().first()
            if existing:
                return {"id": str(existing["id"]), "status": existing["status"]}

        print(f"Error creating lead: {e}")
        print(f"Lead data: business_id={lead.business_id}, consumer_name={lead.consumer_name}, consumer_phone={lead.consumer_phone}, consumer_email={lead.consumer_email}, consumer_suburb={lead.consumer_suburb}")
        print(f"Calculated values: referral_fee={referral_fee}, total_unlock_fee={total_unlock_fee}, platform_fee={platform_fee}")
        raise HTTPException(status_code=500, detail="Failed to create lead")

class OTPVerify(BaseModel):
    otp: str

@router.post("/{lead_id}/verify-otp")
async def verify_otp(lead_id: str, code: Optional[str] = None, data: Optional[OTPVerify] = None, db: AsyncSession = Depends(get_db)):
    # Accept OTP from either query param (?code=) or POST body ({"otp": "..."})
    otp_value = code or (data.otp if data else None)
    
    if not otp_value:
        raise HTTPException(status_code=400, detail="OTP is required")
    
    # Mock OTP verification (6-digit)
    if otp_value != "123456":
         raise HTTPException(status_code=400, detail="Invalid OTP")
         
    verify_query = text("""
        UPDATE leads 
        SET status = 'VERIFIED', otp_verified_at = now() 
        WHERE id = :lead_id
    """)
    await db.execute(verify_query, {"lead_id": lead_id})
    await db.commit()
    return {"message": "OTP Verified"}

@router.get("/{lead_id}")
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    try:
        lead_uuid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lead ID")

    query = text("""
        SELECT id, business_id, consumer_name, consumer_phone, consumer_email, 
               consumer_suburb, consumer_address, job_description, status, unlock_fee_cents,
               referrer_id, referral_link_id
        FROM leads WHERE id = :id
    """)
    result = await db.execute(query, {"id": lead_uuid})
    l = result.mappings().first()

    if not l:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Masking logic
    unlocked_statuses = ["UNLOCKED", "ON_THE_WAY", "CONFIRMED"]
    is_unlocked = l["status"].upper() in unlocked_statuses
    
    data = dict(l)
    if not is_unlocked:
        data["consumer_phone"] = l["consumer_phone"][:4] + "****" + l["consumer_phone"][-2:]
        data["consumer_email"] = l["consumer_email"][:2] + "***@" + l["consumer_email"].split("@")[-1]
        data["consumer_name"] = l["consumer_name"].split(" ")[0] + " ***"

    return data

from services.auth import get_current_user, AuthenticatedUser
from services.stripe_service import StripeService
from decimal import Decimal

class UnlockRequest(BaseModel):
    pass # business_id no longer needed in body as we use authenticated user

@router.post("/{lead_id}/unlock")
async def unlock_lead(
    lead_id: str, 
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Verify business belongs to user
    user_uuid = uuid.UUID(user.id)
    biz_query = text("SELECT id, stripe_account_id FROM businesses WHERE user_id = :uid LIMIT 1")
    biz_result = await db.execute(biz_query, {"uid": user_uuid})
    business = biz_result.mappings().first()
    
    if not business:
        raise HTTPException(status_code=403, detail="No business associated with this account")

    # 2. Check lead exists and belongs to this business
    check_query = text("""
        SELECT status, referrer_id, business_id, unlock_fee_cents, platform_fee_cents
        FROM leads 
        WHERE id = :id
    """)
    res = await db.execute(check_query, {"id": lead_id})
    lead = res.mappings().first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if str(lead["business_id"]) != str(business["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to unlock this lead")
    if lead["status"] == "UNLOCKED":
        return {"message": "Lead already unlocked", "status": "UNLOCKED"}
    
    # 3. Handle Payment
    amount = lead["unlock_fee_cents"] or 0
    stripe_key = os.getenv("STRIPE_SECRET_KEY")

    # Dev/test mode: skip Stripe, unlock directly (deduct from wallet if possible)
    is_dev_mode = not stripe_key or stripe_key == "" or "x8x8x8" in stripe_key or stripe_key.startswith("pk_test_mock")
    if is_dev_mode:
        # Deduct from wallet if balance available, otherwise unlock for free in dev
        wallet_q = await db.execute(
            text("SELECT wallet_balance_cents FROM businesses WHERE id = :id"),
            {"id": business["id"]}
        )
        wallet_balance = wallet_q.scalar() or 0

        if wallet_balance >= amount:
            new_balance = wallet_balance - amount
            await db.execute(
                text("UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :id"),
                {"bal": new_balance, "id": business["id"]}
            )

        # Unlock the lead directly
        pin = str(random.randint(1000, 9999))
        await db.execute(
            text("""UPDATE leads SET status = 'UNLOCKED', unlocked_at = now(),
                    unlock_payment_type = 'dev_bypass', payment_reference = :pin
                    WHERE id = :id"""),
            {"id": lead_id, "pin": pin}
        )
        await db.commit()
        return {"status": "UNLOCKED", "message": "Lead unlocked (dev mode)"}

    # Production: create Stripe PaymentIntent
    try:
        intent = await StripeService.create_payment_intent(
            amount=amount,
            currency="aud",
            metadata={
                "lead_id": lead_id,
                "business_id": str(business["id"]),
                "referrer_id": str(lead["referrer_id"]) if lead["referrer_id"] else None
            }
        )
            
        return {
            "client_secret": intent.client_secret,
            "publishable_key": StripeService.get_publishable_key(),
            "status": "REQUIRES_PAYMENT"
        }
        
    except Exception as e:
        print(f"Stripe setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize payment")

@router.post("/{lead_id}/on-the-way")
async def on_the_way(
    lead_id: str, 
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Verify business
    user_uuid = uuid.UUID(user.id)
    biz_query = text("SELECT id FROM businesses WHERE user_id = :uid LIMIT 1")
    biz_res = await db.execute(biz_query, {"uid": user_uuid})
    business = biz_res.mappings().first()
    if not business:
        raise HTTPException(status_code=403, detail="No business associated")

    # 2. Check lead status
    check_query = text("SELECT status, consumer_phone, business_id FROM leads WHERE id = :id")
    res = await db.execute(check_query, {"id": lead_id})
    lead = res.mappings().first()
    if not lead or str(lead["business_id"]) != str(business["id"]):
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead["status"] != "UNLOCKED":
        raise HTTPException(status_code=400, detail="Lead must be UNLOCKED to trigger ON_THE_WAY")

    # 3. Generate PIN (Spec Part 3.3)
    pin = "".join([str(random.randint(0, 9)) for _ in range(4)])
    expires_at = datetime.now() + timedelta(hours=4)

    # 4. Save PIN
    pin_query = text("""
        INSERT INTO lead_pins (lead_id, pin, expires_at)
        VALUES (:lid, :pin, :exp)
    """)
    await db.execute(pin_query, {"lid": lead_id, "pin": pin, "exp": expires_at})

    # 5. Update Lead Status
    update_query = text("""
        UPDATE leads 
        SET status = 'ON_THE_WAY', on_the_way_at = now() 
        WHERE id = :id
    """)
    await db.execute(update_query, {"id": lead_id})
    await db.commit()

    # 6. TODO: Trigger SMS via Twilio (Part 4.4)
    print(f"📱 SMS to {lead['consumer_phone']}: Your connection code for {business['id']} is {pin}. valid for 4hrs.")

    # 7. Email consumer their PIN
    consumer_info = await db.execute(
        text("SELECT consumer_name, consumer_email FROM leads WHERE id = :id"),
        {"id": lead_id}
    )
    consumer_row = consumer_info.mappings().first()
    biz_name_res = await db.execute(
        text("SELECT business_name FROM businesses WHERE id = :id"),
        {"id": business["id"]}
    )
    biz_name_row = biz_name_res.mappings().first()
    if consumer_row and consumer_row["consumer_email"] and biz_name_row:
        send_consumer_on_the_way(
            email=consumer_row["consumer_email"],
            consumer_name=consumer_row["consumer_name"],
            business_name=biz_name_row["business_name"],
            pin=pin,
        )

    return {"status": "ON_THE_WAY", "expires_at": expires_at.isoformat()}

class PINConfirm(BaseModel):
    pin: str

@router.post("/{lead_id}/confirm-pin")
async def confirm_pin(
    lead_id: str,
    data: PINConfirm,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Verify business
    user_uuid = uuid.UUID(user.id)
    biz_query = text("SELECT id FROM businesses WHERE user_id = :uid LIMIT 1")
    biz_res = await db.execute(biz_query, {"uid": user_uuid})
    business = biz_res.mappings().first()
    
    # 2. Get Lead and PIN details
    query = text("""
        SELECT l.status, l.business_id, lp.pin, lp.attempts, lp.expires_at, lp.is_used,
               l.referrer_id, l.referrer_payout_amount_cents
        FROM leads l
        JOIN lead_pins lp ON l.id = lp.lead_id
        WHERE l.id = :id
        ORDER BY lp.created_at DESC LIMIT 1
    """)
    res = await db.execute(query, {"id": lead_id})
    row = res.mappings().first()

    if not row or str(row["business_id"]) != str(business["id"]):
        raise HTTPException(status_code=404, detail="Lead or PIN not found")
    
    if row["is_used"] or row["status"] == "CONFIRMED":
         return {"message": "Lead already confirmed", "status": "CONFIRMED"}

    if datetime.now() > row["expires_at"]:
        raise HTTPException(status_code=400, detail="PIN has expired")
    
    if row["attempts"] >= 3:
        raise HTTPException(status_code=403, detail="Too many attempts. PIN locked.")

    # 3. Validate PIN
    if data.pin != row["pin"]:
        # Increment attempts
        await db.execute(text("UPDATE lead_pins SET attempts = attempts + 1 WHERE lead_id = :lid"), {"lid": lead_id})
        await db.commit()
        remaining = 2 - row['attempts']
        if remaining <= 0:
            msg = "Invalid PIN. PIN locked."
        else:
            msg = f"Invalid PIN. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        raise HTTPException(status_code=400, detail=msg)

    # 4. Success — Atomic Update (Spec Part 3.4)
    # Mark Lead as CONFIRMED, PIN as used, Release referral payout
    try:
        # Update Lead & PIN
        await db.execute(text("""
            UPDATE leads 
            SET status = 'CONFIRMED', confirmed_at = now()
            WHERE id = :id
        """), {"id": lead_id})
        
        await db.execute(text("UPDATE lead_pins SET is_used = true WHERE lead_id = :lid"), {"lid": lead_id})

        # Handle Referrer Earning: Move from PENDING to AVAILABLE
        payout = row["referrer_payout_amount_cents"] or 0

        if row["referrer_id"]:
            # 1. Update existing earning record if it exists (created by Stripe webhook)
            earning_query = text("""
                UPDATE referrer_earnings 
                SET status = 'AVAILABLE', available_at = now()
                WHERE lead_id = :lid AND referrer_id = :rid AND status = 'PENDING'
                RETURNING gross_cents
            """)
            earning_res = await db.execute(earning_query, {"lid": lead_id, "rid": row["referrer_id"]})
            earning = earning_res.fetchone()
            
            # 2. Update Referrer Balances
            if earning:
                # Move from pending to wallet
                await db.execute(text("""
                    UPDATE referrers 
                    SET wallet_balance_cents = wallet_balance_cents + :amount,
                        pending_cents = GREATEST(0, pending_cents - :amount),
                        total_earned_cents = total_earned_cents + :amount
                    WHERE id = :rid
                """), {"amount": payout, "rid": row["referrer_id"]})
            else:
                # If no pending record found (e.g. race condition or manual unlock), create one as AVAILABLE
                await db.execute(text("""
                    INSERT INTO referrer_earnings (referrer_id, lead_id, gross_cents, platform_cut_cents, status, available_at)
                    VALUES (:rid, :lid, :gross, :cut, 'AVAILABLE', now())
                """), {
                    "rid": row["referrer_id"],
                    "lid": lead_id,
                    "gross": payout,
                    "cut": 0, # Platform cut taken during unlock
                })
                
                await db.execute(text("""
                    UPDATE referrers 
                    SET wallet_balance_cents = wallet_balance_cents + :amount,
                        total_earned_cents = total_earned_cents + :amount
                    WHERE id = :rid
                """), {"amount": payout, "rid": row["referrer_id"]})

            # 3. Log Payout Transaction
            await db.execute(text("""
                INSERT INTO payment_transactions (lead_id, business_id, referrer_id, type, amount_cents, status)
                VALUES (:lid, :bid, :rid, 'referrer_payout', :amount, 'completed')
            """), {
                "lid": lead_id,
                "bid": row["business_id"],
                "rid": row["referrer_id"],
                "amount": payout
            })

            # 4. Update Referral Link Stats
            await db.execute(text("""
                UPDATE referral_links 
                SET leads_unlocked = leads_unlocked + 1,
                    total_earned_cents = total_earned_cents + :amount
                WHERE id = :link_id
            """), {"amount": payout, "link_id": row["referral_link_id"]})

        await db.commit()

        # Send notification to referrer
        if row["referrer_id"] and payout > 0:
            try:
                ref_user = await db.execute(
                    text("SELECT user_id FROM referrers WHERE id = :rid"),
                    {"rid": row["referrer_id"]}
                )
                ref_row = ref_user.fetchone()
                biz_name_res = await db.execute(
                    text("SELECT business_name, slug FROM businesses WHERE id = :bid"),
                    {"bid": row["business_id"]}
                )
                biz_row = biz_name_res.fetchone()
                if ref_row and biz_row:
                    await create_notification(
                        db,
                        str(ref_row[0]),
                        "lead_accepted",
                        f"You earned ${payout / 100:.2f}!",
                        f"Your referral to {biz_row[0]} was confirmed. The money is in your wallet.",
                        f"/dashboard/referrer"
                    )
            except Exception as notif_err:
                print(f"Notification error (non-fatal): {notif_err}")

        # Email referrer: earning confirmed and available
        if row["referrer_id"] and payout > 0:
            try:
                ref_email_res = await db.execute(
                    text("SELECT email, full_name FROM referrers WHERE id = :rid"),
                    {"rid": row["referrer_id"]}
                )
                ref_email_row = ref_email_res.mappings().first()
                biz_name_res2 = await db.execute(
                    text("SELECT business_name FROM businesses WHERE id = :bid"),
                    {"bid": row["business_id"]}
                )
                biz_name_row2 = biz_name_res2.mappings().first()
                if ref_email_row and ref_email_row["email"]:
                    from services.email import send_referrer_earning_available
                    send_referrer_earning_available(
                        email=ref_email_row["email"],
                        full_name=ref_email_row["full_name"] or ref_email_row["email"],
                        amount_dollars=payout / 100,
                        business_name=biz_name_row2["business_name"] if biz_name_row2 else "the business",
                    )
            except Exception as email_err:
                print(f"Earning email error (non-fatal): {email_err}")

        # Email referrer: ask for a review of the business
        if row["referrer_id"]:
            try:
                ref_rev_res = await db.execute(
                    text("SELECT email, full_name FROM referrers WHERE id = :rid"),
                    {"rid": row["referrer_id"]}
                )
                ref_rev_row = ref_rev_res.mappings().first()
                biz_slug_res = await db.execute(
                    text("SELECT business_name, slug FROM businesses WHERE id = :bid"),
                    {"bid": row["business_id"]}
                )
                biz_slug_row = biz_slug_res.mappings().first()
                if ref_rev_row and ref_rev_row["email"] and biz_slug_row:
                    from services.email import send_referrer_review_request
                    send_referrer_review_request(
                        email=ref_rev_row["email"],
                        full_name=ref_rev_row["full_name"] or ref_rev_row["email"],
                        business_name=biz_slug_row["business_name"],
                        slug=biz_slug_row["slug"],
                    )
            except Exception as rev_email_err:
                print(f"Review request email error (non-fatal): {rev_email_err}")

        return {"confirmed": True, "message": "Lead confirmed and payment released to referrer."}
    except Exception as e:
        await db.rollback()
        print(f"PIN Confirmation Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to confirm PIN")
@router.post("/{lead_id}/dispute")
async def create_dispute(
    lead_id: str,
    data: DisputeCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Allows a business to raise a dispute on a lead they have unlocked."""
    user_uuid = uuid.UUID(user.id)
    
    # 1. Verify business owns the lead
    query = text("""
        SELECT l.id, l.business_id, l.status 
        FROM leads l
        JOIN businesses b ON l.business_id = b.id
        WHERE l.id = :lid AND b.user_id = :uid
    """)
    res = await db.execute(query, {"lid": lead_id, "uid": user_uuid})
    lead = res.mappings().first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or not owned by you")
        
    if lead["status"] == "PENDING":
        raise HTTPException(status_code=400, detail="Cannot dispute a lead that hasn't been unlocked")

    # 2. Check for existing dispute
    check_dispute = text("SELECT id FROM disputes WHERE lead_id = :lid")
    existing = await db.execute(check_dispute, {"lid": lead_id})
    if existing.fetchone():
        raise HTTPException(status_code=400, detail="A dispute already exists for this lead")

    # 3. Create dispute
    insert_query = text("""
        INSERT INTO disputes (lead_id, business_id, reason, notes, status)
        VALUES (:lid, :bid, :reason, :notes, 'OPEN')
        RETURNING id
    """)
    
    try:
        await db.execute(insert_query, {
            "lid": lead_id,
            "bid": lead["business_id"],
            "reason": data.reason,
            "notes": data.notes
        })
        
        # Update lead status to DISPUTED
        await db.execute(text("UPDATE leads SET status = 'DISPUTED' WHERE id = :id"), {"id": lead_id})
        
        await db.commit()

        # Email business: dispute confirmation
        try:
            biz_email_res = await db.execute(
                text("SELECT b.business_email, b.business_name FROM businesses b JOIN leads l ON l.business_id = b.id WHERE l.id = :lid"),
                {"lid": lead_id}
            )
            biz_email_row = biz_email_res.mappings().first()
            if biz_email_row and biz_email_row["business_email"]:
                send_business_dispute_raised(
                    email=biz_email_row["business_email"],
                    business_name=biz_email_row["business_name"],
                    lead_id=lead_id,
                    reason=data.reason,
                )
        except Exception as email_err:
            print(f"Dispute email error (non-fatal): {email_err}")

        return {"status": "success", "message": "Dispute raised successfully"}
    except Exception as e:
        await db.rollback()
        print(f"Dispute error: {e}")
        raise HTTPException(status_code=500, detail="Failed to raise dispute")
