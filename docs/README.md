# TradeRefer — Developer Documentation

> Australia's first referral-powered lead marketplace for tradies.
> Geelong launch → Melbourne → National.

---

## What Is This?

TradeRefer is a three-sided marketplace where:

- **Businesses (tradies)** pay a small fee to unlock verified leads sent by real people who know them
- **Referrers** (friends, past customers, anyone) earn money by sharing a unique link for a business they trust
- **Consumers** (homeowners, renters) find a trusted tradie through someone they know, verified by a real-world PIN exchange

The platform digitises word-of-mouth — the #1 way tradies already get their best jobs — and rewards everyone involved.

---

## Documentation Index

| File | What It Covers |
|---|---|
| [01-product-overview.md](./01-product-overview.md) | Business model, three parties, money flow, why this beats HiPages |
| [02-user-flows.md](./02-user-flows.md) | Every user journey from signup to payout, step by step |
| [03-lead-lifecycle.md](./03-lead-lifecycle.md) | Lead states, PIN system, confirmation flow, expiry rules |
| [04-database-schema.md](./04-database-schema.md) | Every table, column, relationship, and index |
| [05-api-spec.md](./05-api-spec.md) | Every FastAPI endpoint, request/response shapes, auth |
| [06-ui-ux-spec.md](./06-ui-ux-spec.md) | Every screen, component, copy, and interaction |
| [07-fraud-prevention.md](./07-fraud-prevention.md) | All 7 fraud layers, trust scores, dispute system |
| [08-payments.md](./08-payments.md) | eWAY collection, wallet, PayPal payouts, Zai migration plan |
| [09-notifications.md](./09-notifications.md) | Every SMS, email, push notification — exact copy and triggers |
| [10-tech-stack.md](./10-tech-stack.md) | Full stack, monorepo structure, deployment, environment vars |
| [redesign-roadmap.md](./redesign-roadmap.md) | Safe phased rollout plan for implementing the redesign without risking the live app |

---

## Key Decisions Made

These were deliberately decided — do not change without understanding the reasoning:

1. **Pay-to-unlock model** (not pre-pay wallet) — business signs up free, pays only when a real lead arrives. Lower friction, higher conversion.
2. **PIN confirmation system** — real-world 4-digit code exchange proves the tradie actually met the consumer. Triggered by "I'm on my way" button, not by payment.
3. **70/30 split** — referrer earns 70% of unlock fee, platform keeps 30%.
4. **$3–$20 unlock fee range** — business sets their own price, minimum $3.
5. **7-day payout hold** — referrer earnings held 7 days OR released immediately on PIN confirmation.
6. **eWAY + PayPal payouts for MVP** — migrate to Zai (Melbourne-based) at scale.
7. **Monorepo structure** — Next.js web + Expo mobile + FastAPI in one repo with shared packages.
8. **Geelong-first** — launch locally, manually recruit both sides simultaneously, prove density before expanding.

---

## Tech Stack Summary

```
Frontend:    Next.js 14 (App Router) + Tailwind + shadcn/ui  →  Vercel
Backend:     FastAPI (Python)                                 →  Railway
Database:    Supabase (Postgres + Auth + Storage + Realtime)
Mobile:      React Native + Expo                              →  EAS Build
SMS:         Twilio ($0.08/SMS)
Email:       SMTPtoGo
Payments:    eWAY (collect) + PayPal Mass Payments (payout)
Push:        Firebase Cloud Messaging (FCM)
Maps:        Google Maps API
```

---

## Project Folder Structure

```
traderefer/
├── apps/
│   ├── web/              ← Next.js (public site + all dashboards)
│   ├── mobile/           ← Expo React Native (tradie PIN app)
│   └── api/              ← FastAPI backend
├── packages/
│   ├── types/            ← Shared TypeScript types
│   ├── api-client/       ← Shared API call functions
│   └── utils/            ← Shared utilities (PIN gen, validation)
├── supabase/
│   ├── migrations/       ← SQL migration files
│   └── seed.sql          ← Test data
└── docs/                 ← You are here
```

---

## Getting Started

See [10-tech-stack.md](./10-tech-stack.md) for full setup instructions.

Quick start:
```bash
git clone [repo]
cd traderefer
npm install          # installs all workspaces
npm run dev          # starts web + api simultaneously
```

---

## Sitemap Architecture

The sitemap uses **dedicated API routes** (not Next.js `generateSitemaps`) so it is reliable, cacheable, and fully scalable. This mirrors how large Australian directory sites like ServiceSeeking handle sitemaps.

### How It Works

`/sitemap.xml` is a **rewrite** (defined in `next.config.ts`) pointing to an API route that returns a sitemap INDEX. The index lists individual sub-sitemaps, each also served via API routes.

