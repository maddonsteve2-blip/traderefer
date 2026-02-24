# TradeRefer Platform Roadmap

> Last updated: 24 Feb 2026

---

## Vision

Transform TradeRefer from a simple link-sharing tool into Australia's leading trade referral marketplace — where referrers earn like affiliate marketers and businesses get high-quality, pre-vetted leads.

---

## Phase 0: Foundation Fixes (Now)

> Fix the core experience so referrers understand the platform and can take action.

- [x] Fix role-based navbar (referrer vs business links)
- [x] Fix cross-role redirects (referrers no longer land on business pages)
- [x] Fix 404 redirects to role-specific onboarding
- [ ] Rename "Your Active Links" → **"Your Businesses"** / **"Your Partner Network"**
- [ ] Rename "Add Active Link" → **"Find Businesses to Refer"**
- [ ] Rename "Leads" (in referrer context) → **"My Referrals"**

---

## Phase 1: Referrer-Facing Business Page (P0)

> When a referrer clicks a business in the directory, they should see a **partner page** — not the customer profile. This is the single biggest gap.

### Referrer Business Page (`/b/[slug]/refer`)

- [ ] Commission amount displayed front and center (e.g. "$15 per verified lead")
- [ ] Business description, trade category, service area
- [ ] Active deals & campaigns (see Phase 3)
- [ ] Business scorecard:
  - Lead acceptance rate
  - Average response time
  - Number of active referrers
  - Active since date
  - Total leads received (social proof)
- [ ] "Start Referring" CTA → generates unique referral link
- [ ] "Why Refer Us" section (business-authored pitch to referrers)
- [ ] Referrer reviews/ratings of the business (do they respond? are they good to work with?)

### Directory Card Updates

- [ ] Show commission amount on each business card in the directory
- [ ] Show active campaign badge ("🔥 2x Commission This Week")
- [ ] Show response time badge ("⚡ Responds in < 2 hours")
- [ ] Card click goes to `/b/[slug]/refer` (referrer partner page) instead of customer profile

---

## Phase 2: Deal Cards & Share Kit (P1)

> Give referrers something tangible to share — not just a raw link.

### Deal Cards (Business Creates)

- [ ] Businesses create deals/offers referrers can promote:
  - "10% off first job when referred through TradeRefer"
  - "Free quote + priority booking"
  - "Free safety inspection with any job over $500"
- [ ] Deals displayed on referrer partner page and directory cards
- [ ] Deals included in share kit messages
- [ ] Deals have optional expiry dates

### Share Kit (Referrer Uses)

- [ ] Pre-written SMS message with referral link + deal
- [ ] WhatsApp share button with formatted message
- [ ] Email template for formal referrals
- [ ] QR code (for in-person referrals)
- [ ] Facebook/Instagram story-ready image template
- [ ] One-tap copy of share message
- [ ] All share methods auto-embed the referrer's unique tracking link

---

## Phase 3: Campaign System (P2)

> Let businesses create time-limited promotions that drive referrer urgency.

### Campaign Types

- [ ] **Flat bonus**: "Extra $10 per lead this week"
- [ ] **Commission multiplier**: "2x commission weekend"
- [ ] **Volume bonus**: "5+ leads this month = $50 bonus"
- [ ] **First-referral bonus**: "New referrers earn $25 on their first lead"

### Campaign Builder (Business Dashboard)

- [ ] Create campaign: title, description, bonus type, amount, start/end dates
- [ ] Shareable promo text (pre-written message for referrers)
- [ ] View active vs expired campaigns
- [ ] Campaign performance metrics (leads generated during campaign period)
- [ ] Auto-notify all connected referrers when campaign goes live

### Campaign Visibility (Referrer Side)

- [ ] "Hot Campaigns" section on referrer dashboard
- [ ] Campaign badges on directory cards
- [ ] Campaign details on referrer partner page
- [ ] Push/email notification when a connected business launches a campaign

---

## Phase 4: Referrer Tiers & Gamification (P2)

> Retention engine — give referrers a reason to stay and grow.

### Tier System

| Tier | Requirement | Perk |
|---|---|---|
| **Starter** | 0–5 referrals | 80% commission split (base) |
| **Pro** | 6–20 referrals | 85% split + priority support |
| **Elite** | 21–50 referrals | 90% split + featured referrer badge |
| **Ambassador** | 50+ referrals | 90% split + early access to new businesses + quarterly bonuses |

