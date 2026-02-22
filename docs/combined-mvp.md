TRADEREFER
Combined Master Specification
The complete build guide for developers, covering every aspect of the platform
Version 1.0  |  February 2026  |  Geelong, Victoria, Australia



Platform
TradeRefer
Document Type
Combined Master Specification — all documents in one
Audience
Developers, AI coding agents (Cursor, Claude Code), product team
Status
Active — February 2026
Launch Market
Geelong, Victoria, Australia
Tech Stack
Next.js, Expo React Native, FastAPI, Supabase, Turborepo
Payment Processing
eWAY (collection), PayPal Phase 1 / Zai Phase 2 (payouts)
Core Innovation
Real-world PIN confirmation eliminating fake leads


IMPORTANT NOTE TO DEVELOPER OR AI AGENT: This document is the single source of truth for the TradeRefer platform. Every screen, field, business rule, API endpoint, database table, and SMS message is specified here. Do not make assumptions. If something is not in this document, ask before implementing it. Treat every specification as mandatory unless explicitly marked as optional.

PART 1 — Executive Summary
TradeRefer is a three-sided marketplace platform that digitises word-of-mouth referrals in the Australian trades market. It connects three user types: Tradies (trade service businesses), Referrers (anyone with a network who wants to earn money recommending tradies), and Consumers (people who need trade services done).
The core innovation that separates TradeRefer from every competitor — HiPages, ServiceSeeking, Airtasker — is a real-world PIN confirmation system. When a tradie travels to a consumer's location, both parties exchange a 4-digit code to prove they physically met. This cannot be faked without both parties being present. It eliminates the fake leads that plague every other lead generation platform and gives tradies confidence they are paying only for genuine connections.

The Problem
Tradies currently pay $10–$50 per lead on platforms like HiPages, but a significant percentage of those leads are fake, low quality, or submitted by people with no real intent to hire. There is no verification mechanism. Tradies waste thousands of dollars annually on leads that go nowhere. This destroys trust in digital lead platforms and pushes tradies back to relying on personal word-of-mouth — which is slow and unscalable.

The Solution
TradeRefer makes word-of-mouth digital and rewards it. People who genuinely recommend a tradie — friends, family, past customers — share a unique referral link. When someone clicks that link, books a job, and the tradie physically meets them (confirmed via PIN), the referrer earns a commission. The tradie pays only for verified in-person connections. No fakes. No wasted money.

Revenue model
Tradie sets referral fee. TradeRefer adds 20% on top as platform fee. Referrer earns 100% of the fee the tradie set.
Minimum referral fee
$3.00 (tradie sets this)
Launch market
Geelong, Victoria — closed beta with 20-30 tradies per category
Phase 2
Melbourne metro
Phase 3
National rollout across Australia
Payout method (Phase 1)
PayPal — referrer provides PayPal email
Payout method (Phase 2)
Zai — mass NPP/PayID/BECS bank transfers
Minimum withdrawal
$20 accumulated wallet balance


PART 2 — Platform Participants
2.1 Tradies (Businesses)
Tradies are licensed or unlicensed trade service businesses in Australia. They are the paying customers of the platform. Examples include plumbers, electricians, builders, cleaners, landscapers, painters, carpenters, tilers, and roofers.
What they pay
A per-lead fee they set themselves (minimum $3.00) plus 20% platform fee on top
What they get
Verified leads — consumers who have been referred by someone who knows the tradie, confirmed via PIN in-person meeting
Key motivation
Escape the fake lead problem of HiPages and ServiceSeeking
How they join
Via pre-created profile outreach or self-registration
Payment method
Credit/debit card via eWAY — pay per lead or prepaid wallet


2.2 Referrers
Referrers are anyone with a social network — friends, family, neighbours, past customers, social media followers. They do not need trade experience or technical skills. They join for free and earn money by sharing referral links for tradies they trust.
What they earn
100% of the referral fee the tradie set — paid after PIN confirmation
Payout method
PayPal (Phase 1), Zai bank transfer (Phase 2)
Minimum payout
$20 accumulated wallet balance
Tax requirement
ABN required to avoid 47% ATO withholding
Quality score
0-100 score based on PIN confirmation rate, lead volume, dispute rate


