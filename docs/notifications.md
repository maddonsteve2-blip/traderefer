# Notification System — traderefer.au

## Overview
When a customer submits an enquiry/quote form on any business profile page, the system
fires both email (Resend) and SMS (Twilio) notifications to the business.
The full enquiry details are **never** sent — the goal is to drive the business to log in
and unlock the lead on the platform.

---

## Channels

| Channel | Provider | Config var(s) |
|---------|----------|--------------|
| Email   | Resend   | `RESEND_API_KEY`, `RESEND_FROM` |
| SMS     | Twilio   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |

See `apps/api/.env.example` for all required environment variables.

---

## Notification Logic (triggered on lead creation)

### Path A — Claimed business (`is_claimed = true`)
Business owner has a Clerk account and an active dashboard.

**Email** (`send_business_new_lead`):
- Subject: `New enquiry in [suburb] — log in to view`
- Body: Teaser only — first initial of customer name + suburb + unlock fee (or "free!" if first lead)
- CTA: `Log In to View Enquiry →` → `/dashboard/business/leads`

**SMS** (`send_sms_claimed_new_lead`):
```
traderefer.au: New enquiry for [Business Name] from a customer in [suburb].
Log in to view and respond: traderefer.au/dashboard/business/leads
Reply STOP to opt out.
```

### Path B — Unclaimed business (`is_claimed = false`)
Business was seeded from Google Places. Has phone/email from Google but no Clerk owner.

**Email** (`send_business_enquiry_teaser`):
- Subject: `New enquiry in [suburb] — claim your free profile on traderefer.au`
- Body: Teaser — suburb only, no job description, lock icon message
- CTA: `Claim Your Free Profile →` → `/onboarding/business?claim=[id]&slug=[slug]`

**SMS** (`send_sms_unclaimed_teaser`):
```
traderefer.au: A customer in [suburb] just enquired about [Business Name].
Claim your free profile to view and respond: traderefer.au/onboarding/business?slug=[slug]
Reply STOP to opt out.
```

---

## First-Lead-Free Logic
- On every lead submission, a `COUNT(*)` query checks existing leads for that `business_id`
- If `count == 0` → `unlock_fee_cents = 0` (stored in the lead row)
- If `count > 0` → `unlock_fee_cents = referral_fee + platform_fee (20%)`
- This applies to **all** leads regardless of whether they came via a referral link or direct from the profile page
- The `is_first_lead` flag is passed to `send_business_new_lead` to show the "free!" callout in the email

---

## Files Modified

| File | Change |
|------|--------|
| `apps/api/services/email.py` | Fixed branding to "traderefer.au"; updated `send_business_new_lead` to teaser-only with first-free banner; updated `send_business_enquiry_teaser` to hide job description |
| `apps/api/services/sms.py` | **NEW** — Twilio SMS service with `send_sms_claimed_new_lead` and `send_sms_unclaimed_teaser` |
| `apps/api/routers/leads.py` | Added SMS import; added first-lead-free count check; updated business fetch to include `business_phone`; hooked SMS alongside email for both paths |
| `apps/api/requirements.txt` | Added `twilio` |
| `apps/api/.env.example` | **NEW** — All required env vars documented |

---

## What's Done ✅
- [x] Resend email already integrated and working
- [x] Email copy updated — teaser-only, no full job description exposed
- [x] Branding fixed to "traderefer.au" throughout email service
- [x] First-lead-free logic implemented (stored as `unlock_fee_cents = 0` on lead row)
- [x] Twilio SMS service created (`apps/api/services/sms.py`)
- [x] AU mobile number normalisation to E.164 (+61 prefix)
- [x] SMS and email both fire on lead creation for claimed AND unclaimed businesses
- [x] Graceful fallback — if Twilio/Resend credentials not set, logs warning and skips (no crash)
- [x] `.env.example` created with all required vars documented

## What's Left ❌

### Twilio setup (waiting on credentials from owner)
1. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` to production `.env`
   on the API server (Railway / Render / etc.)
2. Verify Twilio number supports SMS in Australia
3. If using alphanumeric sender ID in AU, register with ACMA (required for AU)

### Optional improvements
- [ ] Deduplicate notifications — add a `notified_at` timestamp to the `leads` table to prevent
      double-sending if the endpoint is retried
- [ ] Opt-out tracking — store `sms_opted_out` / `email_opted_out` flags on `businesses` table
      and check before sending
- [ ] Unsubscribe endpoint — `GET /businesses/{id}/unsubscribe?token=...` to handle email opt-outs
- [ ] SMS delivery receipts — Twilio webhook to track `delivered` / `failed` status
- [ ] Rate limit per business — max 1 notification per business per 24h to avoid spam if same
      business gets multiple enquiries in quick succession (currently sends on every lead)

---

## Testing

### Test email (no real send needed)
```bash
# With RESEND_API_KEY unset, emails log to console and skip gracefully
# Set RESEND_API_KEY in .env to test real sends
```

### Test SMS locally
```bash
# Twilio test credentials (won't charge):
# TWILIO_ACCOUNT_SID=ACtest...
# TWILIO_AUTH_TOKEN=test_auth_token
# Use Twilio's magic test numbers: +15005550006 (always succeeds)
```

### Submit a test enquiry
```
POST /leads/
{
  "business_id": "<any business uuid>",
  "consumer_name": "Test User",
  "consumer_phone": "0400000000",
  "consumer_email": "test@example.com",
  "consumer_suburb": "Melbourne",
  "job_description": "Test job"
}
```
Check logs for `Email sent successfully` and `SMS sent` entries.
