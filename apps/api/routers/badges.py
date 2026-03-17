from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
import uuid

router = APIRouter()

# Full badge catalogue (order = display order, locked shown after earned)
BADGE_CATALOGUE = [
    {"id": "verified",        "label": "Verified Member",  "desc": "Identity confirmed on TradeRefer",   "color": "emerald"},
    {"id": "first_link",      "label": "First Link",       "desc": "Created your first referral link",    "color": "sky"},
    {"id": "lead_generator",  "label": "Lead Generator",   "desc": "1+ confirmed leads",                  "color": "blue"},
    {"id": "networker",       "label": "Networker",        "desc": "1+ active partnership",               "color": "teal"},
    {"id": "rising_star",     "label": "Rising Star",      "desc": "Quality score 60+",                   "color": "indigo"},
    {"id": "lead_champion",   "label": "Lead Champion",    "desc": "5+ confirmed leads",                  "color": "violet"},
    {"id": "power_networker", "label": "Power Networker",  "desc": "3+ active partnerships",              "color": "green"},
    {"id": "top_performer",   "label": "Top Performer",    "desc": "Quality score 80+",                   "color": "orange"},
    {"id": "elite",           "label": "Elite Referrer",   "desc": "Quality score 96+",                   "color": "amber"},
]


@router.get("/badges/mine")
async def get_my_badges(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns all earned + locked badges for the current referrer."""
    earned_res = await db.execute(text("""
        SELECT badge_id, earned_at, seen_in_app
        FROM user_badges
        WHERE user_id = :uid AND user_type = 'referrer'
        ORDER BY earned_at ASC
    """), {"uid": user.id})

    earned_map = {
        row["badge_id"]: {
            "earned_at": str(row["earned_at"]),
            "seen_in_app": row["seen_in_app"],
        }
        for row in earned_res.mappings().all()
    }

    badges = []
    for b in BADGE_CATALOGUE:
        earned_info = earned_map.get(b["id"])
        badges.append({
            **b,
            "earned": earned_info is not None,
            "earned_at": earned_info["earned_at"] if earned_info else None,
            "seen_in_app": earned_info["seen_in_app"] if earned_info else True,
        })

    new_count = sum(1 for b in badges if b["earned"] and not b["seen_in_app"])
    return {"badges": badges, "new_count": new_count}


@router.patch("/badges/seen")
async def mark_badges_seen(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Mark all unseen earned badges as seen (call after showing unlock modal)."""
    await db.execute(text("""
        UPDATE user_badges SET seen_in_app = TRUE
        WHERE user_id = :uid AND seen_in_app = FALSE
    """), {"uid": user.id})
    await db.commit()
    return {"updated": True}


@router.get("/badges/social-feed")
async def get_social_feed(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns real diverse platform events for social proof ticker."""
    events: list[dict] = []
    badge_label_map = {b["id"]: b["label"] for b in BADGE_CATALOGUE}

    # 1. Recent badge unlocks (excluding 'verified' — everyone has it)
    badge_res = await db.execute(text("""
        SELECT ub.badge_id, ub.earned_at, r.suburb, r.state
        FROM user_badges ub
        JOIN referrers r ON r.user_id = ub.user_id
        WHERE ub.user_type = 'referrer'
          AND ub.badge_id != 'verified'
          AND ub.earned_at > now() - interval '60 days'
        ORDER BY ub.earned_at DESC
        LIMIT 5
    """))
    for row in badge_res.mappings().all():
        label = badge_label_map.get(row["badge_id"], row["badge_id"])
        loc = row["suburb"] or row["state"] or "Australia"
        events.append({
            "emoji": "🎖️",
            "text": f"A referrer in {loc} just unlocked {label}!",
            "type": "badge",
            "ts": str(row["earned_at"]),
        })

    # 2. Recent referrer signups
    signup_res = await db.execute(text("""
        SELECT suburb, state, created_at
        FROM referrers
        WHERE created_at > now() - interval '14 days'
          AND suburb IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5
    """))
    for row in signup_res.mappings().all():
        loc = row["suburb"] or row["state"] or "Australia"
        events.append({
            "emoji": "🚀",
            "text": f"A new referrer just joined from {loc}!",
            "type": "signup",
            "ts": str(row["created_at"]),
        })

    # 3. Recent Prezzee rewards issued
    prezzee_res = await db.execute(text("""
        SELECT rr.reward_amount_cents, rr.issued_at, r.suburb, r.state
        FROM referral_rewards rr
        JOIN referrers r ON r.id = rr.referrer_id
        WHERE rr.status = 'issued'
          AND rr.issued_at > now() - interval '60 days'
        ORDER BY rr.issued_at DESC
        LIMIT 5
    """))
    for row in prezzee_res.mappings().all():
        loc = row["suburb"] or row["state"] or "Australia"
        amt = (row["reward_amount_cents"] or 2500) / 100
        events.append({
            "emoji": "🎁",
            "text": f"A referrer in {loc} just earned a ${amt:.0f} Prezzee gift card!",
            "type": "prezzee",
            "ts": str(row["issued_at"]),
        })

    # 4. Recent confirmed leads (anonymised)
    lead_res = await db.execute(text("""
        SELECT l.confirmed_at, r.suburb, r.state
        FROM leads l
        JOIN referrers r ON r.id = l.referrer_id
        WHERE l.status = 'CONFIRMED_SUCCESS'
          AND l.confirmed_at > now() - interval '30 days'
          AND r.suburb IS NOT NULL
        ORDER BY l.confirmed_at DESC
        LIMIT 5
    """))
    for row in lead_res.mappings().all():
        loc = row["suburb"] or row["state"] or "Australia"
        events.append({
            "emoji": "💰",
            "text": f"A referrer in {loc} just got a lead confirmed and earned!",
            "type": "lead_confirmed",
            "ts": str(row["confirmed_at"]),
        })

    # 5. Recent partnerships created
    partner_res = await db.execute(text("""
        SELECT rl.created_at, r.suburb, r.state, b.business_name
        FROM referral_links rl
        JOIN referrers r ON r.id = rl.referrer_id
        JOIN businesses b ON b.id = rl.business_id
        WHERE rl.created_at > now() - interval '14 days'
          AND r.suburb IS NOT NULL
        ORDER BY rl.created_at DESC
        LIMIT 5
    """))
    for row in partner_res.mappings().all():
        loc = row["suburb"] or row["state"] or "Australia"
        events.append({
            "emoji": "🤝",
            "text": f"A referrer in {loc} just partnered with a new business!",
            "type": "partnership",
            "ts": str(row["created_at"]),
        })

    # Sort all events by timestamp descending, take top 15
    events.sort(key=lambda e: e.get("ts", ""), reverse=True)
    events = events[:15]

    return {"events": events}
