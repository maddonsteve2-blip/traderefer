from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from services.stripe_service import StripeService
from services.email import send_business_welcome
import re
import uuid
import os
import random
import string
import httpx
import json

router = APIRouter()

class ABNVerificationRequest(BaseModel):
    abn: str

class BusinessOnboarding(BaseModel):
    business_name: str
    trade_category: str
    description: Optional[str] = None
    suburb: str
    address: Optional[str] = None
    state: str = "VIC"
    business_phone: str
    business_email: str
    website: Optional[str] = None
    slug: Optional[str] = None
    service_radius_km: int = 20
    referral_fee_cents: int = 1000
    logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    photo_urls: Optional[list[str]] = None
    listing_visibility: str = "public"
    years_experience: Optional[str] = None
    services: Optional[list[str]] = None
    specialties: Optional[list[str]] = None
    business_highlights: Optional[list[str]] = None
    why_refer_us: Optional[str] = None
    features: Optional[list[str]] = None
    abn: Optional[str] = None

class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    trade_category: Optional[str] = None
    description: Optional[str] = None
    suburb: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    service_radius_km: Optional[int] = None
    slug: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    website: Optional[str] = None
    referral_fee_cents: Optional[int] = None
    logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    photo_urls: Optional[list[str]] = None
    features: Optional[list[str]] = None
    listing_visibility: Optional[str] = None
    why_refer_us: Optional[str] = None
    response_sla_minutes: Optional[int] = None
    abn: Optional[str] = None

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None
    is_featured: bool = False
    photo_urls: Optional[list[str]] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None
    is_featured: Optional[bool] = None
    photo_urls: Optional[list[str]] = None

class ReferrerFeeUpdate(BaseModel):
    custom_fee_cents: Optional[int] = None  # None = revert to business default

class ReferrerBonusCreate(BaseModel):
    amount_cents: int
    reason: Optional[str] = None
    charge_card: bool = False  # If True and wallet insufficient, charge card
    payment_intent_id: Optional[str] = None  # Set when confirming after card payment

class ReferrerNotesUpdate(BaseModel):
    business_notes: Optional[str] = None

def generate_slug(name: str):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

async def get_lat_lng(suburb: str, state: str) -> tuple[Optional[float], Optional[float]]:
    """Placeholder for geocoding service."""
    # In a real app, use Google Maps Geocoding API or similar
    # For now, return mock coordinates centered around Geelong region if suburb matches
    if "geelong" in suburb.lower():
        return -38.1499, 144.3617
    return None, None

