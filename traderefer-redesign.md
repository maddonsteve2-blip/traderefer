# TradeRefer Redesign Specification

## Project
TradeRefer — Two-sided referral marketplace for trades businesses and local referrers.

## Design Goal
Rebuild the dashboard from scratch using **shadcn/ui**, **Tailwind CSS**, and a high-contrast theme. Improve navigation clarity, mobile usability, and information hierarchy across both desktop and mobile platforms.

---

## Core Principles
1.  **What needs attention right now?** (Urgent actions, new leads, messages).
2.  **What changed since last visit?** (KPI shifts, recent activity).
3.  **What should I do next?** (Clear primary actions on every screen).

---

## Design System

### Theme & Contrast
-   **Mode:** Light UI with **Dark High-Contrast Sidebars**.
-   **Sidebar Background:** `#09090B` (Zinc 950).
-   **Sidebar Labels:** `#F4F4F5` (Zinc 100) for active/primary text.
-   **Sidebar Subtext:** `#A1A1AA` (Zinc 400).
-   **Main Surfaces:** White (`#FFFFFF`) and very light neutral (`#F8FAFC`).
-   **Primary Accent:** Orange (`#F97316`) — Energetic, trades-focused.
-   **Branding:** Standardized **Orange Gradient Zap Logo** + "TradeRefer" text.

### Layout & Responsiveness
-   **Flexbox:** All layouts use vertical/horizontal flex systems.
-   **Sidebar Placement:** Sidebars MUST be at **Index 0** (leftmost) in desktop horizontal layouts.
-   **Dynamic Sizing:**
    -   `fill_container`: Main content areas expand to fill remaining space.
    -   `fit_content`: Components like buttons and badges size to their internal elements.
-   **Mobile Shell:** Fixed top bar (title + actions) and fixed bottom nav (max 5 items).

### Typography
-   **Font:** Inter.
-   **Headers:** 24px-40px bold/black with negative letter spacing (`-1px` to `-0.5px`).
-   **Labels:** Sentence case, medium/semibold.

---

## Desktop Navigation Architecture

### Shell
-   **Left Sidebar (280px):** Role-specific navigation.
-   **Content Area:** Right of sidebar, `fill_container` width, scrollable.
-   **No Secondary Global Nav:** Banned. Use contextual tabs inside sections only.

### Menu Links
-   **Business:** Home, Leads, Network, Inbox, Analytics, Profile, Settings.
-   **Referrer:** Command Centre, Find Businesses, My Teams, Referrals, Earnings.

---

## Screen Inventory (Source: pencil-shadcn.pen)

### 01–11: Business Core & Sales
-   **01 Business Home:** Action-oriented command centre.
-   **02 Business Leads:** Master-detail lead management.
-   **03 Business Network:** Referrer management and application review.
-   **05 Business Home (Mobile):** Responsive dashboard view.
-   **06 Business Onboarding:** Step-by-step phone & reward setup.
-   **08 Business Sales — Leads:** Advanced unlock flow.
-   **08b Business Claim:** Verification and storefront claiming.
-   **09 Business Sales — Deals:** Prezzee balance management + AI deal creation.
-   **10 Business Analytics:** ROI charts, Leaderboards, and Broadcast tools.
-   **11 Business Settings:** Profile form with live storefront preview.

### 12–15: Communication & Referrer Dashboard
-   **12 Messages:** Unified Business/Referrer inbox.
-   **13 Referrer Command Centre:** Swipe file and business management.
-   **14 Referrer Find:** Business discovery catalog.
-   **15 Referrer Earnings:** Gift card rewards and payout tracking.

### 16–19: Public & Landing Pages
-   **16 Public Profile:** Customer-facing business storefront (`/b/slug`).
-   **17 Landing Page:** High-conversion desktop landing page design.
-   **19 Landing Page Variations:** Alternative hero and section layouts.
-   **00 Public — Waitlist:** Pre-launch conversion page.
-   **00 Public — Support & Legal:** Policy and contact layouts.

### 20a–20m: Mobile Experience Audit
-   **20a-20f:** Business mobile views (Home, Leads, Network, etc.).
-   **20g-20i:** Referrer mobile views (Find, Messaging, Rewards).
-   **20j-20m:** Settings and Onboarding mobile flows.

---

## Technical Stack
-   **Framework:** Next.js 14+ (App Router).
-   **Styling:** Tailwind CSS.
-   **Components:** shadcn/ui.
-   **Icons:** Lucide.
-   **Deployment:** Vercel.
