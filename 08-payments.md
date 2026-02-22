# 08 — Payments

This document covers every money movement in the platform — how businesses pay, how the platform collects, and how referrers get paid out.

---

## Money Flow Overview

```
COLLECTION (from businesses)
Business card/wallet → eWAY → Platform bank account

INTERNAL TRACKING (no money moves)
Platform DB tracks referrer_earnings (PENDING → AVAILABLE → PAID)
Platform DB tracks business wallet_balance

PAYOUTS (to referrers)
Platform bank account → PayPal Mass Payments → Referrer PayPal account
                     OR bank transfer (BSB + account)
```

---

## Phase 1: MVP Payment Stack

### Collection: eWAY

eWAY is used for:
- Business one-off card charges (pay-as-you-go unlock)
- Business wallet top-ups

**Why eWAY over Stripe:**
- Australian company — easier support relationship
- Lower fees: 1.5% + $0.25 vs Stripe's 1.75% + $0.30
- No concerns about account freezes (better for AU small business)

**eWAY integration:**
```python
# eWAY Rapid API — charge a card for a lead unlock
import requests

def charge_eway(amount_cents: int, card_token: str, description: str):
    response = requests.post(
        "https://api.ewaypayments.com.au/AccessCodes",
        auth=(EWAY_API_KEY, EWAY_API_PASSWORD),
        json={
            "Payment": {
                "TotalAmount": amount_cents,
                "CurrencyCode": "AUD",
                "InvoiceDescription": description
            },
            "TokenCustomerID": card_token,
            "TransactionType": "Purchase",
            "Method": "TokenPayment"
        }
    )
    return response.json()
```

**eWAY tokenisation:**
- On first card entry, eWAY JS library tokenises the card
- Store the TokenCustomerID against the business record in Supabase
- Future charges use the token — never store raw card numbers

---

### Payouts: PayPal Mass Payments

PayPal is used for paying referrers.

**Why PayPal:**
- Nearly every Australian adult has an account
- No bank details required from referrers at signup
- $0.25 flat per domestic payout (very cheap at MVP scale)
- Simple API — no complex marketplace onboarding

**Payout process (manual at MVP — done every Thursday):**

1. Admin runs `/admin/payouts/batch` API endpoint
2. System returns list of PENDING payout_requests with total amounts
3. Admin logs into PayPal Business → Mass Payments
4. Uploads CSV or uses PayPal Payouts API:

```python
# PayPal Payouts API
import paypalrestsdk

paypalrestsdk.configure({
    "mode": "live",
    "client_id": PAYPAL_CLIENT_ID,
    "client_secret": PAYPAL_SECRET
})

payout = paypalrestsdk.Payout({
    "sender_batch_header": {
        "sender_batch_id": f"batch_{datetime.now().strftime('%Y%m%d')}",
        "email_subject": "Your TradeRefer earnings are here!",
        "email_message": "Thanks for referring great leads. Here are your earnings."
    },
    "items": [
        {
            "recipient_type": "EMAIL",
            "amount": {"value": "34.75", "currency": "AUD"},
            "note": "TradeRefer referral earnings",
            "sender_item_id": payout_request.id,
            "receiver": referrer.paypal_email
        }
        # ... more items
    ]
})

payout.create()  # Returns True/False
```

5. On success: mark all payout_requests as PAID, update payment_ref

---

## Phase 2: Zai (when volume justifies it)

Migrate to Zai (hellozai.com) when processing >$10,000/month.

