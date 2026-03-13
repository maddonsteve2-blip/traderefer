# TradeRefer Redesign Roadmap

## Purpose

This document defines the safe rollout plan for implementing the new TradeRefer redesign using the restored HTML prototypes in `prototype-comparison/`.

This is **not** a rewrite plan.
This is a **controlled migration plan** for replacing UI safely while keeping the live application stable.

The current production application remains the source of truth until each redesigned page has been verified and approved.

---

## Non-Negotiable Rules

- **Do not delete existing production pages before replacements are proven stable.**
- **Do not rewrite backend logic just to match prototype HTML.**
- **Do not change API contracts unless explicitly required and documented.**
- **Do not mix mobile-only redesign work with desktop/tablet redesign work in the same task unless explicitly requested.**
- **Do not replace multiple critical flows at once.**
- **Do not merge redesign work without a rollback path.**
- **Do not remove current navigation, forms, or business/referrer flows until the replacement is validated.**

---

## Strategic Approach

The redesign must be implemented as a **parallel v2 rollout**.

That means:

- existing live pages remain intact
- new pages are built alongside them
- redesigned pages reuse existing data and business logic where possible
- rollout happens one page or one flow at a time

Recommended delivery modes:

- hidden internal routes such as `/v2/...`
- feature-flagged variants
- page-by-page replacement after acceptance

---

## Source of Design Truth

The redesign reference materials are:

- `prototype-comparison/`
- `traderefer-redesign.md`
- existing docs in `docs/`

These prototypes are **visual references only**.
They are not production-ready application code.

Future implementers must:

- extract layout patterns
- convert them into reusable React components
- wire them to real app data
- preserve existing flows and business rules

---

## Current Page Replacement Inventory

This section maps the current Next.js application pages to the restored prototype reference files.

Legend:

- **Direct**: clear one-to-one prototype match exists
- **Partial**: prototype likely covers part of the page or a related shell
- **None**: no obvious prototype replacement exists yet
- **Risk**: Low, Medium, High based on operational impact

| Current Route / Area | Current File | Prototype Reference | Match | Risk | Notes |
|---|---|---|---|---|---|
| Business dashboard home | `apps/web/app/dashboard/business/page.tsx` | `prototype-comparison/index.html` | Direct | Medium | Primary business command centre shell |
| Business analytics | `apps/web/app/dashboard/business/analytics/page.tsx` | `prototype-comparison/analytics.html` | Direct | Low | Best first migration candidate |
| Business campaigns | `apps/web/app/dashboard/business/campaigns/page.tsx` | `prototype-comparison/campaigns.html` | Direct | Medium | Check campaign actions before cutover |
| Business deals | `apps/web/app/dashboard/business/deals/page.tsx` | `prototype-comparison/deals.html` | Direct | Medium | Preserve reward and offer logic |
| Business leads | `apps/web/app/dashboard/business/leads/page.tsx` | `prototype-comparison/leads.html` | Direct | Medium | Stateful list/detail workflow |
| Business messages | `apps/web/app/dashboard/business/messages/page.tsx` | `prototype-comparison/messages.html` | Partial | Medium | Shared inbox shell likely reusable |
| Business network | `apps/web/app/dashboard/business/network/page.tsx` | `prototype-comparison/network.html` | Direct | Medium | Includes relationship management |
| Business settings | `apps/web/app/dashboard/business/settings/page.tsx` | `prototype-comparison/settings.html` | Direct | Low | Good early migration candidate |
| Business team | `apps/web/app/dashboard/business/team/page.tsx` | `prototype-comparison/team.html` | Direct | Medium | Team/referrer management surface |
| Business profile / public profile editing context | `apps/web/app/dashboard/business/profile/page.tsx` | `prototype-comparison/public-profile.html` | Partial | Medium | May share layout patterns with storefront editing |
| Business applications list/detail | `apps/web/app/dashboard/business/applications/page.tsx` and `apps/web/app/dashboard/business/applications/[id]/page.tsx` | `prototype-comparison/team.html` or `prototype-comparison/network.html` | Partial | High | Approval/review flow; do late |
| Business force page | `apps/web/app/dashboard/business/force/page.tsx` | None | None | High | Needs separate redesign spec |
| Business sales | `apps/web/app/dashboard/business/sales/page.tsx` | `prototype-comparison/deals.html` and `prototype-comparison/leads.html` | Partial | High | Mixed commercial workflows |
| Business referrers pages | `apps/web/app/dashboard/business/referrers/page.tsx` and `[id]/page.tsx` | `prototype-comparison/team.html` | Partial | Medium | Could be folded into team/network patterns |
| Referrer dashboard home | `apps/web/app/dashboard/referrer/page.tsx` | `prototype-comparison/referrer-home.html` | Direct | Medium | Main referrer command centre |
| Referrer businesses / discovery | `apps/web/app/dashboard/referrer/businesses/page.tsx` | `prototype-comparison/referrer-find.html` | Direct | Medium | Preserve discovery filters and application states |
| Referrer manage / my teams | `apps/web/app/dashboard/referrer/manage/page.tsx` | `prototype-comparison/referrer-teams.html` | Direct | Medium | Includes team management and swipe file workflows |
| Referrer messages | `apps/web/app/dashboard/referrer/messages/page.tsx` | `prototype-comparison/messages.html` | Partial | Medium | Shared messaging shell likely reusable |
| Referrer applications | `apps/web/app/dashboard/referrer/applications/page.tsx` | `prototype-comparison/referrer-referrals.html` | Partial | Medium | Confirm semantics before implementation |
| Referrer profile | `apps/web/app/dashboard/referrer/profile/page.tsx` | None | None | Medium | Needs dedicated redesign spec or derivative design |
| Referrer business page / refer view | `apps/web/app/dashboard/referrer/refer/[slug]/page.tsx` | `prototype-comparison/public-profile.html` | Partial | Medium | Public/business-facing hybrid experience |
| Referrer withdraw / earnings | `apps/web/app/dashboard/referrer/withdraw/page.tsx` | `prototype-comparison/referrer-withdraw.html` and `prototype-comparison/referrer-earnings.html` | Direct | High | Payout flow; keep late |
| Public business profile | `apps/web/app/b/[slug]/page.tsx` | `prototype-comparison/public-profile.html` | Direct | Low | Strong candidate after analytics/settings |
| Public refer page | `apps/web/app/b/[slug]/refer/page.tsx` | `prototype-comparison/public-profile.html` | Partial | Medium | Referral CTA variation of public profile |
| Claim business page | `apps/web/app/claim/[slug]/page.tsx` | `prototype-comparison/claim-lead.html` | Partial | High | Similar tone, but business logic differs |
| Account page | `apps/web/app/account/page.tsx` | None | None | Medium | No prototype match |
| Compare page | `apps/web/app/compare/page.tsx` | None | None | Low | Optional redesign later |
| Contact / support / cookies / public directory pages | multiple public routes | None | None | Low | Can follow broader marketing/public design later |
| Admin pages | `apps/web/app/admin/**` | None | None | Medium | Out of initial redesign scope |

