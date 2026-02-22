# 01 — Product Overview

## What TradeRefer Does In One Sentence

TradeRefer pays real people to send verified leads to local tradies, and proves the connection actually happened with a real-world PIN exchange.

---

## The Three Parties

Every single transaction involves exactly three parties. Understand these three people before touching any code.

### 1. The Business (Tradie)
- Plumber, electrician, builder, carpenter, cleaner — any trade or home service
- Signs up FREE — no subscription, no monthly fee, no credit card required at signup
- Gets listed in the public directory immediately
- Receives a notification when a lead arrives: "You have a lead waiting"
- Pays $3–$20 (they set the price) to unlock the lead and see consumer details
- Optional: pre-load wallet credit for convenience (with small bonus)
- Taps "I'm on my way" when heading to the job — triggers the PIN exchange
- Enters the consumer's PIN to confirm the visit happened

### 2. The Referrer
- Anyone — past customer, friend, family member, real estate agent, Facebook group admin
- Signs up FREE
- Browses the business directory
- Gets a unique personal link for each business they want to promote
- Shares that link however they want (text, Facebook, word of mouth)
- Earns 70% of the unlock fee every time their lead gets unlocked
- Earnings accumulate in a wallet, paid out when they hit $20 minimum
- Paid out via PayPal or bank transfer weekly

### 3. The Consumer (Homeowner / Customer)
- Clicks a referrer's link
- Lands on the business listing page
- Fills in: name, phone, email, what they need
- Verifies phone via SMS OTP (4-digit code sent to their mobile)
- Gets connected to the business
- Receives a PIN code when the tradie is "on the way"
- Reads the PIN to the tradie when they arrive

---

## The Money Flow

Every lead unlock triggers this exact split:

```
Business pays unlock fee
         │
         ▼
┌─────────────────────┐
│   $10 unlock fee    │  ← Example at $10
│                     │
│  $7.00 → Referrer   │  ← 70% to referrer
│  $3.00 → Platform   │  ← 30% platform keeps
└─────────────────────┘
```

The referrer's $7 is held for 7 days (fraud protection), then paid out automatically. If the PIN is confirmed before 7 days, payout releases immediately.

### Fee Range
- Minimum unlock fee: $3.00
- Maximum: no hard limit (business sets it, market self-regulates)
- Typical range: $3–$15 for most trades
- Platform always keeps exactly 30%
- Referrer always earns exactly 70%

---

## Why This Beats HiPages

| | TradeRefer | HiPages |
|---|---|---|
| Cost per lead | $3–$15 | $21–$70+ |
| Monthly subscription | None | $69–$900/month |
| Lead exclusivity | Exclusive to one business | Shared with up to 7 competitors |
| Lead source | Real referrals from people who know the business | Anonymous strangers online |
| Phone verification | Always (OTP) | None |
| Connection confirmed | Yes (PIN exchange proves meeting happened) | No — invisible to platform |
| Fake lead problem | Virtually impossible with PIN system | Constant problem |
| Referrer rewards | Anyone can earn | No referral system |
| Contract lock-in | None | 12-month contracts |

---

## The Market

- Australian residential trades market: **$73 billion/year**
- Number of residential trade businesses: **250,000**
- HiPages (market leader) only covers **15%** of the market
- **70% of tradies** still rely on word of mouth — this platform digitises that
- Geelong specifically: 22,875 businesses, $2.1B construction sector, fastest growing regional city

---

## The Core Innovation: The PIN System

This is the feature that no competitor has. When a business taps "I'm on my way":

1. Consumer receives a unique 4-digit PIN via SMS + email
2. Tradie receives notification: "Ask for their connection code when you arrive"
3. Tradie arrives → consumer reads PIN → tradie enters it in the app
4. Connection confirmed → referrer paid immediately

This proves the two parties physically met. It's impossible to fake without both people being present at the right time. It eliminates the platform's biggest trust problem (fake leads, businesses claiming leads were bad) and creates a data point no competitor has: verified connection rate.

---

## The Confirmation Outcome Table

This is the single most important business logic table. Every developer must memorise this.

| Business taps "On My Way" | Consumer PIN confirmed | Outcome |
|---|---|---|
| ✅ Yes | ✅ Yes (PIN entered) | Referrer paid **immediately** |
| ✅ Yes | ❌ No (didn't meet) | Referrer paid after **7 day hold** |
| ❌ No (ignored lead) | ❌ N/A | Referrer paid after **7 day hold** |
| ❌ No | ✅ Consumer claims they visited | Flag for **admin review** — referrer still paid after hold |

**The referrer always gets paid.** Disputes are between the platform and the business — never the referrer.

---

## Regulatory Requirements (Australia)

These are not optional — build them in from day one:

1. **Phone OTP on every lead** — Privacy Act compliance (consumer consent to share data)
2. **SERR Reporting** — Digital platforms must report referrer earnings to ATO twice yearly (since July 2024)
3. **ABN requirement** — Referrers without ABN must have 47% withheld. Prompt at first withdrawal.
4. **Spam Act** — Every automated message must have unsubscribe, clear sender ID, express consent
5. **Privacy Policy** — Required at every data capture point (lead form, signup forms)

---

## Launch Strategy

1. **Phase 1 — Geelong pilot**: Manually recruit 10–20 tradies you know personally. Manually recruit referrers (past customers, community figures). Get 50 real leads. Prove the flow works.
2. **Phase 2 — Melbourne expansion**: Once Geelong is density-proven, open Melbourne suburbs one at a time. Use Geelong data to recruit Melbourne tradies ("platform with proven 80% connection rate").
3. **Phase 3 — National**: Franchise the density playbook to other cities.
