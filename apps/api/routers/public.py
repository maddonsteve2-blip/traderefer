from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db

router = APIRouter()

# Public-safe columns only — never expose user_id, stripe_account_id, wallet, etc.
PUBLIC_BUSINESS_COLUMNS = """
    id, business_name, slug, trade_category, description,
    suburb, state, service_radius_km,
    business_phone, business_email, website,
    trust_score, connection_rate, total_leads_unlocked, total_confirmed,
    is_verified, listing_rank, logo_url, cover_photo_url, photo_urls, features,
    referral_fee_cents, listing_visibility, avg_response_minutes, why_refer_us, created_at,
    years_experience, services, specialties, business_highlights
"""

@router.get("/businesses")
async def get_businesses(
    suburb: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    # Clamp limit to prevent abuse
    limit = max(1, min(limit, 100))
    offset = (max(1, page) - 1) * limit

    # Construct safe query strings
    base_where = "WHERE status = 'active' AND listing_visibility = 'public'"
    query_params = {"limit": limit, "offset": offset}
    
    if suburb:
        base_where += " AND suburb ILIKE :suburb_pattern"
        query_params["suburb_pattern"] = f"%{suburb}%"
    if category:
        base_where += " AND trade_category = :category"
        query_params["category"] = category

    query_str = text(f"""
        SELECT {PUBLIC_BUSINESS_COLUMNS} 
        FROM businesses 
        {base_where}
        ORDER BY listing_rank DESC, created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    
    count_str = text(f"SELECT COUNT(*) FROM businesses {base_where}")
    
    result = await db.execute(query_str, query_params)
    businesses = [dict(row._mapping) for row in result]
    
    count_result = await db.execute(count_str, query_params)
    total = count_result.scalar() or 0
    
    return {
        "businesses": businesses,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/businesses/{slug}")
async def get_business(slug: str, db: AsyncSession = Depends(get_db)):
    query = text(f"SELECT {PUBLIC_BUSINESS_COLUMNS} FROM businesses WHERE slug = :slug")
    result = await db.execute(query, {"slug": slug})
    business = result.fetchone()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    data = dict(business._mapping)
    bid = data.get("id")

    # Trusted By counts
    ref_count = await db.execute(
        text("SELECT COUNT(*) FROM referral_links WHERE business_id = :bid"),
        {"bid": bid}
    )
    biz_rec_count = await db.execute(
        text("SELECT COUNT(*) FROM business_recommendations WHERE to_business_id = :bid"),
        {"bid": bid}
    )
    # Businesses this business recommends
    recommends_count = await db.execute(
        text("SELECT COUNT(*) FROM business_recommendations WHERE from_business_id = :bid"),
        {"bid": bid}
    )
    data["trusted_by_referrers"] = ref_count.scalar() or 0
    data["trusted_by_businesses"] = biz_rec_count.scalar() or 0
    data["recommends_count"] = recommends_count.scalar() or 0

    # Get recommended businesses list
    recs = await db.execute(
        text("""
            SELECT b.business_name, b.slug, b.trade_category, b.logo_url
            FROM business_recommendations br
            JOIN businesses b ON b.id = br.to_business_id
            WHERE br.from_business_id = :bid
            ORDER BY br.created_at DESC LIMIT 6
        """),
        {"bid": bid}
    )
    data["recommended_businesses"] = [dict(r) for r in recs.mappings().all()]

    return data


@router.get("/businesses/{slug}/deals")
async def get_business_deals(slug: str, db: AsyncSession = Depends(get_db)):
    """Get active deals for a business (public endpoint)."""
    # First get business ID from slug
    biz_result = await db.execute(
        text("SELECT id FROM businesses WHERE slug = :slug"),
        {"slug": slug}
    )
    biz = biz_result.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(
        text("""
            SELECT id, title, description, discount_text, terms, expires_at, created_at
            FROM deals
            WHERE business_id = :bid AND is_active = true
              AND (expires_at IS NULL OR expires_at > now())
            ORDER BY created_at DESC
        """),
        {"bid": biz[0]}
    )
    deals = []
    for row in result.mappings().all():
        deals.append({
            "id": str(row["id"]),
            "title": row["title"],
            "description": row["description"],
            "discount_text": row["discount_text"],
            "terms": row["terms"],
            "expires_at": str(row["expires_at"]) if row["expires_at"] else None,
            "created_at": str(row["created_at"])
        })
    return deals


@router.get("/businesses/{slug}/reviews")
async def get_business_reviews(slug: str, db: AsyncSession = Depends(get_db)):
    """Get referrer reviews for a business (public endpoint)."""
    biz_result = await db.execute(
        text("SELECT id FROM businesses WHERE slug = :slug"),
        {"slug": slug}
    )
    biz = biz_result.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(
        text("""
            SELECT rr.id, rr.rating, rr.comment, rr.created_at,
                   r.full_name as referrer_name
            FROM referrer_reviews rr
            JOIN referrers r ON r.id = rr.referrer_id
            WHERE rr.business_id = :bid
            ORDER BY rr.created_at DESC
            LIMIT 20
        """),
        {"bid": biz[0]}
    )
    reviews = []
    for row in result.mappings().all():
        reviews.append({
            "id": str(row["id"]),
            "rating": row["rating"],
            "comment": row["comment"],
            "referrer_name": row["referrer_name"],
            "created_at": str(row["created_at"])
        })
    return reviews


@router.get("/businesses/{slug}/campaigns")
async def get_business_campaigns(slug: str, db: AsyncSession = Depends(get_db)):
    """Get active campaigns for a business (public endpoint)."""
    biz_result = await db.execute(
        text("SELECT id FROM businesses WHERE slug = :slug"),
        {"slug": slug}
    )
    biz = biz_result.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(
        text("""
            SELECT id, title, description, campaign_type, bonus_amount_cents,
                   multiplier, volume_threshold, promo_text, starts_at, ends_at
            FROM campaigns
            WHERE business_id = :bid AND is_active = true
              AND starts_at <= now() AND ends_at > now()
            ORDER BY created_at DESC
        """),
        {"bid": biz[0]}
    )
    campaigns = []
    for row in result.mappings().all():
        c = {k: v for k, v in dict(row).items()}
        c["id"] = str(c["id"])
        for dt in ("starts_at", "ends_at"):
            if c.get(dt):
                c[dt] = str(c[dt])
        if c.get("multiplier") is not None:
            c["multiplier"] = float(c["multiplier"])
        campaigns.append(c)
    return campaigns


@router.get("/campaigns/hot")
async def get_hot_campaigns(db: AsyncSession = Depends(get_db)):
    """Get all active campaigns across the platform (public endpoint for referrer dashboard)."""
    result = await db.execute(
        text("""
            SELECT c.id, c.title, c.description, c.campaign_type,
                   c.bonus_amount_cents, c.multiplier, c.volume_threshold,
                   c.promo_text, c.starts_at, c.ends_at,
                   b.business_name, b.slug, b.trade_category, b.suburb, b.logo_url
            FROM campaigns c
            JOIN businesses b ON b.id = c.business_id
            WHERE c.is_active = true
              AND c.starts_at <= now() AND c.ends_at > now()
              AND b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
            ORDER BY c.bonus_amount_cents DESC, c.created_at DESC
            LIMIT 20
        """)
    )
    campaigns = []
    for row in result.mappings().all():
        c = {k: v for k, v in dict(row).items()}
        c["id"] = str(c["id"])
        for dt in ("starts_at", "ends_at"):
            if c.get(dt):
                c[dt] = str(c[dt])
        if c.get("multiplier") is not None:
            c["multiplier"] = float(c["multiplier"])
        campaigns.append(c)
    return campaigns


@router.get("/discover/hot")
async def hot_right_now(db: AsyncSession = Depends(get_db)):
    """Businesses with highest referral fees — 'Hot Right Now'."""
    result = await db.execute(
        text("""
            SELECT id, business_name, slug, trade_category, suburb, state,
                   referral_fee_cents, logo_url, trust_score, is_verified,
                   avg_response_minutes
            FROM businesses
            WHERE status = 'active'
              AND (listing_visibility = 'public' OR listing_visibility IS NULL)
              AND referral_fee_cents > 0
            ORDER BY referral_fee_cents DESC
            LIMIT 8
        """)
    )
    rows = []
    for row in result.mappings().all():
        d = dict(row)
        d["id"] = str(d["id"])
        rows.append(d)
    return rows


@router.get("/discover/new")
async def new_on_traderefer(db: AsyncSession = Depends(get_db)):
    """Recently listed businesses — 'New on TradeRefer'."""
    result = await db.execute(
        text("""
            SELECT id, business_name, slug, trade_category, suburb, state,
                   referral_fee_cents, logo_url, trust_score, is_verified,
                   created_at
            FROM businesses
            WHERE status = 'active'
              AND (listing_visibility = 'public' OR listing_visibility IS NULL)
            ORDER BY created_at DESC
            LIMIT 8
        """)
    )
    rows = []
    for row in result.mappings().all():
        d = dict(row)
        d["id"] = str(d["id"])
        if d.get("created_at"):
            d["created_at"] = str(d["created_at"])
        rows.append(d)
    return rows


@router.get("/discover/top-earners")
async def top_earners(db: AsyncSession = Depends(get_db)):
    """Anonymous leaderboard — top referrer earnings this month."""
    result = await db.execute(
        text("""
            SELECT r.tier,
                   COALESCE(SUM(e.gross_cents), 0) as month_earnings_cents,
                   COUNT(DISTINCT e.lead_id) as leads_this_month
            FROM referrer_earnings e
            JOIN referrers r ON r.id = e.referrer_id
            WHERE e.created_at >= date_trunc('month', now())
            GROUP BY r.id, r.tier
            ORDER BY month_earnings_cents DESC
            LIMIT 5
        """)
    )
    leaderboard = []
    for i, row in enumerate(result.mappings().all()):
        leaderboard.append({
            "rank": i + 1,
            "tier": row["tier"],
            "month_earnings_cents": row["month_earnings_cents"],
            "leads_this_month": row["leads_this_month"],
        })
    return leaderboard


@router.get("/referrer/{referrer_id}/team")
async def get_referrer_team(referrer_id: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint: get a referrer's team of trusted businesses."""
    import uuid as _uuid
    try:
        rid = _uuid.UUID(referrer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid referrer ID")

    ref = await db.execute(
        text("SELECT full_name, region, tier FROM referrers WHERE id = :rid"),
        {"rid": rid}
    )
    referrer = ref.mappings().first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Referrer not found")

    links = await db.execute(
        text("""
            SELECT b.business_name, b.slug, b.trade_category, b.suburb, b.state,
                   b.logo_url, b.referral_fee_cents, b.is_verified, b.trust_score,
                   rl.link_code
            FROM referral_links rl
            JOIN businesses b ON rl.business_id = b.id
            WHERE rl.referrer_id = :rid
              AND b.status = 'active'
        """),
        {"rid": rid}
    )
    team = []
    for row in links.mappings().all():
        d = dict(row)
        d["id"] = d.get("slug")
        team.append(d)

    return {
        "referrer_name": referrer["full_name"],
        "region": referrer["region"],
        "tier": referrer["tier"],
        "team": team
    }
