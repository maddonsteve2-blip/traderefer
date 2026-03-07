import os
import resend
import asyncio
from typing import Optional
from utils.logging_config import email_logger, error_logger

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDRESS = os.getenv("RESEND_FROM", "traderefer.au <no-reply@traderefer.au>")
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
# SHARED EMAIL LAYOUT HELPERS
# ─────────────────────────────────────────────

def _logo_bar() -> str:
    """Dark top bar with the traderefer logo (PNG icon + TRADE white / REFER orange)."""
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px 12px 0 0">
      <tr>
        <td style="padding:18px 24px">
          <a href="{FRONTEND_URL}" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px">
            <img src="{FRONTEND_URL}/logo-dark.png" alt="traderefer" width="36" height="36"
                 style="border-radius:8px;display:block" />
            <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;line-height:1;font-family:sans-serif">
              <span style="color:#ffffff">TRADE</span><span style="color:#ea580c">REFER</span>
            </span>
          </a>
        </td>
      </tr>
    </table>"""


def _email_footer(unsubscribe_note: str = "") -> str:
    return f"""
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;margin-top:8px">
      <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.6">
        &copy; {__import__('datetime').datetime.now().year} traderefer.au &nbsp;&mdash;&nbsp;
        <a href="{FRONTEND_URL}" style="color:#9ca3af">traderefer.au</a>
        {f' &nbsp;&mdash;&nbsp; {unsubscribe_note}' if unsubscribe_note else ''}
      </p>
    </div>"""


def _wrap(body_html: str, unsubscribe_note: str = "") -> str:
    """Wrap email body with the standard logo header and footer."""
    return f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      {_logo_bar()}
      <div style="padding:28px 24px">
        {body_html}
      </div>
      {_email_footer(unsubscribe_note)}
    </div>"""


# ─────────────────────────────────────────────
# BUSINESS EMAILS
# ─────────────────────────────────────────────