2.3 Consumers
Consumers are people who need trade services. They click a referral link, submit a job request, interact with the tradie, and confirm the PIN when the tradie arrives. They never pay the platform and never create an account. Their experience must be completely frictionless.
Cost to them
Free — consumers never pay TradeRefer
Account required
No — consumers never create an account
What they do
Submit job request, verify mobile via OTP, receive PIN via SMS, read PIN to tradie on arrival
Data collected
Name, mobile, email, suburb, job type, description — shared only with the unlocking tradie


PART 3 — Complete End-to-End Workflow
3.1 The 10-Step Journey
REFERRER shares their unique link (e.g. traderefer.com.au/ref/jane/bob-plumbing) via social media, SMS, or word of mouth.
CONSUMER clicks the link and lands on the job request form. They fill in name, mobile, email, suburb, job type, and description. They verify their mobile via 6-digit SMS OTP before the form submits.
TRADIE receives instant notification of a new lead. Lead is in 'pending' state — suburb and job type visible, contact details locked.
TRADIE pays to unlock the lead. Charged their set fee plus 20% platform fee via eWAY. Lead moves to 'unlocked' state. Consumer contact details now visible.
TRADIE contacts the consumer to arrange a time.
TRADIE taps 'I'm On My Way' in their app when they are about to travel to the consumer.
SYSTEM sends PIN SMS to CONSUMER ('Your connection code is [PIN]'). 5 seconds later, sends notification to TRADIE ('Ask them for their 4-digit code when you arrive').
TRADIE arrives at consumer's location. Consumer reads out their PIN. Tradie enters it into the app.
SYSTEM validates PIN. If correct, lead moves to 'confirmed'. Referrer payment released from escrow into their wallet immediately. Both parties receive confirmation SMS.
REFERRER sees wallet balance updated. When balance reaches $20+, they can withdraw to PayPal.

3.2 Lead Status States
pending
Lead submitted by consumer, awaiting tradie action
unlocked
Tradie paid and has consumer contact details
on_the_way
Tradie triggered 'I'm On My Way' — PIN sent to consumer
confirmed
PIN exchanged in person — referrer payment released
expired
Tradie did not unlock within 48 hours
disputed
Flagged for admin review — payment held in escrow


PART 4 — Tradie Onboarding
4.1 How Tradies Are Found (Pre-Onboarding)
Search Google Business listings for trade categories in target suburb (e.g. 'plumbers Geelong').
Visit each business website found.
Check Terms & Conditions and Privacy Policy. If either prohibits third-party contact, skip this business.
Confirm business is actively advertising for work (website contact form, Google Ads, social media).
Record business name, email, phone, suburb, category, and website URL.
Pre-create an 'unclaimed' profile using their publicly available information.
Send transactional outreach email (see template below).

4.2 Outreach Email Template
Subject: Your TradeRefer profile has been created — claim it here
Hi [Business Name],We've created a free profile for your business on TradeRefer — a platform that lets people in your local area earn money by referring customers to tradies they trust.Your profile is ready to claim at:traderefer.com.au/claim/[unique-token]Once you log in, you'll be able to:- Set what you're willing to pay per referral- Invite people you know to refer customers your way- Start receiving verified leads from your local communityIf you'd prefer not to have a profile on TradeRefer, you can remove it permanently here: traderefer.com.au/remove/[unique-token]TradeRefer Pty Ltd | ABN XX XXX XXX XXX123 Example Street, Geelong VIC 3220Unsubscribe: traderefer.com.au/unsubscribe/[token]

4.3 Onboarding Wizard — 5 Steps
Step 1 — Confirm Business Details
Tradie reviews and edits pre-populated info: business name, trade category, suburb, state, website. Adds: business description (max 300 chars, required) and ABN (required for payouts).

Step 2 — Set Referral Fee
Tradie sets their dollar amount per verified lead. Minimum $3.00. No maximum. Helper text shows: 'If you set $10.00, your referrer earns $10.00 and TradeRefer earns $2.00 on top of that.'

Step 3 — Invite Referrers
Tradie enters email addresses (up to 10 at once) of friends, family, or past customers to invite as referrers. Step is skippable — tradie can invite from dashboard later.

Step 4 — Notification Preferences
SMS notifications (on by default), email notifications (on by default), push notifications (if mobile app), lead expiry reminder 24 hours before expiry (on by default).

