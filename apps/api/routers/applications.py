from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from services.email import (
    send_referrer_application_received, send_application_approved,
    send_application_rejected, send_application_expired, send_application_reminder
)
from services.sms import _send_sms
import uuid
from datetime import datetime, timedelta
from utils.logging_config import error_logger
from utils.business_slugs import find_business_by_slug

router = APIRouter()


class ApplyRequest(BaseModel):
    message: Optional[str] = None


class ProfileUpdate(BaseModel):
    profile_bio: Optional[str] = None
    tagline: Optional[str] = None
    profile_photo_url: Optional[str] = None


async def _get_referrer_id(db: AsyncSession, user: AuthenticatedUser):
    r = await db.execute(
        text("SELECT id FROM referrers WHERE user_id = :uid"),
        {"uid": uuid.UUID(user.id)}
    )
    row = r.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Referrer profile not found")
    return row["id"]


async def _get_business_id(db: AsyncSession, user: AuthenticatedUser):
    b = await db.execute(
        text("SELECT id FROM businesses WHERE user_id = :uid"),
        {"uid": uuid.UUID(user.id)}
    )
    row = b.mappings().first()
    if not row:
        raise HTTPException(status_code=403, detail="Business profile not found")
    return row["id"]


# ──────────────────────────────────────────────────────────────
# REFERRER ENDPOINTS
# ──────────────────────────────────────────────────────────────