---

## Prototype Coverage Summary

The restored prototypes cover these major design domains:

- business dashboard home
- analytics
- campaigns
- deals
- leads
- messages
- network
- onboarding
- public profile
- referrer home
- referrer find
- referrer teams
- referrer referrals
- referrer earnings
- referrer withdraw
- settings
- team management

They do **not** clearly cover all current production pages.

Pages that still need a separate redesign specification or design derivation include:

- account
- admin pages
- business force
- some applications/detail views
- referrer profile
- directory/local SEO pages

---

## Migration Matrix

This table is the operational source of truth for rollout order.

| Priority | Area | Pages | Why This Order |
|---|---|---|---|
| 1 | Shared foundations | shell, cards, typography, navigation, content panels | Enables consistent page-by-page migration |
| 2 | Low-risk business pages | analytics, settings | Mostly read-only, easiest to verify |
| 3 | Low-risk public surfaces | public profile | Strong prototype coverage, lower operational risk |
| 4 | Dashboard landing pages | business home, referrer home | High visibility but manageable if foundations exist |
| 5 | Medium-risk operational shells | messages, network, team pages | Reusable patterns emerge here |
| 6 | Referrer operational pages | businesses/find, manage, referrals, earnings views | Medium complexity and higher UI state density |
| 7 | Applications and claim-related views | business applications, claim pages | Approval/claim logic requires caution |
| 8 | Financial and payout flows | deals where transactional, withdraw/earnings payout paths | Higher commercial and trust risk |
| 9 | Onboarding and sensitive conversion flows | onboarding, approval-heavy workflows | Leave until design system is proven |

---

## What Must Stay Stable

During redesign work, the following must remain unchanged unless separately approved:

- authentication flow
- onboarding flow
- lead lifecycle logic
- payment logic
- referrer earnings logic
- API request and response shapes
- production routes currently used by customers

If a redesign requires behavior changes, that must be proposed separately from the visual migration.

---

## Rollout Phases

## Phase 0 — Preparation

Goal: create a safe structure for redesign work.