Step 5 — Payment Method
Option A: Pay per lead — card charged at each unlock via eWAY. Option B: Prepaid wallet — load $20+ credit, leads auto-unlock from balance.

4.4 Profile Removal
Available at any time via email unsubscribe link or Account Settings. Removal deletes all profile data, cancels all pending leads, notifies referrers, adds email to permanent suppression list, and refunds any remaining wallet balance within 5 business days.

PART 5 — Referrer Onboarding
5.1 Referrer Invitation Email
Subject: [Tradie Name] wants you to earn money by referring their customers
Hi [Referrer Name],[Tradie Name] from [Business Name] has invited you to join TradeRefer.Here's how it works:- You get a unique link to share for [Business Name]- When someone clicks your link and books a job with them,   you earn $[Referral Fee] once the job is confirmed- There's no limit to how many referrals you can makeIt's free to join and takes less than 2 minutes to set up.Claim your referrer account here:traderefer.com.au/join/[unique-token]TradeRefer — Word of mouth, made rewarding.

5.2 Registration Fields
First Name
Required
Last Name
Required
Email Address
Required
Mobile Number
Required — verified via 6-digit SMS OTP
Password
Required — minimum 8 characters
Terms Checkbox
Required — must accept Terms of Service and Privacy Policy


5.3 Onboarding Wizard — 3 Steps
Step 1 — Meet Your Earning Opportunity
Informational screen showing: 'You earn $[Fee] every time someone you refer books a confirmed job.' Example calculation. Leaderboard preview showing top earner this month.

Step 2 — Your Referral Link
Referrer sees their unique link (traderefer.com.au/ref/[username]/[business-slug]). One-tap copy button. Native share sheet buttons for WhatsApp, Facebook, Instagram, SMS, Email. Pre-written caption they can edit and share immediately.

Step 3 — Payout Details
PayPal email address (Phase 1). ABN (optional at signup, required before first withdrawal). Step is skippable — payout details can be added from dashboard.

5.4 Referrer Dashboard
My Links
All referral links with copy and share buttons
My Earnings
Wallet balance, pending earnings, total earned to date
My Referrals
Full history with status — pending, unlocked, on_the_way, confirmed, expired, disputed
Withdraw
Active when balance is $20+. Handles ABN collection if not provided.
Leaderboard
Top referrers on platform this month
Marketing Kit
Pre-written social captions, earning calculator, invite-a-referrer tool


5.5 Referrer Quality Score
80-100 — Top Referrer
Eligible for bonus rates from tradies. Shown on public leaderboard.
50-79 — Good Referrer
Standard rates apply.
20-49 — At Risk
Warning sent. Leads throttled to 3 per day.
0-19 — Suspended
Account flagged for admin review. All payouts held.


PART 6 — Consumer Journey
6.1 Entry Points
Referral Link
Primary — traderefer.com.au/ref/[referrer]/[business]
Direct Directory
Consumer finds tradie in public directory — no referrer credited
QR Code
Tradie's business card/vehicle/signage — referrer can be assigned manually
Social Media
Referrer's shared post — same referral link flow


6.2 Landing Page Rules
Load under 2 seconds on 4G mobile
No login required — ever
No navigation menu — only action is submitting the job request
Business name and category visible above the fold
Form completable in under 60 seconds
Works perfectly on iOS Safari and Android Chrome

6.3 Job Request Form Fields
First Name
Required
Last Name
Required
Mobile Number
Required — verified via inline OTP (no page redirect)
Email Address
Required
Suburb
Required — Australian suburbs autocomplete
Job Type
Required — dropdown specific to trade category
Job Description
Required — minimum 20 characters
Preferred Contact Time
Optional — Morning, Afternoon, Evening, Anytime
How Soon Needed
Optional — Urgent, This week, This month, Just getting quotes


6.4 OTP Verification (Inline)
OTP sends automatically when consumer tabs out of the mobile field (onBlur). OTP input appears directly below — no page redirect. 3 incorrect attempts locks out for 10 minutes. OTP expires in 10 minutes. Consumer can request resend after 60 seconds.
SMS: Your TradeRefer verification code is [OTP]. Valid for 10 minutes. Do not share this code. - TradeRefer

6.5 Post-Submission Confirmation
Screen shows: '[Business Name] will be in touch on your phone. When they are on their way, we will send you a 4-digit connection code via SMS. Share that code with them when they arrive.' Confirmation email also sent.