```
/sitemap.xml              → /api/sitemaps           (index — lists all sub-sitemaps)
/sitemaps/general.xml     → /api/sitemaps/general   (static pages, state hubs, city hubs)
/sitemaps/profiles.xml    → /api/sitemaps/profiles  (all business profile pages)
/sitemaps/suburbs.xml     → /api/sitemaps/suburbs   (suburb hub pages)
/sitemaps/trades.xml      → /api/sitemaps/trades    (suburb + trade combo pages)
/sitemaps/jobs/0.xml      → /api/sitemaps/jobs/0    (job-level pages, chunk 0)
/sitemaps/jobs/1.xml      → /api/sitemaps/jobs/1    (job-level pages, chunk 1)
... (as many job chunks as needed)
```

All responses are cached by Vercel's CDN for 24 hours (`s-maxage=86400`). Google only triggers a fresh generation on the first uncached request; all subsequent hits within 24 hours are served from the CDN edge.

### Key Files

| File | Purpose |
|---|---|
| `apps/web/app/api/sitemaps/route.ts` | **INDEX** — queries DB to calculate how many job chunks exist, then lists all sub-sitemap URLs |
| `apps/web/app/api/sitemaps/general/route.ts` | Static pages + state + city hub pages |
| `apps/web/app/api/sitemaps/profiles/route.ts` | All active business profile pages |
| `apps/web/app/api/sitemaps/suburbs/route.ts` | Suburb hub pages (`/local/[state]/[city]/[suburb]`) |
| `apps/web/app/api/sitemaps/trades/route.ts` | Suburb + trade combo pages (`/local/.../[trade]`) |
| `apps/web/app/api/sitemaps/jobs/[chunk]/route.ts` | Job-level pages chunked at 5,000 URLs per file |
| `apps/web/next.config.ts` | Rewrites that map the clean `.xml` URLs to the API routes |
| `apps/web/app/robots.ts` | Points Google to `/sitemap.xml`; allows `/api/sitemaps` |
| `apps/web/app/sitemap.ts` | **Intentionally disabled** — do not add exports back to this file |

### What To Update When The Site Changes

#### Adding a new page type (e.g. `/top/[trade]/[state]/[city]` pages)
1. Create a new API route: `apps/web/app/api/sitemaps/top/route.ts`
2. Add a rewrite in `next.config.ts`: `{ source: '/sitemaps/top.xml', destination: '/api/sitemaps/top' }`
3. Add the new URL to the INDEX in `apps/web/app/api/sitemaps/route.ts`: push `${BASE_URL}/sitemaps/top.xml` into the `sitemaps` array

#### Adding a new static page (e.g. `/how-it-works`)
- Edit `apps/web/app/api/sitemaps/general/route.ts` and add a `urlEntry(...)` line for the new page.

#### Changing the trade/job data (`JOB_TYPES` in `constants.ts`)
- No sitemap file changes needed. The `jobs/[chunk]/route.ts` dynamically reads `JOB_TYPES` on every request — adding or removing trades/jobs is automatically reflected in the sitemap.

#### Adding new URL patterns to trade or suburb pages
- Update `apps/web/app/api/sitemaps/trades/route.ts` or `suburbs/route.ts` to include the new URL format.

#### The job chunk count grows (URL count exceeds 5,000 per chunk)
- Nothing to change — the INDEX route (`/api/sitemaps/route.ts`) recalculates the number of required chunks on every request by counting trade combos × jobs in the DB.

#### Changing chunk size (currently 5,000 URLs per file)
- Change `const JOB_CHUNK_SIZE = 5000;` in both:
  - `apps/web/app/api/sitemaps/route.ts` (so the index knows how many chunks to list)
  - `apps/web/app/api/sitemaps/jobs/[chunk]/route.ts` (so each chunk slices correctly)

#### Google Search Console shows errors on a specific sitemap
1. Visit the URL directly in a browser (e.g. `traderefer.au/sitemaps/trades.xml`) to see the raw XML
2. Check the corresponding API route file for DB query errors
3. All routes have try/catch — if the DB is down, they return empty but valid XML (no 500s)

### Do Not
- **Do not add exports back to `apps/web/app/sitemap.ts`** — it was intentionally cleared. Adding a default export there re-enables Next.js's built-in sitemap handling, which conflicts with the rewrites.
- **Do not use `export const revalidate`** on sitemap routes — this forces build-time static generation, which caused the original 404 issue on Vercel.
- **Do not remove `'Content-Type': 'application/xml'`** from any sitemap route — without it, Google won't parse the response as XML.

---

## Core Business Rules (Never Break These)

1. A lead is never created without phone OTP verification
2. Lead details are never shown to a business before they pay to unlock
3. A referrer always gets paid — disputes are between platform and business, not referrer
4. The PIN system is a trust signal, not a payment gate — referrer gets paid after 7 days regardless if PIN not confirmed
5. Consumer confirmation raises an investigation flag — it never auto-penalises a business
6. A referrer is never punished for a business dispute unless fraud is proven
