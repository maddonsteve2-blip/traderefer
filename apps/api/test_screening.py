"""
End-to-end AI screening test — no running server needed.
Directly inserts a lead into the DB and fires Q1 SMS to your phone,
then inbound replies flow through api.traderefer.au automatically.

Usage:  python test_screening.py
"""
import asyncio, os
from dotenv import load_dotenv
load_dotenv(".env.local")

import asyncpg

CONSUMER_PHONE  = "0413600191"
CONSUMER_NAME   = "Steve F"
CONSUMER_EMAIL  = "stevejford1@gmail.com"
CONSUMER_SUBURB = "Melbourne"
JOB_DESC        = "I need a new handle put on my front door — the old one is broken."


async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))

    # Find a good test business (handyman/general preferred, else any claimed)
    row = await conn.fetchrow("""
        SELECT id, business_name, trade_category, referral_fee_cents
        FROM businesses
        WHERE is_claimed = true
          AND trade_category ILIKE ANY(ARRAY[
            '%handyman%','%general%','%builder%','%carpenter%','%maintenance%'
          ])
        ORDER BY created_at DESC LIMIT 1
    """)
    if not row:
        row = await conn.fetchrow("""
            SELECT id, business_name, trade_category, referral_fee_cents
            FROM businesses WHERE is_claimed = true ORDER BY created_at DESC LIMIT 1
        """)

    if not row:
        print("❌  No claimed businesses in DB — onboard a business first.")
        await conn.close()
        return

    biz_id   = str(row["id"])
    biz_name = row["business_name"]
    trade    = row["trade_category"] or "trade"
    fee      = row["referral_fee_cents"] or 5000
    total    = fee + int(fee * 0.20)

    print(f"✅  Business : {biz_name} ({trade})")
    print(f"    Fee      : ${fee/100:.0f}  →  unlock ${total/100:.0f}")

    # Insert lead
    lead_id = await conn.fetchval("""
        INSERT INTO leads (
            business_id, consumer_name, consumer_phone, consumer_email,
            consumer_suburb, job_description,
            status, screening_status,
            unlock_fee_cents, referral_fee_snapshot_cents, referrer_payout_amount_cents,
            consumer_ip, lead_urgency
        ) VALUES (
            $1,$2,$3,$4,$5,$6,
            'SCREENING','Q1_SENT',
            $7,$8,$9,
            'test','warm'
        ) RETURNING id
    """, biz_id, CONSUMER_NAME, CONSUMER_PHONE, CONSUMER_EMAIL,
         CONSUMER_SUBURB, JOB_DESC, total, fee, int(fee * 0.8))

    await conn.close()
    print(f"✅  Lead ID  : {lead_id}")

    # Fire Q1 SMS
    from services.sms import send_sms_screening_q1
    await send_sms_screening_q1(
        phone=CONSUMER_PHONE,
        consumer_name=CONSUMER_NAME,
        business_name=biz_name,
        trade_category=trade,
    )

    print(f"\n🚀  Q1 SMS sent to {CONSUMER_PHONE}")
    print(f"    Reply to the text on your phone to start the back-and-forth.")
    print(f"    Inbound replies route through https://api.traderefer.au/twilio/inbound")
    print(f"\n    Lead: {lead_id}")


asyncio.run(main())