PART 7 — PIN Confirmation System
7.1 Why PIN (Not GPS, App, or Photo)
GPS rejected
Spoofable. Poor accuracy underground, rural, inside buildings. Privacy concerns.
Consumer app rejected
Consumer would need to download an app for one confirmation. Drop-off near 100%.
Website link rejected
Can be forwarded or clicked without physically meeting.
Photo rejected
Privacy concerns. Facial recognition complexity. Consumer resistance.
PIN chosen
Requires verbal exchange at the door. Cannot be completed without both parties physically present. Zero consumer app friction.


7.2 Trigger — 'I'm On My Way' Button
Location
Lead detail screen — visible only when lead status is 'unlocked'
Style
Large, full-width, green background, white text
Confirmation dialog
Shows before triggering: 'This will send a connection code to [Consumer]. Only tap this when you are actually on your way.'
After trigger
Button turns grey, disabled. Text: 'Connection code sent — ask [Consumer] for their code when you arrive.'
Can retrigger?
Yes — if PIN expires, button reactivates for a new PIN to be generated


7.3 PIN Generation
4 digits exactly — range 1000 to 9999 — no leading zeros
Cryptographically secure random generation — do NOT use Math.random() or random.random()
Never reuse same PIN for same lead within 24 hours
Store as string in database
# Pythonimport secretspin = str(secrets.randbelow(9000) + 1000)
// JavaScriptconst pin = String(Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF * 9000) + 1000);

7.4 SMS Delivery Sequence
Generate PIN and store in database atomically.
Send PIN SMS to CONSUMER immediately.
Wait 5 seconds.
Send notification SMS and push notification to TRADIE.

Consumer SMS: Hi [First Name], [Business Name] is on their way to you for your [Job Type] enquiry. Your connection code is [PIN]. Share this with them when they arrive. - TradeRefer
Tradie SMS: You're heading to [First Name] in [Suburb] for [Job Type]. Ask them for their 4-digit connection code when you arrive and enter it in the TradeRefer app. - TradeRefer

7.5 PIN Entry Screen — Mobile UI
Header
'Confirm Your Visit' — large bold
Subheader
'Enter the 4-digit code from [Consumer First Name]'
PIN Input
4 individual digit boxes — minimum 64x64pt each — numeric keyboard opens automatically — auto-advance to next box after each digit
Countdown Timer
Live countdown — turns red under 60 seconds
Confirm Button
Large, full-width, green — auto-activates when 4th digit entered
Expired state
'Code expired? Request a new one' link — only shows when timer hits 0:00


7.6 Validation Logic
Lead status must be 'on_the_way'.
Current time must be before pin_expires_at (3 hour window).
PIN entered must exactly match leads.pin.
pin_attempts must be less than 5.

7.7 On Successful Validation (Atomic Transaction)
Update leads.status to 'confirmed'.
Update leads.confirmed_at to current timestamp.
Clear leads.pin (set to NULL).
Release referrer payment — add referrer_payout_amount to referrers.wallet_balance.
Create payment_transactions record.
Send confirmation SMS to consumer and tradie.
Send push notification to tradie.
Send email to referrer confirming earning.
Recalculate business.connection_rate.

7.8 Incorrect PIN Error States
Attempts 1-4
'That code is incorrect. Ask [Consumer] to check their SMS and try again.' PIN boxes clear for re-entry. Show remaining attempts from attempt 3.
Attempt 5
'Too many incorrect attempts. This lead has been flagged for review. Contact TradeRefer support.'
After 5 failures
Lead status changed to 'disputed'. Admin notified. Payment held in escrow. Both tradie and referrer notified by email.


7.9 Edge Cases
Consumer didn't get SMS
Tradie taps 'Consumer didn't get the code?' — system resends PIN SMS. Limited to 3 resends per lead.
Consumer not home
Tradie taps 'Consumer not available' — lead reverts to 'unlocked'. Tradie reschedules and re-triggers 'I'm On My Way'.
No mobile signal
PIN entry can be completed when signal returns. PIN does not expire faster due to no signal.
PIN expired
Tradie requests new code — new PIN generated, new SMS sent to consumer with note that old code is invalid.
Two tradies same consumer
Each lead has its own PIN. Correct tradie enters correct PIN. Wrong tradie gets error. Handled by design.


