# Prezzee Sandbox Testing Plan

## Overview
Test the complete Prezzee integration flow before switching to production. All tests use your accounts:
- **Test Referrer**: stevejford1@gmail.com
- **Test Business**: stevejford1@gmail.com
- **Environment**: Sandbox (PREZZEE_ENV=sandbox)

---

## Phase 1: API Integration Test (Quick Verification)

### Test 1.1: Run Prezzee API Test Script
```bash
cd c:\Users\61479\Documents\trade-refer-stitch
python scripts/test_prezzee.py
```

**Expected Results:**
- ✅ Auth token retrieved
- ✅ Float balance > $5
- ✅ Test $5 gift card created
- ✅ Duplicate order prevented (idempotency)
- ✅ Order lookup by reference works
- 📧 Email received at stevejford1@gmail.com with Prezzee gift card link

**If this fails:** Check `.env` file has correct Prezzee credentials:
- `PREZZEE_ENV=sandbox`
- `PREZZEE_USERNAME=<your_sandbox_username>`
- `PREZZEE_PASSWORD=<your_sandbox_password>`
- `PREZZEE_API_KEY=<optional_if_using_password_auth>`

---

## Phase 2: Manual Claim Flow (Referrer Dashboard)

### Test 2.1: Add Test Balance to Referrer Account

**Option A: Direct DB Update (Fast)**
```bash
node scripts/db_query.js "UPDATE referrers SET wallet_balance_cents = 2500, pending_cents = 0 WHERE email = 'stevejford1@gmail.com'"
```

**Option B: Complete a Test Lead (Full Flow)**
1. Log in as business (stevejford1@gmail.com)
2. Create a test campaign with $8 unlock fee
3. Log in as referrer (stevejford1@gmail.com)
4. Submit a test lead
5. Business confirms job → referrer earns $6.40 (80% of $8)
6. Repeat 4x to reach $25.60 balance

### Test 2.2: Manual Claim via Dashboard
1. Log in as referrer: https://traderefer.au/dashboard/referrer/withdraw
2. Verify balance shows $25.00+
3. Click "Claim Gift Card"
4. Enter amount: $25.00
5. Click "Claim Now"

**Expected Results:**
- ✅ Success message shown
- ✅ Balance reduced to $0
- ✅ Payout request logged in `payout_requests` table
- ✅ Email received with Prezzee gift card
- ✅ Gift card link works in sandbox

**Check Database:**
```bash
node scripts/db_query.js "SELECT * FROM payout_requests WHERE referrer_id = (SELECT id FROM referrers WHERE email = 'stevejford1@gmail.com') ORDER BY created_at DESC LIMIT 1"
```

Should show:
- `method: "PREZZEE_SWAP"`
- `amount_cents: 2500`
- `status: "completed"`
- `prezzee_order_uuid: <uuid>`
- `destination_email: stevejford1@gmail.com`

---

## Phase 3: Auto-Payout Flow ($74.99 Threshold)

### Test 3.1: Trigger Auto-Payout
```bash
# Set balance to $74.99
node scripts/db_query.js "UPDATE referrers SET wallet_balance_cents = 7499, pending_cents = 0 WHERE email = 'stevejford1@gmail.com'"
```

### Test 3.2: Simulate Survey Completion (Triggers Auto-Payout)
1. Create a test lead via referrer dashboard
2. As business, confirm the job
3. Complete the dual-YES survey flow
4. **OR** manually trigger via Python:

```python
# In Python console or script
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from services.survey_service import _issue_prezzee_or_accumulate
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_auto_payout():
    async with AsyncSessionLocal() as db:
        # Get referrer ID
        result = await db.execute(text("SELECT id FROM referrers WHERE email = 'stevejford1@gmail.com'"))
        ref_id = result.scalar()
        
        # Trigger auto-payout logic
        await _issue_prezzee_or_accumulate(ref_id, 7499, db)
        await db.commit()

asyncio.run(test_auto_payout())
```

