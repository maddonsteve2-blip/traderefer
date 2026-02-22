# 09 — Notifications

Every SMS, email, and push notification the platform sends. Exact copy included.

Providers:
- SMS: Twilio
- Email: SMTPtoGo
- Push: Firebase Cloud Messaging (FCM) — mobile app only

All messages must include an unsubscribe option (Spam Act compliance).
All SMS from number: `+61 4XX XXX XXX` (get Australian virtual number via Twilio)
All emails from: `noreply@traderefer.com.au` with reply-to `hello@traderefer.com.au`

---

## Notification Trigger Map

```
Event                          → Who notified     → Channel(s)
───────────────────────────────────────────────────────────────
Lead OTP verification          → Consumer         → SMS
Lead created (pending)         → Business         → Email
Lead created (pending)         → Referrer         → In-app + Email
Lead unlocked                  → Referrer         → In-app + SMS
On the way triggered           → Consumer         → SMS + Email
On the way triggered           → Business/Tradie  → SMS + Push
PIN confirmed                  → Consumer         → SMS
PIN confirmed                  → Business         → Push
PIN confirmed / earning avail  → Referrer         → In-app + SMS
Lead expiring (24hr warning)   → Business         → Email
Lead expired                   → Consumer         → SMS
Lead expired                   → Referrer         → In-app
Earning available (7-day)      → Referrer         → SMS + Email
Payout processed               → Referrer         → Email
Dispute received               → Business         → Email
Dispute resolved               → Business         → Email
Dispute resolved               → Referrer         → In-app
Welcome (signup)               → Business         → Email
Welcome (signup)               → Referrer         → Email
```

---

## SMS Messages (Twilio)

SMS must be under 160 characters to avoid splitting into two messages.
All must end with: `Reply STOP to opt out`

---

### SMS-001: OTP Verification (to Consumer)
**Trigger:** Consumer submits lead form
```
Your TradeRefer verification code is [OTP]. 
Valid for 10 minutes. Do not share this code.
Reply STOP to opt out
```

---

### SMS-002: Lead Unlocked (to Referrer)
**Trigger:** Business pays to unlock a referrer's lead
```
Great news! Your lead for [Business Name] was 
just unlocked. You've earned $[amount] (pending 
7 days). View: traderefer.com.au/dashboard
Reply STOP to opt out
```

---

### SMS-003: "On The Way" — Consumer
**Trigger:** Business taps "I'm On My Way"
```
Hi [Consumer First Name]! [Business Name] is on 
their way to you. Your connection code is [PIN]. 
Share this with them when they arrive. - TradeRefer
Reply STOP to opt out
```

---

### SMS-004: "On The Way" — Business/Tradie
**Trigger:** Business taps "I'm On My Way"
```
You're heading to [Consumer First Name] in 
[Suburb] for [job type]. Ask for their 4-digit 
code on arrival. Enter at: traderefer.com.au
Reply STOP to opt out
```

---

### SMS-005: PIN Confirmed (to Consumer)
**Trigger:** Tradie enters correct PIN
```
✅ Your visit with [Business Name] is confirmed! 
Thanks for using TradeRefer. - TradeRefer
Reply STOP to opt out
```

---

### SMS-006: Earning Available (to Referrer)
**Trigger:** 7-day hold expires OR PIN confirmed
```
Your $[amount] from [Business Name] is now 
available to withdraw! Log in to request payout: 
traderefer.com.au/dashboard
Reply STOP to opt out
```

---

### SMS-007: Lead Expired (to Consumer)
**Trigger:** Lead expires after 48hrs without unlock
```
[Business Name] wasn't able to take your enquiry 
right now. Browse other [category]s in your area: 
traderefer.com.au/businesses
Reply STOP to opt out
```

---

## Email Messages (SMTPtoGo)

Use HTML templates. Plain text fallback included.
Subject line is critical — avoid spam trigger words.