PART 8 — Pricing & Revenue Model
8.1 Core Pricing Principle
The referrer always receives exactly what the tradie promised. TradeRefer's 20% platform fee is charged ON TOP of the referral fee — paid entirely by the tradie. Referrers never have their earnings reduced by platform fees.

Tradie sets referral fee
The dollar amount per lead (e.g. $10.00)
Referrer earns
100% of that fee (e.g. $10.00) — nothing deducted
TradeRefer platform fee
20% added on top, charged to tradie (e.g. $2.00)
Total tradie pays
Referral fee + 20% (e.g. $12.00)
Minimum referral fee
$3.00
Maximum referral fee
No limit


8.2 Fee Examples
$5 referral fee
Referrer earns $5.00 / TradeRefer earns $1.00 / Tradie pays $6.00
$10 referral fee
Referrer earns $10.00 / TradeRefer earns $2.00 / Tradie pays $12.00
$25 referral fee
Referrer earns $25.00 / TradeRefer earns $5.00 / Tradie pays $30.00
$50 referral fee
Referrer earns $50.00 / TradeRefer earns $10.00 / Tradie pays $60.00


8.3 Bonus Payments
After a job is completed, tradies can pay referrers a bonus (e.g. 'great referral bonus'). The 20% platform fee applies to bonuses too. This prevents fee arbitrage where tradies could pay low referral fees and compensate via bonuses to bypass platform fees.

8.4 Per-Referrer Rate Adjustments
Tradies can set different referral rates for individual referrers. A top-performing referrer who consistently sends high-quality leads can be offered a higher rate than the default. This creates incentive alignment and rewards quality.

8.5 Referrer Payout Flow
PIN confirmed — referrer_payout_amount added to referrers.wallet_balance immediately.
Earnings accumulate in wallet — no per-lead payouts.
When balance reaches $20+, referrer can request withdrawal.
Withdrawal flow checks for ABN — if not provided, explains 47% ATO withholding.
Payout processed via PayPal API (Phase 1) or Zai (Phase 2).
Referrer receives confirmation email and SMS.

PART 9 — Fraud Prevention System
9.1 Fraud Scenarios
Referrer self-submission
Referrer creates fake consumer identities and submits leads via own link.
Referrer-tradie collusion
Associates unlocking fake leads and splitting the commission.
Competitor sabotage
Flooding a tradie's inbox with fake leads to drain their budget.
Phone number farming
Acquiring multiple SIMs to submit many 'verified' leads.
Bonus farming
Colluding to generate fake PIN confirmations to trigger bonus payments.


9.2 Seven-Layer Defence Stack
Layer 1 — Phone OTP
Consumer must verify mobile via 6-digit OTP at lead submission. Prevents bots and automated fake submissions. One verified mobile per lead.
Layer 2 — Rate Limiting
No referrer can submit more than 5 leads per day to a single business. Abnormal spikes trigger holds and admin review.
Layer 3 — PIN Physical Confirmation
Both tradie and consumer must be physically present for PIN exchange. Cannot be faked without consumer participation. Consumer has no incentive to collude.
Layer 4 — Device Fingerprinting
Referrer and consumer device fingerprints logged. Submissions from same device as referrer flagged for review.
Layer 5 — Relationship Graph
If referrer and tradie share IP history, phone number, or device — leads flagged as potential collusion.
Layer 6 — Quality Scoring
Each referrer builds a quality score based on PIN confirmation rate. Low scores result in throttling then suspension.
Layer 7 — Admin Dispute Flow
Either party can flag a lead. Flagged leads held in escrow pending manual admin review before payment released or reversed.


PART 10 — Go-To-Market Strategy
10.1 The Cold Start Solution
TradeRefer bootstraps supply first. Tradies are onboarded before the platform goes public. By launch day, tradies are active, profiles are populated, and the directory looks busy. Referrers join to an active platform with real earning potential, not an empty directory.

10.2 Phase 1 — Geelong Closed Beta
Identify and qualify 20-30 tradies per category in Geelong via Google Business listings.
Pre-create profiles and send transactional outreach emails.
Onboard willing tradies manually with white-glove support.
Each tradie invites their top referrers — friends, family, best past customers.
Referrers begin sharing links. First real leads flow. Real PIN confirmations happen. Real money is earned.
Referrers post publicly about their earnings. Social proof builds organically.
Target: 100 PIN-confirmed leads within 60 days of beta launch.

