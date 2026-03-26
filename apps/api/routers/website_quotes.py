from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, require_admin, AuthenticatedUser
from routers.notifications import create_notification
from services.email import (
    send_business_enquiry_teaser,
    send_business_website_quote,
    send_consumer_lead_confirmation,
    send_consumer_quote_request_confirmation,
    send_admin_quote_queue_alert,
)
from services.sms import (
    send_sms_claimed_new_lead,
    send_sms_unclaimed_teaser,
    send_sms_consumer_lead_confirmation,
)
import os
import uuid

router = APIRouter()

WEBSITE_QUOTES_ENABLED = os.getenv("WEBSITE_QUOTES_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
ADMIN_QUOTE_ALERT_EMAIL = os.getenv("WEBSITE_QUOTES_ADMIN_EMAIL", "stevejford1@gmail.com")


class WebsiteQuoteCreate(BaseModel):
    business_id: Optional[str] = None
    business_ids: List[str] = Field(default_factory=list)
    source_page: Optional[str] = None
    trade_category: Optional[str] = None
    consumer_name: str
    consumer_phone: str
    consumer_email: str
    consumer_suburb: Optional[str] = None
    consumer_city: Optional[str] = None
    consumer_state: Optional[str] = None
    consumer_address: Optional[str] = None
    job_description: str
    lead_urgency: str = "warm"
    target_match_count: int = 1


class WebsiteQuoteAssign(BaseModel):
    business_id: str


def _normalize_phone(phone: str) -> str:
    value = phone.strip().replace(" ", "").replace("-", "")
    if value.startswith("04"):
        return "+61" + value[1:]
    if value.startswith("4") and len(value) == 9:
        return "+61" + value
    return value


async def _notify_claimed_business(db: AsyncSession, business: dict, quote: WebsiteQuoteCreate, request_id: str):
    user_id = business.get("user_id")
    if user_id:
        try:
            await create_notification(
                db,
                str(user_id),
                "website_quote",
                f"New website quote in {quote.consumer_suburb or quote.consumer_city or 'your area'}",
                quote.job_description[:160],
                "/dashboard/business/leads",
            )
        except Exception:
            pass

    if business.get("business_email"):
        await send_business_website_quote(
            business["business_email"],
            business["business_name"],
            quote.consumer_name,
            quote.consumer_suburb or quote.consumer_city or "your area",
            quote.job_description,
        )
    if business.get("business_phone"):
        await send_sms_claimed_new_lead(
            business["business_phone"],
            business["business_name"],
            quote.consumer_name,
            quote.consumer_suburb or quote.consumer_city or "your area",
            quote.job_description,
        )


async def _notify_unclaimed_business(business: dict, quote: WebsiteQuoteCreate):
    if business.get("business_email"):
        await send_business_enquiry_teaser(
            business["business_email"],
            business["business_name"],
            str(business["id"]),
            business.get("slug") or "",
            quote.consumer_name,
            quote.consumer_suburb or quote.consumer_city or "your area",
            quote.job_description,
        )
    if business.get("business_phone"):
        await send_sms_unclaimed_teaser(
            business["business_phone"],
            business["business_name"],
            quote.consumer_name,
            business.get("slug") or "",
            quote.consumer_suburb or quote.consumer_city or "your area",
            quote.job_description,
        )


async def _send_consumer_confirmation(quote: WebsiteQuoteCreate, businesses: list[dict]):
    if not quote.consumer_email:
        return
    if len(businesses) == 1:
        business = businesses[0]
        await send_consumer_lead_confirmation(
            quote.consumer_email,
            quote.consumer_name,
            business["business_name"],
            business.get("trade_category") or quote.trade_category or "Trade",
            quote.job_description,
        )
    else:
        await send_consumer_quote_request_confirmation(
            quote.consumer_email,
            quote.consumer_name,
            min(len(businesses), max(1, quote.target_match_count)),
            quote.trade_category or "Trade",
            quote.job_description,
            quote.consumer_suburb or quote.consumer_city or quote.consumer_state or "your area",
        )
    if quote.consumer_phone:
        target = businesses[0]["business_name"] if len(businesses) == 1 else "local providers"
        await send_sms_consumer_lead_confirmation(quote.consumer_phone, quote.consumer_name, target)


async def _get_candidate_businesses(db: AsyncSession, quote: WebsiteQuoteCreate) -> list[dict]:
    if quote.business_id:
        result = await db.execute(
            text(
                """
                SELECT id, user_id, business_name, business_email, business_phone, slug,
                       trade_category, suburb, city, state, is_claimed, status
                FROM businesses
                WHERE id = :id
                LIMIT 1
                """
            ),
            {"id": uuid.UUID(quote.business_id)},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Business not found")
        return [dict(row)]

    if quote.business_ids:
        ids = [uuid.UUID(value) for value in quote.business_ids]
        result = await db.execute(
            text(
                """
                SELECT id, user_id, business_name, business_email, business_phone, slug,
                       trade_category, suburb, city, state, is_claimed, status
                FROM businesses
                WHERE id = ANY(:ids)
                ORDER BY is_claimed DESC, created_at DESC
                """
            ),
            {"ids": ids},
        )
        return [dict(row) for row in result.mappings().all()]

    if not quote.trade_category:
        raise HTTPException(status_code=400, detail="trade_category is required for auto-matching")

    query = text(
        """
        SELECT id, user_id, business_name, business_email, business_phone, slug,
               trade_category, suburb, city, state, is_claimed, status,
               CASE
                   WHEN :suburb IS NOT NULL AND lower(COALESCE(suburb, '')) = lower(:suburb) THEN 0
                   WHEN :city IS NOT NULL AND lower(COALESCE(city, '')) = lower(:city) THEN 1
                   WHEN :state IS NOT NULL AND lower(COALESCE(state, '')) = lower(:state) THEN 2
                   ELSE 3
               END AS rank_score
        FROM businesses
        WHERE status = 'active'
          AND is_claimed = true
          AND lower(COALESCE(trade_category, '')) = lower(:trade_category)
          AND (
            (:suburb IS NOT NULL AND lower(COALESCE(suburb, '')) = lower(:suburb))
            OR (:city IS NOT NULL AND lower(COALESCE(city, '')) = lower(:city))
            OR (:state IS NOT NULL AND lower(COALESCE(state, '')) = lower(:state))
          )
        ORDER BY rank_score ASC, review_count DESC NULLS LAST, avg_rating DESC NULLS LAST, created_at DESC
        LIMIT :limit
        """
    )
    result = await db.execute(
        query,
        {
            "trade_category": quote.trade_category,
            "suburb": quote.consumer_suburb,
            "city": quote.consumer_city,
            "state": quote.consumer_state,
            "limit": max(1, min(quote.target_match_count, 3)),
        },
    )
    return [dict(row) for row in result.mappings().all()]


async def _recount_request(db: AsyncSession, request_id: str):
    counts = await db.execute(
        text(
            """
            SELECT
                COUNT(*) FILTER (WHERE is_claimed_snapshot = true) AS claimed_count,
                COUNT(*) AS total_count
            FROM website_quote_matches
            WHERE request_id = :request_id
            """
        ),
        {"request_id": uuid.UUID(request_id)},
    )
    row = counts.mappings().first() or {}
    return int(row.get("claimed_count") or 0), int(row.get("total_count") or 0)


@router.post("/submit")
async def submit_website_quote(quote: WebsiteQuoteCreate, db: AsyncSession = Depends(get_db)):
    if not WEBSITE_QUOTES_ENABLED:
        raise HTTPException(status_code=404, detail="Website quotes are currently disabled")

    normalized_phone = _normalize_phone(quote.consumer_phone)
    target_match_count = max(1, min(quote.target_match_count or 1, 3))
    is_direct_quote = bool(quote.business_id)

    request_result = await db.execute(
        text(
            """
            INSERT INTO website_quote_requests (
                source_type, source_page, target_business_id, trade_category,
                consumer_name, consumer_phone, consumer_email, consumer_address,
                consumer_suburb, consumer_city, consumer_state,
                job_description, urgency, target_match_count, status
            ) VALUES (
                'website', :source_page, :target_business_id, :trade_category,
                :consumer_name, :consumer_phone, :consumer_email, :consumer_address,
                :consumer_suburb, :consumer_city, :consumer_state,
                :job_description, :urgency, :target_match_count, 'PENDING'
            ) RETURNING id
            """
        ),
        {
            "source_page": quote.source_page,
            "target_business_id": uuid.UUID(quote.business_id) if quote.business_id else None,
            "trade_category": quote.trade_category,
            "consumer_name": quote.consumer_name,
            "consumer_phone": normalized_phone,
            "consumer_email": quote.consumer_email,
            "consumer_address": quote.consumer_address,
            "consumer_suburb": quote.consumer_suburb,
            "consumer_city": quote.consumer_city,
            "consumer_state": quote.consumer_state,
            "job_description": quote.job_description,
            "urgency": quote.lead_urgency,
            "target_match_count": target_match_count,
        },
    )
    request_id = str(request_result.scalar())

    candidates = await _get_candidate_businesses(db, quote)

    matched_businesses: list[dict] = []
    claimed_count = 0
    for index, business in enumerate(candidates[:target_match_count], start=1):
        is_claimed = bool(business.get("is_claimed"))
        status = "NEW" if is_claimed else "NEEDS_CLAIM"
        match_type = "direct" if is_direct_quote else "auto"
        await db.execute(
            text(
                """
                INSERT INTO website_quote_matches (
                    request_id, business_id, match_type, match_rank, status,
                    is_claimed_snapshot, notified_at, allocated_at
                ) VALUES (
                    :request_id, :business_id, :match_type, :match_rank, :status,
                    :is_claimed_snapshot, now(), CASE WHEN :is_claimed_snapshot THEN now() ELSE NULL END
                )
                ON CONFLICT (request_id, business_id) DO NOTHING
                """
            ),
            {
                "request_id": uuid.UUID(request_id),
                "business_id": business["id"],
                "match_type": match_type,
                "match_rank": index,
                "status": status,
                "is_claimed_snapshot": is_claimed,
            },
        )
        matched_businesses.append(business)
        if is_claimed:
            claimed_count += 1

    admin_review_required = False
    if is_direct_quote:
        admin_review_required = claimed_count == 0
    elif target_match_count > 1:
        admin_review_required = claimed_count < 2

    await db.execute(
        text(
            """
            UPDATE website_quote_requests
            SET claimed_match_count = :claimed_match_count,
                status = :status,
                admin_review_required = :admin_review_required,
                admin_notified_at = CASE WHEN :admin_review_required THEN now() ELSE admin_notified_at END,
                updated_at = now()
            WHERE id = :request_id
            """
        ),
        {
            "request_id": uuid.UUID(request_id),
            "claimed_match_count": claimed_count,
            "status": "ADMIN_REVIEW" if admin_review_required else "MATCHED",
            "admin_review_required": admin_review_required,
        },
    )
    await db.commit()

    for business in matched_businesses:
        if business.get("is_claimed"):
            await _notify_claimed_business(db, business, quote, request_id)
        else:
            await _notify_unclaimed_business(business, quote)

    if admin_review_required:
        await send_admin_quote_queue_alert(
            ADMIN_QUOTE_ALERT_EMAIL,
            quote.trade_category or (matched_businesses[0].get("trade_category") if matched_businesses else "Trade"),
            quote.consumer_suburb or quote.consumer_city or quote.consumer_state or "your area",
            quote.job_description,
            quote.lead_urgency,
            claimed_count,
            target_match_count,
            request_id,
        )

    await _send_consumer_confirmation(quote, [b for b in matched_businesses if b.get("is_claimed")] or matched_businesses)

    return {
        "id": request_id,
        "status": "ADMIN_REVIEW" if admin_review_required else "MATCHED",
        "claimedMatches": claimed_count,
        "targetMatches": target_match_count,
    }


@router.get("/admin-queue")
async def get_admin_quote_queue(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    result = await db.execute(
        text(
            """
            SELECT r.id, r.trade_category, r.consumer_name, r.consumer_suburb, r.consumer_city,
                   r.consumer_state, r.job_description, r.urgency, r.claimed_match_count,
                   r.target_match_count, r.created_at,
                   COUNT(m.id) AS total_matches
            FROM website_quote_requests r
            LEFT JOIN website_quote_matches m ON m.request_id = r.id
            WHERE r.admin_review_required = true
            GROUP BY r.id
            ORDER BY r.created_at DESC
            """
        )
    )
    items = []
    for row in result.mappings().all():
        item = dict(row)
        item["id"] = str(item["id"])
        item["created_at"] = str(item["created_at"]) if item.get("created_at") else None
        items.append(item)
    return {"items": items, "total": len(items)}


@router.post("/{request_id}/assign")
async def assign_quote_request(
    request_id: str,
    payload: WebsiteQuoteAssign,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_admin),
):
    request_row = await db.execute(
        text("SELECT id, trade_category, consumer_name, consumer_phone, consumer_email, consumer_suburb, consumer_city, consumer_state, consumer_address, job_description, urgency, target_match_count FROM website_quote_requests WHERE id = :id"),
        {"id": uuid.UUID(request_id)},
    )
    request_data = request_row.mappings().first()
    if not request_data:
        raise HTTPException(status_code=404, detail="Quote request not found")

    business_row = await db.execute(
        text(
            """
            SELECT id, user_id, business_name, business_email, business_phone, slug,
                   trade_category, suburb, city, state, is_claimed, status
            FROM businesses
            WHERE id = :id
            LIMIT 1
            """
        ),
        {"id": uuid.UUID(payload.business_id)},
    )
    business = business_row.mappings().first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    is_claimed = bool(business["is_claimed"])
    await db.execute(
        text(
            """
            INSERT INTO website_quote_matches (
                request_id, business_id, match_type, match_rank, status,
                is_claimed_snapshot, allocated_by_admin_user_id, allocated_at, notified_at
            ) VALUES (
                :request_id, :business_id, 'admin', 99, :status,
                :is_claimed_snapshot, :admin_user_id, now(), now()
            )
            ON CONFLICT (request_id, business_id)
            DO UPDATE SET
                match_type = 'admin',
                status = EXCLUDED.status,
                is_claimed_snapshot = EXCLUDED.is_claimed_snapshot,
                allocated_by_admin_user_id = EXCLUDED.allocated_by_admin_user_id,
                allocated_at = now(),
                notified_at = now(),
                updated_at = now()
            """
        ),
        {
            "request_id": uuid.UUID(request_id),
            "business_id": business["id"],
            "status": "NEW" if is_claimed else "NEEDS_CLAIM",
            "is_claimed_snapshot": is_claimed,
            "admin_user_id": uuid.UUID(user.id),
        },
    )

    claimed_count, _ = await _recount_request(db, request_id)
    target_match_count = int(request_data["target_match_count"] or 1)
    admin_review_required = claimed_count < (1 if target_match_count == 1 else 2)
    await db.execute(
        text(
            """
            UPDATE website_quote_requests
            SET claimed_match_count = :claimed_match_count,
                admin_review_required = :admin_review_required,
                status = :status,
                updated_at = now()
            WHERE id = :request_id
            """
        ),
        {
            "request_id": uuid.UUID(request_id),
            "claimed_match_count": claimed_count,
            "admin_review_required": admin_review_required,
            "status": "ADMIN_REVIEW" if admin_review_required else "MATCHED",
        },
    )
    await db.commit()

    quote = WebsiteQuoteCreate(
        trade_category=request_data.get("trade_category"),
        consumer_name=request_data["consumer_name"],
        consumer_phone=request_data["consumer_phone"],
        consumer_email=request_data["consumer_email"],
        consumer_suburb=request_data.get("consumer_suburb"),
        consumer_city=request_data.get("consumer_city"),
        consumer_state=request_data.get("consumer_state"),
        consumer_address=request_data.get("consumer_address"),
        job_description=request_data["job_description"],
        lead_urgency=request_data.get("urgency") or "warm",
        target_match_count=target_match_count,
    )
    if is_claimed:
        await _notify_claimed_business(db, dict(business), quote, request_id)
    else:
        await _notify_unclaimed_business(dict(business), quote)

    return {"status": "assigned", "requestId": request_id, "businessId": str(business["id"])}
