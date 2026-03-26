"""
Test Prezzee sandbox integration.
Usage: python scripts/test_prezzee.py

Tests:
1. Auth token retrieval
2. Float balance check
3. Test gift card creation ($5 test amount)
4. Idempotency check (duplicate order prevention)
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from services.prezzee_service import (
    _get_access_token,
    get_float_balance,
    create_gift_card,
    get_order_by_reference,
    PREZZEE_ENV,
    BASE_URL,
)

async def test_prezzee():
    print(f"\n{'='*60}")
    print(f"🧪 Prezzee Integration Test")
    print(f"{'='*60}")
    print(f"Environment: {PREZZEE_ENV}")
    print(f"API Base URL: {BASE_URL}")
    print(f"{'='*60}\n")

    # Test 1: Authentication
    print("1️⃣  Testing authentication...")
    try:
        token = await _get_access_token()
        print(f"   ✅ Auth successful")
        print(f"   Token (first 20 chars): {token[:20]}...")
    except Exception as e:
        print(f"   ❌ Auth failed: {e}")
        return

    # Test 2: Float balance
    print("\n2️⃣  Checking float balance...")
    try:
        float_data = await get_float_balance()
        balance = float(
            float_data.get("balance")
            or float_data.get("data", {}).get("balance")
            or 0
        )
        print(f"   ✅ Float balance: ${balance:.2f}")
        if balance < 5:
            print(f"   ⚠️  Warning: Balance too low for test ($5 needed)")
            return
    except Exception as e:
        print(f"   ❌ Float check failed: {e}")
        return

    # Test 3: Create test gift card
    test_ref = f"test-{int(asyncio.get_event_loop().time())}"
    test_email = "stevejford1@gmail.com"  # Your test email
    test_amount = 5.00  # $5 test amount
    
    print(f"\n3️⃣  Creating test gift card...")
    print(f"   Reference: {test_ref}")
    print(f"   Amount: ${test_amount:.2f}")
    print(f"   Recipient: {test_email}")
    
    try:
        order = await create_gift_card(
            reference=test_ref,
            amount_dollars=test_amount,
            recipient_name="Steve Ford (Test)",
            recipient_email=test_email,
        )
        order_uuid = order.get("uuid") or order.get("data", {}).get("uuid")
        print(f"   ✅ Gift card created!")
        print(f"   Order UUID: {order_uuid}")
        print(f"   📧 Check {test_email} for the Prezzee email")
    except Exception as e:
        print(f"   ❌ Gift card creation failed: {e}")
        return

    # Test 4: Idempotency check
    print(f"\n4️⃣  Testing idempotency (duplicate prevention)...")
    try:
        duplicate = await create_gift_card(
            reference=test_ref,  # Same reference
            amount_dollars=test_amount,
            recipient_name="Steve Ford (Test)",
            recipient_email=test_email,
        )
        dup_uuid = duplicate.get("uuid") or duplicate.get("data", {}).get("uuid")
        if dup_uuid == order_uuid:
            print(f"   ✅ Idempotency working - returned existing order")
            print(f"   Same UUID: {dup_uuid}")
        else:
            print(f"   ⚠️  Warning: Different UUID returned")
    except Exception as e:
        print(f"   ❌ Idempotency test failed: {e}")

    # Test 5: Order lookup
    print(f"\n5️⃣  Testing order lookup by reference...")
    try:
        found = await get_order_by_reference(test_ref)
        if found:
            print(f"   ✅ Order found by reference")
            print(f"   UUID: {found.get('uuid')}")
        else:
            print(f"   ⚠️  Order not found (may take a moment to index)")
    except Exception as e:
        print(f"   ❌ Order lookup failed: {e}")

    print(f"\n{'='*60}")
    print(f"✅ Prezzee sandbox test complete!")
    print(f"{'='*60}")
    print(f"\n📋 Next steps:")
    print(f"   1. Check {test_email} for the Prezzee gift card email")
    print(f"   2. Verify the gift card works in sandbox")
    print(f"   3. Test the full referrer payout flow (see test plan below)")
    print(f"\n")

if __name__ == "__main__":
    asyncio.run(test_prezzee())
