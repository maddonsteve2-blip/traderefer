"""
Create a fresh test lead to verify:
1. Only 2 Twilio numbers are used
2. Same number is used throughout the conversation (twilio_from_number fix)
3. AI screening flow works Q1 -> Q2 -> Q3 -> classification
"""
import httpx
import asyncio

async def create_final_test():
    print("🧪 Creating fresh test lead...")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get Stephen's Handyman business
        resp = await client.get("https://api.traderefer.au/businesses/stephen-s-handyman")
        
        if resp.status_code != 200:
            print(f"❌ Failed to get business: {resp.status_code}")
            return
        
        business = resp.json()
        business_id = business["id"]
        print(f"✅ Business: {business['business_name']}")
        
        # Create lead
        lead_data = {
            "business_id": business_id,
            "consumer_name": "Steve Test",
            "consumer_phone": "0413600191",
            "consumer_email": "test@example.com",
            "consumer_suburb": "Brisbane CBD",
            "job_description": "Blocked toilet urgent repair"
        }
        
        print(f"\n📤 Creating lead...")
        resp = await client.post(
            "https://api.traderefer.au/leads/",
            json=lead_data
        )
        
        if resp.status_code == 200:
            result = resp.json()
            print(f"✅ Lead created: {result['id']}")
            print(f"📱 Status: {result['status']}")
            print()
            print("=" * 60)
            print("📱 CHECK YOUR PHONE NOW!")
            print("=" * 60)
            print()
            print("You should receive Q1 from one of these numbers:")
            print("  • +61485028717")
            print("  • +61485033454")
            print()
            print("🧪 TEST FLOW:")
            print("1. Reply to Q1 with: 'toilet is blocked'")
            print("2. Reply to Q2 with: 'asap'")
            print("3. Reply to Q3 with: 'full toilet replacement'")
            print()
            print("✅ ALL MESSAGES SHOULD COME FROM THE SAME NUMBER!")
            print()
        else:
            print(f"❌ Failed: {resp.status_code}")
            print(resp.text)

asyncio.run(create_final_test())
