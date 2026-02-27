import os
import resend
import asyncio
from typing import Optional
from utils.logging_config import email_logger, error_logger

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDRESS = os.getenv("RESEND_FROM", "TradeRefer <no-reply@traderefer.au>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")


async def _send(to: str, subject: str, html: str):
    """Async email send using Resend. Runs in thread pool to avoid blocking."""
    if not resend.api_key:
        email_logger.error(f"RESEND_API_KEY not set — skipping email to {to}: {subject}")
        return
    
    # Validate from address
    if not FROM_ADDRESS or "@" not in FROM_ADDRESS:
        email_logger.error(f"Invalid RESEND_FROM address: {FROM_ADDRESS}")
        return
    
    try:
        # Run sync Resend SDK in thread pool to avoid blocking async event loop
        def send_email():
            return resend.Emails.send({
                "from": FROM_ADDRESS,
                "to": [to],
                "subject": subject,
                "html": html
            })
        
        result = await asyncio.to_thread(send_email)
        email_logger.info(f"Email sent successfully | to={to} | subject={subject} | result={result}")
        return result
        
    except Exception as e:
        error_msg = f"Failed to send email | to={to} | subject={subject} | error={e}"
        email_logger.error(error_msg)
        error_logger.error(error_msg, exc_info=True)


# ─────────────────────────────────────────────
# BUSINESS EMAILS
# ─────────────────────────────────────────────

