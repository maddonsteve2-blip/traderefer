"""
Google Indexing API — submit URLs directly to Google.

⚠️  IMPORTANT RESTRICTION:
Google officially only supports pages with JobPosting or BroadcastEvent schema.
For a trade/service directory (business profiles, suburb hubs, trade pages),
Google Indexing API will REJECT submissions — use GSC sitemaps instead.

This script is ONLY useful if you add JobPosting schema markup to specific
pages (e.g. job request / quote request pages on TradeRefer).

QUOTA REALITY:
  Default: 200 URLs/day per project (~265 days for 53k URLs)
  Quota increase: request via Google Cloud Console → Quotas (needs approval)
  Multiple service accounts: each gets 200/day (10 accounts = 2,000/day)

For a directory site without JobPosting schema, the correct Google approach is:
  1. Submit sitemap in Google Search Console (already done)
  2. Use GSC URL Inspection tool for priority pages (manual, limited)
  3. Build domain authority → increases crawl budget over time

SETUP (if you have JobPosting schema pages):
1. console.cloud.google.com → Create project → Enable 'Web Search Indexing API'
2. IAM & Admin → Service Accounts → Create → Download JSON key
3. Google Search Console → traderefer.au → Settings → Users and permissions
   → Add the service account email as Owner
4. Save the JSON key as: apps/api/google-indexing-key.json
5. Run: python submit_google_indexing.py

State is saved to submitted_urls.txt so re-runs skip already-submitted URLs.
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import json
import time
import sys
import os

# ── Config ────────────────────────────────────────────────────────────────

SITEMAP_INDEX  = "https://traderefer.au/sitemap.xml"
KEY_FILE       = os.path.join("apps", "api", "google-indexing-key.json")
INDEXING_API   = "https://indexing.googleapis.com/v3/urlNotifications:publish"
TOKEN_URL      = "https://oauth2.googleapis.com/token"
SCOPE          = "https://www.googleapis.com/auth/indexing"
BATCH_DELAY    = 0.5   # seconds between requests
DAILY_LIMIT    = 200   # Google's default quota — increase via Cloud Console if needed
STATE_FILE     = "submitted_urls.txt"  # tracks already-submitted URLs across runs

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

# ── Check key file exists ─────────────────────────────────────────────────

if not os.path.exists(KEY_FILE):
    print(f"\n{RED}{BOLD}✗ Key file not found: {KEY_FILE}{RESET}")
    print(f"""
{BOLD}One-time setup required:{RESET}

  1. Go to: https://console.cloud.google.com/
  2. Create a project (or use an existing one)
  3. APIs & Services → Enable 'Web Search Indexing API'
  4. IAM & Admin → Service Accounts → Create service account
     → Download JSON key → save as {KEY_FILE}
  5. Google Search Console → traderefer.au → Settings → Users and permissions
     → Add the service account email (from the JSON) as Owner
  6. Re-run: python submit_google_indexing.py

