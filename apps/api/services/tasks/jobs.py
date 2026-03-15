from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timedelta
from services.email import send_referrer_earning_available
import os
from utils.logging_config import cron_logger, error_logger
from services.sms import send_sms_business_survey_followup, send_sms_customer_survey_followup


async def send_reengagement_nudges(db: AsyncSession):
    """
    Daily cron: nudge referrers who have been inactive for 7, 14, or 30 days.
    Rules:
    - Max 1 nudge per user per 7 days (checked via engagement_nudges table)
    - 7-day lapse → email only
    - 14-day lapse → email + SMS (if phone available)
    - 30-day lapse → email only (different copy, gentler tone)
    """
    # Find referrers inactive for 7+ days (last_seen tracked via in_app_notifications read activity
    # or we fall back to created_at of most recent notification)
    res = await db.execute(text("""
        SELECT
            r.user_id,
            r.full_name,
            r.email,
            r.phone,
            r.quality_score,
            r.businesses_linked,
            COUNT(DISTINCT CASE WHEN l.status IN ('CONFIRMED','CONFIRMED_SUCCESS') THEN l.id END) AS confirmed_referrals,
            COUNT(DISTINCT rl.id) AS total_links,
            COALESCE(
                (SELECT MAX(n.created_at) FROM in_app_notifications n WHERE n.user_id = r.user_id::uuid),
                r.created_at
            ) AS last_active_at
        FROM referrers r
        LEFT JOIN referral_links rl ON rl.referrer_id = r.id
        LEFT JOIN leads l ON l.referrer_id = r.id
        WHERE r.email IS NOT NULL
          AND COALESCE(r.accountability_stage, 'none') NOT IN ('paused', 'banned')
        GROUP BY r.user_id, r.full_name, r.email, r.phone, r.quality_score, r.businesses_linked, r.created_at
        HAVING COALESCE(
            (SELECT MAX(n.created_at) FROM in_app_notifications n WHERE n.user_id = r.user_id::uuid),
            r.created_at
        ) < now() - interval '7 days'
    """))
    referrers = res.mappings().all()

    sent_count = 0
    for ref in referrers:
        user_id = ref["user_id"]
        if not user_id or not ref["email"]:
            continue

        # Check if already nudged in the last 7 days
        recent = await db.execute(text("""
            SELECT id FROM engagement_nudges
            WHERE user_id = :uid AND sent_at > now() - interval '7 days'
            LIMIT 1
        """), {"uid": str(user_id)})
        if recent.fetchone():
            continue

        # Calculate days inactive
        last_active = ref["last_active_at"]
        days_inactive = (datetime.utcnow() - last_active.replace(tzinfo=None)).days if last_active else 999

        # Determine next badge for personalised copy
        score = ref["quality_score"] or 0
        confirmed = ref["confirmed_referrals"] or 0
        linked = ref["businesses_linked"] or 0
        total_links = ref["total_links"] or 0

        earned: set[str] = {"verified"}
        if total_links >= 1: earned.add("first_link")
        if score >= 60: earned.add("rising_star")
        if confirmed >= 1: earned.add("lead_generator")
        if confirmed >= 5: earned.add("lead_champion")
        if linked >= 1: earned.add("networker")
        if linked >= 3: earned.add("power_networker")
        if score >= 80: earned.add("top_performer")
        if score >= 96: earned.add("elite")

        from services.badge_service import _next_badge_for
        next_badge = _next_badge_for(earned, score, confirmed, linked)

        # Send email
        try:
            from services.email import send_reengagement_email
            await send_reengagement_email(
                email=ref["email"],
                full_name=ref["full_name"] or "Referrer",
                next_badge_label=next_badge,
                days_inactive=days_inactive,
            )
            await db.execute(text("""
                INSERT INTO engagement_nudges (user_id, user_type, channel, nudge_type)
                VALUES (:uid, 'referrer', 'email', 'reengagement')
            """), {"uid": str(user_id)})
            await db.commit()
            sent_count += 1
        except Exception as e:
            error_logger.warning(f"Re-engagement email failed for {user_id}: {e}")

        # SMS: only for 14+ day lapse, only if phone available
        if days_inactive >= 14 and ref["phone"]:
            try:
                from services.sms import send_sms_reengagement
                await send_sms_reengagement(ref["phone"], ref["full_name"] or "Referrer", next_badge)
                await db.execute(text("""
                    INSERT INTO engagement_nudges (user_id, user_type, channel, nudge_type)
                    VALUES (:uid, 'referrer', 'sms', 'reengagement')
                """), {"uid": str(user_id)})
                await db.commit()
            except Exception as e:
                error_logger.warning(f"Re-engagement SMS failed for {user_id}: {e}")

    if sent_count:
        cron_logger.info(f"Sent {sent_count} re-engagement nudges")
    return sent_count

