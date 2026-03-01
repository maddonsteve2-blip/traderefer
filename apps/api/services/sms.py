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
        f"traderefer.au: New enquiry for {business_name} from a customer in {suburb}. "
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
        f"traderefer.au: A customer in {suburb} just enquired about {business_name}. "
        f"Claim your free profile to view and respond: {claim_url}\n"
        f"Reply STOP to opt out."
    )
    await _send_sms(phone, body)
