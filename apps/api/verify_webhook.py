"""
Verify current Twilio webhook configuration
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv(".env.local")

client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

numbers = ["+61485028717", "+61485033454"]

for num in numbers:
    phone = client.incoming_phone_numbers.list(phone_number=num)
    if phone:
        p = phone[0]
        print(f"\n{num}:")
        print(f"  SMS URL: {p.sms_url}")
        print(f"  Voice URL: {p.voice_url}")