async def send_business_welcome(email: str, business_name: str, slug: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Welcome to TradeRefer, {business_name}!</h1>
      <p>Your business profile is live. Referrers can now start sending you leads.</p>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
      <p style="margin-top:24px">Head to your <a href="{FRONTEND_URL}/dashboard/business">dashboard</a> to manage leads and set your referral fee.</p>
    </div>
    """
    await _send(email, f"Welcome to TradeRefer — {business_name} is live!", html)


async def send_business_new_lead(email: str, business_name: str, consumer_name: str, suburb: str, job_description: str, lead_id: str, unlock_fee_dollars: float):
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
    await _send(email, f"New lead in {suburb} — Unlock now", html)


async def send_business_lead_unlocked(email: str, business_name: str, consumer_name: str, consumer_phone: str, consumer_email: str, suburb: str, job_description: str):
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
    await _send(email, f"Lead unlocked — {consumer_name} in {suburb}", html)


# ─────────────────────────────────────────────
# REFERRER EMAILS
# ─────────────────────────────────────────────

async def send_referrer_welcome(email: str, full_name: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Welcome to TradeRefer, {full_name}!</h1>
      <p>You're now set up as a referrer. Start referring customers to tradies and earn money for every successful lead.</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Your Dashboard</a>
      <p style="margin-top:24px;color:#666;font-size:14px">Browse businesses and generate your unique referral links to get started.</p>
    </div>
    """
    await _send(email, "Welcome to TradeRefer — start earning today!", html)


async def send_referrer_lead_unlocked(email: str, full_name: str, business_name: str, suburb: str, payout_dollars: float, available_date: str):
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
    await _send(email, f"You earned ${payout_dollars:.2f} from a referral!", html)


async def send_referrer_payout_processed(email: str, full_name: str, amount_dollars: float, method: str):
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
    await _send(email, f"Your ${amount_dollars:.2f} payout is on its way!", html)


# ─────────────────────────────────────────────
# CONSUMER EMAILS
# ─────────────────────────────────────────────

async def send_referrer_earning_available(email: str, full_name: str, amount_dollars: float, business_name: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Your earnings are now available!</h1>
      <p>Hi {full_name}, the 7-day hold period has passed and your referral earnings are ready to withdraw.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Business</td><td style="padding:8px">{business_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Available Now</td><td style="padding:8px;font-weight:bold;color:#ea580c">${amount_dollars:.2f}</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Withdraw Earnings</a>
    </div>
    """
    await _send(email, f"${amount_dollars:.2f} is ready to withdraw!", html)


async def send_consumer_on_the_way(email: str, consumer_name: str, business_name: str, pin: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">{business_name} is on the way!</h1>
      <p>Hi {consumer_name}, your tradie is heading to you. When they arrive, give them this PIN to confirm the job:</p>
      <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#666;margin:0 0 8px 0;font-size:14px">Your confirmation PIN</p>
        <p style="font-size:48px;font-weight:900;color:#ea580c;margin:0;letter-spacing:8px">{pin}</p>
        <p style="color:#666;margin:8px 0 0 0;font-size:13px">Valid for 4 hours</p>
      </div>
      <p style="color:#666;font-size:14px">Show this PIN to {business_name} when they arrive to confirm your job is complete.</p>
    </div>
    """
    await _send(email, f"Your PIN for {business_name} — they're on the way!", html)


async def send_business_dispute_raised(email: str, business_name: str, lead_id: str, reason: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Dispute Received</h1>
      <p>Hi {business_name}, your dispute has been received and is under review by our team.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Lead ID</td><td style="padding:8px;font-family:monospace">{lead_id[:8]}...</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Reason</td><td style="padding:8px">{reason}</td></tr>
      </table>
      <p style="color:#666">Our team will review your dispute within 2 business days and contact you with an outcome.</p>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Leads</a>
    </div>
    """
    await _send(email, "Your dispute has been received — under review", html)


async def send_dispute_resolved_business(email: str, business_name: str, outcome: str, admin_notes: Optional[str] = None):
    outcome_text = "confirmed in your favour" if outcome == "confirm" else "not upheld"
    colour = "#16a34a" if outcome == "confirm" else "#dc2626"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Dispute Resolved</h1>
      <p>Hi {business_name}, your dispute has been reviewed and resolved.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-weight:bold;color:{colour}">Outcome: {outcome_text.capitalize()}</p>
        {f'<p style="margin:8px 0 0 0;color:#666">{admin_notes}</p>' if admin_notes else ''}
      </div>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    </div>
    """
    await _send(email, f"Dispute resolved — {outcome_text}", html)


async def send_dispute_resolved_referrer(email: str, full_name: str, outcome: str, business_name: str, amount_dollars: float):
    if outcome == "confirm":
        msg = f"The dispute was resolved in the business's favour. Your ${amount_dollars:.2f} earning for a referral to {business_name} has been released to your wallet."
    else:
        msg = f"The dispute raised by {business_name} was not upheld. Your ${amount_dollars:.2f} earning has been cancelled. Contact support if you have questions."
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">Dispute Outcome</h1>
      <p>Hi {full_name},</p>
      <p>{msg}</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    </div>
    """
    await _send(email, "Update on your referral dispute", html)


async def send_new_message_notification(email: str, recipient_name: str, sender_name: str, message_preview: str, conversation_url: str):
    preview = message_preview[:120] + "..." if len(message_preview) > 120 else message_preview
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">New message from {sender_name}</h1>
      <p>Hi {recipient_name},</p>
      <div style="background:#f9f9f9;border-left:4px solid #ea580c;padding:16px;border-radius:4px;margin:16px 0">
        <p style="margin:0;color:#333;font-style:italic">"{preview}"</p>
      </div>
      <a href="{FRONTEND_URL}{conversation_url}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reply</a>
    </div>
    """
    await _send(email, f"New message from {sender_name}", html)


async def send_referrer_campaign_notification(email: str, full_name: str, business_name: str, campaign_title: str, promo_text: Optional[str], business_slug: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">🔥 New campaign from {business_name}</h1>
      <p>Hi {full_name}, one of your linked businesses has launched a new campaign you can share with customers.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:16px 0">
        <h2 style="margin:0 0 8px 0;color:#9a3412">{campaign_title}</h2>
        {f'<p style="margin:0;color:#666">{promo_text}</p>' if promo_text else ''}
      </div>
      <a href="{FRONTEND_URL}/b/{business_slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Share This Business</a>
    </div>
    """
    await _send(email, f"New campaign from {business_name} — share it now!", html)


async def send_business_new_review(email: str, business_name: str, referrer_name: str, rating: int, comment: Optional[str], slug: str):
    stars = "★" * rating + "☆" * (5 - rating)
    comment_html = f'<p style="margin:8px 0 0 0;color:#555;font-style:italic">"{comment}"</p>' if comment else ""
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">New Review for {business_name}</h1>
      <p>{referrer_name} has left a review on your referral profile.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:16px 0">
        <p style="margin:0;font-size:24px;color:#ea580c;letter-spacing:4px">{stars}</p>
        <p style="margin:4px 0 0 0;font-weight:bold;color:#333">{rating}/5 — by {referrer_name}</p>
        {comment_html}
      </div>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
    </div>
    """
    await _send(email, f"New {rating}-star review from {referrer_name}", html)


async def send_referrer_review_request(email: str, full_name: str, business_name: str, slug: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#ea580c">How was referring {business_name}?</h1>
      <p>Hi {full_name}, your referral to <strong>{business_name}</strong> was confirmed. We'd love to hear how the experience went — your review helps other referrers!</p>
      <a href="{FRONTEND_URL}/b/{slug}/refer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Leave a Review</a>
      <p style="margin-top:16px;color:#666;font-size:14px">It only takes 30 seconds.</p>
    </div>
    """
    await _send(email, f"How was referring {business_name}? Leave a quick review", html)


async def send_consumer_lead_confirmation(email: str, consumer_name: str, business_name: str, trade_category: str, job_description: str):
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
    await _send(email, f"Your request to {business_name} has been received", html)