- [ ] Tier progress bar on referrer dashboard ("3 referrals away from Pro!")
- [ ] Tier badge on referrer profile
- [ ] Commission split auto-adjusts based on tier
- [ ] Notification when tier is unlocked

### Earnings Dashboard Redesign

- [ ] **This week/month** earnings with trend arrows (↑ 20% vs last week)
- [ ] **Pending earnings** (leads awaiting business response)
- [ ] **Lifetime earnings** prominently displayed
- [ ] **Goal tracker**: referrer sets a monthly goal → progress ring → "You're 60% to $200"
- [ ] **Earnings graph**: weekly/monthly trend line
- [ ] **Per-business breakdown**: which businesses are earning you the most?
- [ ] **Earnings estimator**: "If you refer 5 people/month to this plumber → $75/month"

---

## Phase 5: Smart Notifications & Nudges (P3)

> Keep referrers engaged between sessions.

- [ ] "Mike's Plumbing just increased their referral fee to $20/lead!"
- [ ] "You haven't shared your link for Dave's Electrical in 14 days"
- [ ] "New campaign: Double commission on all landscaping referrals this weekend"
- [ ] "Your referral to ABC Plumbing was accepted! You earned $15"
- [ ] "You're 2 referrals away from Pro tier 🔥"
- [ ] "New business in your area: Jim's Fencing — $20/lead"
- [ ] Notification preferences (email, push, in-app)

---

## Phase 6: Business-Side Enhancements (P3)

> Support features that make the referrer experience better.

### Marketing Asset Uploader

- [ ] Upload photos, promo images, logo
- [ ] Write "Why Refer Us" pitch text
- [ ] Create pre-written share messages
- [ ] Assets auto-populate referrer share kit

### Referrer Analytics (Business Dashboard)

- [ ] Which referrers are performing best
- [ ] Which campaigns drove the most leads
- [ ] Cost per acquired customer through referrals
- [ ] Referrer leaderboard

### Response SLA

- [ ] Business sets target response time (e.g. "within 2 hours")
- [ ] Platform tracks actual response time
- [ ] Displayed on referrer-facing scorecard
- [ ] Slow responders get flagged / lose visibility in directory

### Bulk Referrer Communication

- [ ] Business can send updates to all connected referrers
  - "We just got certified for gas fitting — let your network know!"
  - "Holiday hours: closed Dec 25–Jan 2"
- [ ] Custom commission for top-performing referrers (already in DB — surface it)

---

## Phase 7: Advanced Features (Future)

### Warm vs Cold Lead Differentiation

- [ ] Referrer indicates lead urgency: "Actively looking" vs "Might need work soon"
- [ ] Businesses can pay different rates for warm vs cold leads
- [ ] Quality incentive: better leads = better earnings

### Referrer Onboarding Overhaul

- [ ] "How It Works" animation — show money flow from business → platform → referrer
- [ ] Earnings examples: "Sarah from Melbourne earned $480 last month"
- [ ] Guided first action: "Find your first business to refer" flow
- [ ] First referral bonus: "$5 bonus for your first referral within 7 days"

### Trending / Discovery

- [ ] "Hot Right Now" — businesses with highest commission
- [ ] "New on TradeRefer" — recently listed businesses
- [ ] "In Your Area" — geo-targeted business recommendations
- [ ] "Top Earners" — anonymous leaderboard ("Top referrer earned $850 this month")

### Referrer-Business Relationship

- [ ] Referrer can leave private feedback to businesses ("Your response time is slow")
- [ ] Business can respond to feedback
- [ ] Relationship health score

---

## The Retention Loop

```
Referrer signs up
  → Browses businesses (attracted by commission + deals)
  → Connects to 2-3 businesses
  → Shares using share kit (low effort, pre-written messages)
  → Gets notification: "Lead accepted! $15 earned"
  → Checks dashboard: "You're 2 away from Pro tier"
  → Sees new campaign: "Double commission weekend"
  → Shares more
  → Hits Pro tier → gets 85% split
  → Now they're invested → they stay
  → Cycle repeats
```

---

## Key Principles

1. **Commission transparency** — referrers should always know exactly what they'll earn
2. **Low effort to share** — pre-written messages, one-tap sharing, QR codes
3. **Urgency through campaigns** — time-limited deals drive action now
4. **Status through tiers** — progress bars and levels prevent churn
5. **Quality over quantity** — reward better leads, not just more leads
6. **Referrers are partners, not users** — treat them like affiliates, not customers
