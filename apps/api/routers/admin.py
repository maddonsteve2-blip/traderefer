from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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
import httpx
import re
import asyncio
import os
from utils.business_slugs import generate_unique_business_slug

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
                   wallet_balance_cents, pending_cents, clerk_user_id, created_at,
                   abn, supplier_statement_declared_at
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
        if row.get("supplier_statement_declared_at"):
            row["supplier_statement_declared_at"] = str(row["supplier_statement_declared_at"])
        if row.get("avg_rating"):
            row["avg_rating"] = float(row["avg_rating"])
        users.append(row)

    return {"users": users, "total": total, "page": page, "pages": pages}


@router.get("/referrers/tax-export")
async def referrer_tax_export(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """CSV export of referrer tax data for BAS/accountant handoff."""
    from fastapi.responses import StreamingResponse
    import csv
    import io

    result = await db.execute(text("""
        SELECT r.full_name, r.email, r.phone, r.street_address, r.suburb, r.state, r.postcode,
               r.abn, r.date_of_birth, r.supplier_statement_reason, r.supplier_statement_declared_at,
               COALESCE(SUM(p.amount_cents), 0) as total_paid_cents
        FROM referrers r
        LEFT JOIN payout_requests p ON p.referrer_id = r.id
            AND p.status = 'completed'
            AND p.created_at >= date_trunc('year', now())
        GROUP BY r.id
        ORDER BY r.full_name
    """))
    rows = result.mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Full Name", "Email", "Phone", "Street Address", "Suburb", "State", "Postcode",
        "ABN", "Date of Birth", "Statement Reason", "Declaration Date", "YTD Paid ($)"
    ])
    for r in rows:
        writer.writerow([
            r["full_name"], r["email"], r["phone"],
            r["street_address"] or "", r["suburb"] or "", r["state"] or "", r["postcode"] or "",
            r["abn"] or "", str(r["date_of_birth"] or ""),
            r["supplier_statement_reason"] or "",
            str(r["supplier_statement_declared_at"] or ""),
            f"{(r['total_paid_cents'] or 0) / 100:.2f}",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=referrer-tax-export.csv"}
    )


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


# ── Website Scrape endpoints ──

@router.get("/scrape/stats")
async def get_scrape_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Returns current website scraping stats from tracking columns."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE status = 'active' AND website IS NOT NULL AND website != '') as has_website,
            COUNT(*) FILTER (WHERE status = 'active' AND website_scraped IS TRUE) as scraped,
            COUNT(*) FILTER (WHERE status = 'active' AND website IS NOT NULL AND website != '' AND website_scraped IS NOT TRUE) as unscraped,
            COUNT(*) FILTER (WHERE status = 'active' AND scraped_description IS TRUE) as got_description,
            COUNT(*) FILTER (WHERE status = 'active' AND scraped_logo IS TRUE) as got_logo,
            COUNT(*) FILTER (WHERE status = 'active' AND scraped_email IS TRUE) as got_email,
            COUNT(*) FILTER (WHERE status = 'active' AND scraped_phone IS TRUE) as got_phone,
            COUNT(*) FILTER (WHERE status = 'active' AND (description IS NULL OR description = '')) as missing_description,
            COUNT(*) FILTER (WHERE status = 'active' AND (logo_url IS NULL OR logo_url = '')) as missing_logo,
            COUNT(*) FILTER (WHERE status = 'active' AND (business_email IS NULL OR business_email = '')) as missing_email,
            COUNT(*) FILTER (WHERE status = 'active' AND (business_phone IS NULL OR business_phone = '')) as missing_phone,
            MAX(website_scraped_at) as last_scraped_at
        FROM businesses
    """))
    row = result.mappings().first()
    stats = dict(row) if row else {}
    if stats.get("last_scraped_at"):
        stats["last_scraped_at"] = str(stats["last_scraped_at"])
    return stats


@router.get("/tools/status")
async def get_tools_status(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Returns status for all admin tools including scrape stats."""
    scrape_result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE website_scraped IS TRUE) as scraped,
            COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '' AND website_scraped IS NOT TRUE) as unscraped,
            COUNT(*) FILTER (WHERE scraped_description IS TRUE) as got_description,
            COUNT(*) FILTER (WHERE scraped_logo IS TRUE) as got_logo,
            COUNT(*) FILTER (WHERE scraped_email IS TRUE) as got_email,
            COUNT(*) FILTER (WHERE scraped_phone IS TRUE) as got_phone,
            MAX(website_scraped_at) as last_scraped_at
        FROM businesses WHERE status = 'active'
    """))
    scrape_row = scrape_result.mappings().first()
    scrape_stats = dict(scrape_row) if scrape_row else {}
    if scrape_stats.get("last_scraped_at"):
        scrape_stats["last_scraped_at"] = str(scrape_stats["last_scraped_at"])

    return {
        "active_runs": [],
        "last_runs": {},
        "scrape_stats": scrape_stats,
    }


SOCIAL_DOMAINS_RE = re.compile(r'//(www\.)?(facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|tiktok\.com|m\.facebook\.com)', re.IGNORECASE)
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
EMAIL_BLACKLIST_RE = [re.compile(p, re.IGNORECASE) for p in [
    r'example\.com', r'test\.com', r'sentry\.io', r'wixpress', r'wordpress',
    r'squarespace', r'googleapis', r'cloudflare', r'webpack', r'schema\.org',
    r'noreply', r'no-reply', r'yourdomain', r'company\.com', r'domain\.com',
]]
AU_PHONE_PATTERNS = [
    re.compile(r'(?:(?:\+?61\s?|0)4\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3})'),
    re.compile(r'(?:\(?0[2-9]\)?[\s\-.]?\d{4}[\s\-.]?\d{4})'),
    re.compile(r'(?:1[38]00[\s\-.]?\d{3}[\s\-.]?\d{3})'),
]
LOGO_PATTERNS_RE = [
    re.compile(r'<img[^>]*(?:class|id)=["\'][^"\']*logo[^"\']*["\'][^>]*src=["\']([^"\']+)["\']', re.IGNORECASE),
    re.compile(r'<img[^>]*src=["\']([^"\']+)["\'][^>]*(?:class|id)=["\'][^"\']*logo[^"\']*["\']', re.IGNORECASE),
    re.compile(r'<img[^>]*src=["\']([^"\']*logo[^"\']*\.(?:png|jpg|jpeg|svg|webp))["\']', re.IGNORECASE),
    re.compile(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', re.IGNORECASE),
    re.compile(r'<link[^>]*rel=["\'](?:icon|apple-touch-icon)["\'][^>]*href=["\']([^"\']+)["\']', re.IGNORECASE),
]
LOGO_BLACKLIST_RE = [re.compile(p, re.IGNORECASE) for p in [
    r'google', r'facebook', r'twitter', r'instagram', r'youtube', r'pixel',
    r'tracking', r'analytics', r'1x1', r'spacer', r'gravatar', r'placeholder', r'data:image',
]]
FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def _extract_desc(html: str) -> Optional[str]:
    for pattern in [
        re.compile(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', re.IGNORECASE),
        re.compile(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', re.IGNORECASE),
        re.compile(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']', re.IGNORECASE),
    ]:
        m = pattern.search(html)
        if m:
            d = re.sub(r'\s+', ' ', m.group(1).strip().replace('&amp;', '&').replace('&#39;', "'").replace('&quot;', '"'))
            if len(d) >= 20:
                return d[:500] + '...' if len(d) > 500 else d
    return None


def _extract_logo(html: str, base: str) -> Optional[str]:
    for p in LOGO_PATTERNS_RE:
        m = p.search(html)
        if m:
            url = m.group(1)
            if url.startswith('//'): url = 'https:' + url
            elif url.startswith('/'): 
                try: url = re.match(r'(https?://[^/]+)', base).group(1) + url
                except: continue
            elif not url.startswith('http'): continue
            if len(url) > 10 and not any(bl.search(url) for bl in LOGO_BLACKLIST_RE):
                return url
    return None


def _extract_email(html: str) -> Optional[str]:
    for e in set(m.lower() for m in EMAIL_RE.findall(html)):
        if len(e) > 80: continue
        if re.search(r'\.(png|jpg|jpeg|gif|svg|css|js|php|pdf)$', e, re.IGNORECASE): continue
        if re.search(r'@\d', e): continue
        if any(bl.search(e) for bl in EMAIL_BLACKLIST_RE): continue
        return e
    return None


def _extract_phone(html: str) -> Optional[str]:
    tel_re = re.compile(r'href=["\']tel:([^"\']+)["\']', re.IGNORECASE)
    for m in tel_re.finditer(html):
        n = re.sub(r'[\s\-.()+]', '', m.group(1))
        if n.startswith('61'): n = '0' + n[2:]
        if 10 <= len(n) <= 12 and re.match(r'^0[2-9]', n): return n
    text_only = re.sub(r'<[^>]+>', ' ', html)
    for p in AU_PHONE_PATTERNS:
        m = p.search(text_only)
        if m:
            n = re.sub(r'[\s\-.()]', '', m.group(0))
            if n.startswith('+61'): n = '0' + n[3:]
            if n.startswith('61'): n = '0' + n[2:]
            if 10 <= len(n) <= 12: return n
    return None


async def _scrape_one(client: httpx.AsyncClient, biz: dict) -> dict:
    """Scrape a single business website. Returns dict of found fields."""
    website = biz["website"]
    result = {"id": biz["id"], "name": biz["business_name"], "found": [], "error": None}

    if SOCIAL_DOMAINS_RE.search(website):
        result["error"] = "Social media URL"
        return result

    url = website if website.startswith('http') else f'https://{website}'
    try:
        resp = await client.get(url, follow_redirects=True, timeout=12.0)
        if resp.status_code >= 400:
            result["error"] = f"HTTP {resp.status_code}"
            return result
        ct = resp.headers.get('content-type', '')
        if 'text/html' not in ct and 'xhtml' not in ct:
            result["error"] = f"Non-HTML: {ct[:30]}"
            return result
        html = resp.text[:150000]
    except Exception as e:
        result["error"] = str(e)[:80]
        return result

    result["desc"] = _extract_desc(html)
    result["logo"] = _extract_logo(html, url) if not biz.get("has_logo") else None
    result["email"] = _extract_email(html) if not biz.get("has_email") else None
    result["phone"] = _extract_phone(html) if not biz.get("has_phone") else None

    if result["desc"]: result["found"].append("DESC")
    if result["logo"]: result["found"].append("LOGO")
    if result["email"]: result["found"].append("EMAIL")
    if result["phone"]: result["found"].append("PHONE")

    return result


class ScrapeRequest(BaseModel):
    limit: int = 50
    force: bool = False


@router.post("/scrape/run")
async def run_scrape_batch(
    req: ScrapeRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Run a batch website scrape (max 100 per call for serverless safety)."""
    batch_size = min(req.limit, 100)

    where = "status = 'active' AND website IS NOT NULL AND website != ''"
    if not req.force:
        where += " AND website_scraped IS NOT TRUE"

    result = await db.execute(text(f"""
        SELECT id, business_name, website,
               (logo_url IS NOT NULL AND logo_url != '') as has_logo,
               (business_email IS NOT NULL AND business_email != '') as has_email,
               (business_phone IS NOT NULL AND business_phone != '') as has_phone
        FROM businesses
        WHERE {where}
        ORDER BY total_reviews DESC NULLS LAST
        LIMIT :limit
    """), {"limit": batch_size})
    businesses = [dict(r) for r in result.mappings().all()]

    if not businesses:
        return {"status": "complete", "message": "No businesses to scrape", "processed": 0, "remaining": 0}

    # Scrape in parallel with httpx
    results_list = []
    async with httpx.AsyncClient(headers=FETCH_HEADERS, verify=False) as client:
        tasks = [_scrape_one(client, b) for b in businesses]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

    stats = {"processed": 0, "desc": 0, "logo": 0, "email": 0, "phone": 0, "errors": 0}
    log_entries = []

    for res in results_list:
        if isinstance(res, Exception):
            stats["errors"] += 1
            continue

        biz_id = res["id"]
        sets = ["website_scraped = true", "website_scraped_at = now()"]
        params = {}

        if res.get("error"):
            stats["errors"] += 1
            log_entries.append({"name": res["name"], "status": "error", "detail": res["error"]})
        else:
            if res.get("desc"):
                sets.append("description = :desc")
                sets.append("scraped_description = true")
                params["desc"] = res["desc"]
                stats["desc"] += 1
            if res.get("logo"):
                sets.append("logo_url = :logo")
                sets.append("scraped_logo = true")
                params["logo"] = res["logo"]
                stats["logo"] += 1
            if res.get("email"):
                sets.append("business_email = :email")
                sets.append("scraped_email = true")
                params["email"] = res["email"]
                stats["email"] += 1
            if res.get("phone"):
                sets.append("business_phone = COALESCE(business_phone, :phone)")
                sets.append("scraped_phone = true")
                params["phone"] = res["phone"]
                stats["phone"] += 1
            log_entries.append({"name": res["name"], "status": "ok", "found": res["found"]})

        params["bid"] = biz_id
        await db.execute(text(f"UPDATE businesses SET {', '.join(sets)} WHERE id = :bid"), params)
        stats["processed"] += 1

    await db.commit()

    # Get remaining count
    remaining_result = await db.execute(text("""
        SELECT COUNT(*) FROM businesses
        WHERE status = 'active' AND website IS NOT NULL AND website != '' AND website_scraped IS NOT TRUE
    """))
    remaining = remaining_result.scalar() or 0

    return {
        "status": "done",
        "stats": stats,
        "remaining": remaining,
        "log": log_entries[:20],
    }


