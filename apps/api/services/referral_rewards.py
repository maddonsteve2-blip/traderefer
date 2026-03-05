"""
Referral rewards service.
Checks milestones (every 5 active invitees) and issues $25 Prezee gift cards.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from utils.logging_config import payment_logger, error_logger


async def check_and_reward(referrer_id: str, db: AsyncSession):
    """Check if referrer has hit a new 5-invitee milestone and issue $25 gift card."""
    # Count active invitees
    active_res = await db.execute(text("""
        SELECT COUNT(*) FROM user_invitations
        WHERE inviter_id = :id AND status = 'active'
    """), {"id": referrer_id})
    active_count = active_res.scalar() or 0

    if active_count == 0 or active_count % 5 != 0:
        return  # No new milestone

    milestone = active_count // 5

    # Check if already rewarded for this milestone
    existing = await db.execute(text("""
        SELECT id FROM referral_rewards WHERE referrer_id = :id AND milestone = :m
    """), {"id": referrer_id, "m": milestone})
    if existing.fetchone():
        return  # Already rewarded

    # Get referrer details
    ref_res = await db.execute(text("""
        SELECT full_name, email, phone FROM referrers WHERE id = :id
    """), {"id": referrer_id})
    ref = ref_res.mappings().first()
    if not ref:
        return

    ref_name = ref["full_name"] or "Referrer"
    ref_email = ref["email"] or ""
    ref_phone = ref["phone"] or ""

    # Insert reward record (pending)
    await db.execute(text("""
        INSERT INTO referral_rewards (referrer_id, milestone, reward_amount_cents, status)
        VALUES (:id, :m, 2500, 'pending')
        ON CONFLICT (referrer_id, milestone) DO NOTHING
    """), {"id": referrer_id, "m": milestone})
    await db.commit()

    # Issue Prezee gift card
    try:
        from services.prezzee_service import create_gift_card
        reference = f"tr-referral-reward-{referrer_id}-m{milestone}"
        order = await create_gift_card(
            reference=reference,
            amount_dollars=25.0,
            recipient_name=ref_name,
            recipient_email=ref_email,
        )
        order_uuid = order.get("uuid") or order.get("id") or ""

        await db.execute(text("""
            UPDATE referral_rewards
            SET status = 'issued', prezzee_order_uuid = :uuid, issued_at = now()
            WHERE referrer_id = :id AND milestone = :m
        """), {"uuid": order_uuid, "id": referrer_id, "m": milestone})
        await db.commit()

        payment_logger.info(
            f"Referral reward issued | referrer={referrer_id} | milestone={milestone} | "
            f"amount=$25 | order={order_uuid}"
        )

        # Notify referrer
        try:
            from services.email import send_referral_reward_email
            await send_referral_reward_email(ref_email, ref_name, milestone * 5, 25.0)
        except Exception as e:
            error_logger.warning(f"Reward notification email failed (non-fatal): {e}")

        try:
            from services.sms import _send_sms
            if ref_phone:
                await _send_sms(
                    ref_phone,
                    f"🎉 Congrats {ref_name}! You've invited {milestone * 5} active friends to TradeRefer. "
                    f"Your $25 Prezzee gift card is on its way to {ref_email}! TradeRefer"
                )
        except Exception as e:
            error_logger.warning(f"Reward SMS failed (non-fatal): {e}")

    except Exception as e:
        error_logger.error(
            f"Failed to issue referral reward | referrer={referrer_id} | milestone={milestone} | error={e}",
            exc_info=True
        )
        await db.execute(text("""
            UPDATE referral_rewards SET status = 'failed' WHERE referrer_id = :id AND milestone = :m
        """), {"id": referrer_id, "m": milestone})
        await db.commit()