async def expire_pending_leads(db: AsyncSession):
    """
    Finds leads in PENDING state that have passed their expires_at time
    and moves them to EXPIRED.
    """
    query = text("""
        UPDATE leads 
        SET status = 'EXPIRED', updated_at = now()
        WHERE status = 'PENDING' AND expires_at < now()
        RETURNING id, business_id, consumer_phone
    """)
    result = await db.execute(query)
    expired_leads = result.mappings().all()
    
    if expired_leads:
        cron_logger.info(f"Expired {len(expired_leads)} pending leads")
        
    return len(expired_leads)

async def expire_unlocked_leads(db: AsyncSession):
    """
    Finds leads in UNLOCKED state that have been unlocked for more than 72 hours
    without being moved to ON_THE_WAY or CONFIRMED, and moves them to EXPIRED.
    This ensures businesses don't sit on leads forever.
    """
    query = text("""
        UPDATE leads 
        SET status = 'EXPIRED', updated_at = now()
        WHERE status = 'UNLOCKED' 
          AND unlocked_at < (now() - interval '72 hours')
        RETURNING id, business_id
    """)
    result = await db.execute(query)
    expired_unlocked = result.mappings().all()
    
    if expired_unlocked:
        cron_logger.info(f"Expired {len(expired_unlocked)} unlocked leads (72h limit)")
        
    return len(expired_unlocked)

async def release_pending_earnings(db: AsyncSession):
    """
    Finds referrer_earnings in PENDING state that have passed their available_at time
    and moves them to AVAILABLE.
    """
    # 1. Update earning status
    query = text("""
        UPDATE referrer_earnings 
        SET status = 'AVAILABLE', updated_at = now()
        WHERE status = 'PENDING' AND available_at < now()
        RETURNING id, referrer_id, gross_cents
    """)
    result = await db.execute(query)
    released_earnings = result.mappings().all()
    
    if released_earnings:
        cron_logger.info(f"Released {len(released_earnings)} pending earnings")
        
        # 2. Update referrer wallet balances and send emails
        for earning in released_earnings:
            await db.execute(text("""
                UPDATE referrers 
                SET wallet_balance_cents = wallet_balance_cents + :amount,
                    pending_cents = pending_cents - :amount
                WHERE id = :rid
            """), {
                "amount": earning["gross_cents"],
                "rid": earning["referrer_id"]
            })

            # Email referrer that their earning is now available
            try:
                ref_info = await db.execute(text("""
                    SELECT r.email, r.full_name, b.business_name
                    FROM referrer_earnings re
                    JOIN referrers r ON r.id = re.referrer_id
                    LEFT JOIN leads l ON l.id = re.lead_id
                    LEFT JOIN businesses b ON b.id = l.business_id
                    WHERE re.id = :eid
                """), {"eid": earning["id"]})
                ref_row = ref_info.mappings().first()
                if ref_row and ref_row["email"]:
                    await send_referrer_earning_available(
                        email=ref_row["email"],
                        full_name=ref_row["full_name"] or ref_row["email"],
                        amount_dollars=earning["gross_cents"] / 100,
                        business_name=ref_row["business_name"] or "TradeRefer",
                    )
            except Exception as e:
                error_logger.warning(f"Cron earning email error (non-fatal): {e}")
            
    return len(released_earnings)

async def cleanup_expired_pins(db: AsyncSession):
    """
    Moves leads from ON_THE_WAY to UNCONFIRMED if the PIN has expired.
    """
    query = text("""
        UPDATE leads 
        SET status = 'UNCONFIRMED', updated_at = now()
        WHERE status = 'ON_THE_WAY' AND pin_expires_at < now()
        RETURNING id
    """)
    result = await db.execute(query)
    expired_pins = result.mappings().all()
    
    if expired_pins:
        cron_logger.info(f"Moved {len(expired_pins)} leads to UNCONFIRMED due to expired PINs")
        
    return len(expired_pins)


async def send_d7_survey_followups(db: AsyncSession):
    """
    Sends D7 follow-up surveys to business + customer for leads where:
    - status = PAYMENT_PENDING_CONFIRMATION
    - surveys_sent_at is between 7 and 8 days ago (D7 window)
    - No round-1 survey record exists yet
    """
    res = await db.execute(text("""
        SELECT l.id, l.consumer_suburb, l.job_description,
               l.consumer_name, l.consumer_phone,
               b.business_phone, b.business_name
        FROM leads l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.status = 'PAYMENT_PENDING_CONFIRMATION'
          AND l.surveys_sent_at < (now() - interval '7 days')
          AND l.surveys_sent_at > (now() - interval '8 days')
          AND NOT EXISTS (
              SELECT 1 FROM lead_surveys ls
              WHERE ls.lead_id = l.id AND ls.survey_round = 1
          )
    """))
    leads = res.mappings().all()

    for lead in leads:
        lead_id = str(lead["id"])
        suburb = lead["consumer_suburb"] or "your area"

        for respondent_type in ("business", "customer"):
            await db.execute(text("""
                INSERT INTO lead_surveys (lead_id, respondent_type, survey_round, sent_at)
                VALUES (:lid, :rtype, 1, now())
            """), {"lid": lead_id, "rtype": respondent_type})

        if lead["business_phone"]:
            await send_sms_business_survey_followup(lead["business_phone"], suburb, 1)
        if lead["consumer_phone"]:
            await send_sms_customer_survey_followup(
                lead["consumer_phone"],
                lead["consumer_name"] or "there",
                lead["business_name"] or "the business",
                1
            )

    await db.commit()
    if leads:
        cron_logger.info(f"Sent D7 survey follow-ups to {len(leads)} leads")
    return len(leads)


