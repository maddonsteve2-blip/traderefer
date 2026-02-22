# 06 — UI/UX Specification

Every screen, every component, every piece of copy. Read this before building any UI.

Design principles:
- Simple and fast — tradies are not tech-savvy, every screen must be obvious
- Mobile-first — assume most users are on phones
- Action-oriented — every screen has one clear next step
- Trust-building — show badges, confirmations, real numbers

Tech: Next.js 14 + Tailwind + shadcn/ui

---

## Color Palette

```
Primary:     #F97316  (orange — energetic, trades feel)
Primary Dark:#EA580C
Text:        #111827  (near black)
Muted text:  #6B7280
Background:  #FFFFFF
Surface:     #F9FAFB  (light grey cards)
Border:      #E5E7EB
Success:     #16A34A  (green)
Warning:     #D97706  (amber)
Danger:      #DC2626  (red)
```

---

## Typography

```
Font: Inter (Google Fonts)
H1:  32px, font-bold
H2:  24px, font-semibold
H3:  18px, font-semibold
Body: 16px, font-normal
Small: 14px, font-normal
Tiny: 12px, font-normal
```

---

## PUBLIC PAGES

---

### Screen: Homepage (`/`)

**Purpose:** Convert visitors into signups — business or referrer.

**Header:**
```
[Logo: TradeRefer]                    [Browse Businesses] [Sign In] [Get Started]
```

**Hero Section:**
```
BIG HEADING (H1):
"Australia's smartest way to get tradie leads"

SUBHEADING:
"Real referrals from people who know you.
 Pay only when a verified lead arrives."

TWO BUTTONS:
[List My Business — Free]    [Earn By Referring]
```

**How It Works Section (3 columns):**
```
Column 1:               Column 2:               Column 3:
[Person icon]           [Bell icon]             [Handshake icon]
"Someone who            "A verified lead        "They meet, PIN
 knows your work         arrives with            confirmed,
 shares your link"       their details"          you both win"
```

**Stats Bar:**
```
$73B  |  250,000+  |  70%
Residential trades   Trade businesses   Say word-of-mouth
market in AU         in Australia       is their best source
```

**Competitor Comparison Table:**
```
                    TradeRefer    HiPages    ServiceSeeking
Cost per lead       $3-$15        $21-$70+   $30-$467/mo
Lead exclusivity    ✅ Yours only  ❌ Shared  ❌ Shared
Phone verified      ✅ Always      ❌ No      ❌ No
Real-world confirm  ✅ PIN system  ❌ No      ❌ No
Contract required   ✅ None        ❌ 12 mo   ❌ Annual
```

**Referrer Section:**
```
HEADING: "Turn your tradie recommendations into cash"

BODY: "Know a good plumber? An electrician everyone should use?
Share your personal link. Earn $2.10–$14 every time your lead gets unlocked."

BUTTON: [Start Earning — It's Free]

SOCIAL PROOF: "Top referrers earn $200–$600/month"
```

**Footer:**
```
© 2026 TradeRefer Pty Ltd  |  Privacy Policy  |  Terms  |  Contact
ABN: XX XXX XXX XXX
```

---

### Screen: Business Directory (`/businesses`)

**Layout:** Search bar top, filter sidebar left, grid right.

**Search Bar:**
```
[🔍 Search by suburb, postcode, or trade...]     [Search]
```

**Filters (left sidebar on desktop, dropdown on mobile):**
```
Category:    [All ▼] or checkboxes
              Plumber / Electrician / Builder / Carpenter / Cleaner / Other

Suburb:      [Type suburb...]

Sort by:     [Most Reviews ▼]
              - Most Reviews
              - Lowest Unlock Fee
              - Highest Connection Rate
              - Newest
```

**Business Card (in grid):**
```
┌─────────────────────────────┐
│  [Logo]  Bob's Plumbing     │
│          Plumber · Newtown  │
│                             │
│  ★ 94% connection rate      │
│  42 verified connections    │
│                             │
│  "25 years in Geelong..."   │
│                             │
│  Unlock fee: $8.00          │
│                             │
│  [View & Refer →]           │
└─────────────────────────────┘
```

---

### Screen: Business Listing Page (`/businesses/{slug}`)

URL is used for SEO — must be server-rendered (Next.js Server Component).