**Expected Results:**
- ✅ Prezzee gift card auto-issued for $74.99
- ✅ Wallet balance zeroed
- ✅ Email + SMS sent to referrer
- ✅ Payout logged in database

---

## Phase 4: Compliance Flow (>$75 Edge Case)

### Test 4.1: Test Declaration Required
```bash
# Set balance to $76
node scripts/db_query.js "UPDATE referrers SET wallet_balance_cents = 7600 WHERE email = 'stevejford1@gmail.com'"
```

### Test 4.2: Attempt Manual Claim Without Compliance
1. Log in as referrer
2. Go to withdraw page
3. Try to claim $76

**Expected Results:**
- ❌ Claim blocked with message: "Declaration required for amounts over $74.99"
- ✅ Modal opens for ABN or supplier declaration

### Test 4.3: Complete Declaration
1. In modal, select "I don't have an ABN"
2. Enter date of birth
3. Select reason (e.g., "Under 18")
4. Check declaration box
5. Submit

**Expected Results:**
- ✅ Declaration saved
- ✅ Can now claim $76
- ✅ Prezzee issued successfully

**Check Database:**
```bash
node scripts/db_query.js "SELECT supplier_statement_declared_at, supplier_statement_reason, date_of_birth FROM referrers WHERE email = 'stevejford1@gmail.com'"
```

---

## Phase 5: Production Readiness Checklist

### Before Switching to Production:

- [ ] All Phase 1-4 tests passed in sandbox
- [ ] Prezzee gift cards received and redeemable in sandbox
- [ ] Float balance sufficient in **production** Prezzee account
- [ ] Update `.env` to production credentials:
  ```
  PREZZEE_ENV=production
  PREZZEE_USERNAME=<production_username>
  PREZZEE_PASSWORD=<production_password>
  ```
- [ ] Test one $5 production gift card to your email
- [ ] Monitor first 3-5 real payouts closely
- [ ] Set up Prezzee float balance alerts

### Production Float Monitoring
```bash
# Check production float balance
PREZZEE_ENV=production python -c "import asyncio; from services.prezzee_service import get_float_balance; print(asyncio.run(get_float_balance()))"
```

---

## Troubleshooting

### Issue: "Prezzee float too low"
**Solution:** Top up Prezzee account at https://partner.prezzee.com (or sandbox portal)

### Issue: "Auth failed"
**Solution:** Verify credentials in `.env`, check Prezzee portal for API access

### Issue: Gift card not received
**Solution:** 
1. Check spam folder
2. Verify email in Prezzee order (check `payout_requests.destination_email`)
3. Check Prezzee portal for order status

### Issue: Duplicate order error
**Solution:** This is expected behavior (idempotency working). Check if original order succeeded.

---

## Quick Commands Reference

```bash
# Check referrer balance
node scripts/db_query.js "SELECT email, wallet_balance_cents/100.0 as balance, pending_cents/100.0 as pending FROM referrers WHERE email = 'stevejford1@gmail.com'"

# Check recent payouts
node scripts/db_query.js "SELECT created_at, amount_cents/100.0 as amount, method, status, prezzee_order_uuid FROM payout_requests WHERE referrer_id = (SELECT id FROM referrers WHERE email = 'stevejford1@gmail.com') ORDER BY created_at DESC LIMIT 5"

# Set test balance
node scripts/db_query.js "UPDATE referrers SET wallet_balance_cents = 2500 WHERE email = 'stevejford1@gmail.com'"

# Run Prezzee test
python scripts/test_prezzee.py
```

---

## Success Criteria

✅ **Ready for Production** when:
1. All sandbox tests pass
2. Gift cards received and work
3. Auto-payout triggers correctly at $74.99
4. Compliance flow works for >$75
5. Idempotency prevents duplicates
6. Production float has sufficient balance
7. One production test gift card works

🚀 **Switch to production** by updating `.env` and restarting API server.
