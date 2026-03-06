from fastapi import APIRouter, Depends, HTTPException
from services.auth import require_admin, AuthenticatedUser
from services.database import get_db
from services.email import send_dispute_resolved_business, send_dispute_resolved_referrer
from sqlalchemy.ext.asyncio import AsyncSession
from services.tasks import jobs
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/stats")
async def get_stats(user: AuthenticatedUser = Depends(require_admin)):
    return {"message": "Admin stats"}

@router.post("/cron/process-lifecycle")
async def trigger_lifecycle_tasks(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """
    Manually trigger lead expiry, earning release, and PIN cleanup.
    In production, this can be called by a scheduled job (e.g., GitHub Action or Cron).
    """
    expired_leads = await jobs.expire_pending_leads(db)
    expired_unlocked = await jobs.expire_unlocked_leads(db)
    released_earnings = await jobs.release_pending_earnings(db)
    expired_pins = await jobs.cleanup_expired_pins(db)
    d7_followups = await jobs.send_d7_survey_followups(db)
    d14_followups = await jobs.send_d14_survey_followups(db)
    closed_unconfirmed = await jobs.close_unconfirmed_leads(db)
    auto_passed = await jobs.auto_pass_stalled_screening(db)

    await db.commit()

    return {
        "status": "success",
        "tasks": {
            "expired_leads": expired_leads,
            "expired_unlocked": expired_unlocked,
            "released_earnings": released_earnings,
            "expired_pins": expired_pins,
            "d7_survey_followups": d7_followups,
            "d14_survey_followups": d14_followups,
            "closed_unconfirmed": closed_unconfirmed,
            "auto_passed_screening": auto_passed,
        }
    }

class DisputeResolve(BaseModel):
    outcome: str # 'confirm' or 'reject'
    admin_notes: Optional[str] = None

@router.get("/fill-queue")
async def get_fill_queue(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
    status: Optional[str] = "pending"
):
    """List fill_queue entries. status=pending|filled|all"""
    if status == "pending":
        where = "WHERE filled_at IS NULL"
    elif status == "filled":
        where = "WHERE filled_at IS NOT NULL"
    else:
        where = ""
    result = await db.execute(text(f"""
        SELECT id, state, city, suburb, trade, first_seen_at, filled_at
        FROM fill_queue
        {where}
        ORDER BY first_seen_at DESC
        LIMIT 200
    """))
    rows = [dict(r) for r in result.mappings().all()]
    for r in rows:
        if r.get("first_seen_at"): r["first_seen_at"] = str(r["first_seen_at"])
        if r.get("filled_at"): r["filled_at"] = str(r["filled_at"])
    return rows

@router.get("/fill-queue/stats")
async def get_fill_queue_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE filled_at IS NULL) as pending,
            COUNT(*) FILTER (WHERE filled_at IS NOT NULL) as filled,
            COUNT(*) as total
        FROM fill_queue
    """))
    row = result.mappings().first()
    return dict(row) if row else {"pending": 0, "filled": 0, "total": 0}

@router.get("/fraud-queue")
async def get_fraud_queue(db: AsyncSession = Depends(get_db), user: AuthenticatedUser = Depends(require_admin)):
    """List all leads in disputed or suspended state."""
    query = text("""
        SELECT l.*, d.reason, d.notes as business_notes, b.name as business_name
        FROM leads l
        LEFT JOIN disputes d ON l.id = d.lead_id
        LEFT JOIN businesses b ON l.business_id = b.id
        WHERE l.status = 'disputed'
        ORDER BY l.created_at DESC
    """)
    res = await db.execute(query)
    return res.mappings().all()

@router.post("/leads/{lead_id}/resolve")
async def resolve_dispute(
    lead_id: str,
    data: DisputeResolve,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Admin resolution of a lead dispute."""
    # 1. Get lead and dispute
    lead_query = text("SELECT * FROM leads WHERE id = :id")
    lead_res = await db.execute(lead_query, {"id": lead_id})
    lead = lead_res.mappings().first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    try:
        if data.outcome == 'confirm':
            # Release payment to referrer (similar to PIN success)
            await db.execute(text("""
                UPDATE leads SET status = 'CONFIRMED', confirmed_at = now() WHERE id = :id
            """), {"id": lead_id})
            
            payout = lead["referrer_payout_amount_cents"] or 0
            if lead["referrer_id"]:
                # Update earning
                await db.execute(text("""
                    UPDATE referrer_earnings SET status = 'AVAILABLE', available_at = now()
                    WHERE lead_id = :lid AND status = 'PENDING'
                """), {"lid": lead_id})
                
                # Update wallet
                await db.execute(text("""
                    UPDATE referrers SET wallet_balance_cents = wallet_balance_cents + :amount,
                    pending_cents = GREATEST(0, pending_cents - :amount)
                    WHERE id = :rid
                """), {"amount": payout, "rid": lead["referrer_id"]})
                
                # Log transaction
                await db.execute(text("""
                    INSERT INTO payment_transactions (lead_id, business_id, referrer_id, type, amount_cents, status)
                    VALUES (:lid, :bid, :rid, 'referrer_payout', :amount, 'completed')
                """), {
                    "lid": lead_id, "bid": lead["business_id"], "rid": lead["referrer_id"], "amount": payout
                })
        else:
            # Reject lead - status stays disputed or move to something like 'INVALID'
            # For MVP, we'll keep it as DISPUTED but marked as resolved
            await db.execute(text("""
                UPDATE leads SET status = 'EXPIRED' WHERE id = :id
            """), {"id": lead_id})
            
            # Cancel pending earning
            await db.execute(text("""
                UPDATE referrer_earnings SET status = 'CANCELLED'
                WHERE lead_id = :lid AND status = 'PENDING'
            """), {"lid": lead_id})

        # 2. Update Dispute record
        await db.execute(text("""
            UPDATE disputes 
            SET status = 'RESOLVED', admin_notes = :notes, resolved_at = now(), resolved_by = :aid
            WHERE lead_id = :lid
        """), {
            "notes": data.admin_notes,
            "aid": uuid.UUID(user.id),
            "lid": lead_id
        })
        
        await db.commit()

        # Email business and referrer about dispute outcome
        try:
            parties = await db.execute(text("""
                SELECT b.business_email, b.business_name,
                       r.email as referrer_email, r.full_name as referrer_name,
                       l.referrer_payout_amount_cents
                FROM leads l
                JOIN businesses b ON b.id = l.business_id
                LEFT JOIN referrers r ON r.id = l.referrer_id
                WHERE l.id = :lid
            """), {"lid": lead_id})
            p = parties.mappings().first()
            if p:
                if p["business_email"]:
                    send_dispute_resolved_business(
                        email=p["business_email"],
                        business_name=p["business_name"],
                        outcome=data.outcome,
                        admin_notes=data.admin_notes,
                    )
                if p["referrer_email"]:
                    send_dispute_resolved_referrer(
                        email=p["referrer_email"],
                        full_name=p["referrer_name"] or p["referrer_email"],
                        outcome=data.outcome,
                        business_name=p["business_name"],
                        amount_dollars=(p["referrer_payout_amount_cents"] or 0) / 100,
                    )
        except Exception as email_err:
            print(f"Dispute resolution email error (non-fatal): {email_err}")

        return {"status": "success", "message": f"Lead {lead_id} resolved with outcome: {data.outcome}"}
    except Exception as e:
        await db.rollback()
        print(f"Dispute Resolution Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve dispute")