This is completely free.
""")
    sys.exit(1)

# ── Load credentials & get access token ──────────────────────────────────

try:
    import base64, hashlib, struct
except ImportError:
    pass

def get_access_token(key_file: str) -> str:
    """Exchange a service account JSON key for a short-lived access token."""
    try:
        import google.auth.transport.requests
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(
            key_file, scopes=[SCOPE]
        )
        creds.refresh(google.auth.transport.requests.Request())
        return creds.token
    except ImportError:
        # Fallback: manual JWT signing if google-auth not installed
        return _manual_jwt_token(key_file)

def _manual_jwt_token(key_file: str) -> str:
    """Manually create a JWT and exchange it for an access token."""
    import time, json, base64
    try:
        from cryptography.hazmat.primitives import serialization, hashes
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.backends import default_backend
    except ImportError:
        print(f"{RED}✗ Missing dependency. Run: pip install google-auth cryptography{RESET}")
        sys.exit(1)

    with open(key_file) as f:
        key_data = json.load(f)

    now = int(time.time())
    header  = {"alg": "RS256", "typ": "JWT"}
    payload = {
        "iss": key_data["client_email"],
        "sub": key_data["client_email"],
        "aud": TOKEN_URL,
        "scope": SCOPE,
        "iat": now,
        "exp": now + 3600,
    }

    def b64(data):
        return base64.urlsafe_b64encode(data if isinstance(data, bytes) else json.dumps(data).encode()).rstrip(b"=").decode()

    msg = f"{b64(header)}.{b64(payload)}".encode()
    private_key = serialization.load_pem_private_key(
        key_data["private_key"].encode(), password=None, backend=default_backend()
    )
    signature = private_key.sign(msg, padding.PKCS1v15(), hashes.SHA256())
    jwt = f"{msg.decode()}.{b64(signature)}"

    body = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    }).encode()

    req = urllib.request.Request(TOKEN_URL, data=body, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]

import urllib.parse

# ── Fetch all URLs from sitemaps ──────────────────────────────────────────

def http_get(url: str, timeout: int = 60) -> tuple[int, bytes]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TradeReferGoogleIndexing/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:
        return 0, b""

def parse_locs(xml_bytes: bytes) -> list[str]:
    locs = []
    try:
        root = ET.fromstring(xml_bytes)
        for el in root.iter():
            if el.tag.endswith("}loc") and el.text:
                locs.append(el.text.strip())
    except Exception:
        pass
    return locs

print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}{CYAN}   TradeRefer — Google Indexing API Submission{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}\n")

print(f"{BOLD}Step 1 — Authenticating with Google...{RESET}")
try:
    token = get_access_token(KEY_FILE)
    print(f"  {GREEN}✓ Access token obtained{RESET}\n")
except Exception as e:
    print(f"  {RED}✗ Auth failed: {e}{RESET}")
    print(f"  Make sure the service account email is added as Owner in Google Search Console.")
    sys.exit(1)

print(f"{BOLD}Step 2 — Collecting URLs from sitemaps (priority order):{RESET}")
_, idx_body = http_get(SITEMAP_INDEX)
sub_urls = parse_locs(idx_body)

# Collect per-sitemap so we can prioritise high-value pages first
sitemap_buckets: dict[str, list[str]] = {}
for sub_url in sub_urls:
    name = sub_url.rstrip("/").split("/")[-1]
    st, bd = http_get(sub_url, timeout=60)
    locs = parse_locs(bd) if st == 200 else []
    sitemap_buckets[name] = locs
    status_str = f"{GREEN}+{len(locs):,}{RESET}" if st == 200 else f"{RED}HTTP {st}{RESET}"
    print(f"  {name}: {status_str}")

# Priority: general (static/hub pages) > suburbs > top > trades > profiles
PRIORITY_ORDER = ["general", "suburbs", "top", "trades", "profiles"]
all_urls: list[str] = []
for bucket in PRIORITY_ORDER:
    all_urls.extend(sitemap_buckets.get(bucket, []))
for name, locs in sitemap_buckets.items():
    if name not in PRIORITY_ORDER:
        all_urls.extend(locs)

# Load already-submitted URLs to avoid wasting quota on re-runs
already_submitted: set[str] = set()
if os.path.exists(STATE_FILE):
    with open(STATE_FILE) as f:
        already_submitted = {line.strip() for line in f if line.strip()}
    print(f"\n  {YELLOW}Skipping {len(already_submitted):,} already-submitted URLs (from {STATE_FILE}){RESET}")

pending_urls = [u for u in all_urls if u not in already_submitted]
print(f"  {BOLD}Pending: {len(pending_urls):,} / {len(all_urls):,} URLs{RESET}")
print(f"  At {DAILY_LIMIT}/day default quota → ~{len(pending_urls)//DAILY_LIMIT} days to complete")
print(f"  {YELLOW}Note: Increase quota via Google Cloud Console → Quotas to speed this up{RESET}\n")

if not pending_urls:
    print(f"{GREEN}{BOLD}✓ All URLs already submitted. Nothing to do.{RESET}\n")
    sys.exit(0)

# ── Submit each URL to Google Indexing API ────────────────────────────────
print(f"{BOLD}Step 3 — Submitting to Google Indexing API (max {DAILY_LIMIT} today):{RESET}")
print(f"  Submitting {min(len(pending_urls), DAILY_LIMIT):,} URLs this run\n")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

ok_count = 0
fail_count = 0
quota_hit = False
newly_submitted: list[str] = []

for i, url in enumerate(pending_urls[:DAILY_LIMIT]):
    payload = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
    try:
        req = urllib.request.Request(INDEXING_API, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as r:
            ok_count += 1
    except urllib.error.HTTPError as e:
        if e.code == 429:
            quota_hit = True
            print(f"\n  {YELLOW}⚠  Daily quota hit at URL {i+1}. Resume tomorrow.{RESET}")
            print(f"  Submitted so far: {ok_count:,}")
            break
        elif e.code == 403:
            body_text = e.read().decode()[:200]
            if "not supported" in body_text.lower() or "schema" in body_text.lower():
                print(f"\n  {RED}✗ 403 — Google rejected this URL type.{RESET}")
                print(f"  {YELLOW}This confirms the API only works for JobPosting/BroadcastEvent schema pages.{RESET}")
                print(f"  {YELLOW}TradeRefer directory pages are NOT eligible. Use GSC sitemaps instead.{RESET}")
                sys.exit(1)
            print(f"  {RED}403 — is the service account added as Owner in Search Console?{RESET}")
            fail_count += 1
        else:
            fail_count += 1
    except Exception:
        fail_count += 1
    else:
        newly_submitted.append(url)

    if (i + 1) % 50 == 0:
        print(f"  Progress: {i+1:,}/{min(len(pending_urls), DAILY_LIMIT):,}  ({ok_count:,} OK, {fail_count} failed)")
        # Flush state to file incrementally
        with open(STATE_FILE, "a") as f:
            for u in newly_submitted[-50:]:
                f.write(u + "\n")

    time.sleep(BATCH_DELAY)

# Save final state
with open(STATE_FILE, "a") as f:
    remaining = [u for u in newly_submitted if u not in already_submitted]
    for u in remaining:
        f.write(u + "\n")

print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}Results{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"  Submitted today: {GREEN}{ok_count:,}{RESET}")
print(f"  Failed:          {RED}{fail_count}{RESET}")
total_done = len(already_submitted) + ok_count
print(f"  Total submitted: {GREEN}{total_done:,} / {len(all_urls):,}{RESET}")
print(f"  Still pending:   {len(all_urls) - total_done:,}")
if quota_hit or ok_count >= DAILY_LIMIT:
    days_left = (len(all_urls) - total_done + DAILY_LIMIT - 1) // DAILY_LIMIT
    print(f"\n  {YELLOW}Re-run tomorrow to continue. ~{days_left} more days at {DAILY_LIMIT}/day.{RESET}")
    print(f"  To speed up: Cloud Console → Quotas → request increase for Web Search Indexing API")
else:
    print(f"\n{GREEN}{BOLD}✓ Done! Google will crawl and index these pages within hours.{RESET}")
    print(f"  Check Google Search Console → Coverage for indexing status.\n")