Required outcomes:

- preserve current production pages
- restore prototype reference files
- define a page migration order
- decide whether redesign routes live under `/v2` or behind flags
- document acceptance criteria for each migrated page

Deliverables:

- this roadmap
- workflow instructions in `.windsurf/workflows/redesign-rollout.md`
- restored `prototype-comparison/` reference folder

---

## Phase 1 — Shared Foundations

Goal: implement shared UI primitives without changing core flows.

Scope:

- typography tokens
- spacing scale
- card shells
- content containers
- sidebar/header patterns
- button styles
- badge styles
- dashboard layout primitives

Rules:

- prefer reusable components over one-off page clones
- avoid changing route behavior in this phase
- ensure desktop/tablet/mobile separation is explicit

Exit criteria:

- shared visual system exists in React/Tailwind
- no production flow regressions
- current pages still render correctly

---

## Phase 2 — Low-Risk Page Migration

Goal: migrate the safest pages first.

Recommended order:

1. analytics
2. settings
3. read-only dashboard home views
4. public profile surfaces

Why these first:

- lower interaction risk
- fewer destructive actions
- easier visual comparison against prototypes

Implementation rule:

Build the redesigned page using existing API/data sources before removing the old page.

Exit criteria:

- page matches intended prototype direction
- data parity confirmed
- responsive behavior verified on desktop and tablet
- old page still available if rollback is needed

---

## Phase 3 — Medium-Risk Operational Screens

Goal: migrate pages that include stateful workflows but are still manageable.

Recommended order:

1. messages/inbox shell
2. business network views
3. referrer command centre views
4. lists, tables, filters, and detail panels

Requirements:

- keep existing actions intact
- keep loading, empty, and error states
- preserve current navigation paths unless replacement is fully approved

Exit criteria:

- parity with existing page behavior
- no broken actions
- no API contract changes required

---

## Phase 4 — High-Risk Flow Migration

Goal: migrate the most sensitive flows only after the design system and medium-risk pages are stable.

High-risk flows include:

- onboarding
- claim flow
- lead claim/unlock flows
- approval workflows
- payout/payment related UI
- application review flows

Rules:

- redesign only one high-risk flow at a time
- test with real data states
- keep rollback immediate
- do not combine multiple critical flows in one PR

Exit criteria:

- successful end-to-end verification
- old implementation preserved until acceptance

---

## Phase 5 — Cutover and Cleanup

Goal: replace old pages only after new pages are stable.

Do this only when:

- redesign page has passed review
- core behavior matches production expectations
- preview/staging validation is complete
- rollback plan exists

Cleanup includes:

- removing dead components
- deleting obsolete routes only after confirmation
- updating docs to point to the new implementation

---

## Recommended Migration Order

This is the suggested sequence for future work:

1. shared dashboard shell primitives
2. analytics
3. settings
4. business home
5. referrer home
6. public profile
7. messages
8. business network
9. referrer teams / referrals / earnings
10. onboarding and application/claim flows last

If uncertain, always choose the page with the lowest operational risk first.

---

## Swimlane Workflow Diagrams

These swimlanes describe the current production workflows that the redesign must preserve.

## Swimlane 1 — Public Lead Generation to Business Unlock

```text
Consumer / Referrer      Public Web Experience           Business Dashboard           Backend / Rules
--------------------     ----------------------------    --------------------------   ---------------------------
Finds business           Views public profile            -                            Profile data served
or referral link         or referral page
     |                           |                        |                            |
Submits lead / job  ->    Lead form / referral CTA  ->   -                        ->  Lead created after required verification
     |                           |                        |                            |
Receives OTP /             Completes verification        -                        ->  Lead stored with correct state
confirms details
     |                           |                        |                            |
-                           -                        ->   Sees locked lead        ->  Unlock fee rules applied
                                                         in dashboard
                                                           |
-                           -                        ->   Unlocks / claims lead   ->  Payment + lead reveal logic
                                                           |
-                           -                        ->   Follows up              ->  Lead lifecycle continues
```

## Swimlane 2 — Business Invites / Manages Referrer Network

```text
Business User            Business Dashboard              Referrer Experience          Backend / Rules
--------------------     ----------------------------    --------------------------   ---------------------------
Opens network            Views network/team page         -                            Existing links/applications loaded
     |                           |                        |                            |
Invites or reviews  ->    Uses network/team actions      -                        ->  Invitation/application state updated
applications
     |                           |                        |                            |
-                           -                        ->   Referrer sees status    ->  Approval state persisted
                                                           in their dashboard
     |                           |                        |                            |
Approves partner     ->    Approval action               Referrer gets access     ->  Active team link created
                                                           to team/manage views
     |                           |                        |                            |
Tracks performance   ->    Team / analytics / leads      Referrer shares link     ->  Leads, clicks, earnings updated
```

