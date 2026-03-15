"""
Badge/Achievement service.
Checks criteria and awards badges to referrers and businesses.
All checks are idempotent — safe to call multiple times.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from utils.logging_config import error_logger
import uuid

# ── Badge definitions ───────────────────────────────────────────────────────
# Each entry: (badge_id, label, desc, send_email, send_sms)
REFERRER_BADGES = [
    ("verified",        "Verified Member",  "Identity confirmed on TradeRefer",   False, False),
    ("first_link",      "First Link",       "Created your first referral link",    True,  False),
    ("rising_star",     "Rising Star",      "Quality score reached 60",            True,  False),
    ("lead_generator",  "Lead Generator",   "First confirmed lead",                True,  True),
    ("lead_champion",   "Lead Champion",    "5 confirmed leads",                   True,  True),
    ("networker",       "Networker",        "First active business partnership",   True,  False),
    ("power_networker", "Power Networker",  "3 active business partnerships",      True,  False),
    ("top_performer",   "Top Performer",    "Quality score reached 80",            True,  True),
    ("elite",           "Elite Referrer",   "Quality score reached 96",            True,  True),
]


async def check_and_award_badges(user_id: str, user_type: str, db: AsyncSession) -> list[str]:
    """
    Check all badge criteria for a user and award any newly earned badges.
    Returns list of newly awarded badge IDs.
    user_id: Clerk user_id (TEXT)
    user_type: 'referrer' or 'business'
    """
    if user_type != "referrer":
        return []

    try:
        # Fetch referrer stats in one query
        res = await db.execute(text("""
            SELECT
                r.id AS referrer_id,
                r.quality_score,
                r.user_id,
                r.full_name,
                r.email,
                r.phone,
                COUNT(DISTINCT rl.business_id) AS businesses_linked,
                COUNT(DISTINCT CASE WHEN l.status IN ('CONFIRMED', 'CONFIRMED_SUCCESS') THEN l.id END) AS confirmed_referrals,
                COUNT(DISTINCT rl2.id) AS total_links
            FROM referrers r
            LEFT JOIN referral_links rl ON rl.referrer_id = r.id
            LEFT JOIN leads l ON l.referrer_id = r.id
            LEFT JOIN referral_links rl2 ON rl2.referrer_id = r.id
            WHERE r.user_id = :uid
            GROUP BY r.id
        """), {"uid": user_id})

        ref = res.mappings().first()
        if not ref:
            return []

        referrer_id = str(ref["referrer_id"])
        score = ref["quality_score"] or 0
        businesses_linked = ref["businesses_linked"] or 0
        confirmed_referrals = ref["confirmed_referrals"] or 0
        total_links = ref["total_links"] or 0

        # Determine which badges are now earned
        earned_ids: set[str] = set()
        earned_ids.add("verified")  # always
        if total_links >= 1:
            earned_ids.add("first_link")
        if score >= 60:
            earned_ids.add("rising_star")
        if confirmed_referrals >= 1:
            earned_ids.add("lead_generator")
        if confirmed_referrals >= 5:
            earned_ids.add("lead_champion")
        if businesses_linked >= 1:
            earned_ids.add("networker")
        if businesses_linked >= 3:
            earned_ids.add("power_networker")
        if score >= 80:
            earned_ids.add("top_performer")
        if score >= 96:
            earned_ids.add("elite")

        # Fetch already-awarded badges
        existing_res = await db.execute(text("""
            SELECT badge_id FROM user_badges WHERE user_id = :uid AND user_type = 'referrer'
        """), {"uid": user_id})
        already_awarded = {row[0] for row in existing_res.fetchall()}

        # Find newly earned
        new_badges = earned_ids - already_awarded
        if not new_badges:
            return []

        badge_map = {b[0]: b for b in REFERRER_BADGES}
        newly_awarded = []

        for badge_id in new_badges:
            badge_def = badge_map.get(badge_id)
            if not badge_def:
                continue

            _, label, desc, do_email, do_sms = badge_def

            # Insert badge row
            await db.execute(text("""
                INSERT INTO user_badges (user_id, user_type, badge_id, notified_email, notified_sms)
                VALUES (:uid, 'referrer', :bid, FALSE, FALSE)
                ON CONFLICT (user_id, badge_id) DO NOTHING
            """), {"uid": user_id, "bid": badge_id})

            # In-app notification
            await db.execute(text("""
                INSERT INTO in_app_notifications (user_id, type, title, body, link)
                VALUES (:uid, 'badge_unlock', :title, :body, :link)
            """), {
                "uid": uuid.UUID(user_id),
                "title": f"🎖️ Badge Unlocked: {label}",
                "body": desc,
                "link": "/dashboard/referrer/profile",
            })

            newly_awarded.append(badge_id)

        await db.commit()

        # Fire email/SMS after commit (non-fatal)
        for badge_id in newly_awarded:
            badge_def = badge_map.get(badge_id)
            if not badge_def:
                continue
            _, label, desc, do_email, do_sms = badge_def

            # Determine next badge to unlock
            next_badge = _next_badge_for(earned_ids | {badge_id}, score, confirmed_referrals, businesses_linked)

            if do_email and ref["email"]:
                try:
                    from services.email import send_badge_unlock_email
                    await send_badge_unlock_email(
                        email=ref["email"],
                        full_name=ref["full_name"] or "Referrer",
                        badge_label=label,
                        badge_desc=desc,
                        next_badge_label=next_badge,
                    )
                    await db.execute(text("""
                        UPDATE user_badges SET notified_email = TRUE
                        WHERE user_id = :uid AND badge_id = :bid
                    """), {"uid": user_id, "bid": badge_id})
                    await db.commit()
                except Exception as e:
                    error_logger.warning(f"Badge email failed (non-fatal): {e}")

            if do_sms and ref["phone"]:
                try:
                    from services.sms import send_sms_badge_unlock
                    await send_sms_badge_unlock(ref["phone"], ref["full_name"] or "Referrer", label)
                    await db.execute(text("""
                        UPDATE user_badges SET notified_sms = TRUE
                        WHERE user_id = :uid AND badge_id = :bid
                    """), {"uid": user_id, "bid": badge_id})
                    await db.commit()
                except Exception as e:
                    error_logger.warning(f"Badge SMS failed (non-fatal): {e}")

        return newly_awarded

    except Exception as e:
        error_logger.error(f"Badge check failed for user={user_id}: {e}", exc_info=True)
        return []


def _next_badge_for(
    earned: set[str],
    score: int,
    confirmed_referrals: int,
    businesses_linked: int,
) -> str | None:
    """Returns the label of the closest next badge to unlock."""
    if "lead_generator" not in earned:
        return "Lead Generator (get your first confirmed lead)"
    if "networker" not in earned:
        return "Networker (get your first approved partnership)"
    if "rising_star" not in earned:
        return f"Rising Star (quality score {score}/60)"
    if "lead_champion" not in earned:
        needed = 5 - confirmed_referrals
        return f"Lead Champion ({needed} more confirmed lead{'s' if needed != 1 else ''})"
    if "power_networker" not in earned:
        needed = 3 - businesses_linked
        return f"Power Networker ({needed} more partnership{'s' if needed != 1 else ''})"
    if "top_performer" not in earned:
        return f"Top Performer (quality score {score}/80)"
    if "elite" not in earned:
        return f"Elite Referrer (quality score {score}/96)"
    return None
