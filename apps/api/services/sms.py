import os
import asyncio
from typing import Optional
from utils.logging_config import email_logger, error_logger

import random

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
_from_numbers_raw = os.getenv("TWILIO_FROM_NUMBERS", os.getenv("TWILIO_FROM_NUMBER", ""))
TWILIO_FROM_NUMBERS = [n.strip() for n in _from_numbers_raw.split(",") if n.strip()]
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")


async def _send_sms(to: str, body: str, from_number: Optional[str] = None):
    """Send SMS via Twilio. Skips gracefully if credentials not set.
    
    Args:
        to: Recipient phone number
        body: SMS message body
        from_number: Specific Twilio number to send from (optional, random if not provided)
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_FROM_NUMBERS:
        email_logger.warning(f"Twilio credentials not set — skipping SMS to {to}")
        return

    # Normalise AU mobile numbers to E.164
    phone = to.strip().replace(" ", "")
    if phone.startswith("04"):
        phone = "+61" + phone[1:]
    elif phone.startswith("4") and len(phone) == 9:
        phone = "+61" + phone

    try:
        from twilio.rest import Client

        def _send():
            _from = from_number if from_number else random.choice(TWILIO_FROM_NUMBERS)
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            return client.messages.create(
                body=body,
                from_=_from,
                to=phone,
            )

        result = await asyncio.to_thread(_send)
        email_logger.info(f"SMS sent | to={phone} | from={from_number or 'random'} | sid={result.sid}")
        return result
    except Exception as e:
        error_logger.error(f"SMS failed | to={phone} | error={e}", exc_info=True)


# ─────────────────────────────────────────────
# CLAIMED BUSINESS — new enquiry teaser
# ─────────────────────────────────────────────

async def send_sms_claimed_new_lead(phone: str, business_name: str, suburb: str):
    """Notify a claimed business owner that a new enquiry has arrived. No details — drive login."""
    body = (
        f"TradeRefer: New enquiry for {business_name} from a customer in {suburb}. "
        f"Log in to view and respond: {FRONTEND_URL}/dashboard/business/leads\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# UNCLAIMED BUSINESS — claim prompt
# ─────────────────────────────────────────────

async def send_sms_unclaimed_teaser(phone: str, business_name: str, slug: str, suburb: str):
    """Notify an unclaimed business that they have an enquiry and prompt them to claim."""
    claim_url = f"{FRONTEND_URL}/onboarding/business?slug={slug}"
    body = (
        f"TradeRefer: A customer in {suburb} just enquired about {business_name}. "
        f"Claim your free profile to view and respond: {claim_url}\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# BUSINESS — lead unlocked (full contact details now visible)
# ─────────────────────────────────────────────

async def send_sms_business_lead_unlocked(phone: str, business_name: str, consumer_name: str, consumer_phone: str, suburb: str):
    """Tell the business they unlocked a lead and give them the customer's number."""
    body = (
        f"TradeRefer: You've unlocked a lead! "
        f"Customer: {consumer_name} ({consumer_phone}) in {suburb}. "
        f"Tap 'On My Way' in your dashboard when you're heading to them: {FRONTEND_URL}/dashboard/business/leads\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# CONSUMER — lead confirmation (enquiry received)
# ─────────────────────────────────────────────

async def send_sms_consumer_lead_confirmation(phone: str, consumer_name: str, business_name: str):
    """Tell the consumer their enquiry was sent and the business will be in touch."""
    body = (
        f"Hi {consumer_name}, your enquiry has been sent to {business_name} via TradeRefer. "
        f"They'll contact you shortly. Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# CONSUMER — tradie is on the way + PIN
# ─────────────────────────────────────────────

async def send_sms_consumer_on_the_way(phone: str, consumer_name: str, business_name: str, pin: str):
    """
    Critical message: tell the consumer the tradie is coming and give them their PIN.
    The PIN must be given to the tradie ON ARRIVAL to confirm the job is done.
    """
    body = (
        f"Hi {consumer_name} - {business_name} is on the way to you!\n\n"
        f"YOUR ARRIVAL PIN: {pin}\n\n"
        f"When the tradie arrives, show them this PIN. "
        f"They will enter it in their app to confirm the job and release payment to your referrer. "
        f"PIN expires in 4 hours. TradeRefer."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# REFERRER — earning confirmed, money in wallet
# ─────────────────────────────────────────────

async def send_sms_referrer_earning_confirmed(phone: str, full_name: str, business_name: str, amount_dollars: float):
    """Tell the referrer their earning has been confirmed and is in their wallet."""
    body = (
        f"TradeRefer: Great news {full_name}! "
        f"Your referral to {business_name} was confirmed. "
        f"${amount_dollars:.2f} is now in your wallet. "
        f"View earnings: {FRONTEND_URL}/dashboard/referrer\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# NEW MESSAGE — notify recipient by SMS
# ─────────────────────────────────────────────

async def send_sms_new_message(phone: str, recipient_name: str, sender_name: str, dashboard_url: str):
    """Notify a user they have a new message via SMS."""
    body = (
        f"TradeRefer: Hi {recipient_name}, you have a new message from {sender_name}. "
        f"Reply here: {FRONTEND_URL}{dashboard_url}\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# CONSUMER — AI screening questions
# ─────────────────────────────────────────────

async def send_sms_screening_q1(phone: str, consumer_name: str, business_name: str, trade_category: str, from_number: Optional[str] = None):
    body = (
        f"Hi {consumer_name}, {business_name} received your job enquiry via TradeRefer.\n\n"
        f"Quick 3 questions to confirm your request:\n"
        f"1. What type of {trade_category} work do you need?\n"
        f"Reply with a short description. TradeRefer"
    )
    result = await _send_sms(phone, body, from_number)
    return result

async def send_sms_screening_q2(phone: str, from_number: Optional[str] = None):
    body = (
        "Thanks! Q2: What's your timeframe? (e.g. urgent, within a week, flexible)\n"
        "Reply now. TradeRefer"
    )
    await _send_sms(phone, body, from_number)

async def send_sms_screening_q3(phone: str, from_number: Optional[str] = None):
    body = (
        "Last one! Q3: What's the scope? (e.g. small repair, full renovation, new install)\n"
        "Reply now. TradeRefer"
    )
    await _send_sms(phone, body, from_number)

async def send_sms_screening_follow_up(phone: str, follow_up: str, from_number: Optional[str] = None):
    body = f"TradeRefer: {follow_up}\nReply with your answer."
    await _send_sms(phone, body, from_number)

async def send_sms_referrer_screening_failed(phone: str, full_name: str, business_name: str):
    body = (
        f"Hi {full_name}, we couldn't confirm the job details for your referral to {business_name}. "
        f"Please contact the customer and resubmit if still active. TradeRefer"
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# BUSINESS — post-meeting outcome survey
# ─────────────────────────────────────────────

async def send_sms_business_survey(phone: str, suburb: str, job_type: str):
    body = (
        f"TradeRefer: Outcome for your lead in {suburb} ({job_type})?\n"
        f"1 = Won job\n2 = Not won\n3 = Still pending\n"
        f"Reply 1, 2 or 3."
    )
    await _send_sms(phone, body)

async def send_sms_business_survey_followup(phone: str, suburb: str, round_num: int):
    body = (
        f"TradeRefer follow-up #{round_num}: Lead in {suburb} — outcome?\n"
        f"1 = Won  2 = Not won  3 = Pending\nReply 1, 2 or 3."
    )
    await _send_sms(phone, body)

async def send_sms_business_survey_job_value(phone: str):
    body = "Great! Estimated job value in dollars? (e.g. 1200, or 0 to skip) TradeRefer"
    await _send_sms(phone, body)

async def send_sms_business_survey_reason(phone: str):
    body = (
        "Reason?\nA Price  B Customer chose another  C Out of scope  D No response  E Other\n"
        "Reply A–E. TradeRefer"
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# CUSTOMER — post-meeting outcome survey
# ─────────────────────────────────────────────

async def send_sms_customer_survey(phone: str, consumer_name: str, business_name: str, job_type: str):
    body = (
        f"Hi {consumer_name}, TradeRefer here.\n"
        f"Did you go ahead with {business_name} for your {job_type}?\n"
        f"1 = Yes, booked/started\n2 = Not yet / deciding\n3 = No, chose someone else\n4 = No longer needed\n"
        f"Reply 1, 2, 3 or 4."
    )
    await _send_sms(phone, body)

async def send_sms_customer_survey_followup(phone: str, consumer_name: str, business_name: str, round_num: int):
    body = (
        f"Hi {consumer_name}, TradeRefer follow-up #{round_num}: Did you hire {business_name}?\n"
        f"1 = Yes  2 = No  3 = No longer needed\nReply 1, 2 or 3."
    )
    await _send_sms(phone, body)

async def send_sms_customer_survey_reason(phone: str):
    body = (
        "Thanks. Main reason?\nA Price  B Timing  C Didn't respond  D Wrong service  E Attitude  F Other\n"
        "Reply A–F. TradeRefer"
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# BUSINESS — wallet & refund notifications
# ─────────────────────────────────────────────

async def send_sms_business_lead_refunded(phone: str, business_name: str, amount_dollars: float, reason: str):
    body = (
        f"TradeRefer: {business_name}, your ${amount_dollars:.2f} referral fee has been refunded "
        f"to your wallet. Reason: {reason}. "
        f"View: {FRONTEND_URL}/dashboard/business\nReply STOP to opt out."
    )
    await _send_sms(phone, body)

async def send_sms_business_wallet_low(phone: str, business_name: str, balance_dollars: float):
    body = (
        f"TradeRefer: {business_name}, your wallet is low (${balance_dollars:.2f}). "
        f"Top up to keep unlocking leads: {FRONTEND_URL}/dashboard/business\nReply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# REFERRER — Prezzee gift card & rewards
# ─────────────────────────────────────────────

async def send_sms_referrer_prezzee_issued(phone: str, full_name: str, amount_dollars: float, email: str):
    body = (
        f"Congrats {full_name}! Your ${amount_dollars:.2f} Prezzee gift card is on its way to {email}. "
        f"Check your inbox! TradeRefer"
    )
    await _send_sms(phone, body)

async def send_sms_referrer_reward_accumulating(phone: str, full_name: str, balance_dollars: float):
    body = (
        f"Hi {full_name}, ${balance_dollars:.2f} added to your reward balance. "
        f"Once you reach $25 you can claim a Prezzee gift card. TradeRefer"
    )
    await _send_sms(phone, body)


async def send_sms_referrer_reward_claimable(phone: str, full_name: str, balance_dollars: float):
    """Tell the referrer their balance is claimable ($25–$249 range). Drive them to the dashboard."""
    body = (
        f"TradeRefer: Hi {full_name}, you have ${balance_dollars:.2f} in claimable Prezzee credit! "
        f"Log in to claim your gift card: {FRONTEND_URL}/dashboard/referrer/withdraw\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)


# ─────────────────────────────────────────────
# REFERRER — accountability notices
# ─────────────────────────────────────────────

async def send_sms_referrer_advisory(phone: str, full_name: str, score: int):
    body = (
        f"Hi {full_name}, your TradeRefer quality score has dropped to {score}/100. "
        f"Ensure leads are genuine and in the correct trade category. TradeRefer"
    )
    await _send_sms(phone, body)

async def send_sms_referrer_warning(phone: str, full_name: str, score: int):
    body = (
        f"TradeRefer Warning: {full_name}, your quality score is {score}/100 — below threshold. "
        f"Continued low quality will pause your account. TradeRefer"
    )
    await _send_sms(phone, body)

async def send_sms_referrer_paused(phone: str, full_name: str):
    body = (
        f"TradeRefer: {full_name}, your referrer account has been temporarily paused due to low lead quality. "
        f"Contact support to review. TradeRefer"
    )
    await _send_sms(phone, body)