@router.post("/apply/{business_slug}")
async def apply_to_business(
    business_slug: str,
    data: ApplyRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Referrer applies to join a business's referral network."""
    referrer_id = await _get_referrer_id(db, user)

    # Lookup business by slug
    biz = await find_business_by_slug(db, "id, business_name, slug, business_email, business_phone", business_slug)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    business_id = biz["id"]

    # Check if already linked
    existing_link = await db.execute(
        text("SELECT id FROM referral_links WHERE referrer_id = :rid AND business_id = :bid"),
        {"rid": referrer_id, "bid": business_id}
    )
    if existing_link.fetchone():
        raise HTTPException(status_code=409, detail="already_linked")

    # Check if pending application already exists
    existing_app = await db.execute(
        text("SELECT id, status FROM referrer_applications WHERE referrer_id = :rid AND business_id = :bid"),
        {"rid": referrer_id, "bid": business_id}
    )
    app_row = existing_app.mappings().first()
    if app_row:
        if app_row["status"] == "pending":
            raise HTTPException(status_code=409, detail="already_applied")
        if app_row["status"] == "approved":
            raise HTTPException(status_code=409, detail="already_linked")
        # If rejected/expired — allow re-apply by updating the row
        await db.execute(
            text("""
                UPDATE referrer_applications
                SET status='pending', message=:msg, reminder_count=0,
                    last_reminder_at=NULL, applied_at=now(), reviewed_at=NULL
                WHERE referrer_id=:rid AND business_id=:bid
            """),
            {"msg": data.message, "rid": referrer_id, "bid": business_id}
        )
        await db.commit()
        # Get the updated row id
        upd_res = await db.execute(
            text("SELECT id FROM referrer_applications WHERE referrer_id=:rid AND business_id=:bid"),
            {"rid": referrer_id, "bid": business_id}
        )
        app_id = str(upd_res.scalar())
    else:
        # Create new application
        new_app = await db.execute(
            text("""
                INSERT INTO referrer_applications (referrer_id, business_id, message)
                VALUES (:rid, :bid, :msg)
                RETURNING id
            """),
            {"rid": referrer_id, "bid": business_id, "msg": data.message}
        )
        app_id = str(new_app.scalar())
        await db.commit()

    # Get referrer info for notifications
    ref_res = await db.execute(
        text("SELECT full_name, email, phone, suburb FROM referrers WHERE id = :rid"),
        {"rid": referrer_id}
    )
    ref = ref_res.mappings().first()

    # In-app notification to business user
    biz_user_res = await db.execute(
        text("SELECT user_id FROM businesses WHERE id = :bid"),
        {"bid": business_id}
    )
    biz_user_row = biz_user_res.mappings().first()
    if biz_user_row and biz_user_row["user_id"]:
        await db.execute(
            text("""
                INSERT INTO in_app_notifications (user_id, type, title, body, link)
                VALUES (:uid, 'new_application', :title, :body, :link)
            """),
            {
                "uid": biz_user_row["user_id"],
                "title": f"New referrer application from {ref['full_name']}",
                "body": data.message[:100] if data.message else f"{ref['full_name']} from {ref['suburb'] or 'your area'} wants to join your network.",
                "link": f"/dashboard/business/applications/{app_id}",
            }
        )
        await db.commit()

        # SSE: push application_new to business dashboard
        try:
            from services.event_bus import event_bus
            event_bus.publish(str(biz_user_row["user_id"]), "application_new", {"app_id": str(app_id), "referrer_name": ref["full_name"]})
        except Exception:
            pass

    # Email + SMS to business
    try:
        if biz["business_email"]:
            await send_referrer_application_received(
                business_email=biz["business_email"],
                business_name=biz["business_name"],
                referrer_name=ref["full_name"] or "A referrer",
                referrer_suburb=ref["suburb"] or "your area",
                application_id=app_id,
                intro_message=data.message,
            )
        if biz["business_phone"]:
            await _send_sms(
                biz["business_phone"],
                f"📋 New referrer application from {ref['full_name']}. Review at traderefer.au/dashboard/business/applications/{app_id}"
            )
    except Exception as e:
        error_logger.warning(f"Application notification error (non-fatal): {e}")

    return {"application_id": app_id, "status": "pending"}


@router.get("/my-applications")
async def list_my_applications(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Referrer lists all their applications."""
    referrer_id = await _get_referrer_id(db, user)

    result = await db.execute(
        text("""
            SELECT ra.id, ra.status, ra.message, ra.applied_at, ra.reviewed_at,
                   b.id as business_id, b.business_name, b.slug, b.logo_url,
                   b.trade_category, b.suburb, b.referral_fee_cents
            FROM referrer_applications ra
            JOIN businesses b ON b.id = ra.business_id
            WHERE ra.referrer_id = :rid
            ORDER BY ra.applied_at DESC
        """),
        {"rid": referrer_id}
    )
    apps = []
    for row in result.mappings().all():
        apps.append({
            "id": str(row["id"]),
            "status": row["status"],
            "message": row["message"],
            "applied_at": str(row["applied_at"]),
            "reviewed_at": str(row["reviewed_at"]) if row["reviewed_at"] else None,
            "business_id": str(row["business_id"]),
            "business_name": row["business_name"],
            "business_slug": row["slug"],
            "business_logo": row["logo_url"],
            "trade_category": row["trade_category"],
            "suburb": row["suburb"],
            "referral_fee_cents": row["referral_fee_cents"] or 0,
        })
    return {"applications": apps}


@router.get("/status/{business_slug}")
async def check_application_status(
    business_slug: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Check referrer's status with a specific business (linked/pending/rejected/none)."""
    referrer_id = await _get_referrer_id(db, user)

    biz = await find_business_by_slug(db, "id", business_slug)
    if not biz:
        return {"status": "not_found"}

    business_id = biz["id"]

    # Check active link first
    link = await db.execute(
        text("SELECT link_code FROM referral_links WHERE referrer_id = :rid AND business_id = :bid"),
        {"rid": referrer_id, "bid": business_id}
    )
    link_row = link.mappings().first()
    if link_row:
        return {"status": "linked", "link_code": link_row["link_code"]}

    # Check application
    app = await db.execute(
        text("SELECT id, status FROM referrer_applications WHERE referrer_id = :rid AND business_id = :bid"),
        {"rid": referrer_id, "bid": business_id}
    )
    app_row = app.mappings().first()
    if app_row:
        return {"status": app_row["status"], "application_id": str(app_row["id"])}

    return {"status": "none"}


@router.patch("/my-profile")
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Referrer updates their public profile bio/tagline/photo."""
    referrer_id = await _get_referrer_id(db, user)
    await db.execute(
        text("""
            UPDATE referrers SET
                profile_bio = COALESCE(:bio, profile_bio),
                tagline = COALESCE(:tagline, tagline),
                profile_photo_url = COALESCE(:photo, profile_photo_url)
            WHERE id = :rid
        """),
        {"bio": data.profile_bio, "tagline": data.tagline, "photo": data.profile_photo_url, "rid": referrer_id}
    )
    await db.commit()
    return {"updated": True}


@router.get("/referrer-profile/{referrer_id}")
async def get_referrer_profile(
    referrer_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a referrer's public profile card (used by businesses reviewing applications)."""
    ref_uuid = uuid.UUID(referrer_id)
    result = await db.execute(
        text("""
            SELECT r.id, r.full_name, r.suburb, r.state, r.profile_bio, r.tagline,
                   r.profile_photo_url, r.quality_score, r.created_at,
                   COUNT(DISTINCT rl.business_id) as businesses_linked,
                   COUNT(DISTINCT CASE WHEN l.status IN ('CONFIRMED','CONFIRMED_SUCCESS') THEN l.id END) as confirmed_referrals
            FROM referrers r
            LEFT JOIN referral_links rl ON rl.referrer_id = r.id
            LEFT JOIN leads l ON l.referrer_id = r.id
            WHERE r.id = :rid
            GROUP BY r.id
        """),
        {"rid": ref_uuid}
    )
    ref = result.mappings().first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referrer not found")

    return {
        "id": str(ref["id"]),
        "full_name": ref["full_name"],
        "suburb": ref["suburb"],
        "state": ref["state"],
        "profile_bio": ref["profile_bio"],
        "tagline": ref["tagline"],
        "profile_photo_url": ref["profile_photo_url"],
        "quality_score": ref["quality_score"] or 0,
        "member_since": str(ref["created_at"])[:10] if ref["created_at"] else None,
        "businesses_linked": ref["businesses_linked"] or 0,
        "confirmed_referrals": ref["confirmed_referrals"] or 0,
    }


# ──────────────────────────────────────────────────────────────
# BUSINESS ENDPOINTS
# ──────────────────────────────────────────────────────────────

@router.get("/business/pending")
async def list_pending_applications(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Business lists all applications (pending first)."""
    business_id = await _get_business_id(db, user)

    result = await db.execute(
        text("""
            SELECT ra.id, ra.status, ra.message, ra.applied_at, ra.reminder_count,
                   r.id as referrer_id, r.full_name, r.suburb, r.state,
                   r.quality_score, r.profile_photo_url, r.tagline
            FROM referrer_applications ra
            JOIN referrers r ON r.id = ra.referrer_id
            WHERE ra.business_id = :bid
              AND r.user_id != :owner_uid
            ORDER BY
                CASE ra.status WHEN 'pending' THEN 0 ELSE 1 END,
                ra.applied_at DESC
        """),
        {"bid": business_id, "owner_uid": user.id}
    )
    apps = []
    for row in result.mappings().all():
        apps.append({
            "id": str(row["id"]),
            "status": row["status"],
            "message": row["message"],
            "applied_at": str(row["applied_at"]),
            "reminder_count": row["reminder_count"],
            "referrer_id": str(row["referrer_id"]),
            "referrer_name": row["full_name"],
            "referrer_suburb": row["suburb"],
            "referrer_state": row["state"],
            "quality_score": row["quality_score"] or 0,
            "profile_photo_url": row["profile_photo_url"],
            "tagline": row["tagline"],
        })
    pending_count = sum(1 for a in apps if a["status"] == "pending")
    rejected_count = sum(1 for a in apps if a["status"] == "rejected")
    approved_count = sum(1 for a in apps if a["status"] == "approved")
    return {"applications": apps, "pending_count": pending_count, "rejected_count": rejected_count, "approved_count": approved_count}


@router.get("/business/{application_id}")
async def get_application_detail(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Business gets full application + referrer profile."""
    business_id = await _get_business_id(db, user)
    app_uuid = uuid.UUID(application_id)

    result = await db.execute(
        text("""
            SELECT ra.id, ra.status, ra.message, ra.applied_at, ra.reminder_count,
                   r.id as referrer_id, r.full_name, r.suburb, r.state,
                   r.quality_score, r.profile_bio, r.tagline, r.profile_photo_url, r.created_at as member_since,
                   COUNT(DISTINCT rl.business_id) as businesses_linked,
                   COUNT(DISTINCT CASE WHEN l.status IN ('CONFIRMED','CONFIRMED_SUCCESS') THEN l.id END) as confirmed_referrals
            FROM referrer_applications ra
            JOIN referrers r ON r.id = ra.referrer_id
            LEFT JOIN referral_links rl ON rl.referrer_id = r.id
            LEFT JOIN leads l ON l.referrer_id = r.id
            WHERE ra.id = :aid AND ra.business_id = :bid
            GROUP BY ra.id, r.id
        """),
        {"aid": app_uuid, "bid": business_id}
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "id": str(row["id"]),
        "status": row["status"],
        "message": row["message"],
        "applied_at": str(row["applied_at"]),
        "reminder_count": row["reminder_count"],
        "referrer": {
            "id": str(row["referrer_id"]),
            "full_name": row["full_name"],
            "suburb": row["suburb"],
            "state": row["state"],
            "quality_score": row["quality_score"] or 0,
            "profile_bio": row["profile_bio"],
            "tagline": row["tagline"],
            "profile_photo_url": row["profile_photo_url"],
            "member_since": str(row["member_since"])[:10] if row["member_since"] else None,
            "businesses_linked": row["businesses_linked"] or 0,
            "confirmed_referrals": row["confirmed_referrals"] or 0,
        }
    }


@router.post("/business/{application_id}/approve")
async def approve_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Business approves a referrer application → creates referral_link."""
    business_id = await _get_business_id(db, user)
    app_uuid = uuid.UUID(application_id)

    # Get application
    app_res = await db.execute(
        text("""
            SELECT ra.referrer_id, ra.status, b.business_name, b.slug,
                   r.email, r.phone, r.full_name, r.user_id as referrer_user_id
            FROM referrer_applications ra
            JOIN businesses b ON b.id = ra.business_id
            JOIN referrers r ON r.id = ra.referrer_id
            WHERE ra.id = :aid AND ra.business_id = :bid
        """),
        {"aid": app_uuid, "bid": business_id}
    )
    app = app_res.mappings().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["status"] not in ("pending", "rejected"):
        raise HTTPException(status_code=400, detail=f"Application is already {app['status']}")

    referrer_id = app["referrer_id"]

    # Create referral link (idempotent)
    link_check = await db.execute(
        text("SELECT link_code FROM referral_links WHERE referrer_id=:rid AND business_id=:bid"),
        {"rid": referrer_id, "bid": business_id}
    )
    existing = link_check.fetchone()
    if not existing:
        import random, string
        link_code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
        await db.execute(
            text("INSERT INTO referral_links (referrer_id, business_id, link_code) VALUES (:rid, :bid, :code)"),
            {"rid": referrer_id, "bid": business_id, "code": link_code}
        )

    # Update application
    await db.execute(
        text("UPDATE referrer_applications SET status='approved', reviewed_at=now() WHERE id=:aid"),
        {"aid": app_uuid}
    )
    await db.commit()

    # In-app notification to referrer
    if app["referrer_user_id"]:
        await db.execute(
            text("""
                INSERT INTO in_app_notifications (user_id, type, title, body, link)
                VALUES (:uid, 'application_approved', :title, :body, :link)
            """),
            {
                "uid": app["referrer_user_id"],
                "title": f"🎉 Approved by {app['business_name']}!",
                "body": f"Open your command centre to copy your referral link and start sending leads.",
                "link": f"/dashboard/referrer/manage?business={app['slug']}",
            }
        )
        await db.commit()

        # SSE: push application_status to referrer dashboard
        try:
            from services.event_bus import event_bus
            event_bus.publish(str(app["referrer_user_id"]), "application_status", {"status": "approved", "business_name": app["business_name"]})
        except Exception:
            pass

    # Email + SMS
    try:
        if app["email"]:
            await send_application_approved(
                referrer_email=app["email"],
                referrer_name=app["full_name"] or "Referrer",
                business_name=app["business_name"],
                business_slug=app["slug"],
            )
        if app["phone"]:
            await _send_sms(
                app["phone"],
                f"🎉 {app['business_name']} approved your application! Open your command centre: traderefer.au/dashboard/referrer/manage?business={app['slug']}"
            )
    except Exception as e:
        error_logger.warning(f"Approval notification error (non-fatal): {e}")

    # Badge check — networker / power_networker
    if app["referrer_user_id"]:
        try:
            from services.badge_service import check_and_award_badges
            await check_and_award_badges(str(app["referrer_user_id"]), "referrer", db)
        except Exception as badge_err:
            error_logger.warning(f"Badge check after approval (non-fatal): {badge_err}")

    return {"status": "approved"}


@router.post("/business/{application_id}/reject")
async def reject_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Business rejects a referrer application."""
    business_id = await _get_business_id(db, user)
    app_uuid = uuid.UUID(application_id)

    app_res = await db.execute(
        text("""
            SELECT ra.referrer_id, ra.status, b.business_name,
                   r.email, r.phone, r.full_name, r.user_id as referrer_user_id
            FROM referrer_applications ra
            JOIN businesses b ON b.id = ra.business_id
            JOIN referrers r ON r.id = ra.referrer_id
            WHERE ra.id = :aid AND ra.business_id = :bid
        """),
        {"aid": app_uuid, "bid": business_id}
    )
    app = app_res.mappings().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Application is already {app['status']}")

    await db.execute(
        text("UPDATE referrer_applications SET status='rejected', reviewed_at=now() WHERE id=:aid"),
        {"aid": app_uuid}
    )
    await db.commit()

    # In-app notification
    if app["referrer_user_id"]:
        await db.execute(
            text("""
                INSERT INTO in_app_notifications (user_id, type, title, body, link)
                VALUES (:uid, 'application_rejected', :title, :body, :link)
            """),
            {
                "uid": app["referrer_user_id"],
                "title": f"Update on your application to {app['business_name']}",
                "body": "They've decided not to proceed at this time. Keep exploring other businesses!",
                "link": "/dashboard/referrer/businesses",
            }
        )
        await db.commit()

    try:
        if app["email"]:
            await send_application_rejected(
                referrer_email=app["email"],
                referrer_name=app["full_name"] or "Referrer",
                business_name=app["business_name"],
            )
        if app["phone"]:
            await _send_sms(
                app["phone"],
                f"Update: {app['business_name']} has decided not to proceed with your application. Keep exploring at traderefer.au/dashboard/referrer/businesses"
            )
    except Exception as e:
        error_logger.warning(f"Rejection notification error (non-fatal): {e}")

    return {"status": "rejected"}


# ──────────────────────────────────────────────────────────────
# CRON: REMINDER PROCESSING
# ──────────────────────────────────────────────────────────────

@router.post("/process-reminders")
async def process_reminders(
    x_cron_secret: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Cron endpoint: send reminder emails, auto-expire after 3 reminders."""
    expected = __import__('os').getenv("CRON_SECRET", "")
    if expected and x_cron_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    now = datetime.utcnow()

    # Fetch all pending applications
    result = await db.execute(
        text("""
            SELECT ra.id, ra.referrer_id, ra.business_id, ra.reminder_count,
                   ra.applied_at, ra.last_reminder_at,
                   b.business_name, b.business_email, b.slug,
                   r.full_name as referrer_name, r.email as referrer_email,
                   r.phone as referrer_phone, r.user_id as referrer_user_id
            FROM referrer_applications ra
            JOIN businesses b ON b.id = ra.business_id
            JOIN referrers r ON r.id = ra.referrer_id
            WHERE ra.status = 'pending'
        """)
    )
    rows = result.mappings().all()

    processed = 0
    expired = 0

    for row in rows:
        applied_at = row["applied_at"]
        if applied_at.tzinfo:
            applied_at = applied_at.replace(tzinfo=None)
        age_hours = (now - applied_at).total_seconds() / 3600
        reminder_count = row["reminder_count"]

        # Determine if reminder should fire
        thresholds = {0: 24, 1: 48, 2: 72}
        should_remind = reminder_count in thresholds and age_hours >= thresholds[reminder_count]

        if reminder_count >= 3:
            # Auto-expire
            await db.execute(
                text("UPDATE referrer_applications SET status='expired', reviewed_at=now() WHERE id=:aid"),
                {"aid": row["id"]}
            )
            await db.commit()
            # Notify referrer
            if row["referrer_user_id"]:
                await db.execute(
                    text("""
                        INSERT INTO in_app_notifications (user_id, type, title, body, link)
                        VALUES (:uid, 'application_expired', :title, :body, :link)
                    """),
                    {
                        "uid": row["referrer_user_id"],
                        "title": f"Application to {row['business_name']} expired",
                        "body": "No response after 72 hours. You can apply again or explore other businesses.",
                        "link": "/dashboard/referrer/businesses",
                    }
                )
                await db.commit()
            try:
                if row["referrer_email"]:
                    await send_application_expired(
                        referrer_email=row["referrer_email"],
                        referrer_name=row["referrer_name"] or "Referrer",
                        business_name=row["business_name"],
                    )
                if row["referrer_phone"]:
                    await _send_sms(
                        row["referrer_phone"],
                        f"Your application to {row['business_name']} has expired (no response after 72h). Explore more businesses at traderefer.au"
                    )
            except Exception as e:
                error_logger.warning(f"Expiry notification error: {e}")
            expired += 1

        elif should_remind:
            reminder_number = reminder_count + 1
            await db.execute(
                text("""
                    UPDATE referrer_applications
                    SET reminder_count = reminder_count + 1, last_reminder_at = now()
                    WHERE id = :aid
                """),
                {"aid": row["id"]}
            )
            await db.commit()
            try:
                if row["business_email"]:
                    await send_application_reminder(
                        business_email=row["business_email"],
                        business_name=row["business_name"],
                        referrer_name=row["referrer_name"],
                        application_id=str(row["id"]),
                        reminder_number=reminder_number,
                    )
            except Exception as e:
                error_logger.warning(f"Reminder email error: {e}")
            processed += 1

    return {"reminders_sent": processed, "expired": expired}
