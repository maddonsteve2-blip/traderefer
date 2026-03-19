import os
import resend
import asyncio
from typing import Optional
from utils.logging_config import email_logger, error_logger

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDRESS = os.getenv("RESEND_FROM", "traderefer.au <no-reply@traderefer.au>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traderefer.au")
BUSINESS_VERIFICATION_EMAIL = os.getenv("BUSINESS_VERIFICATION_EMAIL", "support@traderefer.au")
BUSINESS_VERIFICATION_OWNER_EMAIL = "stevejford007@gmail.com"


async def _send(to: str, subject: str, html: str):
    """Async email send using Resend. Runs in thread pool to avoid blocking."""
    if not resend.api_key:
        email_logger.error(f"RESEND_API_KEY not set ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â skipping email to {to}: {subject}")
        return
    
    # Validate from address
    if not FROM_ADDRESS or "@" not in FROM_ADDRESS:
        email_logger.error(f"Invalid RESEND_FROM address: {FROM_ADDRESS}")
    
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


async def _send_many(recipients: list[str], subject: str, html: str):
    for recipient in recipients:
        await _send(recipient, subject, html)


# ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
# SHARED EMAIL LAYOUT HELPERS
# ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

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


# ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
# BUSINESS EMAILS
# ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

async def send_business_welcome(email: str, business_name: str, slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Welcome to traderefer.au, {business_name}!</h1>
      <p>Your business profile is live. Referrers can now start sending you leads.</p>
      <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Profile</a>
      <p style="margin-top:24px">Head to your <a href="{FRONTEND_URL}/dashboard/business">dashboard</a> to manage leads and set your referral fee.</p>
    """
    await _send(email, f"Welcome to traderefer.au ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {business_name} is live!", _wrap(body))


async def send_business_claim_verification_code(email: str, business_name: str, code: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Verify your claim for {business_name}</h1>
      <p>Use the verification code below to confirm you manage this business on traderefer.au.</p>
      <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#666;margin:0 0 8px 0;font-size:14px">Your business verification code</p>
        <p style="font-size:42px;font-weight:900;color:#ea580c;margin:0;letter-spacing:8px">{code}</p>
        <p style="color:#666;margin:8px 0 0 0;font-size:13px">Expires in 10 minutes</p>
      </div>
      <p style="color:#666">If you did not request this code, you can ignore this email.</p>
    """
    await _send(email, f"Your TradeRefer claim code for {business_name}", _wrap(body))


async def send_business_claim_manual_review_notification(
    claimant_name: str,
    claimant_email: str,
    claimant_phone: Optional[str],
    business_name: str,
    business_slug: Optional[str],
    business_address: str,
    reason: str,
    government_id_url: str,
    business_proof_url: str,
    supporting_document_url: Optional[str] = None,
):
    recipients = [BUSINESS_VERIFICATION_OWNER_EMAIL]
    if BUSINESS_VERIFICATION_EMAIL and BUSINESS_VERIFICATION_EMAIL not in recipients:
        recipients.insert(0, BUSINESS_VERIFICATION_EMAIL)
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Manual business verification submitted</h1>
      <p>A claimant submitted paperwork for manual review on traderefer.au.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-weight:bold">Claimant</td><td style="padding:8px">{claimant_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Email</td><td style="padding:8px">{claimant_email}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Phone</td><td style="padding:8px">{claimant_phone or 'Not provided'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Business</td><td style="padding:8px">{business_name}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Slug</td><td style="padding:8px">{business_slug or 'Not provided'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;font-weight:bold">Address</td><td style="padding:8px">{business_address}</td></tr>
        <tr><td style="padding:8px;color:#666;font-weight:bold">Reason</td><td style="padding:8px">{reason}</td></tr>
      </table>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px 0"><a href="{government_id_url}" style="color:#ea580c;font-weight:bold">View government ID</a></p>
        <p style="margin:0 0 8px 0"><a href="{business_proof_url}" style="color:#ea580c;font-weight:bold">View business proof</a></p>
        {f'<p style="margin:0"><a href="{supporting_document_url}" style="color:#ea580c;font-weight:bold">View supporting document</a></p>' if supporting_document_url else ''}
      </div>
      <p style="color:#666">Review the paperwork and update the claim status in admin.</p>
    """
    await _send_many(recipients, f"Manual verification submitted ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {business_name}", _wrap(body))


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
    await _send(email, f"New enquiry in {suburb} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â log in to view", _wrap(body, "You're receiving this as a registered business on traderefer.au."))


async def send_business_lead_unlocked(email: str, business_name: str, consumer_name: str, consumer_phone: str, consumer_email: str, suburb: str, job_description: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Lead Unlocked ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Contact Your Customer</h1>
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
    await _send(email, f"Lead unlocked ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {consumer_name} in {suburb}", _wrap(body))


async def send_business_enquiry_teaser(email: str, business_name: str, business_id: str, slug: str, suburb: str, job_description: str):
    claim_url = f"{FRONTEND_URL}/claim/{slug}"
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
        Your first enquiry is completely free to view. traderefer.au is a free directory ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â claiming your profile takes 2 minutes.
      </p>
    """
    await _send(email, f"New enquiry in {suburb} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â claim your free profile on traderefer.au", _wrap(body, f"You received this because {business_name} is listed on traderefer.au. To opt out reply to this email."))


async def send_invitation_email(to_email: str, invitee_name: str, inviter_name: str, invitation_type: str, signup_url: str):
    if invitation_type == "business":
        headline = f"{inviter_name} invited you to get more leads ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â for free"
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
          {cta} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px">This invitation was sent by {inviter_name} via traderefer.au.</p>
    """
    await _send(to_email, f"{inviter_name} invited you to join traderefer.au", _wrap(body))


async def send_referral_reward_email(email: str, full_name: str, friends_count: int, amount_dollars: float):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â‚¬Â° You've earned a ${amount_dollars:.0f} gift card!</h1>
      <p>Congratulations {full_name}! You've successfully invited <strong>{friends_count} active friends</strong> to TradeRefer.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center">
        <p style="font-size:32px;font-weight:900;color:#16a34a;margin:0">${amount_dollars:.0f}</p>
        <p style="color:#15803d;font-weight:600;margin:4px 0 0">Prezzee Gift Card ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â on its way to your inbox!</p>
      </div>
      <p style="color:#555">Your Prezzee gift card will be delivered to this email address shortly. You can spend it at hundreds of retailers across Australia.</p>
      <p style="color:#555">Keep inviting friends ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â every 5 active referrals earns you another $25!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View My Dashboard ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        </a>
      </div>
    """
    await _send(email, f"ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â‚¬Â° Your ${amount_dollars:.0f} Prezzee gift card is on its way!", _wrap(body))


async def send_referrer_application_received(business_email: str, business_name: str, referrer_name: str, referrer_suburb: str, application_id: str, intro_message: str = None):
    intro_html = f'<div style="background:#f9f9f9;border-left:4px solid #ea580c;padding:12px 16px;border-radius:4px;margin:16px 0"><p style="margin:0;font-style:italic;color:#333">"{intro_message}"</p></div>' if intro_message else ""
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New referrer application from {referrer_name}</h1>
      <p><strong>{referrer_name}</strong> ({referrer_suburb}) has applied to join your referral network on TradeRefer.</p>
      {intro_html}
      <p>Review their profile and approve or decline ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â you have 72 hours before the application auto-expires.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/applications/{application_id}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Review Application ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        </a>
      </div>
    """
    await _send(business_email, f"New referrer application from {referrer_name} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â review now", _wrap(body))


async def send_application_approved(referrer_email: str, referrer_name: str, business_name: str, business_slug: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â‚¬Â° You've been approved by {business_name}!</h1>
      <p>Hi {referrer_name}, great news ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â <strong>{business_name}</strong> has approved your referrer application.</p>
      <p>You can now open your command centre, copy your public referral link, and submit leads for AI follow-up and SMS verification.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/manage?business={business_slug}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
           Open Your Command Centre ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        </a>
      </div>
    """
    await _send(referrer_email, f"You're approved ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â manage {business_name} now!", _wrap(body))


async def send_application_rejected(referrer_email: str, referrer_name: str, business_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Update on your application to {business_name}</h1>
      <p>Hi {referrer_name}, unfortunately <strong>{business_name}</strong> has decided not to approve your referrer application at this time.</p>
      <p>There are thousands of other businesses on TradeRefer looking for great referrers ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â keep exploring!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/businesses"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Find Other Businesses ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
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
          Find Other Businesses ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        </a>
      </div>
    """
    await _send(referrer_email, f"Your application to {business_name} has expired", _wrap(body))


async def send_application_reminder(business_email: str, business_name: str, referrer_name: str, application_id: str, reminder_number: int):
    hours_left = (3 - reminder_number) * 24
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Reminder {reminder_number}/3: Referrer application awaiting your review</h1>
      <p>Hi {business_name}, <strong>{referrer_name}</strong> is still waiting for your response on their referrer application.</p>
      <p style="color:#dc2626;font-weight:bold">ÃƒÂ¢Ã‚ÂÃ‚Â° Only ~{hours_left} hours left before this application auto-expires.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/applications/{application_id}"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Review Now ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
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


async def send_consumer_on_the_way(email: str, consumer_name: str, business_name: str, pin: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">{business_name} is on the way</h1>
      <p>Hi {consumer_name}, your tradie from <strong>{business_name}</strong> is on the way to you now.</p>
      <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#666;margin:0 0 8px 0;font-size:14px">Your arrival PIN</p>
        <p style="font-size:42px;font-weight:900;color:#ea580c;margin:0;letter-spacing:8px">{pin}</p>
        <p style="color:#666;margin:8px 0 0 0;font-size:13px">Show this PIN when they arrive. It expires in 4 hours.</p>
      </div>
      <p style="color:#666">When the tradie arrives, show them this PIN so they can confirm the visit in TradeRefer.</p>
    """
    await _send(email, f"{business_name} is on the way  your PIN is {pin}", _wrap(body))

async def send_referrer_lead_unlocked(email: str, full_name: str, business_name: str, suburb: str, payout_dollars: float, available_date: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">Your referral has been confirmed </h1>
      <p>Hi {full_name}, your referral for <strong>{business_name}</strong> in <strong>{suburb}</strong> has been confirmed.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center">
        <p style="font-size:32px;font-weight:900;color:#16a34a;margin:0">${payout_dollars:.2f}</p>
        <p style="color:#15803d;font-weight:600;margin:4px 0 0">Available in your wallet on {available_date}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View My Dashboard 
        </a>
      </div>
    """
    await _send(email, f"Referral confirmed  ${payout_dollars:.2f} from {business_name}", _wrap(body))


async def send_business_dispute_raised(email: str, business_name: str, lead_id: str, reason: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Dispute received for lead {lead_id[:8]}</h1>
      <p>Hi {business_name}, your dispute has been recorded and our team will review it.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#9a3412;font-weight:600">Reason provided: {reason}</p>
      </div>
      <p style="color:#555">Well contact you if we need more information.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/leads"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View Leads Dashboard 
        </a>
      </div>
    """
    await _send(email, f"Dispute received for lead {lead_id[:8]}", _wrap(body))
async def send_referrer_welcome(email: str, full_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Welcome to TradeRefer, {full_name}!</h1>
      <p>Your referrer profile is ready. You can now join businesses, submit leads, and track rewards from your dashboard.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Open Referrer Dashboard </a>
      </div>
    """
    await _send(email, "Welcome to TradeRefer", _wrap(body))


async def send_referrer_payout_processed(email: str, full_name: str, amount_dollars: float, method: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">Your withdrawal has been processed</h1>
      <p>Hi {full_name}, your withdrawal of <strong>${amount_dollars:.2f}</strong> has been processed.</p>
      <p>Method: <strong>{method}</strong></p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Withdrawals </a>
      </div>
    """
    await _send(email, f"Withdrawal processed  ${amount_dollars:.2f}", _wrap(body))


async def send_business_new_review(email: str, business_name: str, referrer_name: str, rating: int, comment: Optional[str], slug: str):
    stars = "" * rating + "" * (5 - rating)
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You received a new review</h1>
      <p><strong>{referrer_name}</strong> left a review for <strong>{business_name}</strong>.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-size:24px;color:#ea580c;letter-spacing:4px">{stars}</p>
        <p style="margin:8px 0 0 0;color:#555">{comment or 'No written comment provided.'}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Business Profile </a>
      </div>
    """
    await _send(email, f"New {rating}-star review for {business_name}", _wrap(body))


async def send_referrer_review_request(email: str, full_name: str, business_name: str, rating: Optional[int] = None, comment: Optional[str] = None):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You received feedback from {business_name}</h1>
      <p>Hi {full_name}, <strong>{business_name}</strong> sent you new feedback in TradeRefer.</p>
      {f'<p><strong>Rating:</strong> {rating}/5</p>' if rating is not None else ''}
      {f'<p><strong>Comment:</strong> {comment}</p>' if comment else ''}
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Dashboard </a>
      </div>
    """
    await _send(email, f"Feedback from {business_name}", _wrap(body))


async def send_referrer_earning_available(email: str, full_name: str, amount_dollars: float, business_name: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">Your earning is now available</h1>
      <p>Hi {full_name}, your earning from <strong>{business_name}</strong> is now available in your wallet.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center">
        <p style="font-size:32px;font-weight:900;color:#16a34a;margin:0">${amount_dollars:.2f}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Withdraw Earnings </a>
      </div>
    """
    await _send(email, f"${amount_dollars:.2f} is now available", _wrap(body))


async def send_dispute_resolved_business(email: str, business_name: str, outcome: str, admin_notes: Optional[str] = None):
    outcome_label = 'confirmed' if outcome == 'confirm' else 'rejected'
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your dispute has been resolved</h1>
      <p>Hi {business_name}, your dispute has been <strong>{outcome_label}</strong>.</p>
      <p>{admin_notes or 'No additional admin notes were provided.'}</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Leads </a>
      </div>
    """
    await _send(email, f"Dispute resolved for {business_name}", _wrap(body))


async def send_dispute_resolved_referrer(email: str, full_name: str, outcome: str, business_name: str, amount_dollars: float):
    outcome_label = 'confirmed' if outcome == 'confirm' else 'rejected'
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">A disputed referral has been resolved</h1>
      <p>Hi {full_name}, the dispute for your referral with <strong>{business_name}</strong> has been <strong>{outcome_label}</strong>.</p>
      <p>Amount affected: <strong>${amount_dollars:.2f}</strong></p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Dashboard </a>
      </div>
    """
    await _send(email, f"Dispute resolved for {business_name}", _wrap(body))


async def send_new_message_notification(email: str, recipient_name: str, sender_name: str, message_preview: str, conversation_url: str):
    preview = message_preview[:180] + ('...' if len(message_preview) > 180 else '')
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You have a new message</h1>
      <p>Hi {recipient_name}, <strong>{sender_name}</strong> sent you a new message.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#555">{preview}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}{conversation_url}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Reply in Dashboard </a>
      </div>
    """
    await _send(email, f"New message from {sender_name}", _wrap(body))


async def send_referrer_campaign_notification(email: str, full_name: str, business_name: str, campaign_title: str, promo_text: Optional[str], business_slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New campaign from {business_name}</h1>
      <p>Hi {full_name}, <strong>{business_name}</strong> launched a new campaign for referrers.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-weight:700;color:#9a3412">{campaign_title}</p>
        <p style="margin:8px 0 0 0;color:#555">{promo_text or 'Open the campaign to see the latest bonus details.'}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/b/{business_slug}/refer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Campaign </a>
      </div>
    """
    await _send(email, f"New campaign from {business_name}", _wrap(body))


async def send_email(to_email: str, subject: str, html_body: str):
    await _send(to_email, subject, html_body)


async def send_referrer_welcome(email: str, full_name: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Welcome to TradeRefer, {full_name}!</h1>
      <p>Your referrer profile is ready. You can now join businesses, submit leads, and track rewards from your dashboard.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Open Referrer Dashboard </a>
      </div>
    """
    await _send(email, "Welcome to TradeRefer", _wrap(body))


async def send_referrer_payout_processed(email: str, full_name: str, amount_dollars: float, method: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">Your withdrawal has been processed</h1>
      <p>Hi {full_name}, your withdrawal of <strong>${amount_dollars:.2f}</strong> has been processed.</p>
      <p>Method: <strong>{method}</strong></p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Withdrawals </a>
      </div>
    """
    await _send(email, f"Withdrawal processed  ${amount_dollars:.2f}", _wrap(body))


async def send_business_new_review(email: str, business_name: str, referrer_name: str, rating: int, comment: Optional[str], slug: str):
    stars = "" * rating + "" * (5 - rating)
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You received a new review</h1>
      <p><strong>{referrer_name}</strong> left a review for <strong>{business_name}</strong>.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-size:24px;color:#ea580c;letter-spacing:4px">{stars}</p>
        <p style="margin:8px 0 0 0;color:#555">{comment or 'No written comment provided.'}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/b/{slug}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Business Profile </a>
      </div>
    """
    await _send(email, f"New {rating}-star review for {business_name}", _wrap(body))


async def send_referrer_review_request(email: str, full_name: str, business_name: str, rating: Optional[int] = None, comment: Optional[str] = None):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You received feedback from {business_name}</h1>
      <p>Hi {full_name}, <strong>{business_name}</strong> sent you new feedback in TradeRefer.</p>
      {f'<p><strong>Rating:</strong> {rating}/5</p>' if rating is not None else ''}
      {f'<p><strong>Comment:</strong> {comment}</p>' if comment else ''}
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Dashboard </a>
      </div>
    """
    await _send(email, f"Feedback from {business_name}", _wrap(body))


async def send_referrer_earning_available(email: str, full_name: str, amount_dollars: float, business_name: str):
    body = f"""
      <h1 style="color:#16a34a;margin-top:0">Your earning is now available</h1>
      <p>Hi {full_name}, your earning from <strong>{business_name}</strong> is now available in your wallet.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center">
        <p style="font-size:32px;font-weight:900;color:#16a34a;margin:0">${amount_dollars:.2f}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Withdraw Earnings </a>
      </div>
    """
    await _send(email, f"${amount_dollars:.2f} is now available", _wrap(body))


async def send_dispute_resolved_business(email: str, business_name: str, outcome: str, admin_notes: Optional[str] = None):
    outcome_label = 'confirmed' if outcome == 'confirm' else 'rejected'
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">Your dispute has been resolved</h1>
      <p>Hi {business_name}, your dispute has been <strong>{outcome_label}</strong>.</p>
      <p>{admin_notes or 'No additional admin notes were provided.'}</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/business/leads" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Leads </a>
      </div>
    """
    await _send(email, f"Dispute resolved for {business_name}", _wrap(body))


async def send_dispute_resolved_referrer(email: str, full_name: str, outcome: str, business_name: str, amount_dollars: float):
    outcome_label = 'confirmed' if outcome == 'confirm' else 'rejected'
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">A disputed referral has been resolved</h1>
      <p>Hi {full_name}, the dispute for your referral with <strong>{business_name}</strong> has been <strong>{outcome_label}</strong>.</p>
      <p>Amount affected: <strong>${amount_dollars:.2f}</strong></p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Dashboard </a>
      </div>
    """
    await _send(email, f"Dispute resolved for {business_name}", _wrap(body))


async def send_new_message_notification(email: str, recipient_name: str, sender_name: str, message_preview: str, conversation_url: str):
    preview = message_preview[:180] + ('...' if len(message_preview) > 180 else '')
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">You have a new message</h1>
      <p>Hi {recipient_name}, <strong>{sender_name}</strong> sent you a new message.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#555">{preview}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}{conversation_url}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">Reply in Dashboard </a>
      </div>
    """
    await _send(email, f"New message from {sender_name}", _wrap(body))


async def send_referrer_campaign_notification(email: str, full_name: str, business_name: str, campaign_title: str, promo_text: Optional[str], business_slug: str):
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">New campaign from {business_name}</h1>
      <p>Hi {full_name}, <strong>{business_name}</strong> launched a new campaign for referrers.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-weight:700;color:#9a3412">{campaign_title}</p>
        <p style="margin:8px 0 0 0;color:#555">{promo_text or 'Open the campaign to see the latest bonus details.'}</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/b/{business_slug}/refer" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:900">View Campaign </a>
      </div>
    """
    await _send(email, f"New campaign from {business_name}", _wrap(body))

async def send_referrer_reward_claimable_email(email: str, full_name: str, balance_dollars: float):
    """Notify referrer that their balance is claimable ($25–$249). Drive them to claim manually."""
    body = f"""
      <div style="background:#ea580c;padding:20px 24px;text-align:center;margin:-28px -24px 24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900">🎁 You have claimable Prezzee credit!</h1>
        <p style="color:#fed7aa;margin:8px 0 0;font-size:15px">Log in to claim your gift card now</p>
      </div>
      <p style="font-size:16px;color:#333">Hi {full_name},</p>
      <p style="font-size:16px;color:#333">Your TradeRefer reward balance has reached <strong>${balance_dollars:.2f}</strong> — enough to claim a Prezzee gift card!</p>
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="font-size:40px;font-weight:900;color:#16a34a;margin:0">${balance_dollars:.2f}</p>
        <p style="color:#15803d;font-weight:700;margin:8px 0 0;font-size:16px">Ready to claim as a Prezzee gift card</p>
      </div>
      <p style="color:#555;font-size:15px">You can claim anywhere from <strong>$25 up to $74.99</strong> at a time. Spend it at 400+ stores including Woolworths, Bunnings, JB Hi-Fi and more.</p>
      <p style="color:#555;font-size:15px">Your balance will <strong>auto-pay at $74.99</strong>, or you can claim it manually anytime. Add an ABN to unlock claims up to $300.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Claim My Gift Card →
        </a>
      </div>
    """
    await _send(email, f"🎁 ${balance_dollars:.2f} in Prezzee credit is ready to claim!", _wrap(body, "You're receiving this as a referrer on traderefer.au."))


async def send_referrer_declaration_needed_email(email: str, full_name: str, balance_dollars: float):
    """Notify referrer that their balance exceeds $75 and a tax declaration is needed."""
    first = full_name.split()[0] if full_name else "there"
    body = f"""
      <div style="background:#2563eb;padding:20px 24px;text-align:center;margin:-28px -24px 24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900">📋 Quick declaration needed</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px">Unlock your ${balance_dollars:.2f} reward balance</p>
      </div>
      <p style="font-size:16px;color:#333">Hi {first},</p>
      <p style="font-size:16px;color:#333">Your TradeRefer reward balance is <strong>${balance_dollars:.2f}</strong> — great work!</p>
      <p style="font-size:16px;color:#333">Australian tax law requires a quick declaration (or ABN) for payouts over $75. It takes about <strong>10 seconds</strong> and most fields are pre-filled.</p>
      <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="font-size:40px;font-weight:900;color:#2563eb;margin:0">${balance_dollars:.2f}</p>
        <p style="color:#1d4ed8;font-weight:700;margin:8px 0 0;font-size:16px">Complete declaration to claim</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/withdraw"
           style="background:#2563eb;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Complete Declaration & Claim →
        </a>
      </div>
      <p style="color:#888;font-size:13px">Alternatively, if you have an ABN, you can enter it on the claim page to skip the declaration entirely.</p>
    """
    await _send(email, f"📋 Quick declaration needed to claim ${balance_dollars:.2f}", _wrap(body, "You're receiving this as a referrer on traderefer.au."))


async def send_referrer_prezzee_issued_email(email: str, full_name: str, amount_dollars: float):
    """Notify referrer that their Prezzee gift card was automatically issued at $74.99."""
    body = f"""
      <div style="background:#16a34a;padding:20px 24px;text-align:center;margin:-28px -24px 24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900">🎉 Your Prezzee gift card is on its way!</h1>
        <p style="color:#bbf7d0;margin:8px 0 0;font-size:15px">Automatically issued — check your inbox</p>
      </div>
      <p style="font-size:16px;color:#333">Hi {full_name},</p>
      <p style="font-size:16px;color:#333">Your TradeRefer balance reached <strong>${amount_dollars:.0f}</strong>, so we've automatically issued your Prezzee Swap gift card!</p>
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="font-size:40px;font-weight:900;color:#16a34a;margin:0">${amount_dollars:.2f}</p>
        <p style="color:#15803d;font-weight:700;margin:8px 0 0;font-size:16px">Prezzee Swap Gift Card — delivered to this email 🎁</p>
      </div>
      <p style="color:#555;font-size:15px">Check your inbox for a separate email from <strong>Prezzee</strong> with your gift card link. You can spend it at 400+ retailers across Australia.</p>
      <p style="color:#555;font-size:15px">Keep referring — every confirmed job earns you more credit!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View My Dashboard →
        </a>
      </div>
    """
    await _send(email, f"🎉 Your ${amount_dollars:.2f} Prezzee gift card has been issued!", _wrap(body, "You're receiving this as a referrer on traderefer.au."))


async def send_badge_unlock_email(email: str, full_name: str, badge_label: str, badge_desc: str, next_badge_label: str | None = None):
    next_section = ""
    if next_badge_label:
        next_section = f"""
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-size:13px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.05em">Next badge to unlock</p>
        <p style="margin:6px 0 0;font-size:15px;font-weight:600;color:#c2410c">{next_badge_label}</p>
      </div>
    """
    body = f"""
      <h1 style="color:#ea580c;margin-top:0">🎖️ Badge Unlocked: {badge_label}!</h1>
      <p>Congrats {full_name} — you just earned a new badge on TradeRefer.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center">
        <p style="font-size:28px;font-weight:900;color:#16a34a;margin:0">🎖️ {badge_label}</p>
        <p style="color:#15803d;font-weight:600;margin:8px 0 0;font-size:15px">{badge_desc}</p>
      </div>
      <p style="color:#555">This badge is now displayed on your public referrer profile — businesses can see it when reviewing your application.</p>
      {next_section}
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer/profile"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          View My Profile →
        </a>
      </div>
    """
    await _send(email, f"🎖️ You just unlocked: {badge_label}!", _wrap(body))


async def send_reengagement_email(email: str, full_name: str, next_badge_label: str | None, days_inactive: int):
    """Re-engagement nudge for users who have been offline 7/14/30 days."""
    if next_badge_label:
        subject = f"You're close to unlocking your next badge, {full_name.split()[0]}"
        headline = f"Don't stop now, {full_name.split()[0]}!"
        body_text = f"You're on your way to unlocking <strong>{next_badge_label}</strong> on TradeRefer. Log back in and keep the momentum going."
    elif days_inactive >= 30:
        subject = f"We miss you, {full_name.split()[0]} — here's what you've missed"
        headline = f"Come back, {full_name.split()[0]}"
        body_text = "Businesses in your area are looking for referrers right now. Your profile is live and ready to attract new partnerships."
    else:
        subject = f"New opportunities on TradeRefer, {full_name.split()[0]}"
        headline = f"New opportunities waiting, {full_name.split()[0]}"
        body_text = "There are new businesses in your area accepting referrer applications. Log in to grow your network."

    body = f"""
      <h1 style="color:#ea580c;margin-top:0">{headline}</h1>
      <p>{body_text}</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{FRONTEND_URL}/dashboard/referrer"
           style="background:#ea580c;color:#fff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">
          Open My Dashboard →
        </a>
      </div>
      <p style="color:#888;font-size:13px">You're receiving this because you're a referrer on TradeRefer. <a href="{FRONTEND_URL}/dashboard/referrer" style="color:#888">Manage notifications</a></p>
    """
    await _send(email, subject, _wrap(body))