async def send_business_welcome(email: str, business_name: str, slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Welcome to traderefer.au, {business_name}!</h1>
      <p>Your business profile is live. Referrers can now start sending you leads.</p>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
      <p style="margin-top:24px">Head to your <a href="{FRONTEND_URL}/dashboard/business">dashboard</a> to manage leads and set your referral fee.</p>
    """
    await _send(email, f"Welcome to traderefer.au — {business_name} is live!", _wrap(body))


async def send_business_new_lead(email: str, business_name: str, consumer_name: str, suburb: str, job_description: str, lead_id: str, unlock_fee_dollars: float, is_first_lead: bool = False):
    fee_line = (
        '<p style="color:#16a34a;font-weight:bold">&#127881; Your first enquiry is free to unlock!</p>'
        if is_first_lead
        else f'<p>Unlock fee: <strong style="color:#ea580c">${unlock_fee_dollars:.2f}</strong></p>'
    )
    body = f"""
      <div style="background:#ea580c;padding:20px 24px;text-align:center;margin:-28px -24px 24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900">New enquiry for {business_name}</h1>
        <p style="color:#fed7aa;margin:8px 0 0;font-size:15px">A customer in {suburb} wants to hire you</p>
      </div>
      <p style="font-size:16px;color:#333">Hi {business_name},</p>
      <p style="font-size:16px;color:#333">You have a new customer enquiry waiting on <strong>traderefer.au</strong>. Full details are only revealed once you log in.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#666;font-size:14px">Enquiry from: <strong>{consumer_name[:1]}***</strong> &nbsp;|&nbsp; Location: <strong>{suburb}</strong></p>
      </div>
      {fee_line}
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:900;font-size:16px">Log In to View Enquiry &rarr;</a>
      </div>
    """
    await _send(email, f"New enquiry in {suburb} — log in to view", _wrap(body, "You\'re receiving this as a registered business on traderefer.au."))


async def send_business_lead_unlocked(email: str, business_name: str, consumer_name: str, consumer_phone: str, consumer_email: str, suburb: str, job_description: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Lead Unlocked — Contact Your Customer</h1>
      <p>You've successfully unlocked a lead. Here are the full contact details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Name</td><td style="padding:8px">{consumer_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Phone</td><td style="padding:8px"><a href="tel:{consumer_phone}">{consumer_phone}</a></td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:{consumer_email}">{consumer_email}</a></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Suburb</td><td style="padding:8px">{suburb}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Job</td><td style="padding:8px">{job_description}</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View in Dashboard</a>
    """
    await _send(email, f"Lead unlocked — {consumer_name} in {suburb}", _wrap(body))


# ─────────────────────────────────────────────
# REFERRER EMAILS
# ─────────────────────────────────────────────

async def send_referrer_welcome(email: str, full_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Welcome to traderefer.au, {full_name}!</h1>
      <p>You're now set up as a referrer. Start referring customers to tradies and earn money for every successful lead.</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Your Dashboard</a>
      <p style="margin-top:24px;color:#666;font-size:14px">Browse businesses and generate your unique referral links to get started.</p>
    """
    await _send(email, f"Welcome to traderefer.au — start earning today!", _wrap(body))


async def send_referrer_lead_unlocked(email: str, full_name: str, business_name: str, suburb: str, payout_dollars: float, available_date: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your referral earned you money!</h1>
      <p>Hi {full_name}, a lead you referred to <strong>{business_name}</strong> has been unlocked.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Business</td><td style="padding:8px">{business_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Suburb</td><td style="padding:8px">{suburb}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Your Earning</td><td style="padding:8px;font-weight:bold;color:#ea580c">${payout_dollars:.2f}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Available</td><td style="padding:8px">{available_date} (7-day hold)</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Earnings</a>
    """
    await _send(email, f"You earned ${payout_dollars:.2f} from a referral!", _wrap(body))


async def send_referrer_payout_processed(email: str, full_name: str, amount_dollars: float, method: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Payout Processed</h1>
      <p>Hi {full_name}, your withdrawal has been processed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Amount</td><td style="padding:8px;font-weight:bold;color:#ea580c">${amount_dollars:.2f}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Method</td><td style="padding:8px">{method.capitalize()}</td></tr>
      </table>
      <p style="color:#666;font-size:14px">Funds may take 1–3 business days to appear in your account depending on your bank.</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    """
    await _send(email, f"Your ${amount_dollars:.2f} payout is on its way!", _wrap(body))


# ─────────────────────────────────────────────
# CONSUMER EMAILS
# ─────────────────────────────────────────────

async def send_referrer_earning_available(email: str, full_name: str, amount_dollars: float, business_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your earnings are now available!</h1>
      <p>Hi {full_name}, the 7-day hold period has passed and your referral earnings are ready to withdraw.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Business</td><td style="padding:8px">{business_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Available Now</td><td style="padding:8px;font-weight:bold;color:#ea580c">${amount_dollars:.2f}</td></tr>
      </table>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Withdraw Earnings</a>
    """
    await _send(email, f"${amount_dollars:.2f} is ready to withdraw!", _wrap(body))


async def send_consumer_on_the_way(email: str, consumer_name: str, business_name: str, pin: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">{business_name} is on the way!</h1>
      <p>Hi {consumer_name}, your tradie is heading to you. When they arrive, give them this PIN to confirm the job:</p>
      <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#666;margin:0 0 8px 0;font-size:14px">Your confirmation PIN</p>
        <p style="font-size:48px;font-weight:900;color:#ea580c;margin:0;letter-spacing:8px">{pin}</p>
        <p style="color:#666;margin:8px 0 0 0;font-size:13px">Valid for 4 hours</p>
      </div>
      <p style="color:#666;font-size:14px">Show this PIN to {business_name} when they arrive to confirm your job is complete.</p>
    """
    await _send(email, f"Your PIN for {business_name} — they're on the way!", _wrap(body))


async def send_business_dispute_raised(email: str, business_name: str, lead_id: str, reason: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Dispute Received</h1>
      <p>Hi {business_name}, your dispute has been received and is under review by our team.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Lead ID</td><td style="padding:8px;font-family:monospace">{lead_id[:8]}...</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Reason</td><td style="padding:8px">{reason}</td></tr>
      </table>
      <p style="color:#666">Our team will review your dispute within 2 business days and contact you with an outcome.</p>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Leads</a>
    """
    await _send(email, "Your dispute has been received — under review", _wrap(body))


async def send_dispute_resolved_business(email: str, business_name: str, outcome: str, admin_notes: Optional[str] = None):
    outcome_text = "confirmed in your favour" if outcome == "confirm" else "not upheld"
    colour = "#16a34a" if outcome == "confirm" else "#dc2626"
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Dispute Resolved</h1>
      <p>Hi {business_name}, your dispute has been reviewed and resolved.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-weight:bold;color:{colour}">Outcome: {outcome_text.capitalize()}</p>
        {f'<p style="margin:8px 0 0 0;color:#666">{admin_notes}</p>' if admin_notes else ''}
      </div>
      <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    """
    await _send(email, f"Dispute resolved — {outcome_text}", _wrap(body))


async def send_dispute_resolved_referrer(email: str, full_name: str, outcome: str, business_name: str, amount_dollars: float):
    if outcome == "confirm":
        msg = f"The dispute was resolved in the business's favour. Your ${amount_dollars:.2f} earning for a referral to {business_name} has been released to your wallet."
    else:
        msg = f"The dispute raised by {business_name} was not upheld. Your ${amount_dollars:.2f} earning has been cancelled. Contact support if you have questions."
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Dispute Outcome</h1>
      <p>Hi {full_name},</p>
      <p>{msg}</p>
      <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
    """
    await _send(email, "Update on your referral dispute", _wrap(body))


async def send_new_message_notification(email: str, recipient_name: str, sender_name: str, message_preview: str, conversation_url: str):
    preview = message_preview[:120] + "..." if len(message_preview) > 120 else message_preview
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New message from {sender_name}</h1>
      <p>Hi {recipient_name},</p>
      <div style="background:#f9f9f9;border-left:4px solid #ea580c;padding:16px;border-radius:4px;margin:16px 0">
        <p style="margin:0;color:#333;font-style:italic">"{preview}"</p>
      </div>
      <a href="{FRONTEND_URL}{conversation_url}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reply</a>
    """
    await _send(email, f"New message from {sender_name}", _wrap(body))


async def send_referrer_campaign_notification(email: str, full_name: str, business_name: str, campaign_title: str, promo_text: Optional[str], business_slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">🔥 New campaign from {business_name}</h1>
      <p>Hi {full_name}, one of your linked businesses has launched a new campaign you can share with customers.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:16px 0">
        <h2 style="margin:0 0 8px 0;color:#9a3412">{campaign_title}</h2>
        {f'<p style="margin:0;color:#666">{promo_text}</p>' if promo_text else ''}
      </div>
      <a href="{FRONTEND_URL}/b/{business_slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Share This Business</a>
    """
    await _send(email, f"New campaign from {business_name} — share it now!", _wrap(body))


async def send_business_new_review(email: str, business_name: str, referrer_name: str, rating: int, comment: Optional[str], slug: str):
    stars = "★" * rating + "☆" * (5 - rating)
    comment_html = f'<p style="margin:8px 0 0 0;color:#555;font-style:italic">"{comment}"</p>' if comment else ""
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New Review for {business_name}</h1>
      <p>{referrer_name} has left a review on your referral profile.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:16px 0">
        <p style="margin:0;font-size:24px;color:#ea580c;letter-spacing:4px">{stars}</p>
        <p style="margin:4px 0 0 0;font-weight:bold;color:#333">{rating}/5 — by {referrer_name}</p>
        {comment_html}
      </div>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
    """
    await _send(email, f"New {rating}-star review from {referrer_name}", _wrap(body))


async def send_referrer_review_request(email: str, full_name: str, business_name: str, slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">How was referring {business_name}?</h1>
      <p>Hi {full_name}, your referral to <strong>{business_name}</strong> was confirmed. We'd love to hear how the experience went — your review helps other referrers!</p>
      <a href="{FRONTEND_URL}/b/{slug}/refer" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Leave a Review</a>
      <p style="margin-top:16px;color:#666;font-size:14px">It only takes 30 seconds.</p>
    """
    await _send(email, f"How was referring {business_name}? Leave a quick review", _wrap(body))


async def send_business_enquiry_teaser(email: str, business_name: str, business_id: str, slug: str, suburb: str, job_description: str):
    claim_url = f"{FRONTEND_URL}/onboarding/business?claim={business_id}&slug={slug}"
    body = f"""
      <div style="background:#ea580c;padding:20px 24px;text-align:center;margin:-28px -24px 24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900">You have a new enquiry!</h1>
        <p style="color:#fed7aa;margin:8px 0 0;font-size:15px">A customer in {suburb} wants to hire {business_name}</p>
      </div>
      <p style="font-size:16px;color:#333">Hi {business_name},</p>
      <p style="font-size:16px;color:#333">Someone in <strong>{suburb}</strong> just submitted an enquiry through your listing on <a href="{FRONTEND_URL}" style="color:#ea580c">traderefer.au</a>.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#666;font-size:14px">&#128274; Contact details and message are hidden until you claim your profile.</p>
      </div>
      <p style="font-size:16px;color:#333">Claim your <strong>free</strong> business profile to see who enquired and respond directly. Takes 2 minutes.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{claim_url}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:900;font-size:16px">Claim Your Free Profile &rarr;</a>
      </div>
      <p style="font-size:14px;color:#666;border-top:1px solid #eee;padding-top:16px;margin-top:20px">
        Your first enquiry is completely free to view. traderefer.au is a free directory — claiming your profile takes 2 minutes.
      </p>
    """
    await _send(email, f"New enquiry in {suburb} — claim your free profile on traderefer.au", _wrap(body, f"You received this because {business_name} is listed on traderefer.au. To opt out reply to this email."))


async def send_invitation_email(to_email: str, invitee_name: str, inviter_name: str, invitation_type: str, signup_url: str):
    if invitation_type == "business":
        headline = f"{inviter_name} invited you to get more leads — for free"
        sub = "Join TradeRefer and start receiving qualified job enquiries from referrers who know you."
        cta = "Claim Your Free Business Profile"
        benefit = "Get leads, grow your business, pay only when you unlock a customer's details."
    else:
        headline = f"{inviter_name} thinks you'd be great at this"
        sub = "Join TradeRefer and earn Prezzee gift cards just by recommending tradies to people you know."
        cta = "Start Earning Rewards"
        benefit = "Refer customers to tradies, earn $25+ Prezzee gift cards. No experience needed."
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">{headline}</h1>
      <p>Hi {invitee_name}, <strong>{inviter_name}</strong> has invited you to join <strong>traderefer.au</strong>.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#9a3412;font-weight:600">{sub}</p>
      </div>
      <p style="color:#555">{benefit}</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{signup_url}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          {cta} →
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px">This invitation was sent by {inviter_name} via traderefer.au.</p>
    """
    await _send(to_email, f"{inviter_name} invited you to join traderefer.au", _wrap(body))


async def send_referral_reward_email(email: str, full_name: str, friends_count: int, amount_dollars: float):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">🎉 You've earned a ${amount_dollars:.0f} gift card!</h1>
      <p>Congratulations {full_name}! You've successfully invited <strong>{friends_count} active friends</strong> to TradeRefer.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center">
        <p style="font-size:32px;font-weight:900;color:#16a34a;margin:0">${amount_dollars:.0f}</p>
        <p style="color:#15803d;font-weight:600;margin:4px 0 0">Prezzee Gift Card — on its way to your inbox!</p>
      </div>
      <p style="color:#555">Your Prezzee gift card will be delivered to this email address shortly. You can spend it at hundreds of retailers across Australia.</p>
      <p style="color:#555">Keep inviting friends — every 5 active referrals earns you another $25!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View My Dashboard →
        </a>
      </div>
    """
    await _send(email, f"🎉 Your ${amount_dollars:.0f} Prezzee gift card is on its way!", _wrap(body))


async def send_referrer_application_received(business_email: str, business_name: str, referrer_name: str, referrer_suburb: str, application_id: str, intro_message: str = None):
    intro_html = f'<div style="background:#f9f9f9;border-left:4px solid #ea580c;padding:12px 16px;border-radius:4px;margin:16px 0"><p style="margin:0;font-style:italic;color:#333">"{intro_message}"</p></div>' if intro_message else ""
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New referrer application from {referrer_name}</h1>
      <p><strong>{referrer_name}</strong> ({referrer_suburb}) has applied to join your referral network on TradeRefer.</p>
      {intro_html}
      <p>Review their profile and approve or decline — you have 72 hours before the application auto-expires.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/applications/{application_id}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Review Application →
        </a>
      </div>
    """
    await _send(business_email, f"New referrer application from {referrer_name} — review now", _wrap(body))


async def send_application_approved(referrer_email: str, referrer_name: str, business_name: str, business_slug: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">🎉 You've been approved by {business_name}!</h1>
      <p>Hi {referrer_name}, great news — <strong>{business_name}</strong> has approved your referrer application.</p>
      <p>You can now generate your referral link and start earning for every verified lead you send their way.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/refer/{business_slug}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Get Your Referral Link →
        </a>
      </div>
    """
    await _send(referrer_email, f"You're approved — start referring {business_name}!", _wrap(body))


async def send_application_rejected(referrer_email: str, referrer_name: str, business_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Update on your application to {business_name}</h1>
      <p>Hi {referrer_name}, unfortunately <strong>{business_name}</strong> has decided not to approve your referrer application at this time.</p>
      <p>There are thousands of other businesses on TradeRefer looking for great referrers — keep exploring!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/businesses"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Find Other Businesses →
        </a>
      </div>
    """
    await _send(referrer_email, f"Update on your application to {business_name}", _wrap(body))


async def send_application_expired(referrer_email: str, referrer_name: str, business_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your application to {business_name} has expired</h1>
      <p>Hi {referrer_name}, your referrer application to <strong>{business_name}</strong> expired after 72 hours with no response.</p>
      <p>This can happen when businesses are busy. You're welcome to apply again, or explore other businesses on our platform.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/businesses"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Find Other Businesses →
        </a>
      </div>
    """
    await _send(referrer_email, f"Your application to {business_name} has expired", _wrap(body))


async def send_application_reminder(business_email: str, business_name: str, referrer_name: str, application_id: str, reminder_number: int):
    hours_left = (3 - reminder_number) * 24
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Reminder {reminder_number}/3: Referrer application awaiting your review</h1>
      <p>Hi {business_name}, <strong>{referrer_name}</strong> is still waiting for your response on their referrer application.</p>
      <p style="color:#dc2626;font-weight:bold">⏰ Only ~{hours_left} hours left before this application auto-expires.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/applications/{application_id}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Review Now →
        </a>
      </div>
    """
    await _send(business_email, f"Reminder {reminder_number}/3: Action needed on referrer application", _wrap(body))


async def send_consumer_lead_confirmation(email: str, consumer_name: str, business_name: str, trade_category: str, job_description: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your request has been received</h1>
      <p>Hi {consumer_name}, your job request has been sent to <strong>{business_name}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Trade</td><td style="padding:8px">{trade_category}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Job</td><td style="padding:8px">{job_description[:300]}</td></tr>
      </table>
      <p style="color:#666">The business will be in touch with you soon. You may receive a call or SMS from them directly.</p>
    """
    await _send(email, f"Your request to {business_name} has been received", _wrap(body))