## Swimlane 3 — Referrer Discovery to Earnings

```text
Referrer User           Referrer Dashboard               Business / Public Pages      Backend / Rules
-------------------     -----------------------------    --------------------------   ---------------------------
Searches for business   Opens find businesses page       -                            Discovery data loaded
     |                           |                        |                            |
Applies to join    ->    Application UI / filters        -                        ->  Application created
     |                           |                        |                            |
Waits for approval  <-   Application / manage status     Business reviews         <-  Status changes stored
     |                           |                        |                            |
Gets approved       <-   Team/manage page unlocks        -                        <-  Active link available
     |                           |                        |                            |
Shares link         ->    Uses swipe file / link tools   Public visitor opens page ->  Attribution tracked
     |                           |                        |                            |
Earns reward        <-   Earnings / withdraw pages       Business unlocks lead     <-  Reward calculations and hold rules applied
```

## Swimlane 4 — Messaging Workflow

```text
Business User            Messaging UI                    Referrer User                Backend / Rules
--------------------     ----------------------------    --------------------------   ---------------------------
Opens inbox              Shared messages shell           Opens inbox                  Conversations loaded
     |                           |                        |                            |
Reads thread        <->   Conversation list/detail  <->  Reads thread            <-> Message history served
     |                           |                        |                            |
Sends message       ->    Composer / chat panel     ->   Receives message        ->  Message persisted and delivered
     |                           |                        |                            |
Continues follow-up <->   Ongoing thread UI         <->  Replies                 <-> Thread state updated
```

## Swimlane 5 — High-Risk Approval / Claim / Payout Paths

```text
Actor                   UI Surface                      Decision Point               Backend / Rules
-------------------     ----------------------------    --------------------------   ---------------------------
Business user           Applications / claim pages      Approve / reject / claim     Writes sensitive state
Referrer user           Withdraw / earnings pages       Request payout               Applies payout rules
Consumer / lead         Claim / verification surfaces   Verify details               Trust and fraud checks

Rule: redesign these only after lower-risk pages are stable.
```

---

## Per-Page Delivery Template

For each redesign page, future implementers should follow this checklist:

1. identify the current production route
2. identify the matching prototype HTML page
3. list the current data dependencies
4. list the actions/forms on the page
5. build a React version using shared components
6. preserve existing API calls and logic
7. verify desktop and tablet responsiveness
8. verify loading/empty/error states
9. compare old vs new behavior
10. only then propose cutover

---

## Required PR Scope Rules

Each PR should ideally contain only one of the following:

- one shared design-system improvement
- one page migration
- one route-level rollout/cutover
- one cleanup step after successful cutover

Avoid PRs that combine:

- multiple high-risk flows
- backend rewrites plus redesign
- desktop redesign plus unrelated mobile work
- major typography changes plus route migrations plus logic rewrites

---

## Testing Expectations

Minimum verification for each redesigned page:

- desktop layout works
- tablet layout works
- loading state works
- empty state works
- error state works
- main actions still work
- no broken auth assumptions
- TypeScript passes
- no obvious visual overflow/regression

For sensitive flows also verify:

- create/update actions
- payment-related UI states
- lead/referral state changes
- approval/rejection states

---

## Rollback Strategy

Every redesign task must preserve an easy rollback path.

Preferred rollback options:

- keep old route active
- keep old component in place until replacement is accepted
- use feature flag or alternate route
- avoid destructive deletions in the same PR as a new implementation

If rollback is not simple, the redesign task is too large.

---

## Instructions for Future AI Coders

When working on redesign tasks:

- read this file first
- treat `prototype-comparison/` as visual reference only
- preserve production behavior
- migrate incrementally
- do not delete current routes without approval
- do not touch mobile-only redesign work unless explicitly asked
- prefer reversible changes
- update this roadmap if rollout decisions change

If a task is ambiguous, the safe default is:

- create a parallel implementation
- compare against production
- avoid replacing the live page immediately

---

## Definition of Success

The redesign is successful when:

- the visual quality improves materially
- production flows remain stable
- pages are migrated incrementally without outages
- old and new states remain understandable during transition
- future contributors can continue the rollout without guessing

---

## Current Recommendation

The next safest implementation step is:

1. build shared desktop/tablet dashboard primitives
2. migrate one low-risk page from `prototype-comparison/`
3. review it visually and functionally
4. continue one page at a time