# ── Photo Filler endpoints ──

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") or ""

@router.get("/photos/stats")
async def get_photo_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Stats for business photo coverage."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls::text != '{}' AND photo_urls::text != '') as has_photos,
            COUNT(*) FILTER (WHERE status = 'active' AND (photo_urls IS NULL OR photo_urls::text = '{}' OR photo_urls::text = '')) as missing_photos,
            COUNT(*) FILTER (WHERE status = 'active' AND logo_url IS NOT NULL AND logo_url != '') as has_logo,
            COUNT(*) FILTER (WHERE status = 'active' AND (logo_url IS NULL OR logo_url = '')) as missing_logo,
            COUNT(*) FILTER (WHERE status = 'active' AND photo_urls::text LIKE '%places.googleapis.com%') as google_photo_urls,
            COUNT(*) FILTER (WHERE status = 'active' AND photo_urls::text LIKE '%blob.vercel-storage.com%') as blob_photo_urls,
            COUNT(*) FILTER (WHERE status = 'active' AND source_url IS NOT NULL AND source_url LIKE '%places.googleapis.com%') as has_place_id
        FROM businesses
    """))
    row = result.mappings().first()
    return dict(row) if row else {}


class PhotoFillRequest(BaseModel):
    limit: int = 50
    state: Optional[str] = None
    min_photos: int = 6


@router.post("/photos/run")
async def run_photo_fill(
    req: PhotoFillRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Fetch photos from Google Places for businesses missing them."""
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_API_KEY not configured on Railway")

    batch_size = min(req.limit, 50)
    state_filter = "AND state = :state" if req.state else ""
    params = {"limit": batch_size, "min_photos": req.min_photos}
    if req.state:
        params["state"] = req.state

    result = await db.execute(text(f"""
        SELECT id, business_name, slug, suburb, state, source_url, logo_url, photo_urls
        FROM businesses
        WHERE status = 'active'
          AND data_source = 'Google Places'
          {state_filter}
          AND (
            photo_urls IS NULL
            OR photo_urls::text = '{{}}'
            OR photo_urls::text = ''
            OR array_length(string_to_array(trim(both '{{}}' from photo_urls::text), ','), 1) < :min_photos
          )
        ORDER BY total_reviews DESC NULLS LAST
        LIMIT :limit
    """), params)
    businesses = [dict(r) for r in result.mappings().all()]

    if not businesses:
        return {"status": "complete", "message": "All businesses have enough photos", "processed": 0, "remaining": 0}

    stats = {"processed": 0, "updated": 0, "photos_added": 0, "not_found": 0, "errors": 0}
    log_entries = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for biz in businesses:
            try:
                place_id = None
                src = biz.get("source_url") or ""
                m = re.search(r'ChIJ[A-Za-z0-9_-]+', src)
                if m:
                    place_id = m.group(0)

                photos = None
                if place_id:
                    resp = await client.get(
                        f"https://places.googleapis.com/v1/places/{place_id}",
                        headers={"X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "photos"}
                    )
                    if resp.status_code == 200:
                        photos = resp.json().get("photos")

                if not photos:
                    query = f"{biz['business_name']} {biz.get('suburb','')} {biz.get('state','')} Australia"
                    resp = await client.post(
                        "https://places.googleapis.com/v1/places:searchText",
                        headers={"X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "places.photos", "Content-Type": "application/json"},
                        json={"textQuery": query, "maxResultCount": 1}
                    )
                    if resp.status_code == 200:
                        places = resp.json().get("places", [])
                        if places:
                            photos = places[0].get("photos")

                if not photos:
                    stats["not_found"] += 1
                    stats["processed"] += 1
                    log_entries.append({"name": biz["business_name"], "status": "not_found"})
                    continue

                new_urls = [f"https://places.googleapis.com/v1/{p['name']}/media?key={GOOGLE_API_KEY}&maxWidthPx=800&maxHeightPx=800" for p in photos[:10]]
                existing = []
                if biz.get("photo_urls"):
                    raw = str(biz["photo_urls"]).strip("{}")
                    existing = [u.strip() for u in raw.split(",") if u.strip() and len(u.strip()) > 5]

                blob_urls = [u for u in existing if "blob.vercel-storage.com" in u]
                all_urls = list(blob_urls)
                for u in new_urls:
                    if u not in all_urls:
                        all_urls.append(u)
                final = all_urls[:10]

                photo_str = "{" + ",".join(final) + "}"
                logo = final[0] if final else biz.get("logo_url")
                cover = final[1] if len(final) > 1 else (final[0] if final else None)

                await db.execute(text("""
                    UPDATE businesses
                    SET photo_urls = :photos,
                        logo_url = COALESCE(NULLIF(:logo, ''), logo_url),
                        cover_photo_url = COALESCE(NULLIF(:cover, ''), cover_photo_url)
                    WHERE id = :bid
                """), {"photos": photo_str, "logo": logo, "cover": cover, "bid": biz["id"]})

                added = len(final) - len(blob_urls)
                stats["updated"] += 1
                stats["photos_added"] += added
                log_entries.append({"name": biz["business_name"], "status": "ok", "found": [f"{len(final)} photos"]})
            except Exception as e:
                stats["errors"] += 1
                log_entries.append({"name": biz["business_name"], "status": "error", "detail": str(e)[:80]})
            stats["processed"] += 1

    await db.commit()

    remaining_result = await db.execute(text(f"""
        SELECT COUNT(*) FROM businesses
        WHERE status = 'active' AND data_source = 'Google Places'
          {state_filter}
          AND (photo_urls IS NULL OR photo_urls::text = '{{}}' OR photo_urls::text = ''
               OR array_length(string_to_array(trim(both '{{}}' from photo_urls::text), ','), 1) < :min_photos)
    """), params)
    remaining = remaining_result.scalar() or 0

    return {"status": "done", "stats": stats, "remaining": remaining, "log": log_entries[:20]}


# ── Blob Converter endpoints ──

BLOB_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN") or ""

@router.get("/blob/stats")
async def get_blob_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Stats for Google → Blob URL conversion."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE photo_urls::text LIKE '%places.googleapis.com%') as needs_conversion,
            COUNT(*) FILTER (WHERE photo_urls::text LIKE '%blob.vercel-storage.com%' AND photo_urls::text NOT LIKE '%places.googleapis.com%') as fully_converted,
            COUNT(*) FILTER (WHERE logo_url LIKE '%places.googleapis.com%') as logos_need_conversion,
            COUNT(*) FILTER (WHERE logo_url LIKE '%blob.vercel-storage.com%') as logos_converted
        FROM businesses WHERE status = 'active'
    """))
    row = result.mappings().first()
    return dict(row) if row else {}


class BlobConvertRequest(BaseModel):
    limit: int = 20
    concurrency: int = 5


@router.post("/blob/run")
async def run_blob_convert(
    req: BlobConvertRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Convert Google Places photo URLs to Vercel Blob storage."""
    if not BLOB_TOKEN:
        raise HTTPException(status_code=500, detail="BLOB_READ_WRITE_TOKEN not configured on Railway")

    batch_size = min(req.limit, 30)

    result = await db.execute(text("""
        SELECT id, slug, logo_url, cover_photo_url, photo_urls
        FROM businesses
        WHERE status = 'active'
          AND (
            logo_url LIKE '%places.googleapis.com%'
            OR photo_urls::text LIKE '%places.googleapis.com%'
          )
        ORDER BY created_at DESC
        LIMIT :limit
    """), {"limit": batch_size})
    businesses = [dict(r) for r in result.mappings().all()]

    if not businesses:
        return {"status": "complete", "message": "No Google Places URLs to convert", "processed": 0, "remaining": 0}

    stats = {"processed": 0, "logos_converted": 0, "photos_converted": 0, "errors": 0}
    log_entries = []

    async def download_and_upload(client: httpx.AsyncClient, url: str, slug: str, idx) -> Optional[str]:
        try:
            resp = await client.get(url, timeout=15.0, follow_redirects=True)
            if resp.status_code != 200 or len(resp.content) < 2000:
                return None
            ct = resp.headers.get("content-type", "image/jpeg")
            ext = "png" if "png" in ct else "webp" if "webp" in ct else "jpg"
            filename = f"{slug}-{idx}.{ext}"
            blob_resp = await client.put(
                f"https://blob.vercel-storage.com/{filename}",
                headers={"Authorization": f"Bearer {BLOB_TOKEN}", "x-content-type": ct, "x-cache-control-max-age": "31536000"},
                content=resp.content,
                timeout=30.0,
            )
            if blob_resp.status_code == 200:
                return blob_resp.json().get("url")
        except:
            pass
        return None

    async with httpx.AsyncClient() as client:
        for biz in businesses:
            try:
                slug = biz.get("slug") or str(biz["id"])
                updates = {}

                if biz.get("logo_url") and "places.googleapis.com" in str(biz["logo_url"]):
                    blob_url = await download_and_upload(client, biz["logo_url"], slug, "logo")
                    if blob_url:
                        updates["logo_url"] = blob_url
                        stats["logos_converted"] += 1

                photo_urls = []
                raw = str(biz.get("photo_urls") or "").strip("{}")
                if raw:
                    photo_urls = [u.strip() for u in raw.split(",") if u.strip()]

                google_urls = [u for u in photo_urls if "places.googleapis.com" in u]
                if google_urls:
                    new_urls = []
                    for i, url in enumerate(photo_urls):
                        if "places.googleapis.com" in url:
                            blob_url = await download_and_upload(client, url, slug, i)
                            new_urls.append(blob_url or url)
                            if blob_url:
                                stats["photos_converted"] += 1
                        else:
                            new_urls.append(url)
                    updates["photo_urls"] = "{" + ",".join(new_urls) + "}"

                if updates:
                    sets = []
                    params = {"bid": biz["id"]}
                    for col, val in updates.items():
                        sets.append(f"{col} = :{col}")
                        params[col] = val
                    await db.execute(text(f"UPDATE businesses SET {', '.join(sets)} WHERE id = :bid"), params)
                    log_entries.append({"name": slug, "status": "ok", "found": [f"{stats['logos_converted']}L {stats['photos_converted']}P"]})
                else:
                    log_entries.append({"name": slug, "status": "skip"})

                stats["processed"] += 1
            except Exception as e:
                stats["errors"] += 1
                stats["processed"] += 1
                log_entries.append({"name": str(biz.get("slug", "")), "status": "error", "detail": str(e)[:80]})

    await db.commit()

    remaining_result = await db.execute(text("""
        SELECT COUNT(*) FROM businesses
        WHERE status = 'active'
          AND (logo_url LIKE '%places.googleapis.com%' OR photo_urls::text LIKE '%places.googleapis.com%')
    """))
    remaining = remaining_result.scalar() or 0

    return {"status": "done", "stats": stats, "remaining": remaining, "log": log_entries[:20]}


# ── Admin Campaigns & Deals ──

@router.get("/campaigns")
async def admin_list_campaigns(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """List all campaigns across all businesses."""
    result = await db.execute(text("""
        SELECT c.*, b.business_name, b.slug as business_slug
        FROM campaigns c
        JOIN businesses b ON b.id = c.business_id
        ORDER BY c.created_at DESC
        LIMIT 100
    """))
    rows = result.mappings().all()
    campaigns = []
    for r in rows:
        d = dict(r)
        for k in d:
            if hasattr(d[k], 'isoformat'):
                d[k] = d[k].isoformat()
            elif isinstance(d[k], uuid.UUID):
                d[k] = str(d[k])
        campaigns.append(d)

    stats_result = await db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true AND (ends_at IS NULL OR ends_at > NOW())) as active,
            COUNT(*) FILTER (WHERE is_active = false OR ends_at <= NOW()) as inactive
        FROM campaigns
    """))
    stats_row = stats_result.mappings().first()

    return {"campaigns": campaigns, "stats": dict(stats_row) if stats_row else {}}


@router.get("/deals")
async def admin_list_deals(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """List all deals across all businesses."""
    result = await db.execute(text("""
        SELECT d.*, b.business_name, b.slug as business_slug
        FROM deals d
        JOIN businesses b ON b.id = d.business_id
        ORDER BY d.created_at DESC
        LIMIT 100
    """))
    rows = result.mappings().all()
    deals = []
    for r in rows:
        d = dict(r)
        for k in d:
            if hasattr(d[k], 'isoformat'):
                d[k] = d[k].isoformat()
            elif isinstance(d[k], uuid.UUID):
                d[k] = str(d[k])
        deals.append(d)

    stats_result = await db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active,
            COUNT(*) FILTER (WHERE is_active = false) as inactive
        FROM deals
    """))
    stats_row = stats_result.mappings().first()

    return {"deals": deals, "stats": dict(stats_row) if stats_row else {}}


