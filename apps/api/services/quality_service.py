"""
Referrer quality score calculation and progressive accountability.
Called after every screening result, OTP verification, and survey outcome.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from utils.logging_config import lead_logger, error_logger
from services.sms import (
    send_sms_referrer_advisory, send_sms_referrer_warning, send_sms_referrer_paused
)


async def update_referrer_quality_score(referrer_id: str, db: AsyncSession) -> int:
    """
    Recalculate quality_score from last 20 classified leads for this referrer.
    Weighted: OTP verified 30%, screening pass 25%, survey valid 25%, low dispute 20%.
    Returns the new score.
    """
    try:
        # Count relevant lead outcomes (last 20 with any classification)
        res = await db.execute(text("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE screening_status = 'PASS') AS screening_pass,
                COUNT(*) FILTER (WHERE status IN ('MEETING_VERIFIED','VALID_LEAD','PAYMENT_PENDING_CONFIRMATION','CONFIRMED_SUCCESS')) AS otp_verified,
                COUNT(*) FILTER (WHERE status = 'CONFIRMED_SUCCESS') AS confirmed,
                COUNT(*) FILTER (WHERE status IN ('DECLINED','UNCONFIRMED')) AS declined,
                COUNT(*) FILTER (WHERE status = 'DISPUTED') AS disputed
            FROM leads
            WHERE referrer_id = :rid
              AND status NOT IN ('NEW','SCREENING','READY_FOR_BUSINESS','PENDING')
            ORDER BY created_at DESC
            LIMIT 20
        """), {"rid": referrer_id})
        row = res.mappings().first()

        if not row or (row["total"] or 0) == 0:
            return 100

        total = row["total"]
        screening_rate = (row["screening_pass"] or 0) / total * 100
        otp_rate = (row["otp_verified"] or 0) / total * 100
        valid_rate = (row["confirmed"] or 0) / max(row["otp_verified"] or 1, 1) * 100
        dispute_rate = (row["disputed"] or 0) / total * 100
        low_dispute_score = max(0, 100 - dispute_rate * 5)

        score = int(
            screening_rate * 0.25 +
            otp_rate * 0.30 +
            valid_rate * 0.25 +
            low_dispute_score * 0.20
        )
        score = max(0, min(100, score))

        await db.execute(text("""
            UPDATE referrers SET quality_score = :score WHERE id = :rid
        """), {"score": score, "rid": referrer_id})
        await db.commit()

        lead_logger.info(f"Quality score updated | referrer={referrer_id} | score={score}")

        # Check accountability thresholds
        await check_and_apply_accountability(referrer_id, score, total, db)

        # Check badge unlocks for quality score milestones
        try:
            uid_res = await db.execute(text("SELECT user_id FROM referrers WHERE id = :rid"), {"rid": referrer_id})
            uid_row = uid_res.mappings().first()
            if uid_row and uid_row["user_id"]:
                from services.badge_service import check_and_award_badges
                await check_and_award_badges(str(uid_row["user_id"]), "referrer", db)
        except Exception as badge_err:
            error_logger.warning(f"Badge check after quality score update (non-fatal): {badge_err}")

        return score

    except Exception as e:
        error_logger.error(f"Quality score update failed for {referrer_id}: {e}", exc_info=True)
        return 0


async def check_and_apply_accountability(
    referrer_id: str, score: int, total_leads: int, db: AsyncSession
):
    """
    Escalate accountability stage if thresholds breached.
    Never auto-de-escalates.
    """
    try:
        ref_res = await db.execute(text("""
            SELECT accountability_stage, phone, full_name FROM referrers WHERE id = :rid
        """), {"rid": referrer_id})
        ref = ref_res.mappings().first()
        if not ref:
            return

        current_stage = ref["accountability_stage"] or "none"
        phone = ref["phone"] or ""
        name = ref["full_name"] or "Referrer"

        new_stage = current_stage

        # Only escalate, never downgrade automatically
        if score < 50 and total_leads >= 15 and current_stage not in ("paused", "review"):
            new_stage = "paused"
        elif score < 60 and total_leads >= 10 and current_stage not in ("warning", "paused", "review"):
            new_stage = "warning"
        elif score < 70 and total_leads >= 5 and current_stage == "none":
            new_stage = "advisory"

        if new_stage != current_stage:
            await db.execute(text("""
                UPDATE referrers
                SET accountability_stage = :stage, accountability_updated_at = now()
                WHERE id = :rid
            """), {"stage": new_stage, "rid": referrer_id})
            await db.commit()

            lead_logger.info(f"Accountability escalated | referrer={referrer_id} | {current_stage} → {new_stage}")

            if phone:
                if new_stage == "advisory":
                    await send_sms_referrer_advisory(phone, name, score)
                elif new_stage == "warning":
                    await send_sms_referrer_warning(phone, name, score)
                elif new_stage == "paused":
                    await send_sms_referrer_paused(phone, name)

    except Exception as e:
        error_logger.error(f"Accountability check failed for {referrer_id}: {e}", exc_info=True)