10.3 Viral Growth Mechanics
Referrers earn real money and talk about it publicly — organic word of mouth
Public leaderboard shows top earner amounts — motivates new referrers to join
Tradies with high connection rates earn 'Verified' badge and directory ranking boost
Every referral link shared exposes TradeRefer to a new potential consumer and potential referrer
Referrers can invite other referrers for the same tradie — multi-level referrer network building

10.4 Phase Rollout
Phase 1 — Geelong Closed Beta
20-30 tradies per category. Manual onboarding. Validate all flows. Target: 100 confirmed leads in 60 days.
Phase 2 — Geelong Public Launch
Open registration. Full directory live. Social media marketing push. Local community groups.
Phase 3 — Melbourne Metro
Suburb-by-suburb expansion. Same category-first approach. Scale infrastructure.
Phase 4 — National
All Australian states. Upgrade to Zai for mass BECS/PayID payouts. Automate TPAR reporting.


PART 11 — Database Schema
11.1 Overview
TradeRefer uses Supabase (PostgreSQL). All tables use UUID primary keys. Row Level Security (RLS) is enabled on all tables. All tables include created_at and updated_at timestamps managed by Supabase triggers. Migrations stored in /supabase/migrations/ — version controlled.

11.2 businesses table
id
UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id
UUID REFERENCES auth.users(id)
name
VARCHAR(255) NOT NULL
abn
VARCHAR(11)
category
ENUM('plumber','electrician','builder','cleaner','landscaper','painter','carpenter','roofer','tiler','other')
description
TEXT
suburb
VARCHAR(100) NOT NULL
state
VARCHAR(3) NOT NULL
website_url
VARCHAR(500)
referral_fee
DECIMAL(10,2) NOT NULL DEFAULT 3.00
wallet_balance
DECIMAL(10,2) NOT NULL DEFAULT 0.00
connection_rate
DECIMAL(5,2) DEFAULT 0.00
trust_score
INTEGER DEFAULT 0
status
ENUM('unclaimed','active','suspended') DEFAULT 'unclaimed'
is_verified
BOOLEAN DEFAULT FALSE
created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()


11.3 referrers table
id
UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id
UUID REFERENCES auth.users(id)
name
VARCHAR(255) NOT NULL
email
VARCHAR(255) UNIQUE NOT NULL
phone
VARCHAR(20) NOT NULL
abn
VARCHAR(11)
paypal_email
VARCHAR(255)
wallet_balance
DECIMAL(10,2) NOT NULL DEFAULT 0.00
total_earned
DECIMAL(10,2) NOT NULL DEFAULT 0.00
quality_score
INTEGER DEFAULT 50
status
ENUM('active','suspended','at_risk') DEFAULT 'active'
created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()


11.4 leads table
id
UUID PRIMARY KEY DEFAULT gen_random_uuid()
business_id
UUID REFERENCES businesses(id) NOT NULL
referrer_id
UUID REFERENCES referrers(id)
consumer_name
VARCHAR(255) NOT NULL
consumer_phone
VARCHAR(20) NOT NULL
consumer_email
VARCHAR(255) NOT NULL
job_type
VARCHAR(100) NOT NULL
description
TEXT NOT NULL
suburb
VARCHAR(100) NOT NULL
status
ENUM('pending','unlocked','on_the_way','confirmed','expired','disputed') DEFAULT 'pending'
pin
VARCHAR(4)
pin_expires_at
TIMESTAMP WITH TIME ZONE
pin_attempts
INTEGER DEFAULT 0
unlock_fee_paid
DECIMAL(10,2)
platform_fee_amount
DECIMAL(10,2)
referrer_payout_amount
DECIMAL(10,2)
unlocked_at
TIMESTAMP WITH TIME ZONE
on_the_way_at
TIMESTAMP WITH TIME ZONE
confirmed_at
TIMESTAMP WITH TIME ZONE
created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()


11.5 payment_transactions table
id
UUID PRIMARY KEY DEFAULT gen_random_uuid()
lead_id
UUID REFERENCES leads(id)
business_id
UUID REFERENCES businesses(id)
referrer_id
UUID REFERENCES referrers(id)
type
ENUM('lead_unlock','referrer_payout','bonus','refund')
amount
DECIMAL(10,2) NOT NULL
platform_fee
DECIMAL(10,2)
status
ENUM('pending','completed','failed','refunded')
eway_transaction_id
VARCHAR(255)
paypal_transaction_id
VARCHAR(255)
created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()


