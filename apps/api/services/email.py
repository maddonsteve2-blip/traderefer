import os
import resend
from typing import Optional

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDRESS = os.getenv("RESEND_FROM", "TradeRefer <no-reply@traderefer.au>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")


def _send(to: str, subject: str, html: str):
    """Fire-and-forget email send. Swallows errors so they never break API responses."""
    if not resend.api_key:
        print(f"[email] RESEND_API_KEY not set — skipping email to {to}: {subject}")
        return
    try:
        resend.Emails.send({"from": FROM_ADDRESS, "to": [to], "subject": subject, "html": html})
    except Exception as e:
        print(f"[email] Failed to send '{subject}' to {to}: {e}")


# ─────────────────────────────────────────────
# BUSINESS EMAILS
# ─────────────────────────────────────────────

def send_business_welcome(email: str, business_name: str, slug: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Welcome to TradeRefer, {business_name}!</h1>
      <p>Your business profile is live. Referrers can now start sending you leads.</p>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
      <p style="margin-top:24px">Head to your <a href="{FRONTEND_URL}/dashboard/business">dashboard</a> to manage leads and set your referral fee.</p>
    </div>
    """
    _send(email, f"Welcome to TradeRefer — {business_name} is live!", html)


def send_business_new_lead(email: str, business_name: str, consumer_name: str, suburb: str, job_description: str, lead_id: str, unlock_fee_dollars: float):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">New Lead for {business_name}</h1>
      <p>You have a new lead waiting to be unlocked.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Customer</td><td style="padding:8px">{consumer_name[:1]}*** (hidden until unlocked)</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Suburb</td><td style="padding:8px">{suburb}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Job</td><td style="padding:8px">{job_description[:200]}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Unlock Fee</td><td style="padding:8px;font-weight:bold;color:#ea580c">${unlock_fee_dollars:.2f}</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Unlock This Lead</a>
    </div>
    """
    _send(email, f"New lead in {suburb} — Unlock now", html)


def send_business_lead_unlocked(email: str, business_name: str, consumer_name: str, consumer_phone: str, consumer_email: str, suburb: str, job_description: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Lead Unlocked — Contact Your Customer</h1>
      <p>You've successfully unlocked a lead. Here are the full contact details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Name</td><td style="padding:8px">{consumer_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Phone</td><td style="padding:8px"><a href="tel:{consumer_phone}">{consumer_phone}</a></td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:{consumer_email}">{consumer_email}</a></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Suburb</td><td style="padding:8px">{suburb}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Job</td><td style="padding:8px">{job_description}</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View in Dashboard</a>
    </div>
    """
    _send(email, f"Lead unlocked — {consumer_name} in {suburb}", html)


# ─────────────────────────────────────────────
# REFERRER EMAILS
# ─────────────────────────────────────────────

def send_referrer_welcome(email: str, full_name: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Welcome to TradeRefer, {full_name}!</h1>
      <p>You're now set up as a referrer. Start referring customers to tradies and earn money for every successful lead.</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Your Dashboard</a>
      <p style="margin-top:24px;color:#666;font-size:14px">Browse businesses and generate your unique referral links to get started.</p>
    </div>
    """
    _send(email, "Welcome to TradeRefer — start earning today!", html)


def send_referrer_lead_unlocked(email: str, full_name: str, business_name: str, suburb: str, payout_dollars: float, available_date: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Your referral earned you money!</h1>
      <p>Hi {full_name}, a lead you referred to <strong>{business_name}</strong> has been unlocked.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Business</td><td style="padding:8px">{business_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Suburb</td><td style="padding:8px">{suburb}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Your Earning</td><td style="padding:8px;font-weight:bold;color:#ea580c">${payout_dollars:.2f}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Available</td><td style="padding:8px">{available_date} (7-day hold)</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Earnings</a>
    </div>
    """
    _send(email, f"You earned ${payout_dollars:.2f} from a referral!", html)


def send_referrer_payout_processed(email: str, full_name: str, amount_dollars: float, method: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Payout Processed</h1>
      <p>Hi {full_name}, your withdrawal has been processed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Amount</td><td style="padding:8px;font-weight:bold;color:#ea580c">${amount_dollars:.2f}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Method</td><td style="padding:8px">{method.capitalize()}</td></tr>
      </table>
      <p style="color:#666;font-size:14px">Funds may take 1–3 business days to appear in your account depending on your bank.</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    </div>
    """
    _send(email, f"Your ${amount_dollars:.2f} payout is on its way!", html)


# ─────────────────────────────────────────────
# CONSUMER EMAILS
# ─────────────────────────────────────────────

def send_consumer_lead_confirmation(email: str, consumer_name: str, business_name: str, trade_category: str, job_description: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Your request has been received</h1>
      <p>Hi {consumer_name}, your job request has been sent to <strong>{business_name}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Trade</td><td style="padding:8px">{trade_category}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Job</td><td style="padding:8px">{job_description[:300]}</td></tr>
      </table>
      <p style="color:#666">The business will be in touch with you soon. You may receive a call or SMS from them directly.</p>
    </div>
    """
    _send(email, f"Your request to {business_name} has been received", html)
