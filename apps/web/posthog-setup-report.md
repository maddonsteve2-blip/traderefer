<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the TradeRefer Next.js App Router application. Here is a summary of all changes made:

## Files created

| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | Initialises the PostHog client-side SDK using the Next.js 15.3+ `instrumentation-client` pattern. Enables autocapture, session replay, and exception tracking. |
| `lib/posthog-server.ts` | Singleton server-side PostHog client (`posthog-node`) used in API routes for server-side event capture. |

## Files modified

| File | Changes |
|------|---------|
| `next.config.ts` | Added PostHog reverse-proxy rewrites (`/ingest/*` → `us.i.posthog.com`) and `skipTrailingSlashRedirect: true`. |
| `app/onboarding/business/page.tsx` | Added `business_onboarding_started`, `business_onboarding_step_completed`, `business_profile_generated`, and `business_onboarding_completed` events. Added `captureException` on error. |
| `app/onboarding/referrer/page.tsx` | Added `referrer_onboarding_completed` event on successful submission. Added `captureException` on error. |
| `components/dashboard/LeadsList.tsx` | Added `lead_unlock_initiated`, `lead_unlocked` (wallet & Stripe), `lead_on_the_way`, and `lead_job_confirmed` events. Added `captureException` on error. |
| `app/dashboard/business/campaigns/page.tsx` | Added `campaign_created`, `campaign_toggled`, and `campaign_deleted` events. |
| `components/referrer/ShareKit.tsx` | Added `referral_link_shared` (per channel: WhatsApp, Facebook, Twitter, Instagram, Email, native share), `referral_message_copied`, and `referral_qr_code_shown` events. |
| `app/api/ai/chat/route.ts` | Added server-side `ai_chat_message_sent` event tracking via `posthog-node`. |
| `app/api/ai/generate-profile/route.ts` | Added server-side `ai_profile_generated` event tracking via `posthog-node`. |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables. |

## Events instrumented

| Event Name | Description | File |
|-----------|-------------|------|
| `business_onboarding_started` | Fired when a business dismisses the welcome tour and begins onboarding. Properties: `trade_category`. | `app/onboarding/business/page.tsx` |
| `business_onboarding_step_completed` | Fired each time the user advances a step during business onboarding. Properties: `step`, `trade_category`, `chat_messages`. | `app/onboarding/business/page.tsx` |
| `business_profile_generated` | Fired when AI generates profile options from the chat conversation. Properties: `trade_category`, `suburb`, `chat_message_count`, `profile_options_count`, `is_tweak`. | `app/onboarding/business/page.tsx` |
| `business_onboarding_completed` | Fired on successful submission of business onboarding. Properties: `trade_category`, `suburb`, `state`, `listing_visibility`, `referral_fee_cents`, `service_radius_km`, `has_logo`, `has_cover_photo`, `photo_count`. | `app/onboarding/business/page.tsx` |
| `referrer_onboarding_completed` | Fired when a referrer completes onboarding. Properties: `region`. | `app/onboarding/referrer/page.tsx` |
| `lead_unlock_initiated` | Fired when a business clicks to unlock a lead. Properties: `lead_id`, `unlock_fee_cents`, `trade_type`, `suburb`. | `components/dashboard/LeadsList.tsx` |
| `lead_unlocked` | Fired when a lead is successfully unlocked. Properties: `lead_id`, `payment_method` (`wallet` or `stripe`), `unlock_fee_cents`. | `components/dashboard/LeadsList.tsx` |
| `lead_on_the_way` | Fired when a business marks themselves as on the way to a job. Properties: `lead_id`. | `components/dashboard/LeadsList.tsx` |
| `lead_job_confirmed` | Fired when a job is confirmed via PIN code. Properties: `lead_id`. | `components/dashboard/LeadsList.tsx` |
| `campaign_created` | Fired when a business successfully creates a campaign. Properties: `campaign_type`, `bonus_amount_cents`, `multiplier`, `volume_threshold`. | `app/dashboard/business/campaigns/page.tsx` |
| `campaign_toggled` | Fired when a business pauses or reactivates a campaign. Properties: `campaign_id`, `new_state`. | `app/dashboard/business/campaigns/page.tsx` |
| `campaign_deleted` | Fired when a business deletes a campaign. Properties: `campaign_id`. | `app/dashboard/business/campaigns/page.tsx` |
| `referral_link_shared` | Fired when a referrer shares a referral link via any channel. Properties: `channel`, `business_slug`, `business_name`. | `components/referrer/ShareKit.tsx` |
| `referral_message_copied` | Fired when a referrer copies a pre-written message template. Properties: `channel`, `business_slug`, `business_name`. | `components/referrer/ShareKit.tsx` |
| `referral_qr_code_shown` | Fired when a referrer reveals the QR code for in-person referrals. Properties: `business_slug`, `business_name`. | `components/referrer/ShareKit.tsx` |
| `ai_chat_message_sent` | Server-side: fired for each AI chat exchange during business onboarding. Properties: `trade_category`, `suburb`, `user_message_count`, `conversation_done`. | `app/api/ai/chat/route.ts` |
| `ai_profile_generated` | Server-side: fired when the AI generates a business profile. Properties: `is_tweak`, `conversation_length`. | `app/api/ai/generate-profile/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/326187/dashboard/1315748) — pinned dashboard with all 5 insights below

### Insights
1. [Business Onboarding Funnel](https://us.posthog.com/project/326187/insights/BkeuZM7H) — tracks conversion from onboarding start → step completion → profile generation → completion
2. [Lead Conversion Funnel](https://us.posthog.com/project/326187/insights/eeSltI7G) — the core revenue funnel: unlock initiated → unlocked → on the way → job confirmed
3. [Referral Sharing Activity](https://us.posthog.com/project/326187/insights/QIFNAVqs) — daily trend of referral links shared and messages copied across all channels
4. [Campaign Activity](https://us.posthog.com/project/326187/insights/vH9Mmwgn) — weekly view of campaigns created, toggled, and deleted
5. [Onboarding Completions (Business vs Referrer)](https://us.posthog.com/project/326187/insights/R67B2fLS) — weekly count of new businesses and referrers onboarded

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