# ── Google Places Fill endpoints ──

@router.get("/places/stats")
async def get_places_fill_stats(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Stats for Google Places fill coverage."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE status = 'active' AND data_source = 'Google Places') as from_google,
            COUNT(*) FILTER (WHERE status = 'active' AND data_source IS NULL OR data_source = '') as no_source,
            COUNT(*) FILTER (WHERE status = 'active' AND google_place_id IS NOT NULL) as has_place_id,
            COUNT(DISTINCT state) FILTER (WHERE status = 'active') as states_covered,
            COUNT(DISTINCT trade_category) FILTER (WHERE status = 'active') as trades_covered
        FROM businesses
    """))
    row = result.mappings().first()
    return dict(row) if row else {}


class PlacesFillRequest(BaseModel):
    trade: str
    state: str
    suburb: Optional[str] = None
    limit: int = 20


@router.post("/places/run")
async def run_places_fill(
    req: PlacesFillRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Search Google Places for businesses and add new ones to the directory."""
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_API_KEY not configured")

    batch_size = min(req.limit, 60)
    location = f"{req.suburb}, {req.state}" if req.suburb else req.state
    query = f"{req.trade} in {location}, Australia"

    stats = {"searched": 0, "created": 0, "skipped_duplicate": 0, "skipped_no_name": 0, "errors": 0}
    log_entries = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        next_page_token = None
        fetched = 0

        while fetched < batch_size:
            params = {"key": GOOGLE_API_KEY}
            if next_page_token:
                params["pagetoken"] = next_page_token
                await asyncio.sleep(2)  # Required delay for page tokens
            else:
                params["query"] = query

            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params=params
            )
            data = resp.json()

            if data.get("status") not in ("OK", "ZERO_RESULTS"):
                log_entries.append(f"API error: {data.get('status')} — {data.get('error_message', '')}")
                break

            results = data.get("results", [])
            if not results:
                break

            for place in results:
                if fetched >= batch_size:
                    break
                fetched += 1
                stats["searched"] += 1

                name = place.get("name", "").strip()
                if not name:
                    stats["skipped_no_name"] += 1
                    continue

                place_id = place.get("place_id", "")
                lat = place.get("geometry", {}).get("location", {}).get("lat")
                lng = place.get("geometry", {}).get("location", {}).get("lng")
                address = place.get("formatted_address", "")
                rating = place.get("rating")
                total_reviews = place.get("user_ratings_total", 0)

                # Parse suburb/city/state from address
                parts = [p.strip() for p in address.split(",")]
                biz_suburb = parts[1].strip().split(" ")[0] if len(parts) > 1 else (req.suburb or "")
                biz_state = req.state
                biz_city = biz_suburb

                # Check for duplicate by place_id or name+suburb
                dup_check = await db.execute(text("""
                    SELECT id FROM businesses
                    WHERE google_place_id = :pid
                       OR (LOWER(business_name) = LOWER(:name) AND LOWER(suburb) = LOWER(:suburb))
                    LIMIT 1
                """), {"pid": place_id, "name": name, "suburb": biz_suburb})
                if dup_check.first():
                    stats["skipped_duplicate"] += 1
                    log_entries.append(f"⏭ {name} — duplicate")
                    continue

                # Get logo from first photo
                logo_url = None
                photos = place.get("photos", [])
                if photos:
                    ref = photos[0].get("photo_reference")
                    if ref:
                        logo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={ref}&key={GOOGLE_API_KEY}"

                slug = await generate_unique_business_slug(
                    db,
                    business_name=name,
                    suburb=biz_suburb,
                    city=biz_city,
                    state=biz_state,
                )

                try:
                    new_id = str(uuid.uuid4())
                    await db.execute(text("""
                        INSERT INTO businesses (id, business_name, slug, trade_category, suburb, city, state,
                            lat, lng, avg_rating, total_reviews, review_count, logo_url, status, data_source,
                            google_place_id, listing_visibility, created_at, updated_at)
                        VALUES (:id, :name, :slug, :trade, :suburb, :city, :state,
                            :lat, :lng, :rating, :reviews, :reviews, :logo, 'active', 'Google Places',
                            :pid, 'public', NOW(), NOW())
                    """), {
                        "id": new_id, "name": name, "slug": slug, "trade": req.trade,
                        "suburb": biz_suburb, "city": biz_city, "state": biz_state,
                        "lat": lat, "lng": lng, "rating": rating, "reviews": total_reviews,
                        "logo": logo_url, "pid": place_id,
                    })
                    await db.commit()
                    stats["created"] += 1
                    log_entries.append(f"✅ {name} — created ({biz_suburb}, {biz_state})")
                except Exception as e:
                    await db.rollback()
                    stats["errors"] += 1
                    log_entries.append(f"❌ {name} — {str(e)[:80]}")

            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break

    # Count remaining unfilled
    remaining = await db.execute(text("""
        SELECT COUNT(*) FROM fill_queue WHERE filled_at IS NULL
    """))
    stats["remaining_queue"] = remaining.scalar() or 0

    return {"status": "complete", "stats": stats, "log": log_entries}


