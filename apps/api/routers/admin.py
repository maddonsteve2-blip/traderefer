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

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Full admin overview with live DB stats."""
    result = await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM businesses WHERE status = 'active') as total_businesses,
            (SELECT COUNT(*) FROM referrers) as total_referrers,
            (SELECT COUNT(*) FROM leads) as total_leads,
            (SELECT COUNT(*) FROM disputes WHERE status != 'RESOLVED') as open_disputes,
            (SELECT COUNT(*) FROM businesses WHERE status = 'active' AND clerk_user_id IS NOT NULL) as claimed_businesses,
            (SELECT COUNT(*) FROM businesses WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls::text != '{}' AND photo_urls::text != '') as businesses_with_photos
    """))
    row = result.mappings().first()
    stats = dict(row) if row else {}

    # Recent activity: last 10 new businesses + leads
    activity_result = await db.execute(text("""
        (
            SELECT 'New business: ' || business_name as message, created_at
            FROM businesses
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT 5
        )
        UNION ALL
        (
            SELECT 'New lead from ' || COALESCE(customer_name, 'unknown') as message, created_at
            FROM leads
            ORDER BY created_at DESC
            LIMIT 5
        )
        ORDER BY created_at DESC
        LIMIT 10
    """))
    activity_rows = activity_result.mappings().all()
    recent_activity = []
    for r in activity_rows:
        from datetime import datetime, timezone
        created = r["created_at"]
        if created:
            now = datetime.now(timezone.utc)
            if hasattr(created, 'tzinfo') and created.tzinfo is None:
                from datetime import timezone as tz
                created = created.replace(tzinfo=tz.utc)
            diff = now - created
            if diff.days > 0:
                time_str = f"{diff.days}d ago"
            elif diff.seconds > 3600:
                time_str = f"{diff.seconds // 3600}h ago"
            elif diff.seconds > 60:
                time_str = f"{diff.seconds // 60}m ago"
            else:
                time_str = "just now"
        else:
            time_str = ""
        recent_activity.append({"message": r["message"], "time": time_str})

    stats["recent_activity"] = recent_activity
    return stats

@router.get("/businesses")
async def list_businesses(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
    page: int = 1,
    search: Optional[str] = None,
    state: Optional[str] = None,
    trade: Optional[str] = None,
):
    """List businesses with search, filter, pagination."""
    per_page = 50
    offset = (page - 1) * per_page

    where_clauses = ["status = 'active'"]
    params = {}

    if search:
        where_clauses.append("(business_name ILIKE :search OR suburb ILIKE :search OR slug ILIKE :search)")
        params["search"] = f"%{search}%"
    if state:
        where_clauses.append("state = :state")
        params["state"] = state
    if trade:
        where_clauses.append("trade_category ILIKE :trade")
        params["trade"] = f"%{trade}%"

    where_sql = " AND ".join(where_clauses)

    count_result = await db.execute(text(f"SELECT COUNT(*) as cnt FROM businesses WHERE {where_sql}"), params)
    total = count_result.scalar() or 0
    pages = max(1, (total + per_page - 1) // per_page)

    result = await db.execute(text(f"""
        SELECT id, business_name, slug, trade_category, suburb, city, state,
               avg_rating, review_count, logo_url, photo_urls, status, clerk_user_id,
               business_phone, business_email, website, data_source, created_at
        FROM businesses
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """), {**params, "limit": per_page, "offset": offset})

    businesses = []
    for r in result.mappings().all():
        row = dict(r)
        if row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        if row.get("avg_rating"):
            row["avg_rating"] = float(row["avg_rating"])
        # Convert photo_urls to list for easier frontend handling
        if row.get("photo_urls") and isinstance(row["photo_urls"], str):
            cleaned = row["photo_urls"].strip("{}")
            row["photo_urls"] = [u.strip() for u in cleaned.split(",") if u.strip()] if cleaned else []
        businesses.append(row)

    return {"businesses": businesses, "total": total, "page": page, "pages": pages}

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
    reengagement_sent = await jobs.send_reengagement_nudges(db)

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
            "reengagement_nudges_sent": reengagement_sent,
        }
    }

