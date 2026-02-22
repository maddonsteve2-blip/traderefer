# TradeRefer — Full Codebase Audit & Refactoring Report

> Generated: 2026-02-21
> Scope: Every file, every function — file-by-file, function-by-function

---

## Table of Contents

1. [Backend API](#1-backend-api)
2. [Frontend — Pages](#2-frontend--pages)
3. [Frontend — Components](#3-frontend--components)
4. [Shared / Config / Infrastructure](#4-shared--config--infrastructure)
5. [Database Schema vs Code Gaps](#5-database-schema-vs-code-gaps)
6. [Cross-Cutting Issues](#6-cross-cutting-issues)
7. [Priority Summary](#7-priority-summary)

---

## 1. Backend API

### `apps/api/main.py`

| Function | Status | Issue |
|----------|--------|-------|
| `root()` | ⚠️ | Health check endpoint returns plain JSON. **Missing**: no `/health` endpoint with DB connectivity check for production monitoring. |
| CORS config | ⚠️ | Only allows a single origin from `FRONTEND_URL`. **Missing**: support for multiple origins (e.g. staging + production + mobile). |
| Router registration | ⚠️ | `webhooks` router is mounted but has no signature verification fallback in production — only skips in dev. |

---

### `apps/api/services/database.py`

| Function | Status | Issue |
|----------|--------|-------|
| `get_db()` | ⚠️ | Strips ALL query parameters from DATABASE_URL (line 18-19). This removes `sslmode`, `options`, and Neon-specific params like `endpoint`. Could break pooled connections. Should only strip problematic params, not all. |
| Engine config | ⚠️ | `pool_pre_ping=True` is good, but **missing**: `pool_size`, `max_overflow`, `pool_recycle` settings for production. |
| SSL | ℹ️ | Hard-coded `ssl: True`. Fine for Neon but not portable. |

---

### `apps/api/services/auth.py`

| Function | Status | Issue |
|----------|--------|-------|
| `get_jwks()` | 🔴 | **JWKS is cached forever** (global `_jwks` variable, never refreshed). If keys rotate, the server will reject all tokens until restarted. Needs TTL-based cache (e.g. 1 hour). |
| `get_current_user()` | ⚠️ | `verify_aud` and `verify_iss` are both `False`. This means any valid JWT from any Clerk/Neon Auth project would be accepted. Should verify issuer at minimum. |
| `get_current_user()` | ⚠️ | Uses `uuid.uuid5(uuid.NAMESPACE_DNS, clerk_id)` to generate a stable UUID. This is fine but **undocumented** — if the namespace ever changes, all user-to-data mappings break. |

---

### `apps/api/middleware/auth.py`

| Function | Status | Issue |
|----------|--------|-------|
| `get_jwks()` | ✅ | Has proper TTL cache (1 hour). Better than `services/auth.py`. |
| `get_current_user()` | ⚠️ | Returns raw JWT payload dict, not a typed object. Inconsistent with `services/auth.py` which returns `AuthenticatedUser`. |
| `require_admin()` | 🔴 | **Checks `user.get("role") != "admin"`** but Clerk/Neon Auth JWTs don't include a `role` claim by default. This function will **always deny access**. Admin role checking is not implemented. |
| **Duplicate** | 🔴 | **This entire file is a duplicate of `services/auth.py`**. Two competing auth implementations exist. The routers import from `services/auth.py` — this file appears unused. Should be consolidated or deleted. |

---

### `apps/api/services/stripe_service.py`

| Function | Status | Issue |
|----------|--------|-------|
| `create_connected_account()` | ⚠️ | Falls back to mock `acct_mock_*` ID on any error. In production, this would silently create fake accounts and break payment flows. Needs proper error propagation. |
| `create_account_link()` | ⚠️ | Same mock fallback issue — returns a fake Stripe URL. |
| `create_payment_intent()` | ⚠️ | Returns a `MockIntent` class on failure. Downstream code calls `.client_secret` on this, which would return a fake secret. No way to distinguish real vs mock. |
| `get_publishable_key()` | ℹ️ | Returns `pk_test_mock` as default. Fine for dev, but should fail loudly in production. |
| **Missing** | 🔴 | **No `create_payout()` method** — the WithdrawalForm on the frontend has no backend implementation. Withdrawals are completely non-functional. |
| **Missing** | 🔴 | **No `check_account_status()` method** — cannot verify if a Stripe Connect account has completed onboarding. |

---

### `apps/api/routers/business.py`

| Function | Status | Issue |
|----------|--------|-------|
| `BusinessOnboarding` model | ⚠️ | Has `unlock_fee_cents` (legacy) AND `referral_fee_cents`. Default is `1250` but frontend now sends `1000`. The legacy field should be removed. |
| `onboarding()` | ⚠️ | Hard-codes `state: "VIC"`. Should accept state from form data or derive from suburb. |
| `onboarding()` | ℹ️ | Slug generation with fallback is good. |
| `get_my_business()` | ✅ | Clean implementation. |
| `check_slug_availability()` | ⚠️ | **No authentication required** — anyone can probe slugs. Low risk but worth noting. |
| `update_business()` | ⚠️ | Uses `data.dict(exclude_unset=True)` — Pydantic v1 syntax. Will break on Pydantic v2 (should be `model_dump`). |
| `update_business()` | ⚠️ | **No validation on `referral_fee_cents`** — a business could set it to 0 or negative. Should enforce minimum ($3.00 / 300 cents). |
| `get_business_dashboard()` | ⚠️ | `trust_score/20` calculation for display assumes trust_score is 0-100 but displays as X/5.0. Works but is fragile. |
| `get_business_dashboard()` | ⚠️ | `DollarSign` icon referenced in stats but not in `ICON_MAP` on frontend. Falls back to `BarChart3`. |
| `get_business_leads()` | ⚠️ | Returns `created_at: "Recently"` for all leads instead of actual timestamp. |
| `verify_abn()` | ⚠️ | Variable name collision: `text = response.text` shadows the imported `text` from SQLAlchemy (line 367 shadows line 5's import). Works because the SQLAlchemy `text` is only used after this block, but is a bug waiting to happen. |
| `verify_abn()` | ℹ️ | Mock ABN verification (starts with "123") is fine for dev. |
| **Missing** | 🔴 | **No `description` field in `BusinessOnboarding` model** — businesses can't set a description during onboarding. Only available via update. |
| **Missing** | 🔴 | **No endpoint to delete/deactivate a business**. |
| **Missing** | 🔴 | **No endpoint to upload logo/photos** — `logo_url` and `photo_urls` columns exist in DB but no API to populate them. |
| **Missing** | 🔴 | **No Stripe Connect webhook to verify onboarding completion** — `stripe_account_id` is saved but there's no check that onboarding was actually finished. |

---

### `apps/api/routers/referrer.py`

| Function | Status | Issue |
|----------|--------|-------|
| `onboarding()` | ⚠️ | Hard-codes `full_name: "New Referrer"`. Should get the name from Clerk user profile or from form input. |
| `onboarding()` | ⚠️ | **Missing `phone` field** — DB requires `phone TEXT NOT NULL` but onboarding doesn't collect or insert it. Will cause a DB insert error. |
| `ReferrerOnboarding` model | 🔴 | Only has `profession` and `region`. **Missing**: `full_name`, `phone`, `email` — all required by DB schema. |
| `create_referral_link()` | ✅ | Good duplicate detection and short code generation. |
| `get_referrer_dashboard()` | ✅ | Clean implementation with proper joins. |
| `get_my_referrer()` | ⚠️ | Only returns `id`, `full_name`, `professional_license_number`. Missing most useful fields. Also `professional_license_number` doesn't exist in the DB schema. |
| `connect_stripe_referrer()` | ✅ | Mirrors business Stripe connect properly. |
| **Missing** | 🔴 | **No withdrawal/payout endpoint** — `WithdrawalForm` component exists but there's no backend route to process withdrawals. |
| **Missing** | 🔴 | **No referrer profile update endpoint** — referrers can't edit their profile after onboarding. |
| **Missing** | 🔴 | **No endpoint to list available businesses** for referrers to browse and create links. |

---

### `apps/api/routers/leads.py`

| Function | Status | Issue |
|----------|--------|-------|
| `create_lead()` | ⚠️ | `business_id` is passed as a string but used directly in SQL without UUID conversion. May fail depending on DB driver. |
| `create_lead()` | ⚠️ | Reads `platform_fee_percentage` from businesses table but this **column doesn't exist in the DB schema**. Will cause a runtime SQL error. |
| `verify_otp()` | 🔴 | **Hard-coded OTP "123456"** — completely insecure. No actual OTP generation or SMS sending. |
| `verify_otp()` | ⚠️ | Sets status back to `'PENDING'` after verification — should probably set to `'VERIFIED'` or leave unchanged. |
| `get_lead()` | ⚠️ | **No authentication** — any user can fetch any lead by ID. Should require auth and verify ownership. |
| `unlock_lead()` | ✅ | Proper ownership verification and Stripe payment flow. |
| `on_the_way()` | ⚠️ | SMS sending is a `print()` statement (TODO). No actual notification sent. |
| `confirm_pin()` | ⚠️ | **Double-credits referrer** — credits on PIN confirmation here AND in `webhooks.py` on payment success. Referrer gets paid twice. |
| `confirm_pin()` | ⚠️ | Error message shows `2 - row['attempts']` but `attempts` is 0-indexed. Should be `2 - (row['attempts'])` at attempt 0 = "2 attempts remaining", which is correct, but at attempt 2 = "0 attempts remaining" when it should say "locked". |
| **Missing** | 🔴 | **No lead expiry handling** — leads have `expires_at` (48hrs) but no cron job or mechanism to expire them. |
| **Missing** | 🔴 | **No dispute creation endpoint** — disputes table exists but no API to create disputes. |
| **Missing** | 🔴 | **No `referrer_earnings` record creation** — the `referrer_earnings` table exists in DB but is never written to. Earnings are tracked only on the referrer's wallet balance. |
| **Missing** | 🔴 | **No `wallet_transactions` record creation** — same issue, table exists but never used. |
| **Missing** | 🔴 | **No `notifications` record creation** — table exists but never used. |

---

### `apps/api/routers/public.py`

| Function | Status | Issue |
|----------|--------|-------|
| `get_businesses()` | ⚠️ | **SQL injection risk** — `limit` and `page` are injected via f-string into SQL. Should use parameterized query. |
| `get_businesses()` | ⚠️ | Count query doesn't apply suburb/category filters — returns total of ALL active businesses regardless of search. |
| `get_business()` | ⚠️ | Returns ALL columns including `user_id`, `stripe_account_id`, `wallet_balance_cents` — sensitive data leaked to public. |

---

### `apps/api/routers/admin.py`

| Function | Status | Issue |
|----------|--------|-------|
| `get_stats()` | 🔴 | **Completely stubbed** — returns `{"message": "Admin stats"}`. No actual admin functionality. |
| **Missing** | 🔴 | No dispute resolution endpoint. |
| **Missing** | 🔴 | No user management (ban/suspend). |
| **Missing** | 🔴 | No auth check — anyone can access `/admin/stats`. |

---

### `apps/api/routers/webhooks.py`

| Function | Status | Issue |
|----------|--------|-------|
| `stripe_webhook()` | ⚠️ | On signature verification failure (no secret set), falls back to `json.loads(payload)` — insecure in production. |
| `stripe_webhook()` | 🔴 | **Double-credits referrer** — credits wallet on `payment_intent.succeeded` AND `confirm_pin()` also credits wallet. Referrer gets paid twice for the same lead. |
| `stripe_webhook()` | ⚠️ | `account.updated` event handler is a `pass` — no handling of Stripe Connect onboarding completion. |
| **Missing** | 🔴 | No handling of `payment_intent.payment_failed` — if payment fails, lead stays in limbo. |
| **Missing** | 🔴 | No handling of `charge.dispute.created` — disputes from Stripe are not captured. |

---

## 2. Frontend — Pages

### `apps/web/app/page.tsx` (Landing Page)

| Element | Status | Issue |
|---------|--------|-------|
| Stats section | ⚠️ | Hard-coded stats ("$73B", "250,000+", "70%"). Should come from API or at least be in a config. |
| Referrer earnings text | ⚠️ | Shows "$2.10–$14" but actual fees are now $10+ default. Copy is outdated. |

---

### `apps/web/app/dashboard/page.tsx` (Dashboard Redirect)

| Function | Status | Issue |
|----------|--------|-------|
| `resolveDashboard()` | ⚠️ | Makes 2 sequential API calls to determine user type. Should have a single `/auth/me` endpoint that returns user role. |
| Error handling | ⚠️ | Falls back to `/onboarding` on any error, even network failures. Could loop users who are already onboarded. |

---

### `apps/web/app/dashboard/business/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `getBusinessDashboardData()` | ✅ | Server component with proper auth. |
| `ICON_MAP` | ⚠️ | Missing `DollarSign` key — API returns `"DollarSign"` for referral fee stat but map only has Target, Zap, Star, Users. Falls back to BarChart3. |
| Lead detail link | 🔴 | Links to `/dashboard/business/leads/${lead.id}` but **this route doesn't exist**. No individual lead detail page. |
| "Good morning" greeting | ⚠️ | Always says "Good morning" regardless of time of day. |

---

### `apps/web/app/dashboard/business/leads/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `getLeads()` | 🔴 | **Hard-coded business ID** `"8a0a3328-1a91-430b-b711-588177463382"`. Should be fetched from auth context. |
| `getLeads()` | 🔴 | **No auth token passed** — the API endpoint requires authentication but the server fetch sends no `Authorization` header. Will always return empty/403. |
| "Want more leads?" section | ⚠️ | Always shown below leads list, even when leads exist. Should only show when list is empty. |

---

### `apps/web/app/dashboard/business/settings/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `fetchBusiness()` | ✅ | Properly fetches and populates form. |
| `handleSave()` | ✅ | Saves to DB via PATCH with proper auth. |
| `checkSlug()` | ✅ | Debounced slug availability check. |
| `verifyABN()` | ✅ | Calls backend ABN verification. |
| **Missing** | ⚠️ | No Stripe Connection card — previously discussed as missing. Business can't connect Stripe from settings page. |
| **Missing** | ⚠️ | No form validation before save (e.g. empty business name, invalid email format). |

---

### `apps/web/app/dashboard/referrer/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Dashboard | ✅ | Properly fetches and displays referrer data. |
| Link cards | ⚠️ | "Leads" and "Earned" labels use `text-[8px]` — extremely small and missed in the 16px minimum sweep. |

---

### `apps/web/app/dashboard/referrer/withdraw/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Balance display | 🔴 | **Hard-coded "$340.00"** — not fetched from API. Always shows same amount. |
| Last Payout | 🔴 | **Hard-coded "$1,200.00"** and "•••• 4922" — not real data. |
| `WithdrawalForm` | 🔴 | Withdrawal is completely mocked — `setTimeout` with fake "success". **No backend API exists for withdrawals.** |

---

### `apps/web/app/b/[slug]/page.tsx` (Public Business Profile)

| Function | Status | Issue |
|----------|--------|-------|
| `getBusiness()` | ⚠️ | Returns all business fields including sensitive data (user_id, wallet_balance, stripe_account_id) from public API. |
| "Book Now" button | 🔴 | **Goes nowhere** — no `href` or `onClick`. Dead button. |
| LeadForm | 🔴 | **Not rendered on this page** — the `LeadForm` component exists but is never imported or used on the public profile. Consumers have no way to submit an enquiry. |
| Service features | ⚠️ | Hard-coded features ("Locally Owned", "Verified Reviews", etc.) — same for every business. |

---

### `apps/web/app/onboarding/business/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Multi-step form | ✅ | Good UX flow. |
| `referral_fee_cents` | ⚠️ | Default in form is `1250` (old value). Should be `1000` to match the new $10 default. |
| **Missing** | ⚠️ | No `description` field in onboarding — businesses can't set a description until they go to settings. |

---

### `apps/web/app/onboarding/referrer/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Form data | 🔴 | Only collects `profession` and `region`. **Missing**: `full_name`, `phone`, `email`. Backend requires these for DB insert. Onboarding will fail with a DB error. |
| Stripe setup step | ⚠️ | Shows a "Secure Payouts" card with a checkmark but doesn't actually trigger Stripe Connect. Just visual. |

---

### `apps/web/app/leads/verify/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleSubmit()` | ⚠️ | Sends OTP as query param (`?code=XXXX`) instead of POST body. The backend expects `{"otp": "123456"}` in POST body. **Verification will always fail.** |
| OTP input | ⚠️ | 4-digit input but backend expects 6-digit OTP ("123456"). Mismatch. |
| "Resend Code" button | 🔴 | **No functionality** — no `onClick` handler. Dead button. |
| "Edit Number" button | 🔴 | **No functionality** — no `onClick` handler. Dead button. |

---

### `apps/web/app/leads/success/page.tsx`

| Element | Status | Issue |
|---------|--------|-------|
| Page | ✅ | Clean success confirmation page. |
| "Back to Directory" link | ⚠️ | Links to `/businesses` but the actual route is `/(public)/businesses`. Should work if Next.js route groups are configured correctly. |

---

### `apps/web/app/admin/page.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Disputes | 🔴 | **Hard-coded mock data** — disputes are static, not fetched from API. |
| Stats | 🔴 | **Hard-coded** — "1,284 Total Leads", "156 Active Partners" etc. Not from API. |
| **Missing** | 🔴 | **No auth protection** — any logged-in user can access `/admin`. No admin role check. |

---

### Other Pages

| Page | Status | Issue |
|------|--------|-------|
| `app/login/page.tsx` | ✅ | Clean Clerk integration. |
| `app/register/page.tsx` | ✅ | Clean with testimonial. Stats are hard-coded ("5,000+", "$1.2M+"). |
| `app/account/page.tsx` | ✅ | Clerk `UserProfile` component. |
| `app/privacy/page.tsx` | ❓ | Not read — likely static content. |
| `app/terms/page.tsx` | ❓ | Not read — likely static content. |
| `app/contact/page.tsx` | ❓ | Not read — likely static content. |
| `app/signup/page.tsx` | ❓ | Not read — may be duplicate of register. |

---

## 3. Frontend — Components

### `components/layout-shared.tsx`

| Component | Status | Issue |
|-----------|--------|-------|
| `Navbar` | ⚠️ | Settings link only shows for signed-in dashboard users. **Missing**: mobile hamburger menu. Links are hidden on mobile (`hidden md:block`). |
| `Navbar` | ⚠️ | "Browse Businesses" link goes to `/businesses` — may not resolve if route group `(public)` isn't configured for this path. |
| `Footer` | ⚠️ | ABN shows "XX XXX XXX XXX" placeholder. Should be real or removed. |
| `Footer` | ⚠️ | `/support` link in onboarding page points to a route that doesn't exist. |

---

### `components/LeadForm.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleSubmit()` | ✅ | Properly sends lead data to API. |
| `handleSubmit()` | ⚠️ | No phone number validation (Australian format). |
| `handleSubmit()` | ⚠️ | No rate limiting or spam protection on form submission. |
| Consent checkbox | ✅ | Good privacy consent pattern. |

---

### `components/dashboard/LeadsList.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleUnlock()` | ✅ | Proper Stripe payment flow. |
| `handleOnTheWay()` | ✅ | Proper status update. |
| `refreshLead()` | ⚠️ | Fetches lead without auth on the GET request (line 113-117). API may not require auth for GET but it should. |
| Badge `text-[10px]` | ⚠️ | Still uses tiny text — missed in the 16px minimum sweep. |
| Unlock Fee label | ⚠️ | `text-[10px]` — missed in 16px sweep. |
| "Referrer has been credited" | ⚠️ | `text-[10px]` — missed in 16px sweep. |
| Helper text | ⚠️ | `text-[10px]` at line 274 — missed in 16px sweep. |

---

### `components/dashboard/StripeConnectButton.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleConnect()` | ✅ | Properly calls backend and redirects to Stripe. |
| Error handling | ⚠️ | Uses `alert()` for errors — should use toast. |

---

### `components/dashboard/StripePaymentModal.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `CheckoutForm` | ✅ | Proper Stripe Elements integration. |
| `stripePromise` | ⚠️ | Uses `pk_test_placeholder` as fallback — will fail silently if env var missing. |

---

### `components/dashboard/PinConfirmationModal.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleSubmit()` | ✅ | Proper PIN validation and API call. |
| PIN label | ⚠️ | Uses `text-xs` — below 16px minimum. |

---

### `components/dashboard/StorefrontLinkCard.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleCopy()` | ✅ | Good clipboard API usage with toast. |
| `shareSocial()` | ✅ | Proper social sharing URLs. |
| URL display | ⚠️ | Shows `traderefer.com/b/{slug}` but actual domain is `localhost:3000` in dev. URL text is hard-coded. |
| URL display | ⚠️ | `text-[10px]` — missed in 16px sweep. |

---

### `components/dashboard/WithdrawalForm.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `handleWithdraw()` | 🔴 | **Completely mocked** — just a `setTimeout`. No actual API call, no actual withdrawal processing. |
| Instant payout "1% fee" | ⚠️ | Claims 1% fee but no calculation or backend support. |
| "Fast" badge | ⚠️ | `text-[10px]` — missed in 16px sweep. |

---

### `components/onboarding/WelcomeTour.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| Tour flow | ✅ | Clean step-by-step tour with animations. |
| `rounded-inherit` | ⚠️ | CSS class `rounded-inherit` is not a standard Tailwind class. May not render correctly. |

---

### `components/admin/DisputeList.tsx`

| Function | Status | Issue |
|----------|--------|-------|
| `resolveDispute()` | 🔴 | **No API call** — just removes from local state. Comment says "In real app, we would post to API". |
| Text sizes | ⚠️ | Multiple `text-[10px]` and `text-xs` instances — below 16px minimum. |

---

### `components/ui/*` (Button, Card, Badge, Dialog, Input, Label)

| Component | Status | Issue |
|-----------|--------|-------|
| All | ✅ | Standard shadcn/ui components. Well-structured. |
| `Card` | ℹ️ | Uses `rounded-[32px]` — consistent with design. |

---

## 4. Shared / Config / Infrastructure

### `apps/web/middleware.ts`

| Element | Status | Issue |
|---------|--------|-------|
| Protected routes | ✅ | `/dashboard` and `/onboarding` properly protected. |
| **Missing** | 🔴 | `/admin` route is **NOT protected**. Anyone can access admin page without auth. |

---

### `apps/web/lib/db.ts`

| Element | Status | Issue |
|---------|--------|-------|
| DB client | ⚠️ | Creates a `postgres` client but it's **never used** anywhere in the frontend. All data fetching goes through the Python API. Dead code. |

---

### `apps/web/lib/utils.ts`

| Element | Status | Issue |
|---------|--------|-------|
| `cn()` | ✅ | Standard clsx + tailwind-merge utility. |

---

### `apps/web/app/globals.css`

| Element | Status | Issue |
|---------|--------|-------|
| Theme | ✅ | Proper CSS variable setup. |
| Font | ⚠️ | `--font-heading: "Outfit"` defined but layout.tsx imports both Inter and Outfit. Consistent. |
| **Missing** | ⚠️ | No `--radius` variable defined. Components use hard-coded border-radius values. |

---

### `apps/web/app/layout.tsx`

| Element | Status | Issue |
|---------|--------|-------|
| Layout | ⚠️ | `Navbar` and `Footer` render on **every** page including onboarding, login, register. These pages have their own headers/footers, causing **double navbars**. |
| Imports | ⚠️ | `ClerkProvider` import is after the font declarations (line 20). Should be grouped with other imports at top. |

---

## 5. Database Schema vs Code Gaps

### Columns in DB but never written to by API:

| Table | Column | Issue |
|-------|--------|-------|
| `businesses` | `website` | No form field or API support |
| `businesses` | `lat`, `lng` | No geocoding implemented |
| `businesses` | `wallet_balance_cents` | Never updated — business wallet not implemented |
| `businesses` | `total_confirmed` | Never incremented |
| `businesses` | `response_rating` | Never calculated |
| `businesses` | `listing_rank` | Always 0, no ranking algorithm |
| `businesses` | `logo_url` | No upload functionality |
| `businesses` | `photo_urls` | No upload functionality |
| `businesses` | `platform_fee_percentage` | **Column doesn't exist in schema but is referenced in `leads.py` line 53** |
| `businesses` | `referral_fee_cents` | **Column doesn't exist in original schema** — schema has `unlock_fee_cents`. Migration may have added it. |
| `referrers` | `phone` | Required NOT NULL but not collected in onboarding |
| `referrers` | `abn` | No form field |
| `referrers` | `tax_withheld` | No UI or logic |
| `referrers` | `paypal_email`, `bank_bsb`, `bank_account_number` | No payout setup UI |
| `referrers` | `preferred_payout` | No payout preference UI |
| `referrers` | `quality_score` | Never calculated |
| `referrers` | `unlock_rate` | Never calculated |
| `referrers` | `total_leads_sent` | Never incremented |
| `leads` | `consumer_ip` | Never captured |
| `leads` | `consumer_device_hash` | Never captured |
| `leads` | `pin_confirmed_by_business` | Referenced in confirm_pin but **not in schema** |
| `leads` | `referrer_payout_amount_cents` | Referenced in code but **not in schema** |
| `leads` | `platform_fee_cents` | Referenced in code but **not in schema** |
| `leads` | `referral_fee_snapshot_cents` | Referenced in code but **not in schema** |

### Tables never used by API:

| Table | Issue |
|-------|-------|
| `referrer_earnings` | No records ever created — earnings only tracked as wallet balance |
| `wallet_transactions` | Never written to — no transaction history |
| `disputes` | No create/update/list API endpoints |
| `payout_requests` | No create/process API endpoints |
| `notifications` | No notification sending implemented |

---

## 6. Cross-Cutting Issues

### Security

1. **Public API leaks sensitive data** — `/businesses/{slug}` returns `user_id`, `stripe_account_id`, `wallet_balance_cents`
2. **Admin page unprotected** — no middleware, no role check
3. **SQL injection in public.py** — `limit` and `offset` via f-string
4. **No CSRF protection** on any forms
5. **No rate limiting** on any endpoints
6. **OTP is hard-coded** — "123456" always works
7. **JWT verification skips issuer/audience** — any valid Clerk JWT accepted

### Data Integrity

1. **Double referrer credit** — both `webhooks.py` and `confirm_pin()` credit the referrer wallet
2. **No lead expiry mechanism** — 48hr expiry defined but never enforced
3. **No transaction records** — money moves but no audit trail
4. **Schema/Code mismatch** — multiple columns referenced in code don't exist in schema (likely added via migrations not captured in `combined.sql`)

### Missing Core Features (per PRD)

1. **SMS/OTP sending** — no Twilio integration, OTP is mocked
2. **Email notifications** — no email service
3. **Withdrawal processing** — no backend, frontend is mocked
4. **Dispute management** — tables exist, no API
5. **Admin dashboard** — completely stubbed
6. **Business media uploads** — no implementation
7. **Referrer earnings history** — table exists, never populated
8. **Lead expiry cron** — no scheduled jobs
9. **Geocoding/location** — lat/lng columns exist, no implementation

### Frontend Consistency

1. **Multiple `text-[10px]` and `text-[8px]` instances remain** in components (LeadsList, StorefrontLinkCard, DisputeList, WithdrawalForm, register page) — below 16px minimum
2. **Double navbar** on login, register, and onboarding pages
3. **Hard-coded mock data** on admin page, withdraw page, and leads page

---

## 7. Priority Summary

### 🔴 Critical (Blocks core functionality or causes errors)

1. Leads page hard-coded business ID and missing auth token
2. Referrer onboarding missing required DB fields (phone)
3. `platform_fee_percentage` column missing from businesses table
4. Double referrer credit (webhook + PIN confirm)
5. Public profile "Book Now" button does nothing, LeadForm not rendered
6. OTP verify page sends wrong format to API
7. Admin page has no auth protection
8. Withdrawal is completely non-functional (no backend)

### ⚠️ Important (Should fix before production)

1. JWKS cache in `services/auth.py` never refreshes
2. Duplicate auth module (`middleware/auth.py` vs `services/auth.py`)
3. Public API leaks sensitive business data
4. SQL injection in `public.py`
5. Mock Stripe fallbacks will silently fail in production
6. No referral_fee_cents minimum validation on backend
7. Business onboarding hard-codes state to "VIC"
8. Remaining `text-[10px]` / `text-[8px]` in components
9. Double navbar on auth pages
10. `data.dict()` Pydantic v1 deprecation

### ℹ️ Nice to Have

1. Single `/auth/me` endpoint instead of 2 calls for dashboard redirect
2. Time-aware greeting on business dashboard
3. Geocoding for business locations
4. Business media upload support
5. Referrer earnings detailed history
6. Real admin dashboard with metrics from DB