# ── Business CRUD endpoints ──

class BusinessUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    trade_category: Optional[str] = None
    suburb: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    abn: Optional[str] = None
    listing_visibility: Optional[str] = None


@router.get("/businesses/{business_id}")
async def get_business_detail(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Get full business details for admin editing."""
    result = await db.execute(text("""
        SELECT b.*,
            (SELECT COUNT(*) FROM leads l WHERE l.business_id = b.id) as lead_count,
            (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id) as deal_count,
            (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id) as campaign_count
        FROM businesses b WHERE b.id = :id
    """), {"id": business_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Business not found")
    biz = dict(row)
    # Serialize dates/uuids
    for k in biz:
        if hasattr(biz[k], 'isoformat'):
            biz[k] = biz[k].isoformat()
        elif isinstance(biz[k], uuid.UUID):
            biz[k] = str(biz[k])
    return biz


@router.patch("/businesses/{business_id}")
async def update_business(
    business_id: str,
    req: BusinessUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Update business fields from admin panel."""
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = ", ".join([f"{k} = :{k}" for k in updates])
    updates["id"] = business_id
    updates["now"] = datetime.utcnow()

    await db.execute(text(f"""
        UPDATE businesses SET {set_clauses}, updated_at = :now WHERE id = :id
    """), updates)
    await db.commit()
    return {"status": "updated", "fields": list(updates.keys())}


class BusinessCreateRequest(BaseModel):
    business_name: str
    trade_category: str
    suburb: str
    city: Optional[str] = None
    state: str
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    abn: Optional[str] = None


@router.post("/businesses/create")
async def create_business(
    req: BusinessCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Manually create a business from admin panel."""
    slug = await generate_unique_business_slug(
        db,
        business_name=req.business_name,
        suburb=req.suburb,
        city=req.city,
        state=req.state,
    )

    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO businesses (id, business_name, slug, trade_category, suburb, city, state,
            business_phone, business_email, website, description, abn,
            status, listing_visibility, data_source, created_at, updated_at)
        VALUES (:id, :name, :slug, :trade, :suburb, :city, :state,
            :phone, :email, :website, :desc, :abn,
            'active', 'public', 'Admin', NOW(), NOW())
    """), {
        "id": new_id, "name": req.business_name, "slug": slug, "trade": req.trade_category,
        "suburb": req.suburb, "city": req.city or req.suburb, "state": req.state,
        "phone": req.business_phone, "email": req.business_email,
        "website": req.website, "desc": req.description, "abn": req.abn,
    })
    await db.commit()
    return {"status": "created", "id": new_id, "slug": slug}


