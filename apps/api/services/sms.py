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


async def _send_sms(to: str, body: str):
    """Send SMS via Twilio. Skips gracefully if credentials not set."""
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
            from_number = random.choice(TWILIO_FROM_NUMBERS)
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            return client.messages.create(
                body=body,
                from_=from_number,
                to=phone,
            )

        result = await asyncio.to_thread(_send)
        email_logger.info(f"SMS sent | to={phone} | sid={result.sid}")
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