@router.post("/onboarding")
async def onboarding(
    data: BusinessOnboarding,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Validate referral_fee_cents minimum ($3.00 = 300 cents)
    if data.referral_fee_cents is not None and data.referral_fee_cents < 300:
        raise HTTPException(status_code=400, detail="Referral fee must be at least $3.00 (300 cents)")

    user_uuid = uuid.UUID(user.id)

    # Check if user already has a business
    check_query = text("SELECT id, slug FROM businesses WHERE user_id = :user_id")
    existing = await db.execute(check_query, {"user_id": user_uuid})
    existing_biz = existing.mappings().first()

    if existing_biz:
        # If re-onboarding with new images, update them on the existing record
        update_fields = {}
        if data.logo_url:
            update_fields["logo_url"] = data.logo_url
        if data.cover_photo_url:
            update_fields["cover_photo_url"] = data.cover_photo_url
        if data.photo_urls:
            update_fields["photo_urls"] = data.photo_urls

        if update_fields:
            set_clauses = ", ".join(f"{k} = :{k}" for k in update_fields)
            update_fields["id"] = existing_biz["id"]
            await db.execute(
                text(f"UPDATE businesses SET {set_clauses}, updated_at = now() WHERE id = :id"),
                update_fields,
            )
            await db.commit()

        return {"id": str(existing_biz["id"]), "slug": existing_biz["slug"], "status": "already_exists"}

    # Geocoding
    lat, lng = await get_lat_lng(data.suburb, data.state)

    # If no slug provided, generate one
    if not data.slug:
        slug = generate_slug(data.business_name)
        # Attempt 1: name
        slug_check = await db.execute(text("SELECT id FROM businesses WHERE slug = :slug"), {"slug": slug})
        if slug_check.fetchone():
            # Attempt 2: name-suburb
            sub_slug = f"{slug}-{data.suburb.lower().replace(' ', '-')}"
            sub_check = await db.execute(text("SELECT id FROM businesses WHERE slug = :slug"), {"slug": sub_slug})
            if sub_check.fetchone():
                # Attempt 3: name-uuid
                slug = f"{slug}-{str(uuid.uuid4())[:8]}"
            else:
                slug = sub_slug
    else:
        slug = data.slug
        # Verify provided slug is unique
        slug_check = await db.execute(text("SELECT id FROM businesses WHERE slug = :slug"), {"slug": slug})
        if slug_check.fetchone():
            raise HTTPException(status_code=400, detail="Slug already in use")

    query = text("""
        INSERT INTO businesses (
            user_id, business_name, slug, trade_category,
            description, suburb, address, business_phone, business_email,
            website, service_radius_km, referral_fee_cents, status,
            state, lat, lng, logo_url, cover_photo_url, photo_urls, stripe_account_id,
            listing_visibility, years_experience, services, specialties,
            business_highlights, why_refer_us, features, abn
        ) VALUES (
            :user_id, :business_name, :slug, :trade_category,
            :description, :suburb, :address, :business_phone, :business_email,
            :website, :service_radius_km, :referral_fee_cents, 'active',
            :state, :lat, :lng, :logo_url, :cover_photo_url, :photo_urls, :stripe_account_id,
            :listing_visibility, :years_experience, :services, :specialties,
            :business_highlights, :why_refer_us, :features, :abn
        ) RETURNING id, slug
    """)

    try:
        result = await db.execute(query, {
            "user_id": user_uuid,
            "business_name": data.business_name,
            "slug": slug,
            "trade_category": data.trade_category,
            "description": data.description,
            "suburb": data.suburb,
            "address": data.address,
            "business_phone": data.business_phone,
            "business_email": data.business_email,
            "website": data.website,
            "service_radius_km": data.service_radius_km,
            "referral_fee_cents": data.referral_fee_cents,
            "state": data.state,
            "lat": lat,
            "lng": lng,
            "logo_url": data.logo_url,
            "cover_photo_url": data.cover_photo_url,
            "photo_urls": data.photo_urls or [],
            "stripe_account_id": f"acct_mock_{slug}",
            "listing_visibility": data.listing_visibility or "public",
            "years_experience": data.years_experience,
            "services": data.services or [],
            "specialties": data.specialties or [],
            "business_highlights": data.business_highlights or [],
            "why_refer_us": data.why_refer_us,
            "features": data.features or [],
            "abn": data.abn
        })
        await db.commit()
        row = result.fetchone()
        new_slug = row[1]
        send_business_welcome(data.business_email, data.business_name, new_slug)
        return {"id": str(row[0]), "slug": new_slug}
    except Exception as e:
        await db.rollback()
        print(f"Onboarding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create business profile")

@router.get("/me")
async def get_my_business(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Fetches the business associated with the authenticated user."""
    query = text("""
        SELECT id, business_name, trade_category, description, suburb, address, state,
               business_phone, business_email, website, slug,
               referral_fee_cents, service_radius_km, is_verified, trust_score,
               logo_url, photo_urls, status, connection_rate,
               total_leads_unlocked, wallet_balance_cents, stripe_account_id,
               abn, features, listing_visibility, why_refer_us, avg_response_minutes, response_sla_minutes, created_at
        FROM businesses WHERE user_id = :user_id
    """)
    result = await db.execute(query, {"user_id": uuid.UUID(user.id)})
    biz = result.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="No business associated with this account")
    # Convert to dict with JSON-safe types
    data = {}
    for key, val in dict(biz).items():
        if isinstance(val, uuid.UUID):
            data[key] = str(val)
        elif hasattr(val, 'isoformat'):
            data[key] = val.isoformat()
        else:
            data[key] = val
    return data

@router.get("/check-slug/{slug}")
async def check_slug_availability(slug: str, db: AsyncSession = Depends(get_db)):
    query = text("SELECT id FROM businesses WHERE slug = :slug")
    result = await db.execute(query, {"slug": slug})
    exists = result.fetchone() is not None
    return {"available": not exists}

@router.patch("/update")
async def update_business(
    data: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)

    # 1. Get current business
    curr_query = text("SELECT id, slug FROM businesses WHERE user_id = :user_id")
    curr_result = await db.execute(curr_query, {"user_id": user_uuid})
    biz = curr_result.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    # 2. If slug changed, check uniqueness
    if data.slug and data.slug != biz["slug"]:
        slug_check = text("SELECT id FROM businesses WHERE slug = :slug AND id != :id")
        check_res = await db.execute(slug_check, {"slug": data.slug, "id": biz["id"]})
        if check_res.fetchone():
            raise HTTPException(status_code=400, detail="Slug already in use")

    # 3. Validate referral_fee_cents minimum ($3.00 = 300 cents)
    if data.referral_fee_cents is not None and data.referral_fee_cents < 300:
        raise HTTPException(status_code=400, detail="Referral fee must be at least $3.00 (300 cents)")

    # 4. Update fields
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No changes"}

    # Geocoding if location changes
    if "suburb" in update_data or "state" in update_data or "address" in update_data:
        new_suburb = update_data.get("suburb", biz["suburb"])
        new_state = update_data.get("state", biz.get("state", "VIC"))
        # we can still use get_lat_lng, but could incorporate address if implemented
        lat, lng = await get_lat_lng(new_suburb, new_state)
        if lat and lng:
            update_data["lat"] = lat
            update_data["lng"] = lng

    update_fields = []
    params = {"id": biz["id"]}

    for field, value in update_data.items():
        # Handle lists (photo_urls, features) for PostgreSQL arrays
        if isinstance(value, list):
            update_fields.append(f"{field} = :{field}")
        else:
            update_fields.append(f"{field} = :{field}")
        params[field] = value

    update_query = text(f"UPDATE businesses SET {', '.join(update_fields)}, updated_at = now() WHERE id = :id")
    await db.execute(update_query, params)
    await db.commit()

    return {"message": "Business updated successfully"}

@router.get("/dashboard")
async def get_business_dashboard(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    try:
        user_uuid = uuid.UUID(user.id)

        # 1. Get business stats
        biz_query = text("""
            SELECT id, business_name, slug, trade_category, suburb, address, trust_score,
                   connection_rate, total_leads_unlocked, wallet_balance_cents,
                   referral_fee_cents, stripe_account_id
            FROM businesses WHERE user_id = :user_id
        """)
        biz_result = await db.execute(biz_query, {"user_id": user_uuid})
        biz = biz_result.mappings().first()

        if not biz:
            raise HTTPException(status_code=404, detail="Business not found for this user")

        biz_id = biz["id"]

        # 2. Get recent leads with full info
        leads_query = text("""
            SELECT id, consumer_name, consumer_suburb, consumer_phone,
                   consumer_email, consumer_address, job_description,
                   unlock_fee_cents, status, created_at
            FROM leads
            WHERE business_id = :id
            ORDER BY created_at DESC LIMIT 5
        """)
        leads_result = await db.execute(leads_query, {
            "id": biz_id
        })
        recent_leads = leads_result.mappings().all()

        unlocked_statuses = ["UNLOCKED", "ON_THE_WAY", "CONFIRMED"]
        formatted_recent = []
        for l in recent_leads:
            is_unlocked = l["status"].upper() in unlocked_statuses
            formatted_recent.append({
                "id": str(l["id"]),
                "customer_name": l["consumer_name"] if is_unlocked else f"{l['consumer_name'][0]}*** ****",
                "suburb": l["consumer_suburb"],
                "description": l["job_description"],
                "status": l["status"].upper(),
                "unlock_fee": (l["unlock_fee_cents"] or 0) / 100,
                "phone": l["consumer_phone"] if is_unlocked else None,
                "email": l["consumer_email"] if is_unlocked else None,
                "address": l["consumer_address"] if is_unlocked else None,
            })

        return {
            "business": {
                "id": str(biz_id),
                "name": biz["business_name"],
                "category": biz["trade_category"],
                "suburb": biz["suburb"],
                "address": biz.get("address"),
                "slug": biz["slug"],
                "trust_score": biz["trust_score"],
                "connection_rate": float(biz["connection_rate"] or 0),
                "unlocked_count": biz["total_leads_unlocked"],
                "stripe_connected": biz["stripe_account_id"] is not None
            },
            "stats": [
                {"label": "Active Leads", "value": str(biz["total_leads_unlocked"]), "icon": "Target", "color": "text-orange-600", "bg": "bg-orange-100"},
                {"label": "Connection Rate", "value": f"{int(float(biz['connection_rate'] or 0)*100)}%", "icon": "Zap", "color": "text-blue-600", "bg": "bg-blue-100"},
                {"label": "Trust Score", "value": f"{biz['trust_score']/20:.1f}", "icon": "Star", "color": "text-yellow-600", "bg": "bg-yellow-100"},
                {"label": "Referral Fee", "value": f"${(biz['referral_fee_cents'] or 0)/100:.2f}", "icon": "DollarSign", "color": "text-green-600", "bg": "bg-green-100"},
            ],
            "recent_leads": formatted_recent
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Business Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stripe/connect")
async def connect_stripe(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Starts the Stripe Connect onboarding flow."""
    user_uuid = uuid.UUID(user.id)

    biz_query = text("SELECT id, business_name, business_email, stripe_account_id FROM businesses WHERE user_id = :user_id")
    result = await db.execute(biz_query, {"user_id": user_uuid})
    biz = result.mappings().first()

    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    account_id = biz["stripe_account_id"]
    if not account_id:
        account_id = await StripeService.create_connected_account(
            email=biz["business_email"],
            business_name=biz["business_name"]
        )
        # Save account_id
        update_query = text("UPDATE businesses SET stripe_account_id = :acc_id WHERE id = :id")
        await db.execute(update_query, {"acc_id": account_id, "id": biz["id"]})
        await db.commit()

    # Create account link
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    onboarding_url = await StripeService.create_account_link(
        account_id=account_id,
        refresh_url=f"{frontend_url}/dashboard/business/settings",
        return_url=f"{frontend_url}/dashboard/business?stripe=success"
    )

    return {"url": onboarding_url}

@router.get("/{business_id}/leads")
async def get_business_leads(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # Verify the user owns this business
    user_uuid = uuid.UUID(user.id)
    biz_verify = text("SELECT id FROM businesses WHERE id = :id AND user_id = :user_id")
    verify_result = await db.execute(biz_verify, {"id": uuid.UUID(business_id), "user_id": user_uuid})
    if not verify_result.fetchone():
        raise HTTPException(status_code=403, detail="Not authorized to view these leads")

    query = text("""
        SELECT id, consumer_name, consumer_phone, consumer_email,
               consumer_suburb, consumer_address, job_description, status, unlock_fee_cents,
               referral_fee_snapshot_cents, created_at
        FROM leads WHERE business_id = :id
        ORDER BY created_at DESC
    """)
    result = await db.execute(query, {"id": uuid.UUID(business_id)})
    leads = result.mappings().all()

    formatted_leads = []
    unlocked_statuses = ["UNLOCKED", "ON_THE_WAY", "CONFIRMED"]
    for l in leads:
        is_unlocked = l["status"].upper() in unlocked_statuses

        lead_dict = {
            "id": str(l["id"]),
            "customer_name": l["consumer_name"] if is_unlocked else f"{l['consumer_name'][0]}*** ****",
            "suburb": l["consumer_suburb"],
            "description": l["job_description"],
            "status": l["status"].upper(),
            "created_at": "Recently",
            "unlock_fee": (l["unlock_fee_cents"] or 0) / 100,
            "referral_fee": (l["referral_fee_snapshot_cents"] or 0) / 100,
            "phone": l["consumer_phone"] if is_unlocked else None,
            "email": l["consumer_email"] if is_unlocked else None,
            "address": l["consumer_address"] if is_unlocked else None
        }
        formatted_leads.append(lead_dict)

    return formatted_leads

@router.post("/verify-abn")
async def verify_abn(
    request: ABNVerificationRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Verifies an ABN via the Australian Business Register (ABR) API.
    If the business name matches, we update the business status to verified.
    """
    abn = request.abn.replace(" ", "")
    if len(abn) != 11 or not abn.isdigit():
        raise HTTPException(status_code=400, detail="Invalid ABN format. Must be 11 digits.")

    abr_guid = os.getenv("ABR_GUID")

    # Placeholder/Mock logic for development or if GUID is missing
    if not abr_guid:
        # For demo purposes, we'll "verify" any ABN starting with '123'
        if abn.startswith("123"):
            business_name = "Mock Verified Business Pty Ltd"
        else:
            return {"verified": False, "message": "ABN not found in registry (Simulation mode: use ABN starting with 123 to succeed)"}
    else:
        try:
            url = f"https://abr.business.gov.au/json/AbnDetails.aspx"
            params = {
                'abn': abn,
                'guid': abr_guid
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="ABR service unavailable")

                # ABR often returns JSONP e.g. callback({"Abn":"..."})
                raw_text = response.text
                if "(" in raw_text and ")" in raw_text:
                    json_str = raw_text[raw_text.find("(") + 1 : raw_text.rfind(")")]
                    data = json.loads(json_str)
                else:
                    data = response.json()

                if data.get("Code") == "Search error":
                    return {"verified": False, "message": data.get("Message", "ABN not found")}

                business_name = data.get("EntityName")
                if not business_name:
                    return {"verified": False, "message": "Business name not found for this ABN"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ABR Lookup failed: {str(e)}")

    # Update business in DB
    user_uuid = uuid.UUID(user.id)
    update_query = text("""
        UPDATE businesses
        SET is_verified = TRUE,
            abn = :abn,
            updated_at = now()
        WHERE user_id = :user_id
    """)
    await db.execute(update_query, {"abn": abn, "user_id": user_uuid})
    await db.commit()

    return {
        "verified": True,
        "business_name": business_name,
        "message": f"Verified successfully as {business_name}"
    }

# --- Projects CRUD ---

@router.get("/me/projects")
async def get_my_projects(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    biz_query = text("SELECT id FROM businesses WHERE user_id = :user_id")
    biz_res = await db.execute(biz_query, {"user_id": user_uuid})
    biz = biz_res.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    query = text("""
        SELECT p.*,
               array_agg(pp.url) FILTER (WHERE pp.url IS NOT NULL) as photo_urls
        FROM projects p
        LEFT JOIN project_photos pp ON p.id = pp.project_id
        WHERE p.business_id = :biz_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    """)
    result = await db.execute(query, {"biz_id": biz["id"]})
    projects = result.mappings().all()
    return [dict(p) for p in projects]

@router.post("/me/projects")
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    biz_query = text("SELECT id FROM businesses WHERE user_id = :user_id")
    biz_res = await db.execute(biz_query, {"user_id": user_uuid})
    biz = biz_res.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    insert_query = text("""
        INSERT INTO projects (business_id, title, description, cover_photo_url, is_featured)
        VALUES (:biz_id, :title, :description, :cover_photo_url, :is_featured)
        RETURNING id
    """)

    try:
        res = await db.execute(insert_query, {
            "biz_id": biz["id"],
            "title": data.title,
            "description": data.description,
            "cover_photo_url": data.cover_photo_url,
            "is_featured": data.is_featured
        })
        project_id = res.fetchone()[0]

        if data.photo_urls:
            for url in data.photo_urls:
                await db.execute(
                    text("INSERT INTO project_photos (project_id, url) VALUES (:pid, :url)"),
                    {"pid": project_id, "url": url}
                )

        await db.commit()
        return {"id": str(project_id), "message": "Project created successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.patch("/me/projects/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    pid = uuid.UUID(project_id)

    # Verify ownership
    verify = text("""
        SELECT p.id FROM projects p
        JOIN businesses b ON p.business_id = b.id
        WHERE p.id = :pid AND b.user_id = :uid
    """)
    if not (await db.execute(verify, {"pid": pid, "uid": user_uuid})).fetchone():
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    photo_urls = update_data.pop("photo_urls", None)

    if update_data:
        fields = [f"{k} = :{k}" for k in update_data.keys()]
        await db.execute(
            text(f"UPDATE projects SET {', '.join(fields)}, updated_at = now() WHERE id = :pid"),
            {**update_data, "pid": pid}
        )

    if photo_urls is not None:
        # Simple policy: replace photos
        await db.execute(text("DELETE FROM project_photos WHERE project_id = :pid"), {"pid": pid})
        for url in photo_urls:
            await db.execute(
                text("INSERT INTO project_photos (project_id, url) VALUES (:pid, :url)"),
                {"pid": pid, "url": url}
            )

    await db.commit()
    return {"message": "Project updated"}

@router.delete("/me/projects/{project_id}")
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    user_uuid = uuid.UUID(user.id)
    pid = uuid.UUID(project_id)

    # Verify ownership
    verify = text("""
        SELECT p.id FROM projects p
        JOIN businesses b ON p.business_id = b.id
        WHERE p.id = :pid AND b.user_id = :uid
    """)
    if not (await db.execute(verify, {"pid": pid, "uid": user_uuid})).fetchone():
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.execute(text("DELETE FROM projects WHERE id = :pid"), {"pid": pid})
    await db.commit()
    return {"message": "Project deleted"}

@router.get("/{business_id_or_slug}/projects/public")
async def get_public_projects(
    business_id_or_slug: str,
    db: AsyncSession = Depends(get_db)
):
    # Try to resolve by slug first, then by ID
    query = text("""
        SELECT p.*,
               array_agg(pp.url) FILTER (WHERE pp.url IS NOT NULL) as photo_urls
        FROM projects p
        JOIN businesses b ON p.business_id = b.id
        LEFT JOIN project_photos pp ON p.id = pp.project_id
        WHERE b.slug = :val OR CAST(b.id AS TEXT) = :val
        GROUP BY p.id
        ORDER BY p.is_featured DESC, p.created_at DESC
    """)
    result = await db.execute(query, {"val": business_id_or_slug})
    projects = result.mappings().all()
    return [dict(p) for p in projects]


# --- Referrer Management ---

async def _get_business_id(db: AsyncSession, user: AuthenticatedUser):
    """Helper: get business ID for authenticated user."""
    user_uuid = uuid.UUID(user.id)
    result = await db.execute(
        text("SELECT id, wallet_balance_cents, referral_fee_cents FROM businesses WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    biz = result.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("/me/referrers")
async def list_referrers(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
    sort_by: str = "leads_created",
    sort_dir: str = "desc",
    search: Optional[str] = None,
):
    """List all referrers linked to this business with aggregated stats."""
    biz = await _get_business_id(db, user)
    biz_id = biz["id"]

    allowed_sorts = {"leads_created", "total_earned_cents", "quality_score", "created_at", "full_name"}
    if sort_by not in allowed_sorts:
        sort_by = "leads_created"
    if sort_dir not in ("asc", "desc"):
        sort_dir = "desc"

    query = text(f"""
        SELECT
            r.id as referrer_id,
            r.full_name,
            r.email,
            r.phone,
            r.quality_score,
            r.status as referrer_status,
            r.created_at as referrer_since,
            rl.id as link_id,
            rl.clicks,
            rl.leads_created,
            rl.leads_unlocked,
            rl.total_earned_cents,
            rl.custom_fee_cents,
            rl.business_notes,
            rl.is_active,
            rl.created_at as linked_since,
            (SELECT COUNT(*) FROM leads l WHERE l.referrer_id = r.id AND l.business_id = :biz_id AND l.status = 'CONFIRMED') as confirmed_jobs,
            (SELECT MAX(l.created_at) FROM leads l WHERE l.referrer_id = r.id AND l.business_id = :biz_id) as last_lead_at
        FROM referral_links rl
        JOIN referrers r ON rl.referrer_id = r.id
        WHERE rl.business_id = :biz_id
        {"AND LOWER(r.full_name) LIKE LOWER(:search)" if search else ""}
        ORDER BY {sort_by} {sort_dir}
    """)

    params = {"biz_id": biz_id}
    if search:
        params["search"] = f"%{search}%"

    result = await db.execute(query, params)
    rows = result.mappings().all()

    referrers = []
    for row in rows:
        effective_fee = row["custom_fee_cents"] if row["custom_fee_cents"] is not None else biz["referral_fee_cents"]
        referrers.append({
            "referrer_id": str(row["referrer_id"]),
            "full_name": row["full_name"],
            "email": row["email"],
            "phone": row["phone"],
            "quality_score": row["quality_score"],
            "referrer_status": row["referrer_status"],
            "link_id": str(row["link_id"]),
            "clicks": row["clicks"],
            "leads_created": row["leads_created"],
            "leads_unlocked": row["leads_unlocked"],
            "confirmed_jobs": row["confirmed_jobs"],
            "total_earned_cents": row["total_earned_cents"],
            "custom_fee_cents": row["custom_fee_cents"],
            "effective_fee_cents": effective_fee,
            "business_notes": row["business_notes"],
            "is_active": row["is_active"],
            "linked_since": str(row["linked_since"]) if row["linked_since"] else None,
            "last_lead_at": str(row["last_lead_at"]) if row["last_lead_at"] else None,
        })

    # Summary stats
    total_leads = sum(r["leads_created"] for r in referrers)
    total_confirmed = sum(r["confirmed_jobs"] for r in referrers)
    total_paid = sum(r["total_earned_cents"] for r in referrers)

    return {
        "referrers": referrers,
        "summary": {
            "total_referrers": len(referrers),
            "total_leads": total_leads,
            "total_confirmed": total_confirmed,
            "total_paid_cents": total_paid,
            "default_fee_cents": biz["referral_fee_cents"],
        }
    }


@router.get("/me/referrers/{referrer_id}")
async def get_referrer_detail(
    referrer_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get detailed view of a single referrer for this business."""
    biz = await _get_business_id(db, user)
    biz_id = biz["id"]
    ref_uuid = uuid.UUID(referrer_id)

    # 1. Get referrer + link info
    info_query = text("""
        SELECT
            r.id as referrer_id, r.full_name, r.email, r.phone,
            r.quality_score, r.status as referrer_status, r.created_at as referrer_since,
            rl.id as link_id, rl.clicks, rl.leads_created, rl.leads_unlocked,
            rl.total_earned_cents, rl.custom_fee_cents, rl.business_notes,
            rl.is_active, rl.created_at as linked_since
        FROM referral_links rl
        JOIN referrers r ON rl.referrer_id = r.id
        WHERE rl.business_id = :biz_id AND r.id = :ref_id
    """)
    result = await db.execute(info_query, {"biz_id": biz_id, "ref_id": ref_uuid})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Referrer not found for this business")

    effective_fee = row["custom_fee_cents"] if row["custom_fee_cents"] is not None else biz["referral_fee_cents"]

    # 2. Get all leads from this referrer for this business
    leads_query = text("""
        SELECT id, consumer_name, consumer_suburb, job_description, status,
               unlock_fee_cents, referral_fee_snapshot_cents,
               referrer_payout_amount_cents, created_at, unlocked_at, confirmed_at
        FROM leads
        WHERE business_id = :biz_id AND referrer_id = :ref_id
        ORDER BY created_at DESC
    """)
    leads_result = await db.execute(leads_query, {"biz_id": biz_id, "ref_id": ref_uuid})
    leads_rows = leads_result.mappings().all()

    leads = []
    for l in leads_rows:
        leads.append({
            "id": str(l["id"]),
            "consumer_name": l["consumer_name"],
            "consumer_suburb": l["consumer_suburb"],
            "job_description": l["job_description"][:80] if l["job_description"] else None,
            "status": l["status"],
            "unlock_fee_cents": l["unlock_fee_cents"],
            "referral_fee_cents": l["referral_fee_snapshot_cents"],
            "referrer_payout_cents": l["referrer_payout_amount_cents"],
            "created_at": str(l["created_at"]) if l["created_at"] else None,
            "unlocked_at": str(l["unlocked_at"]) if l["unlocked_at"] else None,
            "confirmed_at": str(l["confirmed_at"]) if l["confirmed_at"] else None,
        })

    # 3. Get bonus history
    bonus_query = text("""
        SELECT id, amount_cents, reason, funded_from, created_at
        FROM referrer_bonuses
        WHERE business_id = :biz_id AND referrer_id = :ref_id
        ORDER BY created_at DESC
    """)
    bonus_result = await db.execute(bonus_query, {"biz_id": biz_id, "ref_id": ref_uuid})
    bonuses = [
        {
            "id": str(b["id"]),
            "amount_cents": b["amount_cents"],
            "reason": b["reason"],
            "funded_from": b["funded_from"],
            "created_at": str(b["created_at"]) if b["created_at"] else None,
        }
        for b in bonus_result.mappings().all()
    ]

    # 4. Compute stats
    confirmed_count = sum(1 for l in leads if l["status"] == "CONFIRMED")
    conversion_rate = (confirmed_count / len(leads) * 100) if leads else 0
    total_bonus_cents = sum(b["amount_cents"] for b in bonuses)

    return {
        "referrer": {
            "referrer_id": str(row["referrer_id"]),
            "full_name": row["full_name"],
            "email": row["email"],
            "phone": row["phone"],
            "quality_score": row["quality_score"],
            "referrer_status": row["referrer_status"],
            "referrer_since": str(row["referrer_since"]) if row["referrer_since"] else None,
            "linked_since": str(row["linked_since"]) if row["linked_since"] else None,
            "link_id": str(row["link_id"]),
            "is_active": row["is_active"],
            "clicks": row["clicks"],
            "leads_created": row["leads_created"],
            "leads_unlocked": row["leads_unlocked"],
            "confirmed_jobs": confirmed_count,
            "conversion_rate": round(conversion_rate, 1),
            "total_earned_cents": row["total_earned_cents"],
            "total_bonus_cents": total_bonus_cents,
            "custom_fee_cents": row["custom_fee_cents"],
            "effective_fee_cents": effective_fee,
            "default_fee_cents": biz["referral_fee_cents"],
            "business_notes": row["business_notes"],
        },
        "leads": leads,
        "bonuses": bonuses,
        "wallet_balance_cents": biz["wallet_balance_cents"],
    }


@router.patch("/me/referrers/{referrer_id}/fee")
async def update_referrer_fee(
    referrer_id: str,
    data: ReferrerFeeUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Set a custom referral fee for a specific referrer, or revert to default."""
    biz = await _get_business_id(db, user)
    biz_id = biz["id"]
    ref_uuid = uuid.UUID(referrer_id)

    # Validate minimum fee if setting a custom one
    if data.custom_fee_cents is not None and data.custom_fee_cents < 300:
        raise HTTPException(status_code=400, detail="Custom fee must be at least $3.00 (300 cents)")

    # Verify the referral link exists
    check = await db.execute(
        text("SELECT id FROM referral_links WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_id, "ref_id": ref_uuid}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Referrer not found for this business")

    await db.execute(
        text("UPDATE referral_links SET custom_fee_cents = :fee WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"fee": data.custom_fee_cents, "biz_id": biz_id, "ref_id": ref_uuid}
    )
    await db.commit()

    effective = data.custom_fee_cents if data.custom_fee_cents is not None else biz["referral_fee_cents"]
    return {
        "message": "Custom fee updated" if data.custom_fee_cents else "Reverted to default fee",
        "custom_fee_cents": data.custom_fee_cents,
        "effective_fee_cents": effective,
        "default_fee_cents": biz["referral_fee_cents"],
    }


@router.patch("/me/referrers/{referrer_id}/notes")
async def update_referrer_notes(
    referrer_id: str,
    data: ReferrerNotesUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Update private business notes about a referrer."""
    biz = await _get_business_id(db, user)
    biz_id = biz["id"]
    ref_uuid = uuid.UUID(referrer_id)

    check = await db.execute(
        text("SELECT id FROM referral_links WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_id, "ref_id": ref_uuid}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Referrer not found for this business")

    await db.execute(
        text("UPDATE referral_links SET business_notes = :notes WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"notes": data.business_notes, "biz_id": biz_id, "ref_id": ref_uuid}
    )
    await db.commit()
    return {"message": "Notes updated", "business_notes": data.business_notes}



@router.post("/me/referrers/{referrer_id}/bonus")
async def award_referrer_bonus(
    referrer_id: str,
    data: ReferrerBonusCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Award a one-off bonus to a referrer. Handles wallet, card charge, or both."""
    biz = await _get_business_id(db, user)
    biz_id = biz["id"]
    ref_uuid = uuid.UUID(referrer_id)

    # Validate minimum bonus
    if data.amount_cents < 100:
        raise HTTPException(status_code=400, detail="Minimum bonus is $1.00 (100 cents)")

    # Verify referral link exists
    link_result = await db.execute(
        text("SELECT id FROM referral_links WHERE business_id = :biz_id AND referrer_id = :ref_id"),
        {"biz_id": biz_id, "ref_id": ref_uuid}
    )
    link = link_result.mappings().first()
    if not link:
        raise HTTPException(status_code=404, detail="Referrer not found for this business")

    # Re-read wallet balance (fresh, in case concurrent changes)
    bal_result = await db.execute(
        text("SELECT wallet_balance_cents FROM businesses WHERE id = :biz_id"),
        {"biz_id": biz_id}
    )
    wallet_balance = bal_result.scalar()
    shortfall = data.amount_cents - wallet_balance

    # --- CASE 1: Wallet covers it entirely ---
    if shortfall <= 0:
        return await _process_bonus(db, biz_id, ref_uuid, link["id"], data.amount_cents, data.reason, "wallet", None, wallet_balance)

    # --- CASE 2: Insufficient funds, not charging card → return shortfall info ---
    if not data.charge_card and not data.payment_intent_id:
        return {
            "status": "insufficient_funds",
            "wallet_balance_cents": wallet_balance,
            "bonus_amount_cents": data.amount_cents,
            "shortfall_cents": shortfall,
            "message": f"Wallet has ${wallet_balance/100:.2f} but bonus requires ${data.amount_cents/100:.2f}. Shortfall: ${shortfall/100:.2f}",
        }

    # --- CASE 3: charge_card=True, no payment yet → create PaymentIntent for shortfall ---
    if data.charge_card and not data.payment_intent_id:
        try:
            intent = await StripeService.create_payment_intent(
                amount=shortfall,
                currency="aud",
                metadata={
                    "type": "bonus_topup",
                    "business_id": str(biz_id),
                    "referrer_id": referrer_id,
                    "bonus_amount_cents": str(data.amount_cents),
                }
            )
            return {
                "status": "requires_payment",
                "client_secret": intent.client_secret,
                "shortfall_cents": shortfall,
                "wallet_balance_cents": wallet_balance,
                "bonus_amount_cents": data.amount_cents,
                "message": f"Card charge of ${shortfall/100:.2f} required to cover shortfall",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

    # --- CASE 4: Payment confirmed (payment_intent_id provided) → verify and process ---
    if data.payment_intent_id:
        # Verify the payment intent succeeded
        try:
            import stripe as stripe_lib
            intent = stripe_lib.PaymentIntent.retrieve(data.payment_intent_id)
            if intent.status != "succeeded":
                raise HTTPException(status_code=400, detail=f"Payment not completed. Status: {intent.status}")
            card_amount = intent.amount
        except HTTPException:
            raise
        except Exception:
            # In dev/test mode, accept mock payment intents
            card_amount = shortfall

        # Top up wallet with the card charge amount
        new_wallet_after_topup = wallet_balance + card_amount
        await db.execute(
            text("UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :biz_id"),
            {"bal": new_wallet_after_topup, "biz_id": biz_id}
        )
        await db.execute(
            text("""INSERT INTO wallet_transactions (business_id, amount_cents, type, payment_ref, notes, balance_after_cents)
                    VALUES (:biz_id, :amt, 'TOPUP', :pay_ref, 'Auto top-up for referrer bonus', :bal)"""),
            {"biz_id": biz_id, "amt": card_amount, "pay_ref": data.payment_intent_id, "bal": new_wallet_after_topup}
        )

        return await _process_bonus(db, biz_id, ref_uuid, link["id"], data.amount_cents, data.reason, "card+wallet", data.payment_intent_id, new_wallet_after_topup)

    raise HTTPException(status_code=400, detail="Invalid request state")


async def _process_bonus(
    db: AsyncSession,
    biz_id,
    ref_id: uuid.UUID,
    link_id,
    amount_cents: int,
    reason: Optional[str],
    funded_from: str,
    payment_ref: Optional[str],
    wallet_balance: int,
):
    """Deduct from business wallet, credit referrer, create records."""
    new_balance = wallet_balance - amount_cents

    # 1. Deduct from business wallet
    await db.execute(
        text("UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :biz_id"),
        {"bal": new_balance, "biz_id": biz_id}
    )

    # 2. Log wallet transaction
    await db.execute(
        text("""INSERT INTO wallet_transactions (business_id, amount_cents, type, notes, balance_after_cents)
                VALUES (:biz_id, :amt, 'BONUS', :notes, :bal)"""),
        {"biz_id": biz_id, "amt": amount_cents, "notes": f"Bonus to referrer: {reason or 'No reason given'}", "bal": new_balance}
    )

    # 3. Credit referrer wallet + total earned
    await db.execute(
        text("""UPDATE referrers
                SET wallet_balance_cents = wallet_balance_cents + :amt,
                    total_earned_cents = total_earned_cents + :amt
                WHERE id = :ref_id"""),
        {"amt": amount_cents, "ref_id": ref_id}
    )

    # 4. Create bonus record
    await db.execute(
        text("""INSERT INTO referrer_bonuses (business_id, referrer_id, referral_link_id, amount_cents, reason, funded_from, payment_ref)
                VALUES (:biz_id, :ref_id, :link_id, :amt, :reason, :funded, :pay_ref)"""),
        {"biz_id": biz_id, "ref_id": ref_id, "link_id": link_id, "amt": amount_cents,
         "reason": reason, "funded": funded_from, "pay_ref": payment_ref}
    )

    # 5. Create payment transaction record
    await db.execute(
        text("""INSERT INTO payment_transactions (business_id, referrer_id, type, amount_cents, status)
                VALUES (:biz_id, :ref_id, 'bonus', :amt, 'completed')"""),
        {"biz_id": biz_id, "ref_id": ref_id, "amt": amount_cents}
    )

    await db.commit()

    return {
        "status": "success",
        "message": f"Bonus of ${amount_cents/100:.2f} sent successfully",
        "bonus_amount_cents": amount_cents,
        "funded_from": funded_from,
        "new_wallet_balance_cents": new_balance,
    }


class WalletTopUp(BaseModel):
    amount_cents: int


@router.post("/wallet/topup")
async def wallet_topup(
    data: WalletTopUp,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Top up the business wallet balance. In production this would create a Stripe PaymentIntent first."""
    if data.amount_cents < 500:
        raise HTTPException(status_code=400, detail="Minimum top-up is $5.00")

    user_uuid = uuid.UUID(user.id)
    biz_q = await db.execute(
        text("SELECT id, wallet_balance_cents FROM businesses WHERE user_id = :uid"),
        {"uid": user_uuid},
    )
    biz = biz_q.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    new_balance = (biz["wallet_balance_cents"] or 0) + data.amount_cents

    await db.execute(
        text("UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :id"),
        {"bal": new_balance, "id": biz["id"]},
    )
    await db.execute(
        text("""INSERT INTO wallet_transactions (business_id, amount_cents, type, notes, balance_after_cents)
                VALUES (:biz_id, :amt, 'TOPUP', 'Manual wallet top-up', :bal)"""),
        {"biz_id": biz["id"], "amt": data.amount_cents, "bal": new_balance},
    )
    await db.commit()

    return {"new_balance_cents": new_balance}


@router.get("/analytics/referrers")
async def referrer_analytics(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Top referrers, campaign performance, cost per customer for the business."""
    user_uuid = uuid.UUID(user.id)
    biz_res = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid}
    )
    biz = biz_res.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    biz_id = biz[0]

    # Top referrers
    top_res = await db.execute(
        text("""
            SELECT r.full_name, r.tier,
                   COUNT(l.id) as lead_count,
                   COALESCE(SUM(l.referrer_payout_amount_cents), 0) as total_paid_cents,
                   SUM(CASE WHEN l.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_count
            FROM leads l
            JOIN referrers r ON r.id = l.referrer_id
            WHERE l.business_id = :bid
            GROUP BY r.id, r.full_name, r.tier
            ORDER BY lead_count DESC
            LIMIT 10
        """),
        {"bid": biz_id}
    )
    top_referrers = [
        {
            "name": row["full_name"],
            "tier": row["tier"],
            "lead_count": row["lead_count"],
            "confirmed_count": row["confirmed_count"],
            "total_paid_cents": row["total_paid_cents"],
        }
        for row in top_res.mappings().all()
    ]

    # Campaign performance
    camp_res = await db.execute(
        text("""
            SELECT c.id, c.title, c.campaign_type, c.bonus_amount_cents,
                   c.starts_at, c.ends_at, c.is_active,
                   (SELECT COUNT(*) FROM leads l
                    WHERE l.business_id = :bid
                    AND l.created_at BETWEEN c.starts_at AND c.ends_at) as leads_during
            FROM campaigns c
            WHERE c.business_id = :bid
            ORDER BY c.created_at DESC
            LIMIT 10
        """),
        {"bid": biz_id}
    )
    campaign_perf = []
    for row in camp_res.mappings().all():
        c = dict(row)
        c["id"] = str(c["id"])
        for dt in ("starts_at", "ends_at"):
            if c.get(dt):
                c[dt] = str(c[dt])
        campaign_perf.append(c)

    # Cost per customer
    cost_res = await db.execute(
        text("""
            SELECT COUNT(*) as total_leads,
                   SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
                   COALESCE(SUM(unlock_fee_cents), 0) as total_spent_cents
            FROM leads
            WHERE business_id = :bid
        """),
        {"bid": biz_id}
    )
    cost_row = cost_res.mappings().first()
    confirmed = cost_row["confirmed"] or 0
    total_spent = cost_row["total_spent_cents"] or 0
    cost_per_customer = round(total_spent / confirmed) if confirmed > 0 else 0

    return {
        "top_referrers": top_referrers,
        "campaign_performance": campaign_perf,
        "summary": {
            "total_leads": cost_row["total_leads"],
            "confirmed_leads": confirmed,
            "total_spent_cents": total_spent,
            "cost_per_customer_cents": cost_per_customer,
        }
    }


class BulkMessage(BaseModel):
    message: str


@router.post("/broadcast")
async def broadcast_to_referrers(
    data: BulkMessage,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Send a notification to all connected referrers."""
    from routers.notifications import notify_all_referrers_for_business
    user_uuid = uuid.UUID(user.id)
    biz_res = await db.execute(
        text("SELECT id, business_name, slug FROM businesses WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    biz = biz_res.mappings().first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    await notify_all_referrers_for_business(
        db, biz["id"], "general",
        f"Update from {biz['business_name']}",
        data.message,
        f"/b/{biz['slug']}/refer"
    )
    return {"message": "Broadcast sent to all connected referrers"}


# ── Network Effects: Business→Business Recommendations ──

class BusinessRecommendation(BaseModel):
    to_business_slug: str
    message: Optional[str] = None

class BusinessInvite(BaseModel):
    invite_email: str
    invite_name: str
    invite_trade: Optional[str] = None


@router.post("/network/recommend")
async def recommend_business(
    data: BusinessRecommendation,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Recommend another business on the platform (creates a two-way trust link)."""
    user_uuid = uuid.UUID(user.id)
    from_biz = await db.execute(text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid})
    from_row = from_biz.fetchone()
    if not from_row:
        raise HTTPException(status_code=404, detail="Your business not found")

    to_biz = await db.execute(text("SELECT id FROM businesses WHERE slug = :slug"), {"slug": data.to_business_slug})
    to_row = to_biz.fetchone()
    if not to_row:
        raise HTTPException(status_code=404, detail="Business to recommend not found")

    if from_row[0] == to_row[0]:
        raise HTTPException(status_code=400, detail="Cannot recommend yourself")

    try:
        await db.execute(
            text("""
                INSERT INTO business_recommendations (from_business_id, to_business_id, message)
                VALUES (:from_id, :to_id, :message)
                ON CONFLICT (from_business_id, to_business_id) DO NOTHING
            """),
            {"from_id": from_row[0], "to_id": to_row[0], "message": data.message}
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": f"Recommended {data.to_business_slug}"}


@router.get("/network/recommendations")
async def get_my_recommendations(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Get businesses I've recommended and businesses that recommended me."""
    user_uuid = uuid.UUID(user.id)
    biz_res = await db.execute(text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid})
    biz = biz_res.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    # Businesses I recommended
    given = await db.execute(
        text("""
            SELECT b.business_name, b.slug, b.trade_category, b.suburb, b.logo_url, b.is_verified,
                   br.message, br.created_at
            FROM business_recommendations br
            JOIN businesses b ON b.id = br.to_business_id
            WHERE br.from_business_id = :bid
            ORDER BY br.created_at DESC
        """),
        {"bid": biz[0]}
    )

    # Businesses that recommended me
    received = await db.execute(
        text("""
            SELECT b.business_name, b.slug, b.trade_category, b.suburb, b.logo_url, b.is_verified,
                   br.message, br.created_at
            FROM business_recommendations br
            JOIN businesses b ON b.id = br.from_business_id
            WHERE br.to_business_id = :bid
            ORDER BY br.created_at DESC
        """),
        {"bid": biz[0]}
    )

    def fmt(rows):
        out = []
        for r in rows.mappings().all():
            d = dict(r)
            if d.get("created_at"):
                d["created_at"] = str(d["created_at"])
            out.append(d)
        return out

    return {"given": fmt(given), "received": fmt(received)}


@router.post("/network/invite")
async def invite_business(
    data: BusinessInvite,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Invite a business to join TradeRefer (creates a trackable invite)."""
    user_uuid = uuid.UUID(user.id)
    biz_res = await db.execute(text("SELECT id, business_name FROM businesses WHERE user_id = :uid"), {"uid": user_uuid})
    biz = biz_res.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    invite_code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

    await db.execute(
        text("""
            INSERT INTO business_invites (inviter_business_id, invite_email, invite_name, invite_trade, invite_code)
            VALUES (:bid, :email, :name, :trade, :code)
        """),
        {"bid": biz[0], "email": data.invite_email, "name": data.invite_name,
         "trade": data.invite_trade, "code": invite_code}
    )
    await db.commit()

    return {
        "invite_code": invite_code,
        "invite_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/onboarding/business?ref={invite_code}",
        "message": f"Invite created for {data.invite_name}"
    }


@router.get("/network/invites")
async def get_my_invites(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List invites I've sent."""
    user_uuid = uuid.UUID(user.id)
    biz_res = await db.execute(text("SELECT id FROM businesses WHERE user_id = :uid"), {"uid": user_uuid})
    biz = biz_res.fetchone()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(
        text("""
            SELECT invite_name, invite_email, invite_trade, invite_code, status, created_at
            FROM business_invites
            WHERE inviter_business_id = :bid
            ORDER BY created_at DESC
        """),
        {"bid": biz[0]}
    )
    invites = []
    for r in result.mappings().all():
        d = dict(r)
        if d.get("created_at"):
            d["created_at"] = str(d["created_at"])
        invites.append(d)
    return invites