PART 12 — API Specification
12.1 Overview
Framework
FastAPI (Python)
Base URL (production)
https://api.traderefer.com.au
Base URL (development)
http://localhost:8000
Authentication
Supabase JWT Bearer token in Authorization header
Content type
application/json
Versioning
All endpoints prefixed with /v1/
Docs
Auto-generated Swagger UI at /docs (local only)


12.2 Consumer Endpoints (PUBLIC)
POST /v1/leads/submit
Consumer submits job request. Triggers phone OTP. Body: name, phone, email, suburb, job_type, description, referral_link_token.
POST /v1/leads/verify-otp
Consumer submits OTP to verify phone. Body: phone, otp, lead_draft_id. Creates lead on success.


12.3 Tradie Endpoints (AUTH REQUIRED)
GET /v1/leads
List all leads for authenticated tradie. Query params: status, page, limit.
GET /v1/leads/{id}
Get single lead detail. Returns locked info if not unlocked, full details if unlocked.
POST /v1/leads/{id}/unlock
Pay to unlock lead. Charges tradie card via eWAY. Returns consumer contact details.
POST /v1/leads/{id}/on-the-way
Trigger PIN generation. Sends SMS to consumer and notification to tradie.
POST /v1/leads/{id}/confirm-pin
Submit PIN. Body: pin. Validates and releases referrer payment on success.
POST /v1/leads/{id}/consumer-unavailable
Consumer not home. Reverts lead to 'unlocked' status.
GET /v1/businesses/me
Get authenticated tradie's business profile.
PATCH /v1/businesses/me
Update business profile fields.
GET /v1/businesses/me/referrers
List all referrers linked to this business with quality scores.
POST /v1/businesses/me/invite-referrer
Send referrer invitation email. Body: email.


12.4 Referrer Endpoints (AUTH REQUIRED)
GET /v1/referrers/me
Get referrer profile and wallet balance.
GET /v1/referrers/me/earnings
Earnings history with lead status and amounts.
POST /v1/referrers/me/withdraw
Request payout. Minimum $20 balance. Body: paypal_email, abn.
GET /v1/referrers/me/links
All active referral links with share URLs.
GET /v1/leaderboard
Top referrers this month — public data only (first name, suburb, amount).


12.5 Admin Endpoints (ADMIN AUTH REQUIRED)
POST /v1/admin/leads/{id}/dispute
Flag lead for review. Holds payment in escrow.
POST /v1/admin/leads/{id}/resolve
Resolve dispute. Body: outcome (confirm/reject), notes.
GET /v1/admin/fraud-queue
List leads flagged for review.
PATCH /v1/admin/referrers/{id}/status
Update referrer status (active/suspended/at_risk).


PART 13 — Technology Stack & Infrastructure
13.1 Why Monorepo
The entire platform is built in a single Turborepo monorepo. When the AI coding agent (Cursor, Claude Code) has access to the entire codebase at once, it can update a database schema and simultaneously update TypeScript types in both web and mobile apps, change an API endpoint and update every place it is called, and spot duplicated logic that should be shared. Without a monorepo, the agent only sees half the picture.

13.2 Monorepo Structure
tradie-refer/├── apps/│   ├── web/          ← Next.js (Vercel)│   │   ├── app/      ← App Router pages│   │   └── components/│   ├── mobile/       ← Expo React Native (iOS + Android)│   │   ├── app/      ← Expo Router screens│   │   └── components/│   └── api/          ← FastAPI (Railway)│       ├── routers/  ← Route handlers│       ├── models/   ← Pydantic models│       └── services/ ← Business logic├── packages/│   ├── types/        ← Shared TypeScript types│   ├── api-client/   ← Shared API call functions│   ├── utils/        ← PIN generation, validation, formatting│   └── config/       ← Shared constants and endpoints├── supabase/│   └── migrations/   ← Database schema — version controlled└── docs/             ← All specification documents