# ── User Actions ──

class UserActionRequest(BaseModel):
    action: str  # 'suspend', 'activate', 'verify', 'unverify'


@router.post("/businesses/{business_id}/action")
async def business_action(
    business_id: str,
    req: UserActionRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Perform admin action on a business."""
    if req.action == "suspend":
        await db.execute(text("UPDATE businesses SET status = 'suspended', updated_at = NOW() WHERE id = :id"), {"id": business_id})
    elif req.action == "activate":
        await db.execute(text("UPDATE businesses SET status = 'active', updated_at = NOW() WHERE id = :id"), {"id": business_id})
    elif req.action == "verify":
        await db.execute(text("UPDATE businesses SET is_verified = true, updated_at = NOW() WHERE id = :id"), {"id": business_id})
    elif req.action == "unverify":
        await db.execute(text("UPDATE businesses SET is_verified = false, updated_at = NOW() WHERE id = :id"), {"id": business_id})
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")
    await db.commit()
    return {"status": "ok", "action": req.action, "business_id": business_id}


# ── Notifications ──

class BroadcastRequest(BaseModel):
    title: str
    message: str
    audience: str = "all"  # 'all', 'businesses', 'referrers'
    link: Optional[str] = None


@router.get("/notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
    page: int = 1,
):
    """List all admin-sent notifications."""
    per_page = 50
    offset = (page - 1) * per_page

    count_result = await db.execute(text("SELECT COUNT(*) FROM notifications WHERE sender_type = 'admin'"))
    total = count_result.scalar() or 0
    pages = max(1, (total + per_page - 1) // per_page)

    result = await db.execute(text("""
        SELECT id, title, message, audience, link, created_at, recipient_count
        FROM notifications
        WHERE sender_type = 'admin'
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": per_page, "offset": offset})
    items = []
    for r in result.mappings().all():
        row = dict(r)
        if row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
        if isinstance(row.get("id"), uuid.UUID):
            row["id"] = str(row["id"])
        items.append(row)

    return {"items": items, "total": total, "page": page, "pages": pages}


@router.post("/notifications/broadcast")
async def send_broadcast(
    req: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Send a broadcast notification to users."""
    # Count target audience
    if req.audience == "businesses":
        count_res = await db.execute(text("SELECT COUNT(*) FROM businesses WHERE clerk_user_id IS NOT NULL AND status = 'active'"))
    elif req.audience == "referrers":
        count_res = await db.execute(text("SELECT COUNT(DISTINCT clerk_user_id) FROM referrers WHERE clerk_user_id IS NOT NULL"))
    else:
        count_res = await db.execute(text("""
            SELECT (SELECT COUNT(*) FROM businesses WHERE clerk_user_id IS NOT NULL AND status = 'active')
                 + (SELECT COUNT(DISTINCT clerk_user_id) FROM referrers WHERE clerk_user_id IS NOT NULL)
        """))
    recipient_count = count_res.scalar() or 0

    # Store the notification record
    notif_id = str(uuid.uuid4())
    try:
        await db.execute(text("""
            INSERT INTO notifications (id, title, message, audience, link, sender_type, recipient_count, created_at)
            VALUES (:id, :title, :message, :audience, :link, 'admin', :count, NOW())
        """), {
            "id": notif_id, "title": req.title, "message": req.message,
            "audience": req.audience, "link": req.link, "count": recipient_count,
        })
        await db.commit()
    except Exception:
        await db.rollback()
        # Table might not exist yet — create it
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                audience TEXT DEFAULT 'all',
                link TEXT,
                sender_type TEXT DEFAULT 'admin',
                recipient_count INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await db.commit()
        await db.execute(text("""
            INSERT INTO notifications (id, title, message, audience, link, sender_type, recipient_count, created_at)
            VALUES (:id, :title, :message, :audience, :link, 'admin', :count, NOW())
        """), {
            "id": notif_id, "title": req.title, "message": req.message,
            "audience": req.audience, "link": req.link, "count": recipient_count,
        })
        await db.commit()

    return {"status": "sent", "id": notif_id, "recipient_count": recipient_count}


# ── Settings / Health Check ──

@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Real health check for all services."""
    checks = {}

    # DB check
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "online", "detail": "Neon PostgreSQL"}
    except Exception as e:
        checks["database"] = {"status": "offline", "detail": str(e)[:60]}

    # GSC API check
    gsc_url = os.getenv("GSC_API_URL", "https://disciplined-truth-production-5cd7.up.railway.app")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{gsc_url}/api/gsc/latest")
            checks["gsc_api"] = {"status": "online" if r.status_code == 200 else "degraded", "detail": f"HTTP {r.status_code}"}
    except Exception as e:
        checks["gsc_api"] = {"status": "offline", "detail": str(e)[:60]}

    # Blob storage check
    checks["blob_storage"] = {
        "status": "online" if os.getenv("BLOB_READ_WRITE_TOKEN") else "not_configured",
        "detail": "Vercel Blob"
    }

    # Google API check
    checks["google_api"] = {
        "status": "online" if GOOGLE_API_KEY else "not_configured",
        "detail": "Google Places API"
    }

    # DB stats
    try:
        stats = await db.execute(text("""
            SELECT
                (SELECT COUNT(*) FROM businesses WHERE status = 'active') as businesses,
                (SELECT COUNT(*) FROM leads) as leads,
                (SELECT pg_database_size(current_database())) as db_size_bytes
        """))
        row = stats.mappings().first()
        checks["db_stats"] = dict(row) if row else {}
    except:
        checks["db_stats"] = {}

    return checks


# ── Trade Categories CRUD ──

@router.get("/trade-categories")
async def list_trade_categories(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """List all unique trade categories with counts."""
    result = await db.execute(text("""
        SELECT trade_category, COUNT(*) as count
        FROM businesses
        WHERE status = 'active' AND trade_category IS NOT NULL AND trade_category != ''
        GROUP BY trade_category
        ORDER BY count DESC
    """))
    return [dict(r) for r in result.mappings().all()]


class RenameCategoryRequest(BaseModel):
    old_name: str
    new_name: str


@router.post("/trade-categories/rename")
async def rename_trade_category(
    req: RenameCategoryRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin)
):
    """Rename a trade category across all businesses."""
    result = await db.execute(text("""
        UPDATE businesses SET trade_category = :new, updated_at = NOW()
        WHERE trade_category = :old
    """), {"old": req.old_name, "new": req.new_name})
    await db.commit()
    return {"status": "renamed", "from": req.old_name, "to": req.new_name, "affected": result.rowcount}


# ── Cold Email Outreach ──

INSTANTLY_API_KEY = os.getenv("INSTANTLY_API_KEY", "")
NEVERBOUNCE_API_KEY = os.getenv("NEVERBOUNCE_API_KEY", "")
INSTANTLY_BASE = "https://api.instantly.ai/api/v1"
NEVERBOUNCE_BASE = "https://api.neverbounce.com/v4"


async def _ensure_outreach_tables(db: AsyncSession):
    """Create outreach tables if they don't exist yet."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS cold_email_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            instantly_campaign_id TEXT UNIQUE,
            template_version TEXT DEFAULT 'A',
            status TEXT DEFAULT 'draft',
            total_leads INTEGER DEFAULT 0,
            sent_count INTEGER DEFAULT 0,
            opened_count INTEGER DEFAULT 0,
            clicked_count INTEGER DEFAULT 0,
            replied_count INTEGER DEFAULT 0,
            claimed_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ
        )
    """))
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS cold_email_leads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID REFERENCES cold_email_campaigns(id) ON DELETE CASCADE,
            business_id UUID,
            email TEXT NOT NULL,
            first_name TEXT,
            business_name TEXT,
            trade_category TEXT,
            suburb TEXT,
            claim_slug TEXT,
            email_verification_status TEXT,
            send_approved BOOLEAN DEFAULT FALSE,
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMPTZ,
            clicked_at TIMESTAMPTZ,
            replied_at TIMESTAMPTZ,
            claimed_at TIMESTAMPTZ,
            reply_text TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS partner_badge_installs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id UUID,
            badge_style TEXT DEFAULT 'trust',
            installed_at TIMESTAMPTZ DEFAULT NOW(),
            click_count INTEGER DEFAULT 0,
            referrer_signup_count INTEGER DEFAULT 0
        )
    """))
    await db.commit()


def _slugify(value: str) -> str:
    import re as _re
    value = str(value or "").lower().strip()
    value = _re.sub(r"[^a-z0-9\s-]", "", value)
    value = _re.sub(r"[\s-]+", "-", value)
    return value.strip("-")


async def _neverbounce_verify(emails: list[str]) -> dict:
    """Verify emails using NeverBounce bulk API. Returns categorised results."""
    if not NEVERBOUNCE_API_KEY:
        # No API key — mark everything as valid (dev mode)
        return {
            "valid": emails, "invalid": [], "catchall": [],
            "unknown": [], "disposable": [],
        }

    async with httpx.AsyncClient(timeout=300) as client:
        # Create job
        create_res = await client.post(
            f"{NEVERBOUNCE_BASE}/jobs/create",
            json={
                "key": NEVERBOUNCE_API_KEY,
                "input": [{"email": e} for e in emails],
                "auto_start": True,
            }
        )
        if not create_res.is_success:
            raise HTTPException(status_code=502, detail="NeverBounce create failed")
        job_id = create_res.json().get("job_id")

        # Poll until complete
        for _ in range(60):  # max 10 min
            await asyncio.sleep(10)
            status_res = await client.get(
                f"{NEVERBOUNCE_BASE}/jobs/status",
                params={"key": NEVERBOUNCE_API_KEY, "job_id": job_id}
            )
            if status_res.json().get("job_status") == "complete":
                break

        # Get results
        results_res = await client.get(
            f"{NEVERBOUNCE_BASE}/jobs/results",
            params={"key": NEVERBOUNCE_API_KEY, "job_id": job_id}
        )
        results = results_res.json().get("results", [])

    categorised: dict[str, list[str]] = {
        "valid": [], "invalid": [], "catchall": [], "unknown": [], "disposable": []
    }
    for r in results:
        status = r.get("result", "unknown")
        email = r.get("email", "")
        categorised.setdefault(status, []).append(email)
    return categorised


@router.get("/outreach/campaigns")
async def list_outreach_campaigns(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    await _ensure_outreach_tables(db)
    result = await db.execute(text("""
        SELECT id, name, instantly_campaign_id, template_version, status,
               total_leads, sent_count, opened_count, clicked_count,
               replied_count, claimed_count, created_at, started_at
        FROM cold_email_campaigns
        ORDER BY created_at DESC
    """))
    campaigns = [dict(r) for r in result.mappings().all()]
    for c in campaigns:
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
        if c.get("started_at"):
            c["started_at"] = c["started_at"].isoformat()
        c["id"] = str(c["id"])
    return {"campaigns": campaigns}


@router.post("/outreach/campaigns")
async def create_outreach_campaign(
    name: str = Form(...),
    template_version: str = Form("A"),
    csv_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Create a new outreach campaign from a CSV upload."""
    import csv as csv_module
    import io

    await _ensure_outreach_tables(db)

    # Parse CSV
    content = await csv_file.read()
    text_content = content.decode("utf-8-sig", errors="replace")
    reader = csv_module.DictReader(io.StringIO(text_content))
    rows = list(reader)

    if not rows:
        raise HTTPException(status_code=400, detail="CSV is empty")

    # Normalise column names (case-insensitive)
    normalised = []
    for row in rows:
        norm = {k.lower().strip(): str(v or "").strip() for k, v in row.items()}
        email = norm.get("email", "")
        if email and "@" in email:
            normalised.append(norm)

    if not normalised:
        raise HTTPException(status_code=400, detail="No valid email addresses found in CSV")

    # Create campaign record
    campaign_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO cold_email_campaigns (id, name, template_version, status, total_leads)
        VALUES (:id, :name, :template, 'draft', :total)
    """), {"id": campaign_id, "name": name, "template": template_version, "total": len(normalised)})

    # Insert leads — attempt to match each row to a real business in the DB
    for row in normalised:
        email = row.get("email", "")
        business_name = row.get("business_name", "")
        suburb = row.get("suburb", "")
        trade_category = row.get("trade_category", "")

        # Try to find matching business by email first, then name+suburb
        matched_id = None
        claim_slug = None

        if email:
            match = await db.execute(text("""
                SELECT id, slug FROM businesses
                WHERE LOWER(business_email) = LOWER(:email)
                  AND status = 'active'
                LIMIT 1
            """), {"email": email})
            row_match = match.mappings().first()
            if row_match:
                matched_id = str(row_match["id"])
                claim_slug = row_match["slug"]

        if not claim_slug and business_name and suburb:
            match = await db.execute(text("""
                SELECT id, slug FROM businesses
                WHERE LOWER(business_name) = LOWER(:name)
                  AND LOWER(suburb) = LOWER(:suburb)
                  AND status = 'active'
                LIMIT 1
            """), {"name": business_name, "suburb": suburb})
            row_match = match.mappings().first()
            if row_match:
                matched_id = str(row_match["id"])
                claim_slug = row_match["slug"]

        if not claim_slug and business_name:
            # Fuzzy: name only
            match = await db.execute(text("""
                SELECT id, slug FROM businesses
                WHERE LOWER(business_name) = LOWER(:name)
                  AND status = 'active'
                LIMIT 1
            """), {"name": business_name})
            row_match = match.mappings().first()
            if row_match:
                matched_id = str(row_match["id"])
                claim_slug = row_match["slug"]

        # If still no match, use a slug-like value so the claim page can handle it gracefully
        if not claim_slug:
            slug_base = _slugify(f"{business_name}-{suburb}") or _slugify(email.split("@")[0])
            claim_slug = slug_base or f"business-{str(uuid.uuid4())[:8]}"

        await db.execute(text("""
            INSERT INTO cold_email_leads
                (id, campaign_id, business_id, email, first_name, business_name, trade_category, suburb, claim_slug, status)
            VALUES
                (:id, :cid, :bid, :email, :fname, :bname, :trade, :suburb, :slug, 'pending')
        """), {
            "id": str(uuid.uuid4()),
            "cid": campaign_id,
            "bid": matched_id,
            "email": email,
            "fname": row.get("first_name", ""),
            "bname": business_name,
            "trade": trade_category,
            "suburb": suburb,
            "slug": claim_slug,
        })

    await db.commit()
    return {"id": campaign_id, "name": name, "total_leads": len(normalised), "status": "draft"}


@router.post("/outreach/campaigns/{campaign_id}/verify")
async def verify_campaign_emails(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Run NeverBounce verification on all pending leads in a campaign."""
    await _ensure_outreach_tables(db)

    # Get pending leads
    result = await db.execute(text("""
        SELECT id, email FROM cold_email_leads
        WHERE campaign_id = :cid AND email_verification_status IS NULL
    """), {"cid": campaign_id})
    leads = list(result.mappings().all())

    if not leads:
        raise HTTPException(status_code=400, detail="No unverified leads in this campaign")

    emails = [r["email"] for r in leads]

    # Update status to verifying
    await db.execute(text("""
        UPDATE cold_email_campaigns SET status = 'verifying' WHERE id = :id
    """), {"id": campaign_id})
    await db.commit()

    try:
        categorised = await _neverbounce_verify(emails)
    except Exception as e:
        await db.execute(text("""
            UPDATE cold_email_campaigns SET status = 'draft' WHERE id = :id
        """), {"id": campaign_id})
        await db.commit()
        raise HTTPException(status_code=502, detail=f"Email verification failed: {str(e)}")

    # Update individual lead statuses
    for status_key, email_list in categorised.items():
        for email in email_list:
            approved = status_key == "valid"
            await db.execute(text("""
                UPDATE cold_email_leads
                SET email_verification_status = :status, send_approved = :approved
                WHERE campaign_id = :cid AND email = :email
            """), {"status": status_key, "approved": approved, "cid": campaign_id, "email": email})

    await db.execute(text("""
        UPDATE cold_email_campaigns SET status = 'ready' WHERE id = :id
    """), {"id": campaign_id})
    await db.commit()

    valid_count = len(categorised.get("valid", []))
    invalid_count = len(categorised.get("invalid", []) + categorised.get("disposable", []))
    catchall_count = len(categorised.get("catchall", []))
    unknown_count = len(categorised.get("unknown", []))
    total = len(emails)

    bounce_valid = round((total - valid_count) / max(total, 1) * 100 * 0.3, 1)
    bounce_catchall = round(bounce_valid + (catchall_count / max(total, 1)) * 50, 1)

    return {
        "total": total,
        "valid": valid_count,
        "invalid": invalid_count,
        "catchall": catchall_count,
        "unknown": unknown_count,
        "estimated_bounce_rate_valid_only": f"{min(bounce_valid, 4.9):.1f}%",
        "estimated_bounce_rate_with_catchall": f"{min(bounce_catchall, 9.9):.1f}%",
    }


