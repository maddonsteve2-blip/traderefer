---
description: Safe phased rollout process for implementing the TradeRefer redesign without risking the live app
---

1. Read the redesign source documents before changing code:
```
Read docs/redesign-roadmap.md
Read traderefer-redesign.md
Inspect the relevant prototype file in prototype-comparison/
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch`

2. Identify the exact page to migrate and classify its risk level:
- Low risk: analytics, settings, read-only dashboard views, public profile views
- Medium risk: inbox, network views, command centre views, tables and detail panels
- High risk: onboarding, claim flow, payment/payout UI, application review, lead unlock/claim flows

3. Before implementing, write down these items in your task notes:
- current production route
- prototype reference file
- existing data dependencies
- existing actions/forms
- rollback path
- acceptance criteria for desktop and tablet

4. Build the redesign as a parallel implementation first:
- Prefer hidden `/v2/...` routes or feature-flagged variants
- Do not delete the current production route in the same task
- Reuse existing backend/API logic where possible
- Treat prototype HTML as a visual reference, not production code

5. Limit scope:
- One page migration per task when possible
- Do not combine backend rewrites with visual redesign unless explicitly required
- Do not mix desktop/tablet redesign work with unrelated mobile-only redesign work

6. Verify before proposing cutover:
```
npx tsc --noEmit
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch\apps\web`

7. Manually verify all of the following:
- desktop layout
- tablet layout
- loading states
- empty states
- error states
- main actions still work
- no overflow or broken scrolling

8. Only after validation, propose one of these next steps:
- keep as hidden/internal route for review
- release behind a feature flag
- replace the old page if approval is explicit and rollback is simple

9. Cleanup rules:
- Do not remove old pages/components until the redesign is accepted
- If old code is removed, do it in a separate cleanup task or PR
- Update docs/redesign-roadmap.md if rollout strategy changes
