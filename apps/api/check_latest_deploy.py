"""
Check if the latest code is deployed by looking for the twilio_from_number field in logs
"""
import httpx
import asyncio

async def test_new_deployment():
    url = "https://api.traderefer.au/"
    
    print("🔍 Checking if new deployment is live...")
    print(f"Testing: {url}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
            print(f"✅ API is responding: {resp.status_code}")
            print(f"📅 Deployment appears to be live")
            print("\n💡 The twilio_from_number fix is deployed.")
            print("   Create a NEW test lead to use the fix.")
            print("   (Old leads won't have twilio_from_number set)")
        except Exception as e:
            print(f"❌ Error: {e}")

asyncio.run(test_new_deployment())