**Layout:**
```
[Logo]  Bob's Plumbing                           [Get My Referral Link]
Plumber · Newtown, VIC

[Photo Gallery — max 5 images, horizontal scroll on mobile]

ABOUT:
"We've been serving Geelong families for 25 years.
 Same-day emergency callouts, upfront pricing."

BADGES:
✅ Verified Business     ⚡ Fast Responder     🏆 94% connection rate

DETAILS:
Service area: Newtown and within 20km
Response time: Usually within 2 hours
Unlock fee: $8.00

LEAD FORM (right column on desktop, below on mobile):
─────────────────────────────
Get a quote from Bob's Plumbing
─────────────────────────────
Your name:        [_____________]
Your mobile:      [_____________]
Your email:       [_____________]
Your suburb:      [_____________]
What do you need? [_____________]
                  [_____________]
                  [_____________]

[✓] I agree to my details being shared with Bob's Plumbing only.
    Privacy Policy

[Send My Enquiry →]
─────────────────────────────
```

**OTP Verification (appears after form submit):**
```
─────────────────────────────
Verify your mobile number
─────────────────────────────
We sent a code to 0412 XXX XXX

Enter code:    [_] [_] [_] [_]

[Resend code] (grey, becomes clickable after 30s)
─────────────────────────────
```

**Success State:**
```
✅ Enquiry sent!

Bob's Plumbing will be in touch shortly.
We'll text you when they're on their way.

[Browse other businesses]
```

---

## BUSINESS DASHBOARD

All dashboard screens are under `/dashboard/business/` and require business auth.

---

### Screen: Business Dashboard Home (`/dashboard/business`)

**Top Stats Bar:**
```
┌──────────┬──────────┬──────────┬──────────┐
│  $24.50  │    3     │    18    │   87%    │
│  Wallet  │ New leads│ Unlocked │ Connect  │
│ balance  │ waiting  │ all time │  rate    │
└──────────┴──────────┴──────────┴──────────┘
```

**Leads Inbox (main content):**
```
HEADING: Leads Inbox

FILTER TABS: [All] [New (3)] [Unlocked] [Confirmed] [Expired]

LEAD CARD (PENDING — blurred):
┌────────────────────────────────────────────┐
│ 🔒 NEW LEAD                    23 min ago  │
│ Newtown · Plumber                          │
│ "Burst pipe in bathroom, urgent..."        │
│                                            │
│ Name: ████████  Phone: ████████            │
│ Email: ████████                            │
│                                            │
│ Expires in: 47h 37m                        │
│                                            │
│ [Unlock for $8.00]     [Not Interested]   │
└────────────────────────────────────────────┘

LEAD CARD (UNLOCKED):
┌────────────────────────────────────────────┐
│ ✅ UNLOCKED                     2 hrs ago  │
│ Newtown · Plumber                          │
│ "Burst pipe in bathroom, urgent..."        │
│                                            │
│ Sarah Thompson                             │
│ 📞 0412 345 678   ✉ sarah@email.com       │
│                                            │
│ [📞 Call]  [💬 SMS]  [🚗 I'm On My Way]   │
└────────────────────────────────────────────┘

LEAD CARD (ON_THE_WAY):
┌────────────────────────────────────────────┐
│ 🚗 ON MY WAY                   14 min ago │
│ Sarah Thompson · Newtown                   │
│                                            │
│ Enter their connection code:               │
│ [_] [_] [_] [_]                           │
│ [CONFIRM VISIT ✓]                          │
│                                            │
│ PIN expires in: 3:41:22                    │
└────────────────────────────────────────────┘

LEAD CARD (CONFIRMED):
┌────────────────────────────────────────────┐
│ ✅ CONFIRMED CONNECTION         Yesterday  │
│ Sarah Thompson · Newtown                   │
│ +1 to your connection rate                 │
└────────────────────────────────────────────┘
```

---

### Screen: Unlock Payment Modal

**Appears when business clicks "Unlock for $8.00"**

```
┌────────────────────────────────────┐
│  Unlock this lead — $8.00          │
│                                    │
│  What you'll get:                  │
│  ✓ Full name and phone number      │
│  ✓ Email address                   │
│  ✓ Detailed job description        │
│                                    │
│  ─────────────────────────────     │
│  Pay with card:                    │
│  [Card number________________]     │
│  [MM/YY____]  [CVC___]            │
│  [Pay $8.00 Now]                   │
│                                    │
│  ─────────────────────────────     │
│  Or use wallet ($24.50 available): │
│  [Use Wallet Credit]               │
│                                    │
│  ─────────────────────────────     │
│  💰 Load wallet instead:           │
│  $50 → get $55 (10% bonus!)        │
│  [Load Wallet]                     │
│                                    │
│  Note: Payment is for a verified   │
│  phone-confirmed contact. No       │
│  refunds for non-responses.        │
│                          [Cancel]  │
└────────────────────────────────────┘
```

