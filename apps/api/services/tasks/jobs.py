from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timedelta
import os

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
        print(f"Cron: Expired {len(expired_leads)} pending leads.")
        
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
        print(f"Cron: Expired {len(expired_unlocked)} unlocked leads (72h limit).")
        
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
        print(f"Cron: Released {len(released_earnings)} pending earnings.")
        
        # 2. Update referrer wallet balances for released earnings
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
        print(f"Cron: Moved {len(expired_pins)} leads to UNCONFIRMED due to expired PINs.")
        
    return len(expired_pins)
