"""
Simple test - just send a test SMS to verify deployment
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv(".env.local")

client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

# Send test message
msg = client.messages.create(
    body="Test: New deployment is live. Reply 'YES' to confirm you received this.",
    from_="+61485028717",
    to="+61413600191"
)

print(f"✅ Test SMS sent: {msg.sid}")
print("Check your phone and reply 'YES'")
