# 10 — Tech Stack & Project Setup

Everything a developer needs to understand the architecture and get the project running.

---

## Full Stack

| Layer | Technology | Hosting | Purpose |
|---|---|---|---|
| Web frontend | Next.js 14 (App Router) | Vercel | Public site + all dashboards |
| Mobile app | React Native + Expo | EAS Build → App Store / Play Store | Tradie PIN app |
| Backend API | FastAPI (Python 3.12) | Railway | Business logic, payments, SMS |
| Database | Supabase (Postgres 15) | Supabase cloud | All data + auth + realtime |
| Auth | Supabase Auth | Supabase cloud | JWT-based, three user roles |
| File storage | Supabase Storage | Supabase cloud | Business photos, logos |
| SMS | Twilio | Cloud | OTP + PIN delivery |
| Email | SMTPtoGo | Cloud | Transactional emails |
| Push notifications | Firebase Cloud Messaging | Google Cloud | Mobile push |
| Payments (collect) | eWAY | Cloud | Business card charges |
| Payments (payout) | PayPal Payouts API | Cloud | Referrer payouts |
| Maps | Google Maps API | Google Cloud | Directory map, suburb autocomplete |
| Background jobs | Railway Cron | Railway | Lead expiry, earning release |
| Monitoring | Sentry | Cloud | Error tracking |
| Analytics | PostHog | Cloud (free tier) | Product analytics |

---

## Monorepo Structure

Everything in one repository. AI coding agents can see all three apps simultaneously — prevents drift between web, mobile, and API.

```
traderefer/
├── apps/
│   ├── web/                    ← Next.js web app
│   │   ├── app/
│   │   │   ├── (public)/       ← Public pages (no auth)
│   │   │   │   ├── page.tsx            (Homepage /)
│   │   │   │   ├── businesses/
│   │   │   │   │   ├── page.tsx        (Directory /businesses)
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx    (Listing /businesses/{slug})
│   │   │   │   └── r/
│   │   │   │       └── [slug]/
│   │   │   │           └── [code]/
│   │   │   │               └── page.tsx (Referral landing)
│   │   │   ├── (auth)/         ← Login/signup pages
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/business/page.tsx
│   │   │   │   └── signup/referrer/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── business/
│   │   │   │   │   ├── page.tsx        (Business home — leads inbox)
│   │   │   │   │   ├── wallet/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   └── referrer/
│   │   │   │       ├── page.tsx        (Referrer home — earnings)
│   │   │   │       ├── browse/page.tsx (Find businesses to refer)
│   │   │   │       ├── earnings/page.tsx
│   │   │   │       └── withdraw/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── disputes/page.tsx
│   │   │       └── payouts/page.tsx
│   │   ├── components/
│   │   │   ├── ui/             ← shadcn/ui components
│   │   │   ├── leads/          ← Lead cards, unlock modal
│   │   │   ├── business/       ← Business cards, profile
│   │   │   └── referrer/       ← Earnings, link components
│   │   ├── lib/
│   │   │   ├── supabase.ts     ← Supabase client
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   ├── mobile/                 ← Expo React Native app
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx   ← Leads list (home screen)
│   │   │   │   └── profile.tsx
│   │   │   └── leads/
│   │   │       └── [id]/
│   │   │           ├── index.tsx   ← Lead detail
│   │   │           └── pin.tsx     ← PIN entry screen (critical!)
│   │   ├── components/
│   │   │   ├── LeadCard.tsx
│   │   │   └── PinInput.tsx    ← The PIN entry boxes
│   │   └── package.json
│   │
│   └── api/                    ← FastAPI backend
│       ├── main.py
│       ├── routers/
│       │   ├── leads.py        ← Lead creation, unlock, PIN
│       │   ├── business.py     ← Business profile, wallet
│       │   ├── referrer.py     ← Referrer links, earnings
│       │   ├── admin.py        ← Admin panel routes
│       │   └── public.py       ← Directory, listing pages
│       ├── services/
│       │   ├── twilio_service.py
│       │   ├── eway_service.py
│       │   ├── paypal_service.py
│       │   ├── fcm_service.py
│       │   └── fraud_service.py
│       ├── models/             ← Pydantic models
│       ├── jobs/               ← Background cron jobs
│       │   ├── expire_leads.py
│       │   ├── release_earnings.py
│       │   └── expiry_reminder.py
│       └── requirements.txt
│
├── packages/
│   ├── types/                  ← Shared TypeScript types
│   │   ├── lead.ts
│   │   ├── business.ts
│   │   └── referrer.ts
│   ├── api-client/             ← Shared API call functions
│   │   ├── leads.ts
│   │   ├── business.ts
│   │   └── referrer.ts
│   └── utils/                  ← Shared utilities
│       ├── money.ts            ← formatCents(), calculateSplit()
│       └── validation.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_businesses.sql
│   │   ├── 002_create_referrers.sql
│   │   ├── 003_create_referral_links.sql
│   │   ├── 004_create_leads.sql
│   │   ├── 005_create_lead_pins.sql
│   │   ├── 006_create_referrer_earnings.sql
│   │   ├── 007_create_wallet_transactions.sql
│   │   ├── 008_create_disputes.sql
│   │   ├── 009_create_payout_requests.sql
│   │   └── 010_create_notifications.sql
│   └── seed.sql                ← Test data (5 Geelong businesses, 3 referrers)
│
├── docs/                       ← You are here
│
├── package.json                ← Root workspace config
├── turbo.json                  ← Turborepo config
└── .env.example                ← All required env vars (no values)
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. Never commit real secrets.

### Web App (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### API (`apps/api/.env`)
```
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+61400000000

