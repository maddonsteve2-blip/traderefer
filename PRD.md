# TradeRefer — Product Requirements Document

**Version:** 1.0  
**Status:** Active  
**Last Updated:** February 2026  
**Owner:** Founder  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Users & Personas](#4-users--personas)
5. [Core Product Requirements](#5-core-product-requirements)
6. [Feature Specifications](#6-feature-specifications)
7. [Technical Requirements](#7-technical-requirements)
8. [Payment Requirements](#8-payment-requirements)
9. [Trust & Safety Requirements](#9-trust--safety-requirements)
10. [Notification Requirements](#10-notification-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Launch Plan](#12-launch-plan)
13. [Constraints & Decisions](#13-constraints--decisions)

---

## 1. Executive Summary

TradeRefer is an Australian referral-powered lead marketplace for trade and home service businesses. It lets anyone earn money by sending verified leads to local tradies, and proves the connection happened with a real-world PIN exchange.

**The core thesis:** 70% of Australian tradies say word-of-mouth is their best source of work. TradeRefer digitises that — turning informal recommendations into a structured, rewarded, and verified system that benefits all three parties simultaneously.

**Market opportunity:** $73B residential trades economy. 250,000 trade businesses. HiPages (market leader) covers only 15%. Every single competitor charges $21–$70+ per lead with no verification, no exclusivity, and no referral rewards. TradeRefer charges $3–$15 per lead, is exclusive, verified, and pays the referrer.

**Launch market:** Geelong, VIC. Fastest-growing regional city in Australia. $2.1B construction sector. Community-oriented culture ideal for referral mechanics.

> Full market analysis, competitive landscape, and viability research: **[→ 01-product-overview.md]**

---

## 2. Problem Statement

### For Businesses (Tradies)
Existing lead generation platforms are expensive, untrustworthy, and extractive:
- HiPages averages **$21–$70+ per lead**, shared with up to 7 competitors simultaneously
- No phone verification — leads regularly have wrong numbers or are completely fabricated
- 12-month subscription lock-ins with aggressive auto-renewal
- Platform has no way to know if the tradie and consumer ever actually met
- ACCC has taken enforcement action against HiPages (2018–2022) for misleading practices

### For Referrers
No existing platform rewards people for recommending businesses they genuinely trust:
- Every adult has recommended a tradie to someone — this currently earns them nothing
- Affiliate networks exist for online businesses but not for local service businesses
- There is no structured, transparent way to earn from local business referrals in Australia

### For Consumers
Existing directories show anonymous reviews with no verification of quality:
- Cannot tell which tradies are trusted by people in their actual community
- No confirmation that the tradie they hired actually showed up
- Referral from a friend is vastly more trusted than a platform star rating

> See competitor comparison table and tradie sentiment research: **[→ 01-product-overview.md, section "Why This Beats HiPages"]**

---

## 3. Solution Overview

TradeRefer operates a three-sided marketplace:

```
REFERRER  ──shares link──▶  CONSUMER  ──submits enquiry──▶  PLATFORM
                                                                  │
BUSINESS  ◀──pays to unlock──  PLATFORM  ──notifies──────────────┘
    │
    ├──▶ taps "I'm on my way"
    │
CONSUMER  ◀──receives PIN──  PLATFORM
    │
BUSINESS  ◀──reads PIN──  CONSUMER (in person)
    │
PLATFORM  ◀──enters PIN──  BUSINESS
    │
REFERRER  ◀──paid immediately──  PLATFORM
```

**The money flow on every unlock:**
- Business pays unlock fee ($3–$20, they set it)
- 70% goes to the referrer
- 30% stays with the platform

**The trust mechanism:**
When a business taps "I'm on my way," both parties simultaneously receive a 4-digit PIN. The tradie enters the consumer's PIN at the door. This proves physical presence — impossible to fake without both people being in the same place at the right time.

> Complete flow diagrams including Mermaid sequence diagram: **[→ 02-user-flows.md]**  
> PIN system detail, state machine, and timers: **[→ 03-lead-lifecycle.md]**

---

## 4. Users & Personas

### Persona 1: The Business (Tradie)
**Who:** Plumber, electrician, builder, carpenter, cleaner — any trade or home service in Geelong/Melbourne.  
**Tech comfort:** Low to medium. Uses a smartphone but not apps extensively. Gets frustrated by complicated processes.  
**Pain:** Paying $69–$900/month to HiPages for low-quality leads they share with competitors.  
**Goal:** More work from people who already trust them. Pay only when a real lead arrives.  
**Key requirement:** Must be able to operate entirely from their phone. No desktop required.

### Persona 2: The Referrer
**Who:** Former customer of a tradie, friend, family member, real estate agent, property manager, community Facebook group admin, hardware store employee.  
**Tech comfort:** Medium. Uses social media daily. Comfortable with PayPal.  
**Pain:** Recommends tradies constantly and earns nothing from it.  
**Goal:** Passive income from recommendations they're already making.  
**Key requirement:** Zero friction to share a link. Fast, visible earnings.

### Persona 3: The Consumer
**Who:** Homeowner or renter in Geelong/Melbourne who needs a tradie.  
**Tech comfort:** Medium. Clicked a link, wants to submit quickly and move on.  
**Pain:** Not knowing which tradie to trust.  
**Goal:** Get connected with a tradie someone they trust vouches for.  
**Key requirement:** No account creation. Form submits in under 60 seconds. Clear what happens next.

### Persona 4: The Platform Admin (Founder)
**Who:** You.  
**Goal:** Oversee disputes, process payouts, monitor fraud signals, manage trust scores.  
**Key requirement:** Simple admin panel that surfaces the things that need attention without noise.

> Detailed UI/UX for each persona's screens: **[→ 06-ui-ux-spec.md]**

---

## 5. Core Product Requirements

These are non-negotiable. Everything else is a feature. If the build doesn't do these things, it is not TradeRefer.

### REQ-01: Three-Party Verified Lead Flow
A lead must pass through phone OTP verification before it is created. A business must pay to see consumer details. The platform must prove the two parties physically met via PIN exchange.

**References:** [→ 02-user-flows.md, Flow 3–5] · [→ 03-lead-lifecycle.md] · [→ 07-fraud-prevention.md, Layer 1]

---

### REQ-02: Pay-to-Unlock Model
Businesses sign up for free and are listed immediately. They pay only when a lead arrives and they choose to unlock it. No subscription. No upfront wallet loading required.

**Why this matters:** Removes the #1 signup objection. "Pay us before you see anything" kills conversion. "Here's a lead waiting, pay to get it" is a completely different psychology.

**References:** [→ 01-product-overview.md] · [→ 02-user-flows.md, Flow 4] · [→ 08-payments.md]

---

### REQ-03: 70/30 Revenue Split
Referrer always earns 70% of the unlock fee. Platform always keeps 30%. This split is visible to referrers before they generate any leads — they know exactly what they'll earn.

**Calculation rule:** Always use integer cents. Round down to referrer, remainder to platform. Never use floats.

**References:** [→ 01-product-overview.md, "The Money Flow"] · [→ 08-payments.md, "Unlock Fee Calculation"]

---

### REQ-04: PIN Confirmation System
When a business taps "I'm on my way," the system must:
1. Generate a unique 4-digit PIN with a 4-hour expiry
2. Send the PIN to the consumer via SMS and email simultaneously
3. Send a notification to the business/tradie to ask for the code on arrival
4. Validate the PIN when entered by the tradie
5. On correct PIN: release referrer earnings immediately (no 7-day wait)

**References:** [→ 02-user-flows.md, Flow 5] · [→ 03-lead-lifecycle.md, "PIN System Detail"] · [→ 05-api-spec.md, "POST /business/leads/{id}/on-the-way" and "POST /business/leads/{id}/confirm-pin"] · [→ 09-notifications.md, SMS-003, SMS-004, SMS-005, PUSH-002, PUSH-003]

---

### REQ-05: Referrer Always Gets Paid
Disputes are between the platform and the business — never between the business and the referrer. The referrer did their job (sent a verified phone-confirmed lead). They get paid regardless of whether the business confirms or disputes.

**The only exception:** Proven referrer fraud (fake leads they submitted themselves). See fraud layer 4.

**Timeline:**
- PIN confirmed → paid immediately
- No PIN confirmation → paid after 7-day hold
- Business disputes → paid after 7-day hold (unless fraud proven during hold window)

**References:** [→ 03-lead-lifecycle.md, "Referrer Earning State Machine"] · [→ 07-fraud-prevention.md, "The Three-Party Confirmation Logic"]

---

### REQ-06: Lead Exclusivity
A lead belongs to exactly one business. The same consumer cannot submit to the same business twice (while a lead is active). Businesses are never competing for the same lead.

**This is a direct attack on HiPages' biggest pain point** — shared leads sent to 7 competitors simultaneously.

**References:** [→ 04-database-schema.md, "Duplicate Lead Logic"] · [→ 07-fraud-prevention.md, Layer 2]

---

### REQ-07: Mobile-First Tradie Experience
The PIN entry screen must be a native mobile app experience (Expo React Native). Push notifications are required for "new lead" and "enter PIN" moments. The tradie cannot be expected to check email at the door.

**References:** [→ 06-ui-ux-spec.md, "Mobile App Screens"] · [→ 10-tech-stack.md, "Mobile App"] · [→ 09-notifications.md, "Push Notifications"]

---

## 6. Feature Specifications

### F1: Business Onboarding

**What it does:** Business signs up, sets up their profile, and goes live in the directory.

**Acceptance criteria:**
- Business can complete full signup in under 5 minutes
- No credit card required at signup
- Listing is live and searchable immediately after profile setup
- Business can set their own unlock fee (minimum $3, no maximum)
- Business can upload logo and up to 5 work photos
- ABN field present but optional at signup (required before first payout received by referrers — see tax compliance)

**User flow:** [→ 02-user-flows.md, Flow 1]  
**Screens:** [→ 06-ui-ux-spec.md, "Business Signup"]  
**API:** [→ 05-api-spec.md, "Business Routes"]  
**DB:** `businesses` table [→ 04-database-schema.md]

---

### F2: Referrer Onboarding & Link Generation

**What it does:** Referrer signs up and gets a unique shareable link for any business in the directory.

**Acceptance criteria:**
- Open signup — anyone can become a referrer (no invite required)
- Referrer can browse the full business directory after signup
- One click generates a unique link per business
- Link URL format: `traderefer.com.au/r/{business-slug}/{link-code}`
- Pre-written social caption auto-generated with the link
- Link stats visible: clicks, leads created, leads unlocked, total earned

**User flow:** [→ 02-user-flows.md, Flow 2]  
**Screens:** [→ 06-ui-ux-spec.md, "Referrer Dashboard"]  
**API:** [→ 05-api-spec.md, "POST /referrer/links"]  
**DB:** `referral_links` table [→ 04-database-schema.md]

---

### F3: Lead Submission & OTP Verification

**What it does:** Consumer clicks a referral link, fills in a form, verifies their phone via SMS OTP, and a lead is created.

**Acceptance criteria:**
- No account required for consumers
- Form fields: name, mobile, email, suburb, job description (min 20 chars)
- Privacy policy link and consent checkbox present (Spam Act compliance)
- OTP sent to consumer's mobile within 5 seconds of form submit
- OTP is 4 digits, valid for 10 minutes, max 3 attempts before lockout
- Lead is NOT created until OTP is verified
- Duplicate check runs before OTP is sent (same phone + same business = rejected)
- IP velocity check: max 2 submissions to different businesses per IP per hour
- Consumer sees confirmation screen after OTP — no account creation prompt

**User flow:** [→ 02-user-flows.md, Flow 3]  
**Screens:** [→ 06-ui-ux-spec.md, "Business Listing Page", "OTP Verification", "Success State"]  
**API:** [→ 05-api-spec.md, "POST /leads", "POST /leads/{id}/verify-otp"]  
**Fraud:** [→ 07-fraud-prevention.md, Layers 1–3]  
**Notifications:** [→ 09-notifications.md, SMS-001, EMAIL-003]

---

### F4: Leads Inbox & Lead Preview

**What it does:** Business sees arriving leads in their dashboard. Lead details are blurred until paid.

**Acceptance criteria:**
- Business receives email notification within 60 seconds of lead creation
- Lead card shows: suburb, job type (first 100 chars), time submitted, expiry countdown
- Consumer name, phone, and email are visually blurred/hidden until unlocked
- "Unlock" button shows exact price
- "Not interested" option dismisses lead without charge
- Leads sorted by most recent first
- Filter tabs: All, New, Unlocked, Confirmed, Expired

**Screens:** [→ 06-ui-ux-spec.md, "Business Dashboard Home", "Lead Cards"]  
**API:** [→ 05-api-spec.md, "GET /business/leads"]  
**DB:** SQL query with conditional field reveal [→ 04-database-schema.md, "Key Business Logic in SQL"]

---

### F5: Lead Unlock & Payment

**What it does:** Business pays to see full consumer contact details.

**Acceptance criteria:**
- Two payment paths: pay-as-you-go card OR wallet credit
- Card charged via eWAY at point of unlock — no charge if OTP or card fails
- Wallet deducted if balance is sufficient
- Full details revealed immediately after successful payment
- "Call," "SMS," and "I'm On My Way" actions shown post-unlock
- 48-hour contact timer shown prominently
- Wallet top-up option offered in payment modal with bonus tiers

**User flow:** [→ 02-user-flows.md, Flow 4]  
**Screens:** [→ 06-ui-ux-spec.md, "Unlock Payment Modal"]  
**API:** [→ 05-api-spec.md, "POST /business/leads/{id}/unlock"]  
**Payments:** eWAY collection [→ 08-payments.md, "Phase 1: MVP Payment Stack"]  
**Wallet bonus tiers:** [→ 08-payments.md, "Wallet Bonus Tiers"]

---

### F6: "I'm On My Way" & PIN Exchange

**What it does:** Tradie triggers the real-world connection confirmation. PIN sent to consumer, entered by tradie at the door.

**Acceptance criteria:**
- "I'm On My Way" button visible on unlocked lead card (web + mobile app)
- On tap: PIN generated server-side (4-digit numeric), stored with 4-hour expiry
- Consumer receives SMS + email simultaneously (within 10 seconds)
- Tradie receives SMS + push notification simultaneously
- Mobile app shows PIN entry screen with 4 large input boxes and countdown timer
- PIN valid for max 3 attempts — after 3 wrong attempts, lead moves to UNCONFIRMED
- On correct PIN: lead → CONFIRMED, referrer earnings released immediately
- Tradie sees success screen showing connection rate improvement
- Consumer receives confirmation SMS

**User flow:** [→ 02-user-flows.md, Flow 5]  
**Screens:** [→ 06-ui-ux-spec.md, "Mobile: PIN Entry Screen", "Mobile: Visit Confirmed Screen"]  
**API:** [→ 05-api-spec.md, "POST /business/leads/{id}/on-the-way", "POST /business/leads/{id}/confirm-pin"]  
**Notifications:** [→ 09-notifications.md, SMS-003, SMS-004, SMS-005, PUSH-002, PUSH-003]  
**State changes:** [→ 03-lead-lifecycle.md, "After correct PIN"]

---

### F7: Referrer Earnings & Withdrawals

**What it does:** Referrer tracks their earnings and requests payouts.

**Acceptance criteria:**
- Dashboard shows: available balance, pending (7-day hold), all-time total
- Each earning shows: business name, amount, status, available date
- Withdraw button only active when available balance ≥ $20
- Payout methods: PayPal email OR bank transfer (BSB + account)
- ABN field with prominent warning about 47% withholding if blank
- Link to abr.gov.au for free ABN registration
- Payout requests processed every Thursday, paid Friday
- Confirmation email sent when payout is processed
- Minimum payout: $20 AUD

**User flow:** [→ 02-user-flows.md, Flow 6]  
**Screens:** [→ 06-ui-ux-spec.md, "Referrer Dashboard Home", "Withdraw Screen"]  
**API:** [→ 05-api-spec.md, "GET /referrer/earnings", "POST /referrer/payouts"]  
**Payments:** PayPal Payouts API [→ 08-payments.md, "Payouts: PayPal Mass Payments"]  
**Tax:** ABN withholding + SERR reporting [→ 08-payments.md, "Tax Compliance"]  
**Notifications:** [→ 09-notifications.md, EMAIL-006, EMAIL-007]

---

### F8: Business Wallet

**What it does:** Optional pre-loaded credit that businesses can use instead of per-transaction card charges.

**Acceptance criteria:**
- Load amounts: $50, $100, $200, or custom
- Bonus applied automatically: 10%, 15%, 20% based on load amount
- Balance visible on every dashboard screen
- Full transaction history with type, amount, balance-after, date
- Wallet used automatically when balance covers unlock fee (with option to switch to card)
- Admin can view wallet balances and manually adjust in edge cases

**Screens:** [→ 06-ui-ux-spec.md, "Wallet Screen"]  
**API:** [→ 05-api-spec.md, "POST /business/wallet/topup", "GET /business/wallet/transactions"]  
**DB:** `wallet_transactions` table [→ 04-database-schema.md]  
**Bonus tiers:** [→ 08-payments.md, "Wallet Bonus Tiers"]

---

### F9: Business Directory (Public, SEO-Optimised)

**What it does:** Public-facing directory of all listed businesses. Primary organic acquisition channel.

**Acceptance criteria:**
- Server-side rendered (Next.js Server Component) for Google indexing
- Search by suburb, postcode, or trade type
- Filter by category and sort by: most connections, lowest fee, newest
- Individual business listing pages at `/businesses/{slug}` — also server-rendered
- Listing shows: connection rate badge, verified badge, fast responder badge if applicable
- Lead form embedded on listing page (for consumers arriving from referral links)
- Meta title/description optimised per listing for local SEO

**Screens:** [→ 06-ui-ux-spec.md, "Business Directory", "Business Listing Page"]  
**API:** [→ 05-api-spec.md, "GET /businesses", "GET /businesses/{slug}"]  
**Tech note:** Must use Next.js Server Components — not client-side rendered. Critical for SEO. [→ 10-tech-stack.md]

---

### F10: Lead Expiry & Background Jobs

**What it does:** System automatically expires leads, releases earnings, and sends reminders without manual intervention.

**Acceptance criteria:**
- Lead expires automatically 48 hours after creation if not unlocked
- Expiry reminder email sent to business 24 hours before expiry
- Consumer notified via SMS when their lead expires (with alternative businesses link)
- Referrer notified in-app when their lead expires
- Referrer quality score decremented on each expired lead
- Earnings automatically move to AVAILABLE after 7-day hold
- Referrer notified when earnings become available
- All background jobs log their runs and results

**User flow:** [→ 02-user-flows.md, Flow 7]  
**API:** Background cron jobs [→ 05-api-spec.md, "Background Jobs"]  
**State changes:** [→ 03-lead-lifecycle.md, "Lead Expiry Process"]  
**Notifications:** [→ 09-notifications.md, SMS-006, SMS-007, EMAIL-004]

---

### F11: Dispute System

**What it does:** Business can dispute a lead. Admin reviews and resolves. Referrer is protected throughout.

**Acceptance criteria:**
- "Report Issue" button on every unlocked lead
- Dispute reason dropdown: invalid phone, identity fraud, duplicate, other
- Admin receives dispute in queue, reviews with full evidence panel
- Evidence shown: OTP verification timestamp, Twilio delivery status, lead view timestamps, business dispute history
- Admin can approve refund (returns to wallet or card refund) or deny
- Referer earning is NOT reversed unless admin explicitly approves AND dispute is within 7-day hold window
- Business notified of outcome with explanation
- Business trust score affected by dispute outcomes

**User flow:** [→ 02-user-flows.md, Flow 8]  
**Screens:** [→ 06-ui-ux-spec.md, "Admin: Disputes Queue"]  
**API:** [→ 05-api-spec.md, "POST /business/leads/{id}/dispute"]  
**DB:** `disputes` table [→ 04-database-schema.md]  
**Fraud logic:** [→ 07-fraud-prevention.md, Layer 7]  
**Notifications:** [→ 09-notifications.md, EMAIL-008, EMAIL-009, EMAIL-010]

---

## 7. Technical Requirements

### Architecture

Single monorepo containing three applications (web, mobile, API) and shared packages. All three apps share TypeScript types and API client functions to prevent drift.

**Stack:**
- Web: Next.js 14 (App Router) + Tailwind + shadcn/ui → Vercel
- Mobile: React Native + Expo → EAS Build
- API: FastAPI (Python 3.12) → Railway
- Database: Supabase (Postgres 15 + Auth + Storage + Realtime)

> Full stack rationale, repository structure, setup instructions, environment variables, and build order: **[→ 10-tech-stack.md]**

### Performance Requirements
- Public directory pages must be server-side rendered (SEO critical)
- Lead creation to business notification: under 60 seconds
- PIN message delivery to both parties: under 10 seconds
- OTP delivery to consumer: under 5 seconds
- Dashboard load time: under 2 seconds

### Security Requirements
- All database access via Supabase Row Level Security (RLS) policies
- JWT validation on every protected FastAPI route
- Card numbers never stored — eWAY tokenisation only
- Consumer details never exposed in API response until lead is UNLOCKED
- All production secrets in Railway/Vercel environment variables — never in code

### Mobile App Requirements
- iOS and Android (Expo handles both from one codebase)
- Push notifications required (FCM)
- PIN entry screen must work offline for PIN input (validation requires connectivity)
- Minimum supported: iOS 16, Android 11

> Full tech spec, monorepo structure, environment variables: **[→ 10-tech-stack.md]**

---

## 8. Payment Requirements

### Collection (Businesses → Platform)
- Provider: **eWAY** (Australian, 1.5% + $0.25)
- Card tokenisation: eWAY JS library, token stored per business
- Supported: Visa, Mastercard, Amex
- Currencies: AUD only (MVP)

### Payouts (Platform → Referrers)
- Provider: **PayPal Mass Payments** ($0.25/domestic payout)
- Frequency: Weekly (Thursday processing, Friday payment)
- Minimum: $20 AUD
- Methods: PayPal email OR bank transfer (BSB + account number)
- ABN required to avoid 47% withholding

### Future Migration
At $10,000+/month volume: migrate to **Zai** (Melbourne-based, hellozai.com).
Zai provides: PayID/NPP instant transfers, split payment API, lower fees (1.5% + $0.16), dedicated account manager.
**Contact Zai early — before volume justifies it — to establish the relationship.**

### Tax Compliance
- SERR reporting: report referrer earnings to ATO twice yearly (mandatory from July 2024)
- ABN withholding: 47% withheld from payments to referrers without ABN
- GST registration required when platform turnover exceeds $75,000/year

> Full payment architecture, fee comparisons, code examples, tax compliance detail: **[→ 08-payments.md]**

---

## 9. Trust & Safety Requirements

### Fraud Prevention Stack (build in this order)

| Priority | Layer | What it stops |
|---|---|---|
| 1 | Phone OTP verification | Fake leads, bots, mass submissions |
| 2 | Duplicate phone check | Same consumer submitting twice to same business |
| 3 | IP velocity check | One person with multiple SIMs flooding platform |
| 4 | Referrer quality score | Referrers whose leads consistently fail to unlock |
| 5 | Device fingerprinting | Multiple accounts from same device |
| 6 | 7-day payout hold | Fraud caught before money leaves platform |
| 7 | Business dispute investigation | Businesses gaming refund system |

### Business Trust Score
Every business has a score (0–100). Score affects directory ranking and pay-as-you-go privilege.

**Below 50:** Must preload wallet (no pay-as-you-go)  
**Below 30:** Account suspended, admin review required

### Referrer Quality Score
Every referrer has a score (0–100). Score affects payout eligibility.

**Below 50:** Payouts frozen pending review  
**Below 30:** Account suspended

### Non-Negotiable Rules
1. A lead is never created without phone OTP verification
2. Consumer details are never visible before unlock payment is confirmed
3. Referrers are never penalised based solely on consumer survey responses
4. Consumer confirmation raises an investigation flag — it never auto-penalises a business

> Full fraud stack with implementation code, truth tables, and what NOT to do: **[→ 07-fraud-prevention.md]**

---

## 10. Notification Requirements

Every platform action triggers specific notifications. All notifications must:
- Be delivered within the times specified in F3 and F6
- Include unsubscribe mechanism (Spam Act compliance)
- Use the exact copy specified (consistency builds trust)
- Be logged in the `notifications` table for debugging and compliance

### Critical Path Notifications (must work for MVP)

| Event | Recipients | Channels |
|---|---|---|
| OTP verification | Consumer | SMS |
| Lead created | Business | Email |
| Lead unlocked | Referrer | In-app + SMS |
| On the way — PIN | Consumer | SMS + Email |
| On the way — notify | Business | SMS + Push |
| PIN confirmed | Consumer | SMS |
| PIN confirmed | Business | Push |
| Earning available | Referrer | SMS + Email |
| Payout processed | Referrer | Email |

> Every notification with exact copy, trigger conditions, and channel: **[→ 09-notifications.md]**

---

## 11. Success Metrics

### MVP Launch Metrics (Geelong, first 90 days)
| Metric | Target | How measured |
|---|---|---|
| Businesses listed | 20 | `businesses` table count |
| Referrers signed up | 50 | `referrers` table count |
| Leads created | 100 | `leads` table count |
| Leads unlocked | 60 (60% unlock rate) | `status = UNLOCKED` count |
| PIN confirmations | 30 (50% of unlocked) | `status = CONFIRMED` count |
| Referrer payouts processed | 10+ | `payout_requests` count |
| Average unlock fee | $8+ | AVG(unlock_fee_cents) |
| Dispute rate | < 10% | disputes / unlocked leads |

### Health Metrics (ongoing)
| Metric | Target | Warning level |
|---|---|---|
| Business unlock rate | > 50% | < 30% |
| PIN confirmation rate | > 40% | < 20% |
| Lead expiry rate | < 40% | > 60% |
| Referrer quality score avg | > 75 | < 60 |
| Business trust score avg | > 80 | < 65 |
| Fraud disputes | < 5% of leads | > 15% |

### Revenue Model
At $10/avg unlock fee, 30% platform take = $3/lead:
- 500 leads/month = $1,500/month revenue
- 2,000 leads/month = $6,000/month revenue
- 10,000 leads/month = $30,000/month revenue

The variable cost per lead is ~$0.40 (eWAY fee) + ~$0.16 (two SMS) = ~$0.56. Gross margin above $2.44/lead.

---

## 12. Launch Plan

### Pre-Launch (Week 1–2)
- Personally recruit 10 Geelong tradies you know — plumbers, electricians, builders
- Get their profiles live with real photos
- Recruit 10 referrers: their past customers, family members, community connectors
- Generate 3–5 referral links per business (multiple referrers per business = more coverage)
- Do NOT launch publicly until both sides have density

### Soft Launch (Week 3–4)
- Make directory searchable but don't advertise
- Monitor first real leads end-to-end (watch every step personally)
- Manually process first referrer payouts via PayPal
- Fix anything that breaks before bigger push

### Public Launch (Month 2)
- Geelong community Facebook groups (Family Friendly Geelong, Geelong Buy Swap Sell, etc.)
- "Know a good tradie? Now you can earn from it" — referrer recruitment campaign
- Local tradie community: Geelong tradespeople Facebook groups
- Goal: 50 businesses, 200 referrers, 500 leads

### Melbourne Expansion (Month 3+)
- Use Geelong data (connection rates, payout amounts) as proof for Melbourne tradie recruitment
- Suburb-by-suburb approach: seed both sides in one suburb before moving to next
- Target suburbs: Geelong → Ballarat → Melbourne outer suburbs → inner suburbs

---

## 13. Constraints & Decisions

These decisions were explicitly made. Do not revisit without understanding the reasoning behind each.

| Decision | What was decided | Why | Reference |
|---|---|---|---|
| Payment model | Pay-to-unlock (not subscription, not pre-pay wallet) | Removes signup friction, flips psychology to "here's a lead, pay to get it" | [→ 08-payments.md] |
| Revenue split | 70% referrer / 30% platform — fixed, no variance | Simplicity and referrer trust. No confusion about what they'll earn | [→ 01-product-overview.md] |
| Trust mechanism | PIN exchange (not consumer survey, not business self-report) | Both parties must be physically present. Impossible to fake. No survey response rate problems | [→ 03-lead-lifecycle.md] |
| Collection provider | eWAY (not Stripe) | Australian company, lower fees, no account freeze risk | [→ 08-payments.md] |
| Payout provider | PayPal (MVP) → Zai (scale) | PayPal: everyone has it, simple, $0.25/payout. Zai: PayID/NPP at scale | [→ 08-payments.md] |
| Mobile app scope | Tradie only (Expo) — consumers use mobile web | PIN entry needs native UX + push notifications. Consumers don't need an app | [→ 10-tech-stack.md] |
| Monorepo | Yes (Turborepo) | AI coding agents need full context. Prevents web/mobile/API drift | [→ 10-tech-stack.md] |
| Launch market | Geelong (not Melbourne, not national) | Community culture, construction density, personal relationships. Density before scale | [→ 01-product-overview.md] |
| Referrer payout hold | 7 days (not instant, not 14 days) | Enough time to catch fraud. Short enough not to frustrate referrers | [→ 07-fraud-prevention.md] |
| Minimum withdrawal | $20 AUD | PayPal overhead acceptable at this amount. Referrers hit it in 3–10 leads | [→ 08-payments.md] |

---

## Document Map

This PRD is the entry point. Every section links to the detailed specification document that governs that area.

```
PRD (this document)
├── Product & Market Context ──────────────────────── 01-product-overview.md
├── User Journeys & Flows ─────────────────────────── 02-user-flows.md
├── Lead States & Business Logic ──────────────────── 03-lead-lifecycle.md
├── Data Model & SQL ──────────────────────────────── 04-database-schema.md
├── API Endpoints & Contracts ─────────────────────── 05-api-spec.md
├── UI/UX Screens & Copy ──────────────────────────── 06-ui-ux-spec.md
├── Fraud Prevention & Trust ──────────────────────── 07-fraud-prevention.md
├── Payment Architecture ──────────────────────────── 08-payments.md
├── Notifications & Copy ──────────────────────────── 09-notifications.md
└── Tech Stack & Setup ────────────────────────────── 10-tech-stack.md
```

When a developer receives a task, the flow is:
1. Read PRD section relevant to the feature
2. Follow the references to the detailed spec documents
3. Build against the spec — don't interpret or assume
4. If something in the spec is unclear or conflicting, raise it before building
