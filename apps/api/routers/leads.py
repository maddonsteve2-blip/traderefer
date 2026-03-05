from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from routers.notifications import create_notification
from services.email import (
    send_business_new_lead, send_business_enquiry_teaser, send_consumer_lead_confirmation,
    send_consumer_on_the_way, send_business_lead_unlocked,
    send_referrer_lead_unlocked, send_business_dispute_raised
)
from services.sms import (
    send_sms_claimed_new_lead, send_sms_unclaimed_teaser,
    send_sms_business_lead_unlocked, send_sms_consumer_lead_confirmation,
    send_sms_consumer_on_the_way, send_sms_referrer_earning_confirmed,
    send_sms_screening_q1, send_sms_business_lead_refunded, send_sms_business_wallet_low,
)
import uuid
import random
import os
from datetime import datetime, timedelta
from utils.logging_config import lead_logger, error_logger, payment_logger

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
        error_logger.warning(f"Fraud: IP {ip} blocked (velocity: {count} leads/hr)")
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

    # Normalize consumer phone to E.164
    _ph = lead.consumer_phone.strip().replace(" ", "").replace("-", "")
    if _ph.startswith("04"):
        _ph = "+61" + _ph[1:]
    elif _ph.startswith("4") and len(_ph) == 9:
        _ph = "+61" + _ph
    lead = lead.model_copy(update={"consumer_phone": _ph})

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

    # 2. Get Business Pricing + contact info
    biz_query = text("""
        SELECT referral_fee_cents, business_phone
        FROM businesses WHERE id = :bid LIMIT 1
    """)
    biz_result = await db.execute(biz_query, {"bid": lead.business_id})
    business = biz_result.mappings().first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    referral_fee = business["referral_fee_cents"]
    platform_fee_percent = 20 # Fixed at 20% per spec
    
    # Check if this is the first lead for the business (first = free)
    first_lead_result = await db.execute(
        text("SELECT COUNT(*) FROM leads WHERE business_id = :bid"),
        {"bid": lead.business_id}
    )
    existing_lead_count = first_lead_result.scalar() or 0
    is_first_lead = existing_lead_count == 0

    # Calculate fees (dynamic markup logic). First lead is always free.
    platform_fee = int(referral_fee * (platform_fee_percent / 100))
    total_unlock_fee = 0 if is_first_lead else referral_fee + platform_fee

    # Check referrer accountability stage
    if referrer_id:
        acct_res = await db.execute(
            text("SELECT accountability_stage FROM referrers WHERE id = :rid"),
            {"rid": referrer_id}
        )
        acct_row = acct_res.fetchone()
        if acct_row and acct_row[0] == 'paused':
            raise HTTPException(status_code=403, detail="Your referrer account is paused. Please contact support.")

    # 3. Insert Lead
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
            screening_status,
            unlock_fee_cents,
            referral_fee_snapshot_cents,
            referrer_payout_amount_cents,
            consumer_ip,
            consumer_device_hash,
            lead_urgency,
            twilio_from_number
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
            'SCREENING',
            'Q1_SENT',
            :total_fee,
            :referral_fee_snapshot,
            :payout_snapshot,
            :ip,
            :device_hash,
            :lead_urgency,
            :twilio_from_number
        ) RETURNING id
    """)
    
    # Pick a random Twilio number for this lead's entire conversation
    from services.sms import TWILIO_FROM_NUMBERS
    from utils.logging_config import email_logger
    
    email_logger.info(f"TWILIO_FROM_NUMBERS available: {TWILIO_FROM_NUMBERS}")
    twilio_from = random.choice(TWILIO_FROM_NUMBERS) if TWILIO_FROM_NUMBERS else None
    email_logger.info(f"Selected twilio_from: {twilio_from}")
    
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
            "payout_snapshot": int(referral_fee * 0.8), # 80% referrer payout
            "ip": client_ip,
            "device_hash": lead.device_hash,
            "lead_urgency": lead.lead_urgency,
            "twilio_from_number": twilio_from
        })
        new_lead_id = result.scalar()
        await db.commit()

        # Fetch business info for screening SMS
        biz_info = await db.execute(
            text("SELECT business_name, trade_category FROM businesses WHERE id = :id"),
            {"id": lead.business_id}
        )
        biz_row = biz_info.mappings().first()

        # Send consumer AI screening Q1 (business notified only after screening PASS)
        if lead.consumer_phone and biz_row and twilio_from:
            await send_sms_screening_q1(
                phone=lead.consumer_phone,
                consumer_name=lead.consumer_name,
                business_name=biz_row["business_name"],
                trade_category=biz_row["trade_category"] or "trade",
                from_number=twilio_from,
            )

        return {"id": str(new_lead_id), "status": "SCREENING"}
    except Exception as e:
        await db.rollback()
        error_logger.error(f"Error creating lead: {e}")
        error_logger.error(f"Lead data: business_id={lead.business_id}, consumer_name={lead.consumer_name}, consumer_phone={lead.consumer_phone}, consumer_email={lead.consumer_email}, consumer_suburb={lead.consumer_suburb}")
        error_logger.error(f"Calculated values: referral_fee={referral_fee}, total_unlock_fee={total_unlock_fee}, platform_fee={platform_fee}")
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
    unlocked_statuses = ["UNLOCKED", "ON_THE_WAY", "MEETING_VERIFIED", "VALID_LEAD",
                         "PAYMENT_PENDING_CONFIRMATION", "CONFIRMED_SUCCESS",
                         "DECLINED", "UNCONFIRMED", "DISPUTED", "CONFIRMED"]
    is_unlocked = l["status"].upper() in unlocked_statuses
    
    data = dict(l)
    if not is_unlocked:
        data["consumer_phone"] = l["consumer_phone"][:4] + "****" + l["consumer_phone"][-2:]
        data["consumer_email"] = l["consumer_email"][:2] + "***@" + l["consumer_email"].split("@")[-1]
        data["consumer_name"] = l["consumer_name"].split(" ")[0] + " ***"

    return data

from services.auth import get_current_user, AuthenticatedUser
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
    biz_query = text("SELECT id, wallet_balance_cents FROM businesses WHERE user_id = :uid LIMIT 1")
    biz_result = await db.execute(biz_query, {"uid": user_uuid})
    business = biz_result.mappings().first()

    if not business:
        raise HTTPException(status_code=403, detail="No business associated with this account")

    # 2. Check lead exists and belongs to this business
    check_query = text("""
        SELECT status, referrer_id, business_id, unlock_fee_cents, referral_link_id
        FROM leads WHERE id = :id
    """)
    res = await db.execute(check_query, {"id": lead_id})
    lead = res.mappings().first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if str(lead["business_id"]) != str(business["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to unlock this lead")
    if lead["status"] in ("UNLOCKED", "ON_THE_WAY", "MEETING_VERIFIED", "VALID_LEAD",
                           "PAYMENT_PENDING_CONFIRMATION", "CONFIRMED_SUCCESS"):
        return {"message": "Lead already unlocked", "status": lead["status"]}
    if lead["status"] not in ("READY_FOR_BUSINESS", "SCREENING"):
        raise HTTPException(status_code=400, detail=f"Lead cannot be unlocked in status: {lead['status']}")

    # 3. Wallet balance checks
    unlock_fee = lead["unlock_fee_cents"] or 0
    wallet_balance = business["wallet_balance_cents"] or 0

    if wallet_balance < 2500:  # $25 minimum floor
        raise HTTPException(
            status_code=402,
            detail=f"Wallet balance must be at least $25.00 to unlock leads. Current balance: ${wallet_balance/100:.2f}."
        )
    if wallet_balance < unlock_fee:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient wallet balance. Need ${unlock_fee/100:.2f}, have ${wallet_balance/100:.2f}."
        )

    # 4. Deduct from wallet and unlock
    new_balance = wallet_balance - unlock_fee
    try:
        await db.execute(
            text("UPDATE businesses SET wallet_balance_cents = :bal, total_leads_unlocked = total_leads_unlocked + 1 WHERE id = :id"),
            {"bal": new_balance, "id": business["id"]}
        )
        await db.execute(text("""
            INSERT INTO wallet_transactions (business_id, amount_cents, type, lead_id, notes, balance_after_cents)
            VALUES (:bid, :amt, 'LEAD_UNLOCK', :lid, 'Lead unlocked — fee held', :bal)
        """), {"bid": business["id"], "amt": unlock_fee, "lid": lead_id, "bal": new_balance})

        await db.execute(
            text("UPDATE leads SET status = 'UNLOCKED', unlocked_at = now(), unlock_payment_type = 'WALLET' WHERE id = :id"),
            {"id": lead_id}
        )

        # Referrer pending earnings record
        if lead["referrer_id"]:
            payout_res = await db.execute(
                text("SELECT referrer_payout_amount_cents FROM leads WHERE id = :id"),
                {"id": lead_id}
            )
            payout_cents = payout_res.scalar() or int(unlock_fee * 0.8)
            await db.execute(text("""
                INSERT INTO referrer_earnings (referrer_id, lead_id, gross_cents, platform_cut_cents, status, available_at)
                VALUES (:rid, :lid, :gross, :cut, 'PENDING', now() + interval '30 days')
                ON CONFLICT DO NOTHING
            """), {
                "rid": lead["referrer_id"], "lid": lead_id,
                "gross": payout_cents, "cut": unlock_fee - payout_cents,
            })
            await db.execute(text("""
                UPDATE referrers SET total_leads_unlocked = total_leads_unlocked + 1,
                    pending_cents = pending_cents + :amt WHERE id = :rid
            """), {"amt": payout_cents, "rid": lead["referrer_id"]})

        await db.commit()

        # On first lead unlock: mark this business as active in the invitation system
        # (triggers inviter's $25 Prezzee reward milestone if they've hit 5 active invitees)
        if business.get("total_leads_unlocked", 1) <= 1:
            try:
                inv_res = await db.execute(text("""
                    UPDATE user_invitations ui
                    SET status = 'active', became_active_at = now()
                    FROM businesses b
                    WHERE b.id = :biz_id
                      AND ui.inviter_id = b.invited_by_id
                      AND ui.invitation_type = 'business'
                      AND ui.status = 'accepted'
                    RETURNING ui.inviter_id, ui.inviter_type
                """), {"biz_id": str(business["id"])})
                inv_row = inv_res.fetchone()
                if inv_row:
                    await db.commit()
                    from services.referral_rewards import check_and_reward
                    await check_and_reward(str(inv_row[0]), db)
            except Exception as reward_err:
                error_logger.warning(f"Business first-unlock reward check (non-fatal): {reward_err}")

        # Low balance warning
        if new_balance < 3000:  # < $30
            try:
                biz_phone_res = await db.execute(
                    text("SELECT business_phone, business_name FROM businesses WHERE id = :id"),
                    {"id": business["id"]}
                )
                biz_ph = biz_phone_res.mappings().first()
                if biz_ph and biz_ph["business_phone"]:
                    await send_sms_business_wallet_low(
                        biz_ph["business_phone"], biz_ph["business_name"], new_balance / 100
                    )
            except Exception:
                pass

        # Notify business of unlocked lead (full contact details)
        try:
            full_res = await db.execute(text("""
                SELECT l.consumer_name, l.consumer_phone, l.consumer_email, l.consumer_suburb, l.job_description,
                       b.business_name, b.business_email, b.business_phone
                FROM leads l JOIN businesses b ON b.id = l.business_id WHERE l.id = :id
            """), {"id": lead_id})
            full = full_res.mappings().first()
            if full:
                if full["business_email"]:
                    await send_business_lead_unlocked(
                        email=full["business_email"],
                        business_name=full["business_name"],
                        consumer_name=full["consumer_name"],
                        consumer_phone=full["consumer_phone"],
                        consumer_email=full["consumer_email"],
                        suburb=full["consumer_suburb"],
                        job_description=full["job_description"],
                    )
                if full["business_phone"]:
                    await send_sms_business_lead_unlocked(
                        phone=full["business_phone"],
                        business_name=full["business_name"],
                        consumer_name=full["consumer_name"],
                        consumer_phone=full["consumer_phone"],
                        suburb=full["consumer_suburb"],
                    )
        except Exception as e:
            error_logger.warning(f"Unlock notification error (non-fatal): {e}")

        payment_logger.info(f"Lead unlocked via wallet | lead={lead_id} | fee=${unlock_fee/100:.2f} | wallet_after=${new_balance/100:.2f}")
        return {"status": "UNLOCKED"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_logger.error(f"Unlock error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unlock lead")

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

    # 6. Notify consumer: email + SMS with PIN
    consumer_info = await db.execute(
        text("SELECT consumer_name, consumer_email, consumer_phone FROM leads WHERE id = :id"),
        {"id": lead_id}
    )
    consumer_row = consumer_info.mappings().first()
    biz_name_res = await db.execute(
        text("SELECT business_name FROM businesses WHERE id = :id"),
        {"id": business["id"]}
    )
    biz_name_row = biz_name_res.mappings().first()
    if consumer_row and biz_name_row:
        biz_name = biz_name_row["business_name"]
        if consumer_row["consumer_email"]:
            await send_consumer_on_the_way(
                email=consumer_row["consumer_email"],
                consumer_name=consumer_row["consumer_name"],
                business_name=biz_name,
                pin=pin,
            )
        if consumer_row["consumer_phone"]:
            await send_sms_consumer_on_the_way(
                phone=consumer_row["consumer_phone"],
                consumer_name=consumer_row["consumer_name"],
                business_name=biz_name,
                pin=pin,
            )
    lead_logger.info(f"ON_THE_WAY notifications sent | phone={lead['consumer_phone']} | pin={pin}")

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
    
    confirmed_statuses = ("CONFIRMED", "MEETING_VERIFIED", "VALID_LEAD",
                          "PAYMENT_PENDING_CONFIRMATION", "CONFIRMED_SUCCESS")
    if row["is_used"] or row["status"] in confirmed_statuses:
        return {"message": "Lead already confirmed", "status": row["status"]}

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

    # 4. Success — Mark meeting verified, send surveys
    try:
        await db.execute(text("""
            UPDATE leads
            SET status = 'MEETING_VERIFIED', meeting_verified_at = now()
            WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("UPDATE lead_pins SET is_used = true WHERE lead_id = :lid"), {"lid": lead_id})
        await db.commit()

        # Update referrer quality score (OTP verified is a positive signal)
        if row["referrer_id"]:
            try:
                from services.quality_service import update_referrer_quality_score
                await update_referrer_quality_score(str(row["referrer_id"]), db)
            except Exception as qs_err:
                error_logger.warning(f"Quality score update error (non-fatal): {qs_err}")

        # Send post-meeting surveys to business + consumer
        try:
            from services.survey_service import send_post_meeting_surveys
            await send_post_meeting_surveys(lead_id, db)
        except Exception as survey_err:
            error_logger.warning(f"Survey send error (non-fatal): {survey_err}")

        lead_logger.info(f"Meeting verified | lead={lead_id}")
        return {"confirmed": True, "status": "MEETING_VERIFIED", "message": "Meeting confirmed. Surveys sent to business and customer."}

    except Exception as e:
        await db.rollback()
        error_logger.error(f"PIN Confirmation Error: {e}", exc_info=True)
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
                await send_business_dispute_raised(
                    email=biz_email_row["business_email"],
                    business_name=biz_email_row["business_name"],
                    lead_id=lead_id,
                    reason=data.reason,
                )
        except Exception as email_err:
            error_logger.warning(f"Dispute email error (non-fatal): {email_err}")

        return {"status": "success", "message": "Dispute raised successfully"}
    except Exception as e:
        await db.rollback()
        error_logger.error(f"Dispute error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to raise dispute")