# eWAY (Payments)
EWAY_API_KEY=xxxx
EWAY_API_PASSWORD=xxxx
EWAY_SANDBOX=true  # set to false in production

# PayPal (Payouts)
PAYPAL_CLIENT_ID=xxxx
PAYPAL_CLIENT_SECRET=xxxx
PAYPAL_MODE=sandbox  # set to live in production

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=traderefer
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@traderefer.iam.gserviceaccount.com

# SMTPtoGo (Email)
SMTPTOGO_USERNAME=xxxx
SMTPTOGO_PASSWORD=xxxx
SMTPTOGO_FROM=noreply@traderefer.com.au

# App
SECRET_KEY=generate-a-random-64-char-string-here
FRONTEND_URL=http://localhost:3000
```

### Mobile App (`apps/mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase CLI
- Expo CLI (`npm install -g @expo/cli`)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/youraccount/traderefer
cd traderefer
npm install  # installs all workspaces via Turborepo

# 2. Set up Supabase locally
npx supabase start
# Creates local Postgres + Auth at localhost:54321

# 3. Run migrations
npx supabase db push

# 4. Seed with test data
npx supabase db seed

# 5. Set up environment variables
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
# Edit both files with your values

# 6. Start everything
npm run dev
# Starts web (localhost:3000), api (localhost:8000) simultaneously
```

### Individual app commands
```bash
# Web only
npm run dev --workspace=apps/web

# API only  
npm run dev --workspace=apps/api

# Mobile (opens Expo Go on your phone)
npm run dev --workspace=apps/mobile
```

---

## Build Order (What To Build First)

Build in this exact order. Do not skip ahead. Each step unlocks the next.

### Week 1: Foundation
1. Supabase schema (all tables from `04-database-schema.md`)
2. Supabase Auth setup (three user roles: business, referrer, admin)
3. FastAPI project structure + auth middleware
4. `GET /businesses` endpoint + Next.js directory page
5. `GET /businesses/{slug}` + business listing page

### Week 2: Core Lead Flow
6. `POST /leads` + OTP send (Twilio)
7. `POST /leads/{id}/verify-otp` + lead creation
8. Business email notification on lead creation (SMTPtoGo)
9. Business dashboard leads inbox (`GET /business/leads`)
10. Lead preview card with blur effect

### Week 3: Unlock + Payment
11. eWAY integration (sandbox first)
12. `POST /business/leads/{id}/unlock` (card payment)
13. Full lead details revealed after unlock
14. Referrer earning record created on unlock
15. Referrer notified on unlock

### Week 4: PIN System
16. `POST /business/leads/{id}/on-the-way` + PIN generation
17. Twilio SMS to consumer (PIN) + business (notification)
18. Expo mobile app: PIN entry screen
19. `POST /business/leads/{id}/confirm-pin` + validation
20. Earning released on PIN confirm

### Week 5: Payouts + Background Jobs
21. Referrer wallet + earnings display
22. Payout request form
23. Background job: expire leads after 48hrs
24. Background job: release earnings after 7 days
25. PayPal payout API (sandbox)

### Week 6: Polish + Admin
26. Admin panel: disputes, payouts, business/referrer management
27. Business wallet top-up + bonus tiers
28. All email templates (SMTPtoGo)
29. All in-app notifications
30. Sentry error tracking + PostHog analytics

---

## Deployment

### Web (Vercel)
```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on push to main
```

### API (Railway)
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Dockerfile in apps/api/Dockerfile
# Auto-deploys on push to main
```

### Background Jobs (Railway Cron)
```bash
# Separate Railway service for cron jobs
# apps/api/jobs/ — each file is a standalone script
# Railway schedule: expire_leads every 15min, release_earnings hourly
```

### Mobile (EAS Build)
```bash
cd apps/mobile
eas build --platform all  # builds iOS + Android
eas submit --platform all  # submits to App Store + Play Store
```

---

## Cost Estimate (Monthly at MVP scale — 0-500 leads)

| Service | Free tier | Est. cost |
|---|---|---|
| Vercel | Generous free | $0 |
| Railway (API + cron) | $5 credit | ~$5–$15 |
| Supabase | 500MB DB free | $0 |
| Twilio SMS | Pay per use | ~$10 (500 SMSs × $0.08 + $0.08 OTPs) |
| SMTPtoGo | 1000 emails/month | $0 |
| FCM | Free | $0 |
| Google Maps | $200/month credit | $0 |
| eWAY | No monthly (PAYG) | 1.5% + $0.25 per txn |
| PayPal Payouts | $0.25/payout | ~$5–$10 |
| Sentry | 5k errors free | $0 |

**Total fixed costs at MVP: ~$15–$30/month**

Variable costs scale with usage — a healthy sign.

---

## Key Libraries

### Web (Next.js)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.x",
    "tailwindcss": "^3.x",
    "shadcn/ui": "latest",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "latest"
  }
}
```

### API (FastAPI)
```
fastapi==0.x
uvicorn==0.x
supabase==2.x
twilio==8.x
httpx==0.x          # for eWAY + PayPal API calls
python-jose==3.x    # JWT validation
apscheduler==3.x    # background job scheduling
pydantic==2.x
```

### Mobile (Expo)
```json
{
  "dependencies": {
    "expo": "~51.x",
    "expo-router": "~3.x",
    "expo-notifications": "~0.x",
    "@supabase/supabase-js": "^2.x",
    "react-native-url-polyfill": "latest"
  }
}
```
