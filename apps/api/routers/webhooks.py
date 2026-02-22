from fastapi import APIRouter, Request, HTTPException, Header, Depends
from services.stripe_service import StripeService
from services.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import stripe
import os

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
                print(f"⚠️ Lead {lead_id} not found in webhook")
                return {"status": "error", "message": "Lead not found"}

            payout_amount = lead["referrer_payout_amount_cents"] or int(lead["unlock_fee_cents"] * 0.7)
            platform_cut = lead["unlock_fee_cents"] - payout_amount
            referrer_id = lead["referrer_id"]
            link_id = lead["referral_link_id"]

            print(f"💰 Payment succeeded for lead {lead_id}. Referrer payout pending: {payout_amount}")
            
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
            
    elif event["type"] == "account.updated":
        account = event["data"]["object"]
        # Handle account identity verification updates if needed
        pass

    return {"status": "success"}
