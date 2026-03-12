from fastapi import APIRouter, Request, HTTPException, Header, Depends
from services.stripe_service import StripeService
from services.database import get_db
from services.email import send_business_lead_unlocked, send_referrer_lead_unlocked
from services.sms import send_sms_business_lead_unlocked
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import stripe
import os
from datetime import datetime, timedelta
from utils.logging_config import payment_logger, error_logger

router = APIRouter()

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/stripe")
async def stripe_webhook(
    request: Request, 
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        # In development, we might skip this if the secret isn't set
        if STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=400, detail="Invalid signature")
        import json
        event = json.loads(payload)

    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        metadata = payment_intent.get("metadata", {})
        lead_id = metadata.get("lead_id")
        business_id = metadata.get("business_id")
        
        if lead_id and business_id:
            # 1. Fetch Lead Details for dynamic payout (Spec Part 3.4)
            lead_query = text("""
                SELECT referrer_id, referral_link_id, unlock_fee_cents, referrer_payout_amount_cents 
                FROM leads WHERE id = :id
            """)
            res = await db.execute(lead_query, {"id": lead_id})
            lead = res.mappings().first()
            
            if not lead:
                error_logger.warning(f"Lead {lead_id} not found in webhook")
                return {"status": "error", "message": "Lead not found"}

            payout_amount = lead["referrer_payout_amount_cents"] or int(lead["unlock_fee_cents"] * 0.7)
            platform_cut = lead["unlock_fee_cents"] - payout_amount
            referrer_id = lead["referrer_id"]
            link_id = lead["referral_link_id"]

            payment_logger.info(f"Payment succeeded for lead {lead_id}. Referrer payout pending: {payout_amount}")
            
            # 2. Unlock the lead
            await db.execute(text("""
                UPDATE leads 
                SET status = 'UNLOCKED', unlocked_at = now(), unlock_payment_type = 'STRIPE'
                WHERE id = :id
            """), {"id": lead_id})
            
            # 3. Increment business totals
            await db.execute(text("""
                UPDATE businesses 
                SET total_leads_unlocked = total_leads_unlocked + 1
                WHERE id = :id
            """), {"id": business_id})

            # 4. Log Wallet Transaction for Business
            await db.execute(text("""
                INSERT INTO wallet_transactions (business_id, amount_cents, type, lead_id, payment_ref, notes, balance_after_cents)
                VALUES (:bid, :amount, 'DEBIT', :lid, :pref, 'Lead unlocked via Stripe', 0)
            """), {
                "bid": business_id,
                "amount": lead["unlock_fee_cents"],
                "lid": lead_id,
                "pref": payment_intent.get("id")
            })
            
            # 5. Create Referrer Earning record (PENDING - 7 day hold)
            if referrer_id:
                await db.execute(text("""
                    INSERT INTO referrer_earnings (referrer_id, lead_id, gross_cents, platform_cut_cents, status, available_at)
                    VALUES (:rid, :lid, :gross, :cut, 'PENDING', now() + interval '7 days')
                """), {
                    "rid": referrer_id,
                    "lid": lead_id,
                    "gross": payout_amount,
                    "cut": platform_cut
                })

                # Update Stats (not wallet yet)
                await db.execute(text("""
                    UPDATE referrers 
                    SET total_leads_unlocked = total_leads_unlocked + 1,
                        pending_cents = pending_cents + :amount
                    WHERE id = :rid
                """), {"rid": referrer_id, "amount": payout_amount})

                if link_id:
                    await db.execute(text("""
                        UPDATE referral_links 
                        SET leads_unlocked = leads_unlocked + 1
                        WHERE id = :lid
                    """), {"lid": link_id})
                
                # 6. Log Unlock Transaction
                await db.execute(text("""
                    INSERT INTO payment_transactions (lead_id, business_id, type, amount_cents, platform_fee_cents, status, eway_transaction_id)
                    VALUES (:lid, :bid, 'lead_unlock', :amount, :fee, 'completed', :tid)
                """), {
                    "lid": lead_id,
                    "bid": business_id,
                    "amount": lead["unlock_fee_cents"],
                    "fee": platform_cut,
                    "tid": payment_intent.get("id")
                })
            
            await db.commit()

            # Email: notify business of unlocked lead with full contact details
            full_lead = await db.execute(text("""
                SELECT l.consumer_name, l.consumer_phone, l.consumer_email, l.consumer_suburb, l.job_description,
                       b.business_name, b.business_email, b.business_phone
                FROM leads l JOIN businesses b ON b.id = l.business_id
                WHERE l.id = :id
            """), {"id": lead_id})
            full = full_lead.mappings().first()
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

            # Email: notify referrer of pending earning
            if referrer_id:
                ref_info = await db.execute(text("""
                    SELECT r.email, r.full_name, l.consumer_suburb
                    FROM referrers r, leads l
                    WHERE r.id = :rid AND l.id = :lid
                """), {"rid": referrer_id, "lid": lead_id})
                ref_row = ref_info.mappings().first()
                if ref_row and ref_row["email"]:
                    biz_name_res = await db.execute(
                        text("SELECT business_name FROM businesses WHERE id = :id"),
                        {"id": business_id}
                    )
                    biz_name_row = biz_name_res.mappings().first()
                    available = (datetime.utcnow() + timedelta(days=7)).strftime("%d %b %Y")
                    await send_referrer_lead_unlocked(
                        email=ref_row["email"],
                        full_name=ref_row["full_name"] or ref_row["email"],
                        business_name=biz_name_row["business_name"] if biz_name_row else "the business",
                        suburb=ref_row["consumer_suburb"],
                        payout_dollars=payout_amount / 100,
                        available_date=available,
                    )

    elif event["type"] == "account.updated":
        account = event["data"]["object"]
        # Handle account identity verification updates if needed
        pass

    return {"status": "success"}


@router.post("/stripe/wallet-topup")
async def stripe_wallet_topup_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Dedicated webhook handler for wallet top-up payment_intent.succeeded events."""
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        if STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=400, detail="Invalid signature")
        import json
        event = json.loads(payload)

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        metadata = payment_intent.get("metadata", {})

        if metadata.get("type") == "wallet_topup":
            business_id = metadata.get("business_id")
            amount = payment_intent["amount"]

            biz_q = await db.execute(
                text("SELECT id, wallet_balance_cents FROM businesses WHERE id = :id"),
                {"id": business_id}
            )
            biz = biz_q.mappings().first()
            if not biz:
                return {"status": "error", "message": "Business not found"}

            already_credited = await db.execute(
                text("SELECT id FROM wallet_transactions WHERE payment_ref = :ref"),
                {"ref": payment_intent["id"]}
            )
            if already_credited.first():
                return {"status": "already_processed"}

            new_balance = (biz["wallet_balance_cents"] or 0) + amount
            await db.execute(
                text("UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :id"),
                {"bal": new_balance, "id": business_id}
            )
            await db.execute(
                text("""INSERT INTO wallet_transactions (business_id, amount_cents, type, payment_ref, notes, balance_after_cents)
                        VALUES (:biz_id, :amt, 'TOPUP', :pay_ref, 'Stripe wallet top-up (webhook)', :bal)"""),
                {"biz_id": business_id, "amt": amount, "pay_ref": payment_intent["id"], "bal": new_balance}
            )
            await db.commit()
            payment_logger.info(f"Wallet top-up via webhook: business {business_id} +${amount/100:.2f}")

    return {"status": "success"}