async def send_d14_survey_followups(db: AsyncSession):
    """
    Sends D14 follow-up surveys. Last chance before auto-UNCONFIRMED.
    """
    res = await db.execute(text("""
        SELECT l.id, l.consumer_suburb, l.job_description,
               l.consumer_name, l.consumer_phone,
               b.business_phone, b.business_name
        FROM leads l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.status = 'PAYMENT_PENDING_CONFIRMATION'
          AND l.surveys_sent_at < (now() - interval '14 days')
          AND l.surveys_sent_at > (now() - interval '15 days')
          AND NOT EXISTS (
              SELECT 1 FROM lead_surveys ls
              WHERE ls.lead_id = l.id AND ls.survey_round = 2
          )
    """))
    leads = res.mappings().all()

    for lead in leads:
        lead_id = str(lead["id"])
        suburb = lead["consumer_suburb"] or "your area"

        for respondent_type in ("business", "customer"):
            await db.execute(text("""
                INSERT INTO lead_surveys (lead_id, respondent_type, survey_round, sent_at)
                VALUES (:lid, :rtype, 2, now())
            """), {"lid": lead_id, "rtype": respondent_type})

        if lead["business_phone"]:
            await send_sms_business_survey_followup(lead["business_phone"], suburb, 2)
        if lead["consumer_phone"]:
            await send_sms_customer_survey_followup(
                lead["consumer_phone"],
                lead["consumer_name"] or "there",
                lead["business_name"] or "the business",
                2
            )

    await db.commit()
    if leads:
        cron_logger.info(f"Sent D14 survey follow-ups to {len(leads)} leads")
    return len(leads)


async def close_unconfirmed_leads(db: AsyncSession):
    """
    After D14 with no dual YES: move to UNCONFIRMED and refund business wallet.
    """
    res = await db.execute(text("""
        SELECT l.id
        FROM leads l
        WHERE l.status = 'PAYMENT_PENDING_CONFIRMATION'
          AND l.surveys_sent_at < (now() - interval '15 days')
    """))
    leads = res.mappings().all()

    count = 0
    for lead in leads:
        try:
            from services.survey_service import trigger_unconfirmed
            await trigger_unconfirmed(str(lead["id"]), db)
            count += 1
        except Exception as e:
            error_logger.error(f"Error closing unconfirmed lead {lead['id']}: {e}")

    if count:
        cron_logger.info(f"Closed {count} unconfirmed leads (D14+) and refunded wallets")
    return count


async def auto_pass_stalled_screening(db: AsyncSession):
    """
    Auto-PASS leads stuck in SCREENING for > 24 hours (consumer didn't reply).
    Prevents good leads from stalling.
    """
    res = await db.execute(text("""
        SELECT l.id, l.referrer_id,
               b.business_name, b.business_email, b.business_phone, b.is_claimed, b.slug,
               l.consumer_name, l.consumer_suburb, l.job_description, l.unlock_fee_cents
        FROM leads l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.status = 'SCREENING'
          AND l.created_at < (now() - interval '24 hours')
    """))
    leads = res.mappings().all()

    for lead in leads:
        lead_id = str(lead["id"])
        await db.execute(text("""
            UPDATE leads SET screening_status = 'SKIPPED', status = 'READY_FOR_BUSINESS'
            WHERE id = :id
        """), {"id": lead_id})

        if lead["is_claimed"]:
            try:
                from services.email import send_business_new_lead
                from services.sms import send_sms_claimed_new_lead
                if lead["business_email"]:
                    await send_business_new_lead(
                        email=lead["business_email"],
                        business_name=lead["business_name"],
                        consumer_name=lead["consumer_name"],
                        suburb=lead["consumer_suburb"],
                        job_description=lead["job_description"],
                        lead_id=lead_id,
                        unlock_fee_dollars=(lead["unlock_fee_cents"] or 0) / 100,
                        is_first_lead=False,
                    )
                if lead["business_phone"]:
                    await send_sms_claimed_new_lead(
                        phone=lead["business_phone"],
                        business_name=lead["business_name"],
                        suburb=lead["consumer_suburb"],
                    )
            except Exception as e:
                error_logger.warning(f"Auto-pass notify error for lead {lead_id}: {e}")

    await db.commit()
    if leads:
        cron_logger.info(f"Auto-passed {len(leads)} stalled screening leads (24h timeout)")
    return len(leads)