class LaunchCampaignRequest(BaseModel):
    include_catchall: bool = False
    instantly_campaign_id: Optional[str] = None


@router.post("/outreach/campaigns/{campaign_id}/launch")
async def launch_outreach_campaign(
    campaign_id: str,
    req: LaunchCampaignRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Push approved leads to Instantly and mark campaign as active."""
    await _ensure_outreach_tables(db)

    # Get campaign
    camp_result = await db.execute(text("""
        SELECT * FROM cold_email_campaigns WHERE id = :id
    """), {"id": campaign_id})
    campaign = camp_result.mappings().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get leads to send
    statuses = ["valid"]
    if req.include_catchall:
        statuses.extend(["catchall", "unknown"])

    placeholders = ",".join([f"'{s}'" for s in statuses])
    leads_result = await db.execute(text(f"""
        SELECT id, email, first_name, business_name, claim_slug
        FROM cold_email_leads
        WHERE campaign_id = :cid AND email_verification_status IN ({placeholders})
    """), {"cid": campaign_id})
    leads = list(leads_result.mappings().all())

    if not leads:
        raise HTTPException(status_code=400, detail="No approved leads to send")

    instantly_campaign_id = req.instantly_campaign_id or campaign.get("instantly_campaign_id")
    pushed = 0
    errors = 0

    if INSTANTLY_API_KEY and instantly_campaign_id:
        async with httpx.AsyncClient(timeout=30) as client:
            for lead in leads:
                claim_url = f"https://traderefer.au/claim/{lead['claim_slug']}?lid={lead['id']}"
                try:
                    res = await client.post(
                        f"{INSTANTLY_BASE}/lead/add",
                        headers={"Authorization": f"Bearer {INSTANTLY_API_KEY}"},
                        json={
                            "campaign_id": instantly_campaign_id,
                            "email": lead["email"],
                            "first_name": lead["first_name"] or "there",
                            "company_name": lead["business_name"] or "",
                            "variables": {
                                "business_name": lead["business_name"] or "",
                                "claim_url": claim_url,
                                "sender_name": "Steve",
                            },
                        }
                    )
                    if res.is_success:
                        pushed += 1
                        await db.execute(text("""
                            UPDATE cold_email_leads SET status = 'sent', sent_at = NOW()
                            WHERE id = :id
                        """), {"id": str(lead["id"])})
                    else:
                        errors += 1
                except Exception:
                    errors += 1
    else:
        # No Instantly key — just mark as sent for dev/staging
        for lead in leads:
            await db.execute(text("""
                UPDATE cold_email_leads SET status = 'sent', sent_at = NOW(), send_approved = TRUE
                WHERE id = :id
            """), {"id": str(lead["id"])})
        pushed = len(leads)

    await db.execute(text("""
        UPDATE cold_email_campaigns
        SET status = 'active', started_at = NOW(),
            sent_count = :sent,
            instantly_campaign_id = COALESCE(instantly_campaign_id, :icid)
        WHERE id = :id
    """), {"id": campaign_id, "sent": pushed, "icid": instantly_campaign_id})
    await db.commit()

    return {"status": "launched", "pushed": pushed, "errors": errors, "total": len(leads)}


@router.post("/outreach/campaigns/{campaign_id}/sync")
async def sync_campaign_stats(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Pull latest stats from Instantly API and update database."""
    await _ensure_outreach_tables(db)

    camp_result = await db.execute(text("""
        SELECT instantly_campaign_id FROM cold_email_campaigns WHERE id = :id
    """), {"id": campaign_id})
    campaign = camp_result.mappings().first()
    if not campaign or not campaign.get("instantly_campaign_id"):
        raise HTTPException(status_code=400, detail="No Instantly campaign linked")

    if not INSTANTLY_API_KEY:
        raise HTTPException(status_code=503, detail="INSTANTLY_API_KEY not configured")

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            f"{INSTANTLY_BASE}/campaign/get/{campaign['instantly_campaign_id']}",
            headers={"Authorization": f"Bearer {INSTANTLY_API_KEY}"},
        )
        if not res.is_success:
            raise HTTPException(status_code=502, detail="Instantly API error")
        data = res.json()

    await db.execute(text("""
        UPDATE cold_email_campaigns
        SET sent_count = :sent, opened_count = :opened,
            clicked_count = :clicked, replied_count = :replied
        WHERE id = :id
    """), {
        "id": campaign_id,
        "sent": data.get("sent", 0),
        "opened": data.get("opened", 0),
        "clicked": data.get("clicked", 0),
        "replied": data.get("replied", 0),
    })
    await db.commit()
    return {"status": "synced", "stats": data}


