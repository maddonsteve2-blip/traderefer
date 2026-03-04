"""
Quick traffic analysis from the Railway logs you pasted.
Just counts unique IPs and page types.
"""

# Sample from your logs (15:14 - 15:34 timeframe)
log_sample = """
2026-03-04T15:14:55.739129493Z [inf]  INFO:     100.64.0.20:49898 - "GET / HTTP/1.1" 200 OK
2026-03-04T15:14:59.142468815Z [inf]  INFO:     100.64.0.14:54300 - "GET /business/green-ink-garden-design-wiobd/projects/public HTTP/1.1" 200 OK
2026-03-04T15:15:21.704304038Z [inf]  INFO:     100.64.0.2:56714 - "GET /business/wardrobe-connection-aspley-795hx/projects/public HTTP/1.1" 200 OK
2026-03-04T15:16:33.843313622Z [inf]  INFO:     100.64.0.15:60582 - "GET /wp-login.php HTTP/1.1" 404 Not Found
2026-03-04T15:18:39.878721027Z [err]  15:18:39 | INFO | Inbound SMS | from=+61413600191 | body=toilet is blocked
2026-03-04T15:20:40.672931071Z [err]  15:20:40 | INFO | Inbound SMS | from=+61413600191 | body=Asap
"""

import re

# Extract unique IPs (Railway internal IPs from 100.64.0.x range)
ips = set(re.findall(r'100\.64\.0\.(\d+):', log_sample))

# Count request types
business_pages = len(re.findall(r'/business(?:es)?/[\w-]+', log_sample))
homepage = len(re.findall(r'"GET / HTTP', log_sample))
bots = len(re.findall(r'wp-login|wp-admin|administrator|security\.txt', log_sample))
sms_webhooks = len(re.findall(r'Inbound SMS', log_sample))

print("📊 Traffic Stats (from your log sample)")
print("=" * 50)
print(f"👥 Unique visitors: ~{len(ips)} (Railway internal IPs)")
print(f"📄 Business profile views: {business_pages}")
print(f"🏠 Homepage views: {homepage}")
print(f"📱 SMS webhooks: {sms_webhooks}")
print(f"🤖 Bot/scanner requests: {bots}")
print()
print("💡 To get full stats, copy all Railway logs and save to logs.txt,")
print("   then run: python analyze_traffic.py")
