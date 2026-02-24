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
    is_verified, listing_rank, logo_url, photo_urls, features,
    referral_fee_cents, listing_visibility, avg_response_minutes, why_refer_us, created_at
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
        
    return dict(business._mapping)


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
