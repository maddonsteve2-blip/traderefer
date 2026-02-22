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

## Core Business Rules (Never Break These)

1. A lead is never created without phone OTP verification
2. Lead details are never shown to a business before they pay to unlock
3. A referrer always gets paid — disputes are between platform and business, not referrer
4. The PIN system is a trust signal, not a payment gate — referrer gets paid after 7 days regardless if PIN not confirmed
5. Consumer confirmation raises an investigation flag — it never auto-penalises a business
6. A referrer is never punished for a business dispute unless fraud is proven