**Why Zai beats everything at scale:**
- Melbourne-based, purpose-built for Australian marketplaces
- Native PayID/NPP support — instant bank transfers (no PayPal needed)
- Split payments API — automates the 70/30 split
- Lower fees: 1.5% + $0.16 (vs eWAY's 1.5% + $0.25)
- Single API handles both collection and disbursement
- Dedicated account manager (you get a human to call)

**Contact:** hello@hellozai.com
**Start talking to them early** — even before your MVP is built. Establish the relationship so onboarding is fast when you're ready.

**Zai fee comparison on a $10 unlock:**

| Provider | Collection fee | Net to platform |
|---|---|---|
| eWAY | 1.5% + $0.25 = $0.40 | $2.60 of $3 platform cut |
| Zai | 1.5% + $0.16 = $0.31 | $2.69 of $3 platform cut |
| Stripe | 1.75% + $0.30 = $0.475 | $2.53 of $3 platform cut |

At 10,000 leads/month, Zai vs eWAY saves ~$900/year. At 100,000 leads, saves ~$9,000/year.

---

## Unlock Fee Calculation

Business sets unlock fee. Platform always takes 30%. Referrer always gets 70%.

```python
def calculate_split(unlock_fee_cents: int) -> dict:
    referrer_cut = int(unlock_fee_cents * 0.70)  # round down
    platform_cut = unlock_fee_cents - referrer_cut  # platform gets the remainder
    return {
        "referrer_cents": referrer_cut,
        "platform_cents": platform_cut
    }

# Examples:
# $3.00 (300 cents): referrer $2.10, platform $0.90
# $8.00 (800 cents): referrer $5.60, platform $2.40
# $10.00 (1000 cents): referrer $7.00, platform $3.00
# $15.00 (1500 cents): referrer $10.50, platform $4.50
```

**Always use integer cents. Never floats. Rounding always goes to platform.**

---

## Wallet Bonus Tiers

When a business loads wallet credit, give a bonus to reward commitment:

| Load amount | Bonus | Credit received |
|---|---|---|
| $50 (5000c) | 10% (+$5) | $55 (5500c) |
| $100 (10000c) | 15% (+$15) | $115 (11500c) |
| $200+ (20000c+) | 20% (+$40+) | $240+ (24000c+) |

The bonus is tracked as a separate TOPUP_BONUS wallet_transaction row.
Platform absorbs the bonus cost — it's a CAC reduction investment.

---

## Minimum Withdrawal

Referrers can only withdraw when wallet_balance_cents >= 2000 ($20.00).

**Why $20:**
- PayPal charges $0.25 per payout → on $20 that's 1.25% overhead
- Below $20, PayPal overhead becomes too significant
- Referrers typically hit $20 in 3-10 leads depending on fee level
- Keeps payout processing manageable (not too many tiny payouts)

**Display in UI:**
```
Available: $14.20
Minimum withdrawal: $20.00
You need $5.80 more before you can withdraw.
```

---

## Tax Compliance

### SERR (Sharing Economy Reporting Regime)
From July 2024, all digital platforms must report referrer earnings to the ATO twice yearly:
- Report 1: Cover period 1 July – 31 December, due 31 January
- Report 2: Cover period 1 January – 30 June, due 31 July

**What to collect from referrers:**
- Full legal name
- Date of birth
- ABN (if provided)
- Total gross earnings in period
- Total platform fees withheld

**Implementation:**
Build a simple admin export that generates the ATO-required CSV format. Supabase query across referrer_earnings for the reporting period.

### ABN Withholding
If a referrer has no ABN on file: withhold 47% of each payout.
Example: Referrer earns $100 → you send $53, withhold $47 for ATO.

**Handle in payout flow:**
```python
def calculate_payout_amount(referrer, gross_cents):
    if not referrer.abn:
        withheld = int(gross_cents * 0.47)
        payout = gross_cents - withheld
        return {"payout_cents": payout, "withheld_cents": withheld}
    return {"payout_cents": gross_cents, "withheld_cents": 0}
```

**Show ABN warning prominently in UI** before first withdrawal:
```
⚠️ No ABN on file
Without an ABN, we're required by Australian tax law
to withhold 47% of your earnings ($16.34 on this withdrawal).

Getting an ABN is free and takes 10 minutes:
→ abr.gov.au/RegisterAnABN

[Add My ABN]   [Continue without ABN — I understand]
```

---

## Payment Error Handling

### eWAY charge fails
1. Return 402 error to business
2. Show message: "Payment declined. Please check your card details."
3. Do NOT create the lead unlock — no money, no unlock
4. Log the failed attempt in wallet_transactions with type FAILED

### PayPal payout fails
1. Mark payout_request as FAILED
2. Re-add amount to referrer's wallet_balance_cents
3. Email referrer: "Your payout of $34.75 failed. Please check your PayPal email and try again."
4. Admin flagged for manual retry

### Business card tokenisation fails
1. Show inline error on payment modal
2. Ask business to re-enter card details
3. eWAY JS handles most card validation client-side

---

## Testing Payments (Development)

eWAY provides a sandbox environment:
- Sandbox API key: set in `.env.local`
- Test card: 4444333322221111, any future expiry, any CVC
- Force decline: 4111111111111111

PayPal sandbox:
- Create sandbox accounts at developer.paypal.com
- Use sandbox credentials in `.env.local`

Never use real card numbers in development. Use environment variables to switch between sandbox and live.
