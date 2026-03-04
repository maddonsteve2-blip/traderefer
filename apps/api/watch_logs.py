"""
Watch Railway logs for inbound SMS processing.
Run this while you send the test SMS to see real-time webhook activity.
"""
import subprocess
import sys

print("📡 Watching Railway logs for inbound SMS activity...")
print("Reply to the SMS on your phone now with 'toilet is blocked'\n")

try:
    subprocess.run([
        "railway", "logs", "--service", "traderefer-api"
    ], check=True)
except KeyboardInterrupt:
    print("\n✅ Stopped watching logs")
    sys.exit(0)
except FileNotFoundError:
    print("❌ Railway CLI not installed. Install with: npm i -g @railway/cli")
    sys.exit(1)
