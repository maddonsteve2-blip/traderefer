# TradeRefer Dashboard UX/UI Audit — Comprehensive Review Prompt

## Your Mission

You are conducting a **complete visual UX/UI audit** of the TradeRefer platform dashboards. Your goal is to identify **every UI/UX issue, inconsistency, broken flow, confusing element, accessibility problem, and design flaw** across both the Business and Referrer dashboards.

Test the live application at: **https://traderefer.au**

---

## What TradeRefer Is

TradeRefer is an **Australian referral-powered lead marketplace** for trade and home service businesses (plumbers, electricians, builders, cleaners, etc.). It operates a **three-sided marketplace**:

1. **Businesses (Tradies)** — List their services, pay $3-$20 per lead (they set the price), receive verified customer enquiries
2. **Referrers** — Anyone can sign up, generate unique referral links for businesses, earn 70% commission when leads are unlocked
3. **Consumers** — Click referral links, submit enquiries via phone-verified forms, get connected with tradies

### Core Value Propositions
- **For Businesses:** Pay-per-lead (no subscription), exclusive leads (not shared with competitors), phone-verified quality
- **For Referrers:** Passive income from recommendations they're already making, 70/30 split, transparent earnings
- **For Consumers:** Trusted recommendations from people they know, verified businesses

### Key Differentiators vs Competitors (HiPages, ServiceSeeking)
- **No subscription** — businesses pay only when leads arrive
- **Exclusive leads** — never shared with 7 competitors like HiPages does
- **Referrer rewards** — 70% commission creates a motivated referral network
- **Phone verification** — every lead is OTP-verified before creation
- **Prezzee rewards** — referrers earn $25 Prezzee gift cards every 5 active invites

---

## Platform Architecture You Need to Understand

### Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui components
- **Backend API:** FastAPI (Python) on Railway
- **Database:** Neon Postgres (serverless)
- **Auth:** Clerk (email + Google OAuth)
- **Payments:** Stripe (for business wallet top-ups and lead unlocks)
- **Notifications:** In-app notification bell, email, SMS (Twilio)
- **Rewards:** Prezzee gift card API integration

### User Roles & Dashboards
1. **Business Dashboard** (`/dashboard/business/*`)
2. **Referrer Dashboard** (`/dashboard/referrer/*`)
3. **Public Pages** (`/businesses`, `/b/[slug]`, `/r/[business-slug]/[link-code]`)

---

## Complete User Flows You Must Test

### Flow 1: Business Onboarding & First Lead
1. Sign up at `/register?type=business` (email or Google OAuth)
2. Complete onboarding:
   - Step 1: Business details (name, trade category, suburb, slug, phone + OTP verification)
   - Step 2: Fees & visibility (referral fee $3-$20, service radius, public/private)
   - Step 3: Photos (logo + work gallery upload via Cloudinary)
   - Step 4: Success screen with "Invite & Earn" Prezzee messaging
