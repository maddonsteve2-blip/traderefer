"""
Check what's causing the 500 error by testing the API endpoint
"""
import httpx
import asyncio

async def debug_api():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First check if API is responding
        print("1. Testing API health...")
        resp = await client.get("https://api.traderefer.au/")
        print(f"   API root: {resp.status_code}")
        
        # Check if business endpoint works
        print("\n2. Testing business lookup...")
        resp = await client.get("https://api.traderefer.au/businesses/stephen-s-handyman")
        print(f"   Business: {resp.status_code}")
        if resp.status_code == 200:
            biz = resp.json()
            print(f"   ID: {biz['id']}")
            print(f"   Name: {biz['business_name']}")
            
            # Try minimal lead creation
            print("\n3. Testing lead creation with minimal data...")
            lead_data = {
                "business_id": biz["id"],
                "consumer_name": "Test",
                "consumer_phone": "+61413600191",
                "consumer_suburb": "Brisbane",
                "job_description": "Test job"
            }
            
            resp = await client.post(
                "https://api.traderefer.au/leads/",
                json=lead_data
            )
            print(f"   Lead creation: {resp.status_code}")
            if resp.status_code != 200:
                print(f"   Error: {resp.text}")
            else:
                print(f"   Success: {resp.json()}")

asyncio.run(debug_api())