---

### EMAIL-001: Welcome — Business
**Trigger:** Business completes signup
**Subject:** `Your TradeRefer listing is live 🎉`

```
Hi [Name],

Your business is now listed on TradeRefer. Here's what happens next:

1. Referrers will start finding your listing and sharing it
2. When someone enquires, you'll get an email notification
3. Pay to unlock the lead and get their full contact details
4. Tap "I'm on my way" when you head out — confirms the connection

Your listing: traderefer.com.au/businesses/[slug]
Share it yourself to get referrals faster!

Your unlock fee is set at $[amount]. You can change this in your 
settings anytime: traderefer.com.au/dashboard/business/settings

Questions? Reply to this email.

The TradeRefer Team

---
TradeRefer Pty Ltd · hello@traderefer.com.au
Unsubscribe | Privacy Policy
```

---

### EMAIL-002: Welcome — Referrer
**Trigger:** Referrer completes signup
**Subject:** `Start earning with TradeRefer`

```
Hi [Name],

Welcome! Here's how to start earning:

1. Browse businesses you know and trust
2. Grab your personal referral link for any of them
3. Share it with anyone who might need their services
4. Earn [70%] of the unlock fee every time your lead is unlocked

Your earnings page: traderefer.com.au/dashboard/referrer

The more you share, the more you earn. Top referrers earn 
$200–$600/month just by recommending tradies they trust.

Browse businesses now: traderefer.com.au/businesses

The TradeRefer Team

---
TradeRefer Pty Ltd · hello@traderefer.com.au
Unsubscribe | Privacy Policy
```

---

### EMAIL-003: New Lead Waiting — Business
**Trigger:** Lead created (consumer OTP verified)
**Subject:** `🔔 New lead waiting — [Business Name]`

```
Hi [Name],

Someone in [Suburb] needs a [Trade Category].

What we know:
📍 Location: [Consumer Suburb]
🔧 Job: [Job Description preview — first 100 chars]
🕐 Submitted: [X minutes ago]

Full name, phone, and email are waiting for you.

Unlock this lead for $[amount]:
[UNLOCK THIS LEAD →] (big orange button)

⏰ This lead expires in 48 hours.

If you're not interested, you can dismiss it from your dashboard.

The TradeRefer Team

---
Unsubscribe from lead notifications | traderefer.com.au/dashboard
```

---

### EMAIL-004: Lead Expiring Soon — Business
**Trigger:** 24 hours before lead expires
**Subject:** `⚠️ Your lead expires in 24 hours — [Suburb]`

```
Hi [Name],

A lead in [Suburb] expires in 24 hours.

[Job description preview]

If you don't unlock it, it will expire and you'll lose this opportunity.

[UNLOCK FOR $[amount] →]

Or dismiss it if it's not the right fit for you.

The TradeRefer Team
```

---

### EMAIL-005: Lead Unlocked Confirmation — Business
**Trigger:** Business successfully unlocks a lead
**Subject:** `✅ Lead unlocked — here's [Consumer First Name]'s details`

```
Hi [Name],

You've unlocked a lead. Here are their full details:

Name:    [Consumer Full Name]
Phone:   [Phone]
Email:   [Email]
Suburb:  [Suburb]
Job:     [Full job description]

Next steps:
1. Call or text [Consumer First Name] now (they're expecting your contact)
2. When heading out, tap "I'm On My Way" in your dashboard
3. Ask for their 4-digit code when you arrive — confirms the connection

Your dashboard: traderefer.com.au/dashboard/business

The TradeRefer Team
```

---

### EMAIL-006: Earning Released — Referrer
**Trigger:** referrer_earning status changes to AVAILABLE
**Subject:** `💰 $[amount] is ready to withdraw — TradeRefer`