class DisputeResolve(BaseModel):
    outcome: str # 'confirm' or 'reject'
    admin_notes: Optional[str] = None

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
    tab: str = "businesses",
    page: int = 1,
    search: Optional[str] = None,
):
    """List businesses or referrers for user management."""
    per_page = 50
    offset = (page - 1) * per_page
    params: dict = {"limit": per_page, "offset": offset}

    if tab == "referrers":
        where_clauses = ["1=1"]
        if search:
            where_clauses.append("(full_name ILIKE :search OR email ILIKE :search)")
            params["search"] = f"%{search}%"
        where_sql = " AND ".join(where_clauses)

        count_res = await db.execute(text(f"SELECT COUNT(*) FROM referrers WHERE {where_sql}"), params)
        total = count_res.scalar() or 0

        result = await db.execute(text(f"""
            SELECT id, full_name, email, suburb, state, postcode, phone_verified,
                   wallet_balance_cents, pending_cents, clerk_user_id, created_at
            FROM referrers WHERE {where_sql}
            ORDER BY created_at DESC LIMIT :limit OFFSET :offset
        """), params)
    else:
        where_clauses = ["status = 'active'", "clerk_user_id IS NOT NULL"]
        if search:
            where_clauses.append("(business_name ILIKE :search OR business_email ILIKE :search OR suburb ILIKE :search)")
            params["search"] = f"%{search}%"
        where_sql = " AND ".join(where_clauses)

        count_res = await db.execute(text(f"SELECT COUNT(*) FROM businesses WHERE {where_sql}"), params)
        total = count_res.scalar() or 0

        result = await db.execute(text(f"""
            SELECT id, business_name, slug, business_email, owner_name, suburb, city, state,
                   avg_rating, review_count, clerk_user_id, created_at
            FROM businesses WHERE {where_sql}
            ORDER BY created_at DESC LIMIT :limit OFFSET :offset
        """), params)

    pages = max(1, (total + per_page - 1) // per_page)
    users = []
    for r in result.mappings().all():
        row = dict(r)
        if row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        if row.get("avg_rating"):
            row["avg_rating"] = float(row["avg_rating"])
        users.append(row)

    return {"users": users, "total": total, "page": page, "pages": pages}

@router.get("/leads")
async def list_leads(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
    tab: str = "leads",
    page: int = 1,
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    """List leads or disputes for admin management."""
    per_page = 50
    offset = (page - 1) * per_page
    params: dict = {"limit": per_page, "offset": offset}

    where_clauses = ["1=1"]
    if tab == "disputes":
        where_clauses.append("l.status = 'DISPUTED'")
    if status:
        where_clauses.append("l.status = :status")
        params["status"] = status
    if search:
        where_clauses.append("(l.customer_name ILIKE :search OR b.business_name ILIKE :search)")
        params["search"] = f"%{search}%"

    where_sql = " AND ".join(where_clauses)

    count_res = await db.execute(text(f"""
        SELECT COUNT(*) FROM leads l
        LEFT JOIN businesses b ON b.id = l.business_id
        WHERE {where_sql}
    """), params)
    total = count_res.scalar() or 0
    pages = max(1, (total + per_page - 1) // per_page)

    result = await db.execute(text(f"""
        SELECT l.id, l.customer_name, l.customer_phone, l.status, l.lead_price_cents,
               l.referrer_payout_amount_cents, l.created_at,
               b.business_name, r.full_name as referrer_name,
               d.reason
        FROM leads l
        LEFT JOIN businesses b ON b.id = l.business_id
        LEFT JOIN referrers r ON r.id = l.referrer_id
        LEFT JOIN disputes d ON d.lead_id = l.id
        WHERE {where_sql}
        ORDER BY l.created_at DESC
        LIMIT :limit OFFSET :offset
    """), params)

    items = []
    for r in result.mappings().all():
        row = dict(r)
        if row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        items.append(row)

    # Status breakdown stats
    stats_result = await db.execute(text("""
        SELECT status, COUNT(*) as cnt FROM leads GROUP BY status ORDER BY cnt DESC
    """))
    stats = {str(r["status"]): int(r["cnt"]) for r in stats_result.mappings().all()}

    return {"items": items, "total": total, "page": page, "pages": pages, "stats": stats}

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