---

### Screen: Wallet (`/dashboard/business/wallet`)

```
HEADING: Wallet

BALANCE CARD:
┌─────────────────────────┐
│  Available Balance      │
│  $24.50                 │
│  [Top Up Wallet]        │
└─────────────────────────┘

TOP UP SECTION:
Choose amount:
[○ $50 → get $55 (+10%)]
[○ $100 → get $115 (+15%)]
[○ $200 → get $240 (+20%)]
[○ Custom amount $_____]

[Card number________________]
[MM/YY____]  [CVC___]
[Add Credit]

TRANSACTION HISTORY:
Date          Type      Amount    Balance
19 Feb 2026   Unlock    -$8.00    $24.50
18 Feb 2026   TopUp     +$55.00   $32.50
18 Feb 2026   Unlock    -$8.00    -$22.50
```

---

### Screen: Business Profile Settings (`/dashboard/business/settings`)

```
HEADING: Business Profile

SECTIONS:

1. Basic Info
   Business name: [Bob's Plumbing_______]
   Trade category: [Plumber ▼]
   Description: [textarea________________]

2. Location
   Suburb: [Newtown, VIC___]
   Service radius: [● 5km ○ 10km ○ 20km ○ 50km]

3. Lead Pricing
   Unlock fee: [$8____]
   Min $3, no maximum
   Referrers earn: $5.60 (70% of your fee)
   [Preview how your listing looks]

4. Photos
   Logo: [Upload] or [Current logo thumbnail]
   Work photos: [Upload up to 5]

5. Contact
   Business phone: [0412000000___]
   Website: [https://____________]
   ABN: [12345678901_________]

[Save Changes]
```

---

## REFERRER DASHBOARD

All under `/dashboard/referrer/`. Requires referrer auth.

---

### Screen: Referrer Dashboard Home (`/dashboard/referrer`)

```
HEADING: Your Earnings

STATS:
┌──────────┬──────────┬──────────┐
│  $34.75  │  $12.25  │  $156.40 │
│Available │ Pending  │All Time  │
└──────────┴──────────┴──────────┘

[Withdraw $34.75]   (disabled if < $20)
Note: Minimum withdrawal is $20

QUICK ACTION:
[+ Find a Business to Refer]

YOUR LINKS:
─────────────────────────────────────────
Bob's Plumbing    47 clicks  6 leads  $42.00
[Copy Link] [Share] [View Stats]
─────────────────────────────────────────
Geelong Electrical  12 clicks  2 leads  $14.00
[Copy Link] [Share] [View Stats]
─────────────────────────────────────────
[+ Add another business]
```

---

### Screen: Business Browser for Referrers (`/dashboard/referrer/browse`)

```
Same layout as public directory BUT with [Get My Link] button on each card
instead of lead form.

When referrer clicks [Get My Link]:
Shows modal:
┌─────────────────────────────────────┐
│  Your link for Bob's Plumbing       │
│                                     │
│  https://traderefer.com.au/r/       │
│  bobs-plumbing/abc123xyz            │
│                                     │
│  [📋 Copy Link]                     │
│  [📱 Share via SMS]                 │
│  [💬 Share via WhatsApp]            │
│                                     │
│  Pre-written caption:               │
│  "Need a plumber? I've used Bob's   │
│  Plumbing — they're great. Get a   │
│  free quote: [link]"               │
│  [Copy Caption]                     │
│                                     │
│  💰 You earn: $5.60 per unlock      │
└─────────────────────────────────────┘
```

---

### Screen: Earnings History (`/dashboard/referrer/earnings`)

```
HEADING: Earnings History

FILTER: [All] [Pending] [Available] [Paid]

EARNING ROW:
Bob's Plumbing unlock     19 Feb    $5.60    ⏱ Available 26 Feb
Geelong Electrical unlock 17 Feb    $4.20    ✅ Available now
Bob's Plumbing unlock     14 Feb    $5.60    ✅ Paid 18 Feb
```

---

### Screen: Withdraw (`/dashboard/referrer/withdraw`)

