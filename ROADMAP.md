# TradeRefer Platform Roadmap

> Last updated: 25 Feb 2026

---

## Vision

Australia's leading trade referral marketplace — where referrers earn commissions by connecting customers with quality tradies, and businesses get pre-vetted leads without marketing spend.

**Live at:** [traderefer.au](https://traderefer.au)
**API:** Railway (FastAPI + Neon Postgres)
**Auth:** Clerk (email + Google OAuth)
**Region:** Geelong, VIC (expanding later)

---

## Completed

### Phase 0–4: Core Platform (Done)

- [x] Dual-role system: Business + Referrer with separate dashboards
- [x] Clerk auth with email + Google OAuth, SSO callback routes
- [x] Server-side auth routing (`/auth/status` API → `/dashboard` redirects)
- [x] Business onboarding (multi-step: details → fees → photos → success)
- [x] Referrer onboarding (phone + suburb, name auto-filled from Clerk)
- [x] Welcome tour for both roles
- [x] Public business profiles (`/b/[slug]`)
- [x] Referrer-facing business page (`/b/[slug]/refer`) with commission info
- [x] Business directory with search, filters, trade categories
- [x] Referral link generation and tracking
- [x] Lead submission with SMS verification
- [x] Lead management (business dashboard: accept/reject/unlock)
- [x] Wallet system with earnings tracking
- [x] Payout requests
- [x] In-app notifications + notification bell
- [x] Messaging system (business ↔ referrer conversations)
- [x] Business storefront link card
- [x] Image upload (logos + work gallery via Cloudinary)
- [x] Listing visibility (public / private invite-only)
- [x] Slug auto-generation + availability check

### Phase 5–7: Engagement Features (Done)

- [x] Campaign system (businesses create time-limited promos)
- [x] Deal cards (businesses create shareable offers)
- [x] Share kit (SMS, WhatsApp, email, QR code)
- [x] Referrer reviews of businesses
- [x] Private feedback system
- [x] Project photos gallery
- [x] Lead pinning

### Phase 8: Network Effects (Done)

- [x] "My Trades Team" for referrers (connected businesses list)
- [x] Business-to-business recommendations API + UI
- [x] Business invites system
- [x] "Trusted By" badge on public profiles (referrer + business count)
- [x] Shareable team pages (`/team/[id]`)

### Phase 9: Auth Flow Fixes (Done)

- [x] `/auth/status` API endpoint (returns user role from DB)
- [x] Server-side `/dashboard` redirect based on role
- [x] Google OAuth unhidden on login + register pages
- [x] Clerk SSO callback catch-all routes (`[[...sign-in]]`, `[[...sign-up]]`)
- [x] `fallbackRedirectUrl="/dashboard"` on SignIn + SignUp
- [x] Clerk env vars on Vercel (`AFTER_SIGN_IN_URL`, `AFTER_SIGN_UP_URL`)
- [x] CORS updated for `traderefer.au`
- [x] Removed duplicate name field from referrer onboarding (auto-fill from Clerk)

### Phase 10: Location System (Done)

- [x] Geelong suburb data (65 suburbs) in `lib/locations.ts`
- [x] State → City → Suburb hierarchy (ready for expansion)
- [x] Searchable suburb dropdown on referrer onboarding
- [x] Searchable suburb dropdown on business onboarding (state hidden, VIC only)

---

## In Progress

### Phase 11: AI-Powered Onboarding

> Use AI to reduce form friction and generate rich business profiles automatically.

**Stack:** Vercel AI SDK (`ai` + `@ai-sdk/openai`) with structured output via Zod

- [x] Install AI SDK + OpenAI provider
- [x] DB migration: `years_experience`, `services`, `specialties`, `business_highlights` columns
- [x] `/api/ai/generate-profile` API route (generates description, why_refer_us, services, features)
- [ ] AI Q&A step in business onboarding (3-4 quick questions → chip/button answers)
- [ ] AI generates: description, why_refer_us, services list, features list
- [ ] Preview & edit step (show generated profile, user can tweak)
- [ ] Restructured business onboarding flow:
  1. Essentials (name, trade, suburb, slug)
  2. AI Q&A (years, specialty, highlights — buttons not forms)
  3. AI Preview (generated profile with edit option)
  4. Fees & Visibility (radius, commission, public/private)
  5. Photos (logo + gallery)
  6. Success
- [ ] Update API to accept new fields (`years_experience`, `services`, `specialties`, `business_highlights`)
- [ ] Update public profile page with richer sections (Services We Provide, About Us, Why Refer Us)

**Inspired by:** Service Seeking profiles — strong points:
- "About Us" section with personality
- Services list with specific offerings
- Reviews with customer quotes
- Badges (Identity, ABN verified)

---

## Planned

### Phase 12: Enhanced Public Profiles

> Upgrade `/b/[slug]` to be a rich, Service-Seeking-quality profile page.

- [ ] "About Us" section (AI-generated description, editable)
- [ ] "Services We Provide" section (from AI-generated services list)
- [ ] "Why Refer Us" section (visible to referrers)
- [ ] Business highlights chips (Licensed & Insured, Same-Day Service, etc.)
- [ ] Years of experience badge
- [ ] Specialty tags
- [ ] Photo gallery with lightbox
- [ ] Review summary with star rating
- [ ] Response time badge
- [ ] "Trusted By X referrers" social proof

### Phase 13: Referrer Tiers & Gamification

> Retention engine — give referrers a reason to stay and grow.

| Tier | Requirement | Perk |
|---|---|---|
| **Starter** | 0–5 referrals | 80% commission split (base) |
| **Pro** | 6–20 referrals | 85% split + priority support |
| **Elite** | 21–50 referrals | 90% split + featured referrer badge |
| **Ambassador** | 50+ referrals | 90% split + early access + quarterly bonuses |

- [ ] Tier progress bar on referrer dashboard
- [ ] Tier badge on referrer profile
- [ ] Commission split auto-adjusts based on tier
- [ ] Notification when tier is unlocked

### Phase 14: Smart Notifications & Nudges

- [ ] "Mike's Plumbing just increased their referral fee to $20/lead!"
- [ ] "You haven't shared your link for Dave's Electrical in 14 days"
- [ ] "New campaign: Double commission on all landscaping referrals this weekend"
- [ ] "Your referral to ABC Plumbing was accepted! You earned $15"
- [ ] "You're 2 referrals away from Pro tier"
- [ ] "New business in your area: Jim's Fencing — $20/lead"
- [ ] Notification preferences (email, push, in-app)

### Phase 15: Earnings Dashboard Redesign

- [ ] This week/month earnings with trend arrows
- [ ] Pending earnings (leads awaiting business response)
- [ ] Lifetime earnings prominently displayed
- [ ] Goal tracker with progress ring
- [ ] Earnings graph (weekly/monthly trend)
- [ ] Per-business breakdown
- [ ] Earnings estimator

### Phase 16: Advanced Features (Future)

- [ ] Warm vs cold lead differentiation
- [ ] Trending/discovery ("Hot Right Now", "New on TradeRefer", "In Your Area")
- [ ] Referrer-business relationship health score
- [ ] Bulk referrer communication from businesses
- [ ] Response SLA tracking + directory ranking
- [ ] Multi-region expansion (Melbourne, Sydney, Brisbane)

---

## Technical Architecture

```
Frontend:  Next.js 15 (App Router) → Vercel → traderefer.au
API:       FastAPI (async) → Railway → traderefer-api-production.up.railway.app
Database:  Neon Postgres (serverless)
Auth:      Clerk (email + Google OAuth) → clerk.traderefer.au
AI:        Vercel AI SDK + OpenAI (gpt-4o-mini)
Storage:   Cloudinary (images)
Location:  Geelong, VIC only (lib/locations.ts ready for expansion)
```

---

## The Retention Loop

```
Referrer signs up (Google OAuth or email)
  → Onboarding: phone + suburb (30 seconds)
  → Browses directory (attracted by commission + deals)
  → Connects to 2-3 businesses
  → Shares using share kit (pre-written messages, one tap)
  → Gets notification: "Lead accepted! $15 earned"
  → Checks dashboard: earnings + tier progress
  → Sees campaign: "Double commission weekend"
  → Shares more → Hits Pro tier → 85% split
  → Invested → stays → cycle repeats

Business signs up (Google OAuth or email)
  → AI onboarding: answer 3 questions → profile auto-generated
  → Sets commission rate + uploads photos
  → Gets quality leads from referrer network
  → Responds fast → earns good response badge
  → Launches campaigns → more referrers → more leads
```

---

## Key Principles

1. **Commission transparency** — referrers always know exactly what they'll earn
2. **Low effort to share** — pre-written messages, one-tap sharing, QR codes
3. **AI-first onboarding** — businesses answer questions, AI writes the profile
4. **Urgency through campaigns** — time-limited deals drive action now
5. **Status through tiers** — progress bars and levels prevent churn
6. **Quality over quantity** — reward better leads, not just more leads
7. **Referrers are partners, not users** — treat them like affiliates, not customers
8. **Geelong first, Australia later** — nail one region before expanding
