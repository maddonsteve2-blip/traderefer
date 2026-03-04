"""
Survey service: send post-meeting surveys, evaluate dual-YES outcome,
trigger Prezzee gift card or wallet refund.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from utils.logging_config import payment_logger, error_logger
from services.sms import (
    send_sms_business_survey, send_sms_customer_survey,
    send_sms_referrer_prezzee_issued, send_sms_referrer_reward_accumulating,
    send_sms_business_lead_refunded,
)


# ── Send surveys after MEETING_VERIFIED ────────────────────────────────────

async def send_post_meeting_surveys(lead_id: str, db: AsyncSession):
    """Send D0 surveys to both business and consumer after PIN confirmation."""
    lead = await _get_lead_full(lead_id, db)
    if not lead:
        return

    biz_phone = lead["business_phone"]
    consumer_phone = lead["consumer_phone"]
    suburb = lead["consumer_suburb"] or "your area"
    job_type = _short_job_type(lead["job_description"])
    consumer_name = lead["consumer_name"] or "there"
    business_name = lead["business_name"] or "the business"

    # Create survey records
    for respondent_type in ("business", "customer"):
        await db.execute(text("""
            INSERT INTO lead_surveys (lead_id, respondent_type, survey_round, sent_at)
            VALUES (:lid, :rtype, 0, now())
        """), {"lid": lead_id, "rtype": respondent_type})

    await db.execute(text("""
        UPDATE leads SET surveys_sent_at = now(), status = 'PAYMENT_PENDING_CONFIRMATION'
        WHERE id = :id
    """), {"id": lead_id})
    await db.commit()

    if biz_phone:
        await send_sms_business_survey(biz_phone, suburb, job_type)
    if consumer_phone:
        await send_sms_customer_survey(consumer_phone, consumer_name, business_name, job_type)


# ── Evaluate outcome after each survey reply ────────────────────────────────

async def evaluate_payment_outcome(lead_id: str, db: AsyncSession):
    """
    Called after every survey response. Checks if dual YES has been reached,
    or if any definitive NO has been received.
    """
    lead = await db.execute(text("""
        SELECT id, business_survey_outcome, customer_survey_outcome,
               status, unlock_fee_cents, referrer_id, referrer_payout_amount_cents,
               business_id
        FROM leads WHERE id = :id
    """), {"id": lead_id})
    row = lead.mappings().first()
    if not row or row["status"] not in ("PAYMENT_PENDING_CONFIRMATION", "VALID_LEAD"):
        return

    biz = row["business_survey_outcome"]
    cust = row["customer_survey_outcome"]

    if biz == "won" and cust == "hired":
        await trigger_confirmed_success(lead_id, db)
    elif biz == "not_won" or cust in ("not_hired", "no_longer_needed"):
        await trigger_declined(lead_id, db, reason="Survey: not won / customer did not hire")
    elif biz == "won" and cust == "not_hired":
        # Conflict — mark DISPUTED for manual review
        await db.execute(text("""
            UPDATE leads SET status = 'DISPUTED', surveys_closed_at = now() WHERE id = :id
        """), {"id": lead_id})
        await db.commit()
        payment_logger.info(f"Lead {lead_id} → DISPUTED (business won, customer did not hire)")


# ── Confirmed success: Prezzee 80%, TradeRefer 20% ──────────────────────────

async def trigger_confirmed_success(lead_id: str, db: AsyncSession):
    lead_res = await db.execute(text("""
        SELECT l.id, l.unlock_fee_cents, l.referrer_id, l.referrer_payout_amount_cents,
               l.business_id, l.referral_link_id, l.status,
               r.phone AS ref_phone, r.full_name AS ref_name, r.email AS ref_email,
               r.wallet_balance_cents AS ref_wallet,
               b.business_name, b.business_phone
        FROM leads l
        LEFT JOIN referrers r ON r.id = l.referrer_id
        LEFT JOIN businesses b ON b.id = l.business_id
        WHERE l.id = :id
    """), {"id": lead_id})
    lead = lead_res.mappings().first()

    if not lead or lead["status"] == "CONFIRMED_SUCCESS":
        return

    unlock_fee = lead["unlock_fee_cents"] or 0
    payout = lead["referrer_payout_amount_cents"] or int(unlock_fee * 0.8)
    platform_cut = unlock_fee - payout

    # 1. Update lead status
    await db.execute(text("""
        UPDATE leads SET status = 'CONFIRMED_SUCCESS', confirmed_at = now(), surveys_closed_at = now()
        WHERE id = :id
    """), {"id": lead_id})

    # 2. Update business total_leads_unlocked
    await db.execute(text("""
        UPDATE businesses SET total_leads_unlocked = total_leads_unlocked + 1 WHERE id = :bid
    """), {"bid": lead["business_id"]})

    # 3. Log wallet transaction for platform revenue
    await db.execute(text("""
        INSERT INTO wallet_transactions (business_id, amount_cents, type, lead_id, notes, balance_after_cents)
        VALUES (:bid, :cut, 'PLATFORM_FEE', :lid, 'TradeRefer 20% platform fee', 0)
    """), {"bid": lead["business_id"], "cut": platform_cut, "lid": lead_id})

    # 4. Credit referrer wallet + earnings record
    if lead["referrer_id"]:
        # Update existing PENDING record (created at unlock time) → PREZZEE_PAID to prevent
        # release_pending_earnings from double-paying after 30 days.
        updated = await db.execute(text("""
            UPDATE referrer_earnings
            SET status = 'PREZZEE_PAID', platform_cut_cents = :cut
            WHERE lead_id = :lid AND referrer_id = :rid AND status = 'PENDING'
        """), {
            "rid": lead["referrer_id"], "lid": lead_id, "cut": platform_cut,
        })
        # Fallback: insert if no PENDING record exists (e.g. first lead was free)
        if updated.rowcount == 0:
            await db.execute(text("""
                INSERT INTO referrer_earnings (referrer_id, lead_id, gross_cents, platform_cut_cents, status, available_at)
                VALUES (:rid, :lid, :gross, :cut, 'PREZZEE_PAID', now())
                ON CONFLICT DO NOTHING
            """), {
                "rid": lead["referrer_id"], "lid": lead_id,
                "gross": payout, "cut": platform_cut,
            })

        new_wallet = (lead["ref_wallet"] or 0) + payout
        await db.execute(text("""
            UPDATE referrers
            SET wallet_balance_cents = wallet_balance_cents + :amt,
                total_earned_cents = total_earned_cents + :amt,
                total_leads_unlocked = total_leads_unlocked + 1
            WHERE id = :rid
        """), {"amt": payout, "rid": lead["referrer_id"]})

        if lead["referral_link_id"]:
            await db.execute(text("""
                UPDATE referral_links
                SET leads_unlocked = leads_unlocked + 1,
                    total_earned_cents = total_earned_cents + :amt
                WHERE id = :link_id
            """), {"amt": payout, "link_id": lead["referral_link_id"]})

    await db.commit()

    payment_logger.info(
        f"CONFIRMED_SUCCESS | lead={lead_id} | unlock=${unlock_fee/100:.2f} | "
        f"referrer=${payout/100:.2f} | platform=${platform_cut/100:.2f}"
    )

    # 5. Issue Prezzee gift card (or accumulate if < $5)
    if lead["referrer_id"] and payout > 0:
        await _issue_prezzee_or_accumulate(
            lead_id=lead_id,
            referrer_id=str(lead["referrer_id"]),
            payout_cents=payout,
            ref_name=lead["ref_name"] or "Referrer",
            ref_email=lead["ref_email"] or "",
            ref_phone=lead["ref_phone"] or "",
            db=db,
        )


async def _issue_prezzee_or_accumulate(
    lead_id: str, referrer_id: str, payout_cents: int,
    ref_name: str, ref_email: str, ref_phone: str, db: AsyncSession
):
    """Issue Prezzee gift card if balance >= $5, otherwise accumulate."""
    # Re-read current wallet balance
    bal_res = await db.execute(
        text("SELECT wallet_balance_cents FROM referrers WHERE id = :rid"),
        {"rid": referrer_id}
    )
    current_balance = bal_res.scalar() or 0

    if current_balance < 500:  # < $5 minimum
        if ref_phone:
            await send_sms_referrer_reward_accumulating(ref_phone, ref_name, current_balance / 100)
        return

    # Issue Prezzee
    try:
        from services.prezzee_service import create_gift_card, get_order_by_reference
        amount_dollars = current_balance / 100
        reference = f"tr-{lead_id}"

        order = await create_gift_card(
            reference=reference,
            amount_dollars=amount_dollars,
            recipient_name=ref_name,
            recipient_email=ref_email,
        )

        order_uuid = order.get("uuid") or order.get("id") or ""

        # Log payout
        await db.execute(text("""
            INSERT INTO payout_requests
                (referrer_id, amount_cents, status, method, prezzee_order_uuid, destination_email, created_at)
            VALUES (:rid, :amt, 'completed', 'PREZZEE_SWAP', :uuid, :email, now())
        """), {
            "rid": referrer_id, "amt": current_balance,
            "uuid": order_uuid, "email": ref_email,
        })

        # Zero out referrer wallet
        await db.execute(text("""
            UPDATE referrers SET wallet_balance_cents = 0 WHERE id = :rid
        """), {"rid": referrer_id})
        await db.commit()

        if ref_phone:
            await send_sms_referrer_prezzee_issued(ref_phone, ref_name, amount_dollars, ref_email)

        payment_logger.info(f"Prezzee issued | referrer={referrer_id} | ${amount_dollars:.2f} | uuid={order_uuid}")

    except Exception as e:
        error_logger.error(f"Prezzee issuance failed for referrer {referrer_id}: {e}", exc_info=True)
        # Don't block — earnings already in wallet, will retry on next confirmed lead


# ── Declined / Unconfirmed: refund to business wallet ───────────────────────

async def trigger_declined(lead_id: str, db: AsyncSession, reason: str = "Lead declined"):
    lead_res = await db.execute(text("""
        SELECT l.id, l.status, l.unlock_fee_cents, l.business_id, l.referrer_id,
               b.business_phone, b.business_name, b.wallet_balance_cents AS biz_wallet
        FROM leads l
        LEFT JOIN businesses b ON b.id = l.business_id
        WHERE l.id = :id
    """), {"id": lead_id})
    lead = lead_res.mappings().first()

    if not lead or lead["status"] in ("CONFIRMED_SUCCESS", "DECLINED", "UNCONFIRMED"):
        return

    unlock_fee = lead["unlock_fee_cents"] or 0
    new_biz_wallet = (lead["biz_wallet"] or 0) + unlock_fee
    new_status = "DECLINED"

    # 1. Refund to business wallet
    await db.execute(text("""
        UPDATE businesses SET wallet_balance_cents = :bal WHERE id = :bid
    """), {"bal": new_biz_wallet, "bid": lead["business_id"]})

    # 2. Log refund transaction
    await db.execute(text("""
        INSERT INTO wallet_transactions
            (business_id, amount_cents, type, lead_id, notes, balance_after_cents)
        VALUES (:bid, :amt, 'LEAD_REFUND', :lid, :reason, :bal)
    """), {
        "bid": lead["business_id"], "amt": unlock_fee, "lid": lead_id,
        "reason": reason, "bal": new_biz_wallet,
    })

    # 3. Update lead
    await db.execute(text("""
        UPDATE leads
        SET status = :status, refund_issued_at = now(), refund_reason = :reason,
            surveys_closed_at = now()
        WHERE id = :id
    """), {"status": new_status, "reason": reason, "id": lead_id})

    # 4. Reverse any referrer_earnings that were created
    if lead["referrer_id"]:
        await db.execute(text("""
            UPDATE referrer_earnings SET status = 'REVERSED'
            WHERE lead_id = :lid AND referrer_id = :rid AND status IN ('PENDING', 'AVAILABLE')
        """), {"lid": lead_id, "rid": lead["referrer_id"]})

        await db.execute(text("""
            UPDATE referrers
            SET wallet_balance_cents = GREATEST(0, wallet_balance_cents - (
                SELECT COALESCE(SUM(gross_cents), 0) FROM referrer_earnings
                WHERE lead_id = :lid AND referrer_id = :rid AND status = 'REVERSED'
            ))
            WHERE id = :rid
        """), {"lid": lead_id, "rid": lead["referrer_id"]})

    await db.commit()

    # 5. Notify business
    if lead["business_phone"]:
        await send_sms_business_lead_refunded(
            lead["business_phone"],
            lead["business_name"] or "there",
            unlock_fee / 100,
            reason,
        )

    payment_logger.info(f"Lead {lead_id} → {new_status} | refunded ${unlock_fee/100:.2f} to business wallet")


async def trigger_unconfirmed(lead_id: str, db: AsyncSession):
    await trigger_declined(lead_id, db, reason="No confirmation received after 14 days")
    # Update status to UNCONFIRMED instead of DECLINED
    await db.execute(text("UPDATE leads SET status = 'UNCONFIRMED' WHERE id = :id"), {"id": lead_id})
    await db.commit()


# ── Helpers ─────────────────────────────────────────────────────────────────

async def _get_lead_full(lead_id: str, db: AsyncSession):
    res = await db.execute(text("""
        SELECT l.id, l.consumer_name, l.consumer_phone, l.consumer_email,
               l.consumer_suburb, l.job_description, l.status,
               l.unlock_fee_cents, l.referrer_id, l.referrer_payout_amount_cents,
               l.business_id, l.referral_link_id,
               b.business_name, b.business_phone, b.business_email
        FROM leads l
        LEFT JOIN businesses b ON b.id = l.business_id
        WHERE l.id = :id
    """), {"id": lead_id})
    return res.mappings().first()


def _short_job_type(job_description: str) -> str:
    if not job_description:
        return "trade job"
    words = job_description.split()
    return " ".join(words[:6]) + ("..." if len(words) > 6 else "")