13.3 Technology Choices
Web Frontend
Next.js (App Router) — deployed on Vercel
Mobile App
Expo React Native — iOS and Android from single codebase
Backend API
FastAPI (Python) — deployed on Railway
Database & Auth
Supabase (PostgreSQL + Row Level Security + Auth)
Monorepo
Turborepo
SMS
Twilio or SMStoGo (Australian rates)
Email
SMTPtoGo — transactional email
Payment Collection
eWAY — Australian payment gateway
Payouts Phase 1
PayPal API
Payouts Phase 2
Zai — mass NPP/PayID/BECS bank transfers
AI Coding Agent
Cursor or Claude Code — must have full monorepo in context


PART 14 — Compliance & Legal
14.1 Australian Spam Act 2003
All electronic communications must comply with the Spam Act 2003 (Cth). Three requirements: consent, identification, and unsubscribe.
Initial tradie outreach email is classified as transactional (not marketing) — sent once, related to a specific action, not primarily promotional
Every email must include TradeRefer full legal name, ABN, and registered address
Every email must include a clear and functional unsubscribe link
Unsubscribes must be processed within 5 business days
Unsubscribing triggers complete deletion of tradie profile and all data
TradeRefer never sends marketing SMS without prior consent

14.2 ATO Tax Requirements
ABN Withholding
47% must be withheld from referrer payouts if no ABN provided. Remitted to ATO quarterly.
TPAR Reporting
Taxable Payments Annual Report filed annually for all referrer payments above $10. Collect: referrer name, ABN, address, total annual payments.
GST Registration
Required if annual revenue exceeds $75,000. Platform fees may be subject to GST.
ABN Collection
Built into withdrawal flow. Referrer prompted before first payout. Link to abr.gov.au provided.


14.3 Privacy Act 1988
Privacy Policy published at launch covering data collection, use, storage, and deletion rights
Consumer data retained for 12 months then deleted
Consumer data shared only with the tradie who unlocked that specific lead
Consumers can request deletion at privacy@traderefer.com.au
Consumers are never added to marketing lists

PART 15 — All Notification Templates
15.1 Consumer SMS
OTP: Your TradeRefer verification code is [OTP]. Valid for 10 minutes. Do not share this code. - TradeRefer
PIN: Hi [First Name], [Business Name] is on their way to you for your [Job Type] enquiry. Your connection code is [PIN]. Share this with them when they arrive. - TradeRefer
NEW PIN: Hi [First Name], a new connection code has been sent. Your new code is [NEW PIN]. Your previous code is no longer valid. - TradeRefer
CONFIRMED: Hi [First Name], your connection with [Business Name] has been confirmed. Thanks for using TradeRefer. - TradeRefer

15.2 Tradie SMS
NEW LEAD: You have a new lead in [Suburb] for [Job Type]. Log in to TradeRefer to unlock their details. - TradeRefer
ON WAY: You're heading to [First Name] in [Suburb] for [Job Type]. Ask them for their 4-digit connection code when you arrive and enter it in the TradeRefer app. - TradeRefer
CONFIRMED: Your visit to [Consumer First Name] in [Suburb] has been confirmed. The referrer has been paid. - TradeRefer
OTP: Your TradeRefer verification code is [OTP]. Valid for 10 minutes. - TradeRefer

15.3 Referrer Notifications
EARNED: Your referral to [Business Name] has been confirmed. $[Amount] added to your TradeRefer wallet. Balance: $[Total]. - TradeRefer
PAYOUT: Your withdrawal of $[Amount] is on its way to your PayPal. - TradeRefer

15.4 Consumer Confirmation Email
Subject: Your job request has been sent to [Business Name]Hi [First Name],We've sent your job request to [Business Name].What you requested: [Job Type] in [Suburb]Your description: [Job Description][Business Name] will contact you on [Mobile] to discuss your job and arrange a time.When they're on their way, we'll send you a 4-digit connection code via SMS. Share that code with them when they arrive.TradeRefer | traderefer.com.au

15.5 Referrer Earning Email
Subject: You just earned $[Amount] on TradeRefer!Hi [First Name],Great news — your referral to [Business Name] has been confirmed!Amount earned: $[Amount]Your wallet balance: $[Total]When your balance reaches $20, you can withdraw to your PayPal.traderefer.com.au/dashboard



TradeRefer Combined Master Specification — Confidential — Version 1.0 — February 2026
This document is the single source of truth for the TradeRefer platform. Do not implement anything not specified here without explicit approval.
