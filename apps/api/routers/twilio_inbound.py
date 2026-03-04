"""
Single inbound SMS webhook for all Twilio replies.
Routes to: screening replies, business survey replies, customer survey replies.
Configure Twilio: POST https://api.traderefer.au/twilio/inbound
"""
from fastapi import APIRouter, Form, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.ai_screening import classify_screening
from services.survey_service import evaluate_payment_outcome, trigger_declined
from services.quality_service import update_referrer_quality_score
from services.sms import (
    send_sms_screening_q2, send_sms_screening_q3,
    send_sms_screening_follow_up, send_sms_referrer_screening_failed,
    send_sms_business_survey_job_value, send_sms_business_survey_reason,
    send_sms_customer_survey_reason,
)
from utils.logging_config import lead_logger, error_logger
import json

router = APIRouter()

TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def _normalize_phone(raw: str) -> str:
    phone = raw.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        return phone
    if phone.startswith("04"):
        return "+61" + phone[1:]
    if phone.startswith("4") and len(phone) == 9:
        return "+61" + phone
    return phone


@router.post("/inbound", response_class=PlainTextResponse)
async def twilio_inbound(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Route all inbound Twilio SMS to the correct handler."""
    phone = _normalize_phone(From)
    body = Body.strip()
    lead_logger.info(f"Inbound SMS | from={phone} | body={body[:80]}")

    try:
        # Route 1: Active screening conversation?
        screening_lead = await _find_screening_lead(phone, db)
        if screening_lead:
            await handle_screening_reply(screening_lead, body, db)
            return PlainTextResponse(TWIML_EMPTY, media_type="text/xml")

        # Route 2: Pending business survey?
        biz_survey = await _find_business_survey_lead(phone, db)
        if biz_survey:
            await handle_business_survey_reply(biz_survey, body, db)
            return PlainTextResponse(TWIML_EMPTY, media_type="text/xml")

        # Route 3: Pending customer survey?
        cust_survey = await _find_customer_survey_lead(phone, db)
        if cust_survey:
            await handle_customer_survey_reply(cust_survey, body, db)
            return PlainTextResponse(TWIML_EMPTY, media_type="text/xml")

        lead_logger.info(f"No active conversation for {phone} — ignored")

    except Exception as e:
        error_logger.error(f"Inbound SMS handler error: {e}", exc_info=True)

    return PlainTextResponse(TWIML_EMPTY, media_type="text/xml")


# ── Finders ──────────────────────────────────────────────────────────────────

async def _find_screening_lead(phone: str, db: AsyncSession):
    res = await db.execute(text("""
        SELECT l.id, l.screening_conversation, l.screening_status,
               l.referrer_id, l.business_id, l.consumer_name, l.consumer_suburb,
               l.job_description, l.twilio_from_number, b.trade_category
        FROM leads l
        LEFT JOIN businesses b ON b.id = l.business_id
        WHERE l.consumer_phone = :phone
          AND l.status = 'SCREENING'
          AND l.screening_status IN ('PENDING', 'Q1_SENT', 'Q2_SENT', 'Q3_SENT', 'UNCLEAR')
        ORDER BY l.created_at DESC LIMIT 1
    """), {"phone": phone})
    return res.mappings().first()


async def _find_business_survey_lead(phone: str, db: AsyncSession):
    res = await db.execute(text("""
        SELECT l.id, l.consumer_suburb, l.job_description,
               l.business_survey_outcome, l.customer_survey_outcome,
               l.referrer_id, l.business_id
        FROM leads l
        JOIN businesses b ON b.id = l.business_id
        WHERE b.business_phone = :phone
          AND l.status = 'PAYMENT_PENDING_CONFIRMATION'
          AND l.business_survey_outcome IS NULL
        ORDER BY l.surveys_sent_at DESC LIMIT 1
    """), {"phone": phone})
    return res.mappings().first()


async def _find_customer_survey_lead(phone: str, db: AsyncSession):
    res = await db.execute(text("""
        SELECT l.id, l.consumer_name, l.consumer_suburb, l.job_description,
               l.business_survey_outcome, l.customer_survey_outcome,
               l.referrer_id, l.business_id, b.business_name
        FROM leads l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.consumer_phone = :phone
          AND l.status = 'PAYMENT_PENDING_CONFIRMATION'
          AND l.customer_survey_outcome IS NULL
        ORDER BY l.surveys_sent_at DESC LIMIT 1
    """), {"phone": phone})
    return res.mappings().first()


# ── Screening handler ─────────────────────────────────────────────────────────

async def handle_screening_reply(lead: dict, body: str, db: AsyncSession):
    lead_id = str(lead["id"])
    phone = None
    twilio_from = lead.get("twilio_from_number")

    # Fetch phone
    phone_res = await db.execute(
        text("SELECT consumer_phone FROM leads WHERE id = :id"), {"id": lead_id}
    )
    phone_row = phone_res.fetchone()
    if phone_row:
        phone = phone_row[0]

    # Load existing conversation
    raw_conv = lead["screening_conversation"]
    conversation = raw_conv if isinstance(raw_conv, list) else (json.loads(raw_conv) if raw_conv else [])

    screening_status = lead["screening_status"] or "PENDING"
    trade_category = lead["trade_category"] or "trade"

    # Append consumer reply
    conversation.append({"role": "user", "content": body})

    if screening_status == "Q1_SENT":
        # Ask Q2
        conversation.append({"role": "assistant", "content": "Q2: Timeframe?"})
        await _save_conversation(lead_id, conversation, "Q2_SENT", db)
        if phone:
            await send_sms_screening_q2(phone, from_number=twilio_from)

    elif screening_status == "Q2_SENT":
        # Ask Q3
        conversation.append({"role": "assistant", "content": "Q3: Scope?"})
        await _save_conversation(lead_id, conversation, "Q3_SENT", db)
        if phone:
            await send_sms_screening_q3(phone, from_number=twilio_from)

    elif screening_status in ("Q3_SENT", "UNCLEAR"):
        # Classify
        result = await classify_screening(conversation, trade_category)
        status = result["status"]

        if status == "PASS":
            await _screening_pass(lead_id, db)

        elif status == "UNCLEAR" and screening_status != "UNCLEAR":
            follow_up = result.get("follow_up") or "Can you describe the job in a bit more detail?"
            conversation.append({"role": "assistant", "content": follow_up})
            await _save_conversation(lead_id, conversation, "UNCLEAR", db)
            if phone:
                await send_sms_screening_follow_up(phone, follow_up, from_number=twilio_from)

        else:
            # FAIL or second UNCLEAR
            await _screening_fail(lead_id, lead, db)

    else:
        # Q1 not yet sent or unknown state — treat as Q1 reply
        conversation.append({"role": "assistant", "content": "Q2: Timeframe?"})
        await _save_conversation(lead_id, conversation, "Q2_SENT", db)
        if phone:
            await send_sms_screening_q2(phone, from_number=twilio_from)


async def _screening_pass(lead_id: str, db: AsyncSession):
    """Screening passed: notify business (existing email/SMS flow)."""
    await db.execute(text("""
        UPDATE leads
        SET screening_status = 'PASS', status = 'READY_FOR_BUSINESS'
        WHERE id = :id
    """), {"id": lead_id})
    await db.commit()

    # Fetch data to notify business
    res = await db.execute(text("""
        SELECT l.consumer_name, l.consumer_suburb, l.job_description, l.consumer_phone,
               l.unlock_fee_cents, l.referrer_id, l.twilio_from_number,
               b.business_name, b.business_email, b.business_phone, b.is_claimed, b.slug
        FROM leads l JOIN businesses b ON b.id = l.business_id
        WHERE l.id = :id
    """), {"id": lead_id})
    row = res.mappings().first()
    if not row:
        return

    from services.email import send_business_new_lead
    from services.sms import send_sms_claimed_new_lead, _send_sms

    lead_logger.info(f"Screening PASSED | lead={lead_id} | is_claimed={row['is_claimed']} | email={row['business_email']} | phone={row['business_phone']}")
    
    # Send thank you message to consumer
    if row["consumer_phone"]:
        thank_you_msg = (
            f"Thank you for providing those details! "
            f"We've passed your job request to {row['business_name']}. "
            f"They'll be in touch soon. TradeRefer"
        )
        await _send_sms(row["consumer_phone"], thank_you_msg, from_number=row["twilio_from_number"])
    
    if row["is_claimed"]:
        is_first = False
        try:
            if row["business_email"]:
                lead_logger.info(f"Sending email notification to {row['business_email']}")
                await send_business_new_lead(
                    email=row["business_email"],
                    business_name=row["business_name"],
                    consumer_name=row["consumer_name"],
                    suburb=row["consumer_suburb"],
                    job_description=row["job_description"],
                    lead_id=lead_id,
                    unlock_fee_dollars=(row["unlock_fee_cents"] or 0) / 100,
                    is_first_lead=is_first,
                )
                lead_logger.info(f"Email notification sent successfully")
            if row["business_phone"]:
                lead_logger.info(f"Sending SMS notification to {row['business_phone']}")
                await send_sms_claimed_new_lead(
                    phone=row["business_phone"],
                    business_name=row["business_name"],
                    suburb=row["consumer_suburb"],
                )
                lead_logger.info(f"SMS notification sent successfully")
        except Exception as e:
            from utils.logging_config import error_logger
            error_logger.error(f"Failed to send business notifications: {e}", exc_info=True)
    else:
        lead_logger.info(f"Business not claimed - skipping notifications")

    # Update referrer quality score
    if row["referrer_id"]:
        await update_referrer_quality_score(str(row["referrer_id"]), db)


async def _screening_fail(lead_id: str, lead: dict, db: AsyncSession):
    await db.execute(text("""
        UPDATE leads SET screening_status = 'FAIL', status = 'SCREENING_FAILED', requires_admin_review = true
        WHERE id = :id
    """), {"id": lead_id})
    await db.commit()

    # Fetch full lead details for admin notification
    res = await db.execute(text("""
        SELECT l.consumer_phone, l.consumer_name, l.consumer_email, l.job_description, 
               l.screening_conversation, l.twilio_from_number,
               b.business_name, b.trade_category, b.slug
        FROM leads l JOIN businesses b ON b.id = l.business_id
        WHERE l.id = :id
    """), {"id": lead_id})
    row = res.mappings().first()
    
    # Send professional message to consumer
    if row and row["consumer_phone"]:
        from services.sms import _send_sms
        fail_msg = (
            f"Thank you for your enquiry. Unfortunately, your request doesn't match "
            f"{row['business_name']}'s service category ({row['trade_category']}). "
            f"Would you like us to connect you with our customer service team to find the right tradesperson? "
            f"Reply YES if you'd like assistance. TradeRefer"
        )
        await _send_sms(row["consumer_phone"], fail_msg, from_number=row["twilio_from_number"])
    
    # Send QA email to admin
    if row:
        from services.email import send_email
        import json
        
        conversation_text = "\n".join([
            f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
            for msg in (row["screening_conversation"] or [])
        ])
        
        admin_email_body = f"""
<h2>⚠️ Lead Screening Failed - Requires Review</h2>

<p><strong>Lead ID:</strong> {lead_id}</p>
<p><strong>Status:</strong> Flagged for admin review</p>

<h3>Consumer Details:</h3>
<ul>
    <li><strong>Name:</strong> {row['consumer_name']}</li>
    <li><strong>Phone:</strong> {row['consumer_phone']}</li>
    <li><strong>Email:</strong> {row['consumer_email'] or 'N/A'}</li>
</ul>

<h3>Business Details:</h3>
<ul>
    <li><strong>Business:</strong> {row['business_name']}</li>
    <li><strong>Category:</strong> {row['trade_category']}</li>
    <li><strong>Slug:</strong> {row['slug']}</li>
</ul>

<h3>Job Description:</h3>
<p>{row['job_description']}</p>

<h3>Screening Conversation:</h3>
<pre>{conversation_text}</pre>

<p><strong>Action Required:</strong> Review this lead in the admin dashboard and determine if it should be manually assigned to a different business or escalated to customer service.</p>

<p><a href="https://traderefer.au/admin/leads/{lead_id}">View Lead in Admin Dashboard</a></p>
"""
        
        try:
            await send_email(
                to_email="stevejford007@gmail.com",
                subject=f"🚨 QA Alert: Failed Lead Screening - {row['business_name']}",
                html_body=admin_email_body
            )
            lead_logger.info(f"QA email sent to admin for failed lead {lead_id}")
        except Exception as e:
            from utils.logging_config import error_logger
            error_logger.error(f"Failed to send QA email for lead {lead_id}: {e}", exc_info=True)

    # Notify referrer
    if lead["referrer_id"]:
        ref_res = await db.execute(text("""
            SELECT r.phone, r.full_name, b.business_name
            FROM referrers r, businesses b, leads l
            WHERE r.id = :rid AND b.id = l.business_id AND l.id = :lid
        """), {"rid": lead["referrer_id"], "lid": lead_id})
        ref = ref_res.mappings().first()
        if ref and ref["phone"]:
            await send_sms_referrer_screening_failed(
                ref["phone"], ref["full_name"] or "there", ref["business_name"]
            )

        await update_referrer_quality_score(str(lead["referrer_id"]), db)

    lead_logger.info(f"Screening FAILED | lead={lead_id}")


async def _save_conversation(lead_id: str, conversation: list, status: str, db: AsyncSession):
    await db.execute(text("""
        UPDATE leads
        SET screening_conversation = CAST(:conv AS jsonb), screening_status = :status
        WHERE id = :id
    """), {"conv": json.dumps(conversation), "status": status, "id": lead_id})
    await db.commit()


# ── Business survey handler ───────────────────────────────────────────────────

async def handle_business_survey_reply(lead: dict, body: str, db: AsyncSession):
    lead_id = str(lead["id"])
    reply = body.strip().upper()

    biz_phone_res = await db.execute(
        text("SELECT business_phone FROM businesses WHERE id = :bid"),
        {"bid": lead["business_id"]}
    )
    biz_phone_row = biz_phone_res.fetchone()
    biz_phone = biz_phone_row[0] if biz_phone_row else None

    suburb = lead["consumer_suburb"] or "your area"

    if reply in ("1", "WON", "YES"):
        await db.execute(text("""
            UPDATE leads SET business_survey_outcome = 'won' WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'won', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'business' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        if biz_phone:
            await send_sms_business_survey_job_value(biz_phone)

    elif reply in ("2", "NO", "NOT WON", "LOST"):
        await db.execute(text("""
            UPDATE leads SET business_survey_outcome = 'not_won' WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'not_won', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'business' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        if biz_phone:
            await send_sms_business_survey_reason(biz_phone)
        await evaluate_payment_outcome(lead_id, db)

    elif reply in ("3", "PENDING", "STILL PENDING"):
        # No change — wait for next follow-up
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'pending', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'business' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        lead_logger.info(f"Business survey: pending | lead={lead_id}")

    elif reply.isdigit() and len(reply) <= 6:
        # Job value follow-up
        job_value_cents = int(float(reply)) * 100
        await db.execute(text("""
            UPDATE lead_surveys SET job_value_cents = :jv
            WHERE lead_id = :lid AND respondent_type = 'business' AND outcome = 'won'
        """), {"jv": job_value_cents, "lid": lead_id})
        await db.commit()
        await evaluate_payment_outcome(lead_id, db)

    elif reply in ("A", "B", "C", "D", "E"):
        # Reason follow-up for not won
        reason_map = {"A": "Price", "B": "Chose another", "C": "Out of scope", "D": "No response", "E": "Other"}
        await db.execute(text("""
            UPDATE lead_surveys SET outcome_reason = :reason
            WHERE lead_id = :lid AND respondent_type = 'business' AND outcome = 'not_won'
        """), {"reason": reason_map.get(reply, reply), "lid": lead_id})
        await db.commit()

    lead_logger.info(f"Business survey reply | lead={lead_id} | reply={reply}")


# ── Customer survey handler ────────────────────────────────────────────────────

async def handle_customer_survey_reply(lead: dict, body: str, db: AsyncSession):
    lead_id = str(lead["id"])
    reply = body.strip().upper()

    consumer_phone_res = await db.execute(
        text("SELECT consumer_phone FROM leads WHERE id = :id"), {"id": lead_id}
    )
    consumer_phone_row = consumer_phone_res.fetchone()
    consumer_phone = consumer_phone_row[0] if consumer_phone_row else None

    if reply in ("1", "YES", "HIRED"):
        await db.execute(text("""
            UPDATE leads SET customer_survey_outcome = 'hired' WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'hired', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'customer' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        await evaluate_payment_outcome(lead_id, db)

    elif reply in ("2", "NOT YET", "DECIDING", "MAYBE"):
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'pending', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'customer' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()

    elif reply in ("3", "NO", "CHOSE ANOTHER"):
        await db.execute(text("""
            UPDATE leads SET customer_survey_outcome = 'not_hired' WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'not_hired', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'customer' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        if consumer_phone:
            await send_sms_customer_survey_reason(consumer_phone)
        await evaluate_payment_outcome(lead_id, db)

    elif reply in ("4", "NO LONGER NEEDED", "CANCELLED"):
        await db.execute(text("""
            UPDATE leads SET customer_survey_outcome = 'no_longer_needed' WHERE id = :id
        """), {"id": lead_id})
        await db.execute(text("""
            UPDATE lead_surveys SET outcome = 'no_longer_needed', response_raw = :r
            WHERE lead_id = :lid AND respondent_type = 'customer' AND outcome IS NULL
        """), {"r": body, "lid": lead_id})
        await db.commit()
        await evaluate_payment_outcome(lead_id, db)

    elif reply in ("A", "B", "C", "D", "E", "F"):
        reason_map = {
            "A": "Price", "B": "Timing", "C": "Didn't respond",
            "D": "Wrong service", "E": "Attitude", "F": "Other"
        }
        await db.execute(text("""
            UPDATE lead_surveys SET outcome_reason = :reason
            WHERE lead_id = :lid AND respondent_type = 'customer' AND outcome IN ('not_hired','no_longer_needed')
        """), {"reason": reason_map.get(reply, reply), "lid": lead_id})
        await db.commit()

    lead_logger.info(f"Customer survey reply | lead={lead_id} | reply={reply}")
