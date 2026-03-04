"""
Analyze Railway API logs to count unique visitors and page views.
Paste your Railway logs into a file called 'logs.txt' in the same directory.
"""
import re
from collections import defaultdict
from datetime import datetime

def parse_logs(log_text):
    # Pattern to match log lines with IP and endpoint
    pattern = r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).*?(\d+\.\d+\.\d+\.\d+):(\d+) - "GET ([^"]+)"'
    
    unique_ips = set()
    page_views = defaultdict(int)
    endpoints = defaultdict(int)
    hourly_traffic = defaultdict(int)
    
    for line in log_text.split('\n'):
        match = re.search(pattern, line)
        if match:
            timestamp, ip, port, endpoint = match.groups()
            
            # Skip bot/scanner requests
            if any(bot in endpoint for bot in ['/wp-', '/administrator', 'security.txt', 'favicon.ico']):
                continue
            
            # Extract hour from timestamp
            hour = timestamp.split('T')[1][:2]
            
            unique_ips.add(ip)
            page_views[endpoint] += 1
            hourly_traffic[hour] += 1
            
            # Categorize endpoints
            if '/businesses/' in endpoint or '/business/' in endpoint:
                endpoints['Business Profiles'] += 1
            elif endpoint == '/':
                endpoints['Homepage'] += 1
            elif '/twilio/' in endpoint:
                endpoints['SMS Webhooks'] += 1
            else:
                endpoints['Other API'] += 1
    
    return unique_ips, page_views, endpoints, hourly_traffic

# Read logs from file or use sample
try:
    with open('logs.txt', 'r', encoding='utf-8') as f:
        log_text = f.read()
except FileNotFoundError:
    print("❌ logs.txt not found. Create it and paste your Railway logs into it.")
    exit(1)

unique_ips, page_views, endpoints, hourly = parse_logs(log_text)

print("📊 Traffic Analysis")
print("=" * 50)
print(f"\n👥 Unique Visitors: {len(unique_ips)}")
print(f"📄 Total Page Views: {sum(page_views.values())}")

print("\n📈 Traffic by Category:")
for category, count in sorted(endpoints.items(), key=lambda x: -x[1]):
    print(f"  {category}: {count}")

print("\n🕐 Hourly Traffic:")
for hour in sorted(hourly.keys()):
    bar = '█' * (hourly[hour] // 5)
    print(f"  {hour}:00 - {hourly[hour]:3d} requests {bar}")

print("\n🔝 Top 10 Pages:")
for endpoint, count in sorted(page_views.items(), key=lambda x: -x[1])[:10]:
    print(f"  {count:3d}x - {endpoint[:60]}")
