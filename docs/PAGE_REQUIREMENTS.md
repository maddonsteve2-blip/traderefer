# Page Requirements Specification

This document defines the purpose, required elements, and underlying business logic for every screen in the TradeRefer ecosystem. It is the primary reference for building UI and connecting it to the backend.

## Core Process Flow (Swimlane Diagram)
The interactions between Referrer, Consumer, Platform, and Business are defined in the **[Swimlane Sequence Diagram in docs/02-user-flows.md](./02-user-flows.md#mermaid-diagram-—-full-system-sequence)**. This diagram explains how data moves across the system and when each party is notified.

---

## 1. Business Core & Sales (01–11)

### 01 Business Home
- **Purpose**: Action-oriented dashboard for tradies to see what needs attention.
- **Required Elements**:
  - Urgent actions cards (Applications to review, New leads, Unread messages).
  - KPI Strip (Wallet balance, New leads, Unlocked total, Connect rate).
  - Recent activity feed.
  - Quick actions panel.

### 02 Business Leads
- **Purpose**: Master-detail lead management for reviewing and unlocking leads.
- **Required Elements**:
  - Left lead list with status filters.
  - Right detail pane with customer info, call/SMS triggers, and "On My Way" button.

### 03 Business Network
- **Purpose**: Manage the referral network and pending applications.
- **Required Elements**:
  - Tabs for Active Referrers and Applications.
  - Performance metrics per referrer.

### 05 Business Home (Mobile)
- **Purpose**: Pocket-sized dashboard for tradies on site.
- **Required Elements**:
  - Simplified KPI cards.
  - Quick access to active leads.

### 06 Business Onboarding
- **Purpose**: Multi-step guide to setting up a business profile.
- **Required Elements**:
  - Phone OTP verification.
  - Trade category and location selection.
  - Lead price setting.

### 08 Business Sales — Leads + Unlock Flow
- **Purpose**: The primary revenue-generating flow for the business.
- **Required Elements**:
  - Lead unlock payment interface (Card/Wallet).
  - Confirmation of unlock success.

### 08b Business Claim — Verification
- **Purpose**: Allow businesses to claim their pre-listed profiles.
- **Required Elements**:
  - Phone/Identity verification steps.

### 09 Business Sales — Deals (Prezzee + AI)
- **Purpose**: Create and manage referral incentives.
- **Required Elements**:
  - Prezzee balance management for gift cards.
  - AI Deal generator for marketing copy.

### 10 Business Analytics
- **Purpose**: Performance insights and ROI tracking.
- **Required Elements**:
  - Leaderboards for referrers.
  - Charts for lead volume and campaign ROI.

### 11 Business Settings
- **Purpose**: Manage account and public storefront appearance.
- **Required Elements**:
  - Profile edit form with Live Storefront Preview.

---

## 2. Referrer Dashboard (12–15)

### 12 Messages
- **Purpose**: Communication hub between referrers and businesses.
- **Required Elements**:
  - Shared inbox with message threads.

### 13 Referrer Command Centre
- **Purpose**: Management of all referral links and swipe files.
- **Required Elements**:
  - List of active referral links.
  - Swipe file with pre-made social media assets.

### 14 Referrer Find Businesses
- **Purpose**: Discovery catalog for referrers to find tradies to partner with.
- **Required Elements**:
  - Searchable list of businesses by trade and location.
  - "Quick Apply" functionality.

### 15 Referrer Earnings
- **Purpose**: Financial dashboard for commission tracking.
- **Required Elements**:
  - Earnings summary (Available, Pending, Paid).
  - Payout method selection (Prezzee, Bank, PayPal).

---

## 3. Public & Landing Pages (16–19 & 00)

### 16 Public Business Profile (`/b/slug`)
- **Purpose**: The destination for consumers arriving from referral links.
- **Required Elements**:
  - Business gallery and trust badges.
  - Lead enquiry form with OTP verification.

### 17 Landing Page (Desktop)
- **Purpose**: Main conversion point for the entire platform.
- **Required Elements**:
  - Value propositions for both tradies and referrers.
  - High-impact visuals explaining the 3-party loop.

### 19 Landing Page Variations
- **Purpose**: A/B testing different acquisition angles.

### 00 Public Pages
- **00 Waitlist**: Capture pre-launch interest.
- **00 Support & Contact**: Help and inquiry hub.
- **00 Legal**: Terms of Service and Privacy Policy.
- **00 404**: Not Found fallback.

---

## 4. Mobile Experience (20a–20m)

### 20a-20f Business Mobile
- **20a Home**: Action items.
- **20b Leads**: Active leads list.
- **20c Network**: Referrer list.
- **20d/e Lead Details**: Locked vs Unlocked views.
- **20f PIN Entry**: The critical door-side verification screen.

### 20g-20i Referrer Mobile
- **20g Find**: Business discovery.
- **20h Messages**: Chat on the go.
- **20i Rewards**: Commission tracking.

### 20j-20m Mobile Config
- **20j Settings**: Profile and preferences.
- **20k Storefront**: Mobile preview.
- **20l/m Onboarding**: Signup flows for both roles.

---

## 5. Core Business Rules (Logic Layer)

1.  **Lead Expiry**: Leads expire after 48 hours if not unlocked.
2.  **PIN System**: Tradie taps "On My Way" → 4-digit PIN sent to consumer → Tradie enters PIN at door → Commission released immediately.
3.  **Revenue Split**: 70% to Referrer, 30% to Platform.
4.  **Payout Hold**: 7-day fraud hold on earnings unless PIN is confirmed.
5.  **OTP First**: No lead record created until phone is verified via SMS OTP.