@router.post("/outreach/campaigns/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    await _ensure_outreach_tables(db)
    camp_result = await db.execute(text(
        "SELECT instantly_campaign_id FROM cold_email_campaigns WHERE id = :id"
    ), {"id": campaign_id})
    campaign = camp_result.mappings().first()

    if INSTANTLY_API_KEY and campaign and campaign.get("instantly_campaign_id"):
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                f"{INSTANTLY_BASE}/campaign/pause",
                headers={"Authorization": f"Bearer {INSTANTLY_API_KEY}"},
                json={"campaign_id": campaign["instantly_campaign_id"]},
            )

    await db.execute(text(
        "UPDATE cold_email_campaigns SET status = 'paused' WHERE id = :id"
    ), {"id": campaign_id})
    await db.commit()
    return {"status": "paused"}


@router.post("/outreach/campaigns/{campaign_id}/resume")
async def resume_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    await _ensure_outreach_tables(db)
    camp_result = await db.execute(text(
        "SELECT instantly_campaign_id FROM cold_email_campaigns WHERE id = :id"
    ), {"id": campaign_id})
    campaign = camp_result.mappings().first()

    if INSTANTLY_API_KEY and campaign and campaign.get("instantly_campaign_id"):
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                f"{INSTANTLY_BASE}/campaign/resume",
                headers={"Authorization": f"Bearer {INSTANTLY_API_KEY}"},
                json={"campaign_id": campaign["instantly_campaign_id"]},
            )

    await db.execute(text(
        "UPDATE cold_email_campaigns SET status = 'active' WHERE id = :id"
    ), {"id": campaign_id})
    await db.commit()
    return {"status": "resumed"}


