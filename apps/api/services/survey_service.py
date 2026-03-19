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
    send_sms_referrer_reward_claimable, send_sms_business_lead_refunded,
    send_sms_referrer_declaration_needed,
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

    # SSE: push earning_update to referrer dashboard
    if lead["referrer_id"]:
        try:
            uid_res = await db.execute(text("SELECT user_id FROM referrers WHERE id = :rid"), {"rid": lead["referrer_id"]})
            uid_row = uid_res.mappings().first()
            if uid_row and uid_row["user_id"]:
                from services.event_bus import event_bus
                event_bus.publish(str(uid_row["user_id"]), "earning_update", {"lead_id": lead_id, "amount_cents": payout})
        except Exception:
            pass

    # Badge check — lead_generator, lead_champion
    if lead["referrer_id"]:
        try:
            uid_res2 = await db.execute(text("SELECT user_id FROM referrers WHERE id = :rid"), {"rid": lead["referrer_id"]})
            uid_row2 = uid_res2.mappings().first()
            if uid_row2 and uid_row2["user_id"]:
                from services.badge_service import check_and_award_badges
                await check_and_award_badges(str(uid_row2["user_id"]), "referrer", db)
        except Exception as badge_err:
            from utils.logging_config import error_logger
            error_logger.warning(f"Badge check after confirmed_success (non-fatal): {badge_err}")

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
    """
    Smart payout logic after each confirmed lead:

    - Balance < $25      → Accumulate silently (no notification sent yet)
    - Balance $25–$74.98 → Send SMS + Email: "You have $XX claimable — log in to claim"
    - Balance >= $74.99  → Auto-issue Prezzee gift card, notify via SMS + Email

    ATO compliance: auto-payout capped at $74.99 to stay under the $75 no-ABN
    threshold (Section 12-190, Taxation Administration Act 1953). Referrers with
    an ABN or a completed Supplier Statement can claim up to $300 per transaction.
    """
    # Re-read current wallet balance AFTER this lead's payout was added
    bal_res = await db.execute(
        text("SELECT wallet_balance_cents FROM referrers WHERE id = :rid"),
        {"rid": referrer_id}
    )
    current_balance = bal_res.scalar() or 0

    MINIMUM_CLAIM_CENTS = 2500   # $25.00 — minimum to claim manually
    AUTO_PAYOUT_CENTS   = 7499   # $74.99 — ATO compliance: stay under $75 no-ABN threshold

    # ── CASE 1: Balance too low to even notify ──────────────────────────────
    if current_balance < MINIMUM_CLAIM_CENTS:
        payment_logger.info(
            f"Referrer {referrer_id}: balance ${current_balance/100:.2f} below $25 minimum — accumulating silently"
        )
        return

    # ── CASE 2: Balance >= $74.99 → Auto-payout ─────────────────────────────
    if current_balance >= AUTO_PAYOUT_CENTS:
        # Check ATO compliance: if balance > $75 and referrer lacks ABN/declaration, hold and notify
        ATO_THRESHOLD_CENTS = 7500  # $75.00
        if current_balance > ATO_THRESHOLD_CENTS:
            comp_res = await db.execute(
                text("SELECT abn, supplier_statement_declared_at FROM referrers WHERE id = :rid"),
                {"rid": referrer_id}
            )
            comp = comp_res.mappings().first()
            if comp and not comp["abn"] and not comp["supplier_statement_declared_at"]:
                # Not compliant — hold funds, notify referrer to complete declaration
                payment_logger.info(
                    f"Referrer {referrer_id}: balance ${current_balance/100:.2f} exceeds $75 but no ABN/declaration — holding for compliance"
                )
                if ref_phone:
                    await send_sms_referrer_declaration_needed(ref_phone, ref_name, current_balance / 100)
                if ref_email:
                    try:
                        from services.email import send_referrer_declaration_needed_email
                        await send_referrer_declaration_needed_email(ref_email, ref_name, current_balance / 100)
                    except Exception as e:
                        error_logger.warning(f"Declaration-needed email failed for referrer {referrer_id}: {e}")
                return

        await _auto_issue_prezzee(
            lead_id=lead_id,
            referrer_id=referrer_id,
            current_balance=current_balance,
            ref_name=ref_name,
            ref_email=ref_email,
            ref_phone=ref_phone,
            db=db,
        )
        return

    # ── CASE 3: Balance $25–$74.98 → Notify to claim manually ────────────────
    amount_dollars = current_balance / 100
    payment_logger.info(
        f"Referrer {referrer_id}: balance ${amount_dollars:.2f} — sending claim-available notification"
    )

    # SMS notification
    if ref_phone:
        await send_sms_referrer_reward_claimable(ref_phone, ref_name, amount_dollars)

    # Email notification
    if ref_email:
        try:
            from services.email import send_referrer_reward_claimable_email
            await send_referrer_reward_claimable_email(ref_email, ref_name, amount_dollars)
        except Exception as e:
            error_logger.warning(f"Claim-available email failed for referrer {referrer_id}: {e}")


async def _auto_issue_prezzee(
    lead_id: str, referrer_id: str, current_balance: int,
    ref_name: str, ref_email: str, ref_phone: str, db: AsyncSession
):
    """Auto-issue a Prezzee gift card when balance hits $74.99. Capped at $74.99 for ATO compliance."""
    MAX_CLAIM_CENTS = 7499   # $74.99 — ATO compliance cap (no ABN threshold)
    amount_cents = min(current_balance, MAX_CLAIM_CENTS)
    amount_dollars = amount_cents / 100
    reference = f"tr-auto-{referrer_id[:8]}-{lead_id[:8]}"

    try:
        from services.prezzee_service import create_gift_card
        order = await create_gift_card(
            reference=reference,
            amount_dollars=amount_dollars,
            recipient_name=ref_name,
            recipient_email=ref_email,
        )
        order_uuid = order.get("uuid") or order.get("id") or ""

        # Log payout record
        await db.execute(text("""
            INSERT INTO payout_requests
                (referrer_id, amount_cents, status, method, prezzee_order_uuid, destination_email, created_at)
            VALUES (:rid, :amt, 'completed', 'PREZZEE_SWAP', :uuid, :email, now())
        """), {
            "rid": referrer_id, "amt": amount_cents,
            "uuid": order_uuid, "email": ref_email,
        })

        # Deduct claimed amount from wallet (don't zero out — they may have more above $300)
        await db.execute(text("""
            UPDATE referrers
            SET wallet_balance_cents = GREATEST(0, wallet_balance_cents - :claimed)
            WHERE id = :rid
        """), {"claimed": amount_cents, "rid": referrer_id})

        await db.commit()

        payment_logger.info(
            f"AUTO Prezzee issued | referrer={referrer_id} | ${amount_dollars:.2f} | uuid={order_uuid}"
        )

        # Notify via SMS
        if ref_phone:
            await send_sms_referrer_prezzee_issued(ref_phone, ref_name, amount_dollars, ref_email)

        # Notify via email
        if ref_email:
            try:
                from services.email import send_referrer_prezzee_issued_email
                await send_referrer_prezzee_issued_email(ref_email, ref_name, amount_dollars)
            except Exception as e:
                error_logger.warning(f"Prezzee issued email failed for referrer {referrer_id}: {e}")

    except Exception as e:
        error_logger.error(
            f"AUTO Prezzee issuance FAILED for referrer {referrer_id}: {e}", exc_info=True
        )
        # Don't block — earnings are already in wallet, will retry on next confirmed lead or manual claim



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