3. Land on business dashboard (`/dashboard/business`)
4. See welcome dialog (first visit only, localStorage flag)
5. Navigate to "Leads" tab — see empty state
6. Navigate to "Sales" tab — see referral progress widget + invite button
7. Click "Invite & Earn" → open invite dialog → send invites (manual email or Google Contacts import)
8. Receive a lead notification (you'll need to simulate this or have a referrer create one)
9. See lead card in "Leads" inbox — details blurred
10. Click "Unlock Lead" → payment modal → pay via Stripe
11. See full consumer details revealed
12. Click "I'm On My Way" → PIN sent to consumer
13. Enter PIN → lead confirmed → see success state

### Flow 2: Referrer Onboarding & First Earning
1. Sign up at `/register?type=referrer` (email or Google OAuth)
2. Complete onboarding:
   - Step 0: Prezzee rewards explainer strip
   - Step 1: Name (auto-filled from Clerk)
   - Step 2: Phone + OTP verification
   - Step 3: Address (Google Places Autocomplete for suburb/state/postcode)
3. Land on referrer dashboard (`/dashboard/referrer`)
4. See welcome dialog (first visit only)
5. See Prezzee rewards card with Smart Card GIF background
6. Navigate to "Refer" tab → browse business directory
7. Click "Refer" on a business → see referral page (`/dashboard/referrer/refer/[slug]`)
8. Generate referral link → copy link
9. Share link via SMS/WhatsApp/email (test share kit)
10. Consumer clicks link → submits lead → OTP verification
11. Referrer sees notification "New lead submitted!"
12. Business unlocks lead → referrer sees "Lead unlocked! You earned $X"
13. Navigate to "Wallet" tab → see pending earnings (7-day hold)
14. After 7 days OR PIN confirmation → earnings move to "Available"
15. Click "Withdraw" → see Prezzee gift card redemption flow

### Flow 3: Business Invites & Rewards
1. Business clicks "Invite & Earn" button in dashboard
2. Opens invite dialog with two tabs: "Manual" and "Google Contacts"
3. Manual tab: enter emails, select inviter type (referrer/business), send
4. Google Contacts tab: authenticate with Google, import contacts, send bulk invites
5. See "Referral Progress" widget showing X/5 active invites
6. When 5th invite becomes active (unlocks first lead) → business earns $25 Prezzee card
7. See reward notification + updated progress widget

### Flow 4: Referrer Invites & Rewards (Same as Business)
1. Referrer clicks "Invite Friends" button
2. Same invite dialog flow
3. Same progress tracking
4. Same $25 Prezzee reward at 5 active invites

### Flow 5: Lead Lifecycle States
Test that leads correctly display in each state:
- **PENDING** — Lead created, awaiting business unlock (48hr timer visible)
- **UNLOCKED** — Business paid, consumer details visible, "I'm On My Way" button shown
- **ON_THE_WAY** — PIN sent, countdown timer shown, PIN entry field active
- **CONFIRMED** — PIN correct, green checkmark, "Visit Confirmed" badge
- **UNCONFIRMED** — PIN expired or 3 wrong attempts, grey state
- **EXPIRED** — 48hrs passed without unlock, lead removed from inbox
- **DISPUTED** — Business reported issue, admin review pending

### Flow 6: Wallet & Payments (Business)
1. Navigate to "Wallet" tab
2. See current balance, transaction history
3. Click "Top Up Wallet" → see bonus tiers (10%, 15%, 20%)
4. Enter amount → Stripe payment modal → complete payment
5. See balance updated + transaction logged
6. Unlock a lead using wallet balance (auto-deducted)

### Flow 7: Campaigns & Deals (Business)
1. Navigate to "Campaigns" tab
2. Click "Create Campaign" → fill form (title, description, bonus amount, dates)
3. Save campaign → see active campaign card
4. Campaign appears on business profile page for referrers
5. Referrers see "Double Commission" or bonus badge

### Flow 8: Messaging System
1. Business receives lead → clicks "Message Referrer"
2. Opens messaging panel → send message
3. Referrer receives notification → opens message → replies
4. Test real-time updates (if implemented) or refresh behavior

### Flow 9: Public Business Profile
1. Visit `/b/[slug]` as logged-out user
2. See business profile: logo, description, photos, reviews, badges
3. See "Get a Quote" form (for consumers arriving via referral links)
4. Submit form → OTP verification → lead created

### Flow 10: Referral Link Landing Page
1. Visit `/r/[business-slug]/[link-code]` (referrer's unique link)
2. See business profile with referrer attribution
3. Submit lead form → OTP → lead created
4. Referrer's link_code tracked in database

---

## What You Must Check (Detailed Checklist)

### 1. Visual Design & Consistency

#### Brand & Colors
- [ ] TradeRefer orange (#FF6600) used consistently for primary actions
- [ ] Zinc grays used for text hierarchy (900 for headings, 600 for body, 400 for muted)
- [ ] No random color variations or inconsistent button styles
- [ ] Prezzee brand colors (light blue #E0F2FE) used correctly in reward sections

#### Typography
- [ ] Font sizes follow a clear hierarchy (text-4xl → text-3xl → text-2xl → text-xl → text-base → text-sm → text-xs)
- [ ] Font weights used correctly (font-black for headings, font-bold for emphasis, font-medium for body)
- [ ] No text too small to read (minimum text-sm for body copy)
- [ ] Line heights appropriate for readability (leading-relaxed for paragraphs)

#### Spacing & Layout
- [ ] Consistent padding/margin scale (p-4, p-6, p-8, gap-4, gap-6, etc.)
- [ ] Cards use rounded-2xl consistently
- [ ] No elements touching screen edges (proper container padding)
- [ ] White space used effectively (not cramped, not too sparse)

#### Components
- [ ] Buttons have consistent sizing (h-10, h-11, px-4, px-6)
- [ ] Input fields have consistent styling (border, focus states, error states)
- [ ] Modals/dialogs have consistent width, padding, and close button placement
- [ ] Loading states shown for async actions (spinners, skeleton screens)
- [ ] Empty states have helpful messaging + clear CTAs

### 2. Navigation & Information Architecture

#### Dashboard Navigation
- [ ] Business dashboard tabs clearly labeled and in logical order
- [ ] Referrer dashboard tabs clearly labeled and in logical order
- [ ] Active tab visually distinct (underline, bold, color change)
- [ ] Breadcrumbs shown on deep pages (e.g., `/dashboard/business/applications/[id]`)
- [ ] "Back" buttons where appropriate
- [ ] Logo in navbar links to correct homepage (not dashboard)

#### Mobile Navigation
- [ ] Hamburger menu works on mobile (<768px)
- [ ] Mobile menu shows all navigation items
- [ ] Mobile menu closes after selection
- [ ] Bottom nav bar (if present) doesn't overlap content

#### URL Structure
- [ ] URLs are human-readable and SEO-friendly
- [ ] `/dashboard/business/*` for business routes
- [ ] `/dashboard/referrer/*` for referrer routes
- [ ] `/b/[slug]` for public business profiles
- [ ] `/r/[business-slug]/[link-code]` for referral links

### 3. Forms & Input Validation

#### All Forms Must Have:
- [ ] Clear labels for every field
- [ ] Placeholder text where helpful (not as a replacement for labels)
- [ ] Required field indicators (* or "Required" text)
- [ ] Inline validation (real-time feedback as user types)
- [ ] Error messages below fields (red text, clear explanation)
- [ ] Success states (green checkmark, success message)
- [ ] Disabled submit button until form is valid
- [ ] Loading state on submit button ("Submitting..." with spinner)

#### Specific Form Tests:
- [ ] **Business onboarding:** All 3 steps validate correctly, can't skip required fields
- [ ] **Referrer onboarding:** Phone OTP works, address autocomplete works
- [ ] **Lead submission:** OTP verification works, duplicate phone rejected
- [ ] **Invite dialog:** Email validation works, Google Contacts import works
- [ ] **Wallet top-up:** Amount validation, Stripe modal opens correctly
- [ ] **Campaign creation:** Date picker works, bonus amount validates

### 4. Data Display & Tables

#### Lead Cards (Business Dashboard)
- [ ] Lead cards show correct status badge (color-coded)
- [ ] Blurred consumer details before unlock (name, phone, email hidden)
- [ ] Full details visible after unlock
- [ ] Countdown timers work (48hr expiry, 4hr PIN expiry)
- [ ] "Unlock" button shows exact price
- [ ] "I'm On My Way" button only shown for UNLOCKED leads
- [ ] PIN entry field only shown for ON_THE_WAY leads

#### Earnings Table (Referrer Dashboard)
- [ ] Earnings sorted by date (most recent first)
- [ ] Status badges clear (Pending, Available, Paid)
- [ ] Available date shown for pending earnings
- [ ] Total balance calculated correctly
- [ ] Filter tabs work (All, Pending, Available, Paid)

#### Transaction History (Wallet)
- [ ] Transactions sorted by date (most recent first)
- [ ] Type clearly labeled (Top-up, Lead Unlock, Bonus Applied)
- [ ] Amount shown with correct sign (+ for credits, - for debits)
- [ ] Balance-after shown for each transaction

### 5. Notifications & Feedback

#### Notification Bell
- [ ] Red dot badge shows unread count
- [ ] Clicking bell opens notification dropdown
- [ ] Notifications sorted by date (newest first)
- [ ] Unread notifications visually distinct (bold or background color)
- [ ] Clicking notification marks as read
- [ ] "Mark all as read" button works
- [ ] Notification links navigate to correct page

#### Toast Notifications
- [ ] Success toasts appear for positive actions (green, checkmark icon)
- [ ] Error toasts appear for failures (red, X icon)
- [ ] Info toasts appear for neutral updates (blue, info icon)
- [ ] Toasts auto-dismiss after 3-5 seconds
- [ ] Toasts stack correctly if multiple appear
- [ ] Toasts don't block important UI elements

#### Email Notifications
- [ ] Lead created → business receives email within 60 seconds
- [ ] Lead unlocked → referrer receives email
- [ ] PIN sent → consumer receives email + SMS
- [ ] Earnings available → referrer receives email
- [ ] All emails have unsubscribe link (Spam Act compliance)

### 6. Mobile Responsiveness

Test at these breakpoints:
- **Mobile:** 375px (iPhone SE)
- **Tablet:** 768px (iPad)
- **Desktop:** 1440px (standard laptop)

#### Must Work on Mobile:
- [ ] All dashboard tabs accessible
- [ ] Forms usable (inputs large enough to tap, no horizontal scroll)
- [ ] Tables convert to cards or scroll horizontally
- [ ] Modals fit screen (no overflow)
- [ ] Images scale correctly
- [ ] Text readable without zooming
- [ ] Buttons large enough to tap (min 44x44px)
- [ ] No elements cut off or overlapping

### 7. Performance & Loading States

#### Page Load Times
- [ ] Dashboard loads in <2 seconds
- [ ] Business directory loads in <2 seconds
- [ ] Public business profile loads in <1 second (SSR)

#### Loading States
- [ ] Skeleton screens shown while data loads (not blank white screen)
- [ ] Spinners shown for async actions (button clicks, form submits)
- [ ] "Loading..." text shown where appropriate
- [ ] No flash of unstyled content (FOUC)

#### Error States
- [ ] API errors show user-friendly messages (not raw error codes)
- [ ] Network errors show retry button
- [ ] 404 pages have helpful messaging + link to homepage
- [ ] 500 errors don't expose stack traces

### 8. Accessibility (WCAG 2.1 AA)

#### Keyboard Navigation
- [ ] All interactive elements reachable via Tab key
- [ ] Focus indicators visible (outline or ring)
- [ ] Modals trap focus (can't Tab outside modal)
- [ ] Escape key closes modals
- [ ] Enter key submits forms

#### Screen Reader Support
- [ ] All images have alt text
- [ ] Form labels associated with inputs (for/id match)
- [ ] Buttons have descriptive text (not just icons)
- [ ] ARIA labels used where needed (e.g., icon-only buttons)
- [ ] Headings follow logical hierarchy (h1 → h2 → h3)

#### Color Contrast
- [ ] Text meets 4.5:1 contrast ratio (body text)
- [ ] Large text meets 3:1 contrast ratio (headings)
- [ ] Interactive elements distinguishable without color alone
- [ ] Error states don't rely solely on red color

### 9. Business Logic & Edge Cases

#### Lead States
- [ ] Lead expires after 48 hours if not unlocked
- [ ] PIN expires after 4 hours if not entered
- [ ] 3 wrong PIN attempts locks lead to UNCONFIRMED
- [ ] Duplicate phone number rejected for same business
- [ ] Consumer can resubmit after lead expires

#### Earnings & Payouts
- [ ] 70/30 split calculated correctly (integer cents, round down to referrer)
- [ ] Earnings move to AVAILABLE after 7 days OR PIN confirmation
- [ ] Minimum withdrawal $20 enforced
- [ ] Prezzee rewards triggered at exactly 5 active invites

#### Wallet & Payments
- [ ] Bonus tiers applied correctly (10%, 15%, 20%)
- [ ] Wallet balance deducted before card charge
- [ ] Insufficient wallet balance falls back to card
- [ ] Stripe payment modal handles errors gracefully

### 10. Content & Copywriting

#### Tone & Voice
- [ ] Friendly, conversational, Australian English
- [ ] No jargon or technical terms without explanation
- [ ] Action-oriented CTAs ("Get Started", "Unlock Lead", not "Click Here")
- [ ] Consistent terminology (e.g., always "lead" not "enquiry" or "referral")

#### Error Messages
- [ ] Specific and actionable (not "Something went wrong")
- [ ] Suggest next steps ("Please try again" or "Contact support")
- [ ] No blame language ("You entered an invalid email" → "Please enter a valid email")

#### Empty States
- [ ] Explain why it's empty ("No leads yet")
- [ ] Suggest next action ("Share your referral link to start earning")
- [ ] Include relevant CTA button

---

## Quality Standards (Rate Each Area 1-10)

For each section below, provide a **score out of 10** and **specific examples** of issues found.

### Visual Polish (1-10)
- Consistency of design language
- Professional appearance
- Attention to detail (alignment, spacing, colors)

### User Flow Clarity (1-10)
- Ease of completing primary tasks
- Logical navigation structure
- Clear next steps at each stage

### Information Hierarchy (1-10)
- Most important info stands out
- Scannable layouts
- Appropriate use of headings, bold, color

### Error Handling (1-10)
- Helpful error messages
- Graceful degradation
- Recovery paths provided

### Mobile Experience (1-10)
- Usability on small screens
- Touch target sizes
- Responsive layout quality

### Performance (1-10)
- Page load speed
- Smooth interactions
- No janky animations

### Accessibility (1-10)
- Keyboard navigation
- Screen reader support
- Color contrast

### Overall UX (1-10)
- Delightful to use
- Minimal friction
- Meets user expectations

---

## Output Format

Structure your audit report as follows:

```markdown
# TradeRefer UX/UI Audit Report

## Executive Summary
[2-3 paragraph overview of overall quality, major strengths, critical issues]

## Quality Scores
- Visual Polish: X/10
- User Flow Clarity: X/10
- Information Hierarchy: X/10
- Error Handling: X/10
- Mobile Experience: X/10
- Performance: X/10
- Accessibility: X/10
- Overall UX: X/10

**Overall Platform Score: XX/80**

## Critical Issues (Must Fix)
[Issues that break core functionality or severely harm UX]

1. **[Issue Title]**
   - **Location:** [Specific page/component]
   - **Severity:** Critical
   - **Description:** [What's wrong]
   - **Impact:** [How it affects users]
   - **Recommendation:** [How to fix]
   - **Screenshot/Evidence:** [If applicable]

## High Priority Issues (Should Fix Soon)
[Issues that significantly degrade UX but don't break functionality]

## Medium Priority Issues (Nice to Have)
[Polish issues, minor inconsistencies, optimization opportunities]

## Positive Highlights
[Things that work really well and should be maintained/expanded]

## Flow-by-Flow Breakdown

### Business Onboarding Flow
- Issues found: [List]
- Overall rating: X/10
- Key recommendations: [List]

### Referrer Onboarding Flow
- Issues found: [List]
- Overall rating: X/10
- Key recommendations: [List]

[Continue for all 10 flows listed above]

## Component-Level Issues

### Navigation
[Specific issues with navbar, tabs, breadcrumbs, etc.]

### Forms
[Specific issues with validation, error states, etc.]

### Data Tables/Cards
[Specific issues with lead cards, earnings tables, etc.]

### Modals/Dialogs
[Specific issues with payment modal, invite dialog, etc.]

## Mobile-Specific Issues
[Issues only present on mobile breakpoints]

## Accessibility Issues
[WCAG violations, keyboard nav problems, etc.]

## Recommendations Summary
1. [Top priority fix]
2. [Second priority fix]
3. [Third priority fix]
...

## Conclusion
[Final thoughts on platform maturity, readiness for scale, areas of excellence]
```

---

## Testing Credentials

You'll need to create test accounts:

1. **Business Account:**
   - Sign up at https://traderefer.au/register?type=business
   - Use a real email (you'll need to verify it)
   - Complete full onboarding

2. **Referrer Account:**
   - Sign up at https://traderefer.au/register?type=referrer
   - Use a different email
   - Complete full onboarding

3. **Test Lead Submission:**
   - Generate a referral link from your referrer account
   - Open in incognito/private window
   - Submit a lead with a real phone number (you'll receive OTP)

---

## Important Context

### Recent Major Changes (March 2026)
- **Prezzee Integration:** Referrers and businesses now earn $25 Prezzee gift cards every 5 active invites
- **Invite & Earn System:** Both roles can invite others and track progress toward rewards
- **Google Contacts Import:** Bulk invite feature added to invite dialogs
- **Redesigned Onboarding:** Streamlined to 3 steps, removed ABN/tax/payout fields (now Prezzee-based)

### Known Limitations (Don't Report These)
- Mobile app doesn't exist yet (PIN entry is web-only for now)
- Admin panel not accessible to regular users
- Some features in roadmap not yet built (referrer tiers, advanced analytics)

### What "Good" Looks Like
Compare to these benchmarks:
- **HiPages** (hipages.com.au) — market leader, but expensive and extractive
- **ServiceSeeking** (serviceseeking.com.au) — strong profiles, good UX
- **Airtasker** (airtasker.com) — excellent mobile experience
- **Stripe Dashboard** — gold standard for financial UI/UX

---

## Final Instructions

1. **Be thorough** — Test every flow, every button, every form
2. **Be specific** — "Button doesn't work" is useless. "Unlock Lead button on lead card ID #123 shows Stripe modal but payment fails with 'Invalid token' error" is helpful
3. **Be fair** — Note what works well, not just what's broken
4. **Be actionable** — Every issue should have a clear recommendation
5. **Prioritize** — Distinguish between "app is broken" vs "this could be better"
6. **Use screenshots** — Visual evidence helps immensely
7. **Test on multiple devices** — Desktop Chrome, mobile Safari, mobile Chrome minimum
8. **Think like a user** — Would a tradie in Geelong find this intuitive? Would a real estate agent understand how to earn commissions?

**Your audit will directly inform the next sprint of improvements. Be the quality bar.**