@router.get("/outreach/campaigns/{campaign_id}/replies")
async def get_campaign_replies(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Fetch replies from Instantly and sync to database."""
    await _ensure_outreach_tables(db)

    camp_result = await db.execute(text(
        "SELECT instantly_campaign_id FROM cold_email_campaigns WHERE id = :id"
    ), {"id": campaign_id})
    campaign = camp_result.mappings().first()

    replies = []

    if INSTANTLY_API_KEY and campaign and campaign.get("instantly_campaign_id"):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.get(
                    f"{INSTANTLY_BASE}/campaign/replies/{campaign['instantly_campaign_id']}",
                    headers={"Authorization": f"Bearer {INSTANTLY_API_KEY}"},
                )
                if res.is_success:
                    instantly_replies = res.json() if isinstance(res.json(), list) else []
                    for r in instantly_replies:
                        email = r.get("email", "")
                        reply_text = r.get("reply_text", r.get("text", ""))
                        timestamp = r.get("timestamp", r.get("created_at", ""))

                        # Sync to DB
                        await db.execute(text("""
                            UPDATE cold_email_leads
                            SET reply_text = :text, replied_at = NOW(), status = 'replied'
                            WHERE campaign_id = :cid AND email = :email
                        """), {"text": reply_text, "cid": campaign_id, "email": email})

                        # Get business name
                        biz_result = await db.execute(text("""
                            SELECT business_name FROM cold_email_leads
                            WHERE campaign_id = :cid AND email = :email LIMIT 1
                        """), {"cid": campaign_id, "email": email})
                        biz = biz_result.mappings().first()

                        replies.append({
                            "email": email,
                            "business_name": biz["business_name"] if biz else None,
                            "reply_text": reply_text,
                            "timestamp": timestamp,
                            "status": "replied",
                        })
                    await db.commit()
        except Exception:
            pass

    # Always return DB replies as fallback
    if not replies:
        db_result = await db.execute(text("""
            SELECT email, business_name, reply_text, replied_at as timestamp, status
            FROM cold_email_leads
            WHERE campaign_id = :cid AND replied_at IS NOT NULL
            ORDER BY replied_at DESC
        """), {"cid": campaign_id})
        for r in db_result.mappings().all():
            replies.append({
                "email": r["email"],
                "business_name": r["business_name"],
                "reply_text": r["reply_text"] or "",
                "timestamp": r["timestamp"].isoformat() if r["timestamp"] else "",
                "status": r["status"],
            })

    return replies


@router.get("/outreach/campaigns/{campaign_id}/export")
async def export_campaign_leads_csv(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    """Export verified leads as CSV for manual Instantly import."""
    from fastapi.responses import StreamingResponse
    import csv as csv_module
    import io

    await _ensure_outreach_tables(db)

    result = await db.execute(text("""
        SELECT email, first_name, business_name, trade_category, suburb,
               email_verification_status, claim_slug, status
        FROM cold_email_leads
        WHERE campaign_id = :cid
        ORDER BY email_verification_status, business_name
    """), {"cid": campaign_id})
    leads = list(result.mappings().all())

    output = io.StringIO()
    writer = csv_module.writer(output)
    writer.writerow(["email", "first_name", "company_name", "trade_category", "suburb",
                     "verification_status", "claim_url", "send_status"])
    for lead in leads:
        claim_url = f"https://traderefer.au/claim/{lead['claim_slug']}" if lead.get("claim_slug") else ""
        writer.writerow([
            lead["email"],
            lead["first_name"] or "",
            lead["business_name"] or "",
            lead["trade_category"] or "",
            lead["suburb"] or "",
            lead["email_verification_status"] or "unverified",
            claim_url,
            lead["status"] or "pending",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=campaign-{campaign_id[:8]}-leads.csv"},
    )
