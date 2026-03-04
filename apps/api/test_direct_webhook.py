"""
Test the webhook directly to confirm the SQL fix works
"""
import httpx
import asyncio

async def test_webhook():
    url = "https://api.traderefer.au/twilio/inbound"
    
    # Simulate Twilio inbound SMS
    data = {
        "From": "+61413600191",
        "Body": "toilet is blocked",
        "MessageSid": "SMtest123",
        "AccountSid": "test"
    }
    
    print("🧪 Testing webhook with simulated SMS...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(url, data=data)
            print(f"✅ Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
        except Exception as e:
            print(f"❌ Error: {e}")

asyncio.run(test_webhook())