```
HEADING: Withdraw Earnings

AVAILABLE: $34.75

AMOUNT: [$34.75] (pre-filled, editable)
Minimum: $20.00

PAYOUT METHOD:
[● PayPal]  [○ Bank Transfer]

PayPal email: [jane@email.com_______]

ABN (required to avoid 47% tax withholding):
[12 345 678 901_________]
Don't have one? Get a free ABN at abr.gov.au in 10 mins

[Request Withdrawal]

Expected payment: This Friday
Note: Processed every Thursday, paid Friday morning
```

---

## MOBILE APP SCREENS (Expo React Native)

The mobile app is for tradies only. Consumers and referrers use the mobile website.

---

### Mobile: Lead Notification (Push Notification)

```
TradeRefer
🔔 New lead waiting in Newtown
"Burst pipe, urgent" — Tap to unlock
```

---

### Mobile: Leads List (Home Screen)

```
┌─────────────────────────────┐
│ TradeRefer    [Profile]     │
│─────────────────────────────│
│ LEADS                       │
│─────────────────────────────│
│ 🔒 Newtown              NEW │
│ Burst pipe, urgent          │
│ $8 to unlock  Expires 47h  │
│─────────────────────────────│
│ ✅ Newtown         UNLOCKED │
│ Sarah Thompson              │
│ 0412 345 678                │
│ [Call] [SMS] [On My Way]   │
│─────────────────────────────│
│ ✅ Geelong CBD   CONFIRMED  │
│ Mike Johnson · 3 days ago   │
└─────────────────────────────┘
```

---

### Mobile: PIN Entry Screen

This is the most important screen in the entire app. Must be polished.

```
┌─────────────────────────────┐
│       ← Back                │
│                             │
│   Confirm your visit with   │
│                             │
│   Sarah Thompson            │
│   Newtown · Plumber         │
│                             │
│   Ask Sarah for their       │
│   4-digit connection code   │
│                             │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│   │   │ │   │ │   │ │   │  │
│   └───┘ └───┘ └───┘ └───┘  │
│                             │
│   [CONFIRM VISIT  ✓]        │
│                             │
│   ⏱ Expires in 3:41:22      │
│                             │
│   Code expired? [Resend]    │
└─────────────────────────────┘
```

Number pad appears automatically (numeric keyboard).
Large boxes, easy to tap.
Timer counts down in real time.
Orange button matching brand colour.

---

### Mobile: Visit Confirmed Screen

```
┌─────────────────────────────┐
│                             │
│          ✅                  │
│                             │
│   Visit Confirmed!          │
│                             │
│   Sarah Thompson's          │
│   referrer has been paid.   │
│                             │
│   Your connection rate is   │
│   now 88% 📈                │
│                             │
│   [Back to Leads]           │
│                             │
└─────────────────────────────┘
```

---

## ADMIN PANEL

Simple internal tool — not public-facing. Access at `/admin`. Keep it functional, not pretty.

### Admin: Disputes Queue

```
HEADING: Open Disputes (4)

TABLE:
Lead ID   Business          Reason           Days Open  Action
abc-123   Bob's Plumbing    invalid_phone    1 day      [Review]
def-456   GE Electrical     duplicate        2 days     [Review]

DISPUTE DETAIL PAGE:
Lead created: 19 Feb at 10:30am
Business unlocked: 19 Feb at 11:15am
Consumer OTP verified: ✅ (at 10:32am)
Phone delivery status: Delivered (Twilio)
Business reason: "Number was disconnected"
Business notes: "Called 3 times, always goes to voicemail"

Timeline:
10:30am — Lead created
10:32am — OTP verified
11:15am — Lead unlocked ($8.00 charged)
11:20am — Dispute raised

Admin decision:
[✅ Approve Refund] [❌ Deny Refund]
Admin notes: [________________]
```

---

## Loading & Error States

**Loading:** Use skeleton placeholders, not spinners where possible.

**Empty states:**

Leads inbox empty:
```
📭 No leads yet
Referrers are working hard! Leads usually
start arriving within 24-48 hours of listing.
[Share your listing to speed things up →]
```

Referrer no links:
```
💼 No referral links yet
Browse businesses you trust and
grab your personal link.
[Find a business to refer →]
```

**Error states:**

Generic error:
```
Something went wrong
Please try again or contact support.
[Try Again]
```

Payment failed:
```
Payment declined
Please check your card details and try again.
If the problem persists, try a different card.
[Try Again]
```