```
Hi [Name],

Your earnings from [Business Name] are now available!

Amount ready: $[amount]
Your total available balance: $[total]

[WITHDRAW NOW →]

Minimum withdrawal: $20.00
Paid every Friday to your PayPal or bank account.

Keep sharing — your next earning could be on the way now.

The TradeRefer Team
```

---

### EMAIL-007: Payout Processed — Referrer
**Trigger:** Admin marks payout as PAID
**Subject:** `✅ Your $[amount] payout has been sent`

```
Hi [Name],

Your payout has been sent:

Amount: $[amount]
Method: PayPal / Bank transfer
Destination: [masked destination — e.g. j***@email.com]
Reference: [payment_ref]

It should appear in your account within [1 business day for PayPal / 
1-3 business days for bank transfer].

Questions? Reply to this email.

Keep referring — your balance is currently $[new_balance].

The TradeRefer Team
```

---

### EMAIL-008: Dispute Received — Business
**Trigger:** Business submits dispute
**Subject:** `Your dispute has been received — TradeRefer`

```
Hi [Name],

We've received your dispute for the lead from [Suburb].

Reason: [reason]
Lead date: [date]
Amount: $[unlock_fee]

We'll review this and respond within 24 hours. We'll check:
- Phone verification status
- Delivery confirmation
- Account history

You'll hear back from us shortly.

The TradeRefer Team
```

---

### EMAIL-009: Dispute Resolved — Business (Refund Approved)
**Subject:** `✅ Your dispute has been resolved — refund issued`

```
Hi [Name],

We've reviewed your dispute and have issued a refund.

Amount refunded: $[amount]
Applied to: [Card / Wallet balance]

Your wallet balance is now: $[balance]

We take lead quality seriously. If you continue experiencing 
issues, please don't hesitate to contact us.

The TradeRefer Team
```

---

### EMAIL-010: Dispute Resolved — Business (Refund Denied)
**Subject:** `Update on your dispute — TradeRefer`

```
Hi [Name],

We've reviewed your dispute for the lead from [Suburb].

After reviewing our records, we're unable to issue a refund 
in this case because:

[Reason: e.g. "The consumer's phone number was verified via OTP 
and our records show the SMS was successfully delivered. We 
cannot issue refunds for consumers who don't respond after 
contact is made."]

We understand this can be frustrating. Our platform verifies 
every consumer's phone number before you're charged — this 
protects you from fake enquiries.

If you believe this decision is incorrect, please reply to 
this email and we'll escalate to a senior review.

The TradeRefer Team
```

---

## Push Notifications (FCM — Mobile App Only)

Short and action-oriented. Tapping always opens the relevant screen.

---

### PUSH-001: New Lead (to Business)
```
Title: 🔔 New lead in [Suburb]
Body: [Job type] job waiting. Expires in 48hrs. Tap to unlock.
Deep link: /dashboard/business/leads
```

---

### PUSH-002: On The Way Confirmed (to Business/Tradie)
```
Title: 🚗 On your way to [Consumer First Name]
Body: They have a 4-digit code ready. Ask for it when you arrive.
Deep link: /dashboard/business/leads/[lead_id]
```

---

### PUSH-003: PIN Confirmed (to Business)
```
Title: ✅ Visit confirmed!
Body: Your connection with [Consumer First Name] has been confirmed.
Deep link: /dashboard/business/leads/[lead_id]
```

---

### PUSH-004: Earning Available (to Referrer)
```
Title: 💰 $[amount] is ready to withdraw
Body: Your earning from [Business Name] is available. Tap to withdraw.
Deep link: /dashboard/referrer/withdraw
```

---

## In-App Notifications

Stored in a `notifications` table, shown in a bell icon dropdown.
Mark as read on click.

```
🔔 Your lead for Bob's Plumbing was unlocked — $5.60 pending   [2 min ago]
💰 Your $5.60 is now available to withdraw                     [7 days ago]
🔔 New lead submitted from your Bob's Plumbing link            [8 days ago]
```
