"""
Google Indexing API — submit all 53k traderefer.au URLs directly to Google.
Free. Bypasses the crawl queue — Google indexes pages within hours.

SETUP (one-time):
1. console.cloud.google.com → Create project → Enable 'Web Search Indexing API'
2. IAM & Admin → Service Accounts → Create → Download JSON key
3. Google Search Console → Settings → Users and permissions
   → Add the service account email as Owner of traderefer.au
4. Save the JSON key as: apps/api/google-indexing-key.json

Run: python submit_google_indexing.py
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
BATCH_DELAY    = 0.2   # seconds between requests (stay under 200 req/s quota)

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

print(f"{BOLD}Step 2 — Collecting URLs from sitemaps:{RESET}")
_, idx_body = http_get(SITEMAP_INDEX)
sub_urls = parse_locs(idx_body)
all_urls: list[str] = []
for sub_url in sub_urls:
    name = sub_url.rstrip("/").split("/")[-1]
    st, bd = http_get(sub_url, timeout=60)
    locs = parse_locs(bd) if st == 200 else []
    all_urls.extend(locs)
    status_str = f"{GREEN}+{len(locs):,}{RESET}" if st == 200 else f"{RED}HTTP {st}{RESET}"
    print(f"  {name}: {status_str}")

print(f"\n  {BOLD}Total: {len(all_urls):,} URLs{RESET}\n")

# ── Submit each URL to Google Indexing API ────────────────────────────────
print(f"{BOLD}Step 3 — Submitting to Google Indexing API:{RESET}")
print(f"  (This may take a while for {len(all_urls):,} URLs — ~{len(all_urls)*BATCH_DELAY/60:.0f} min)\n")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

ok_count = 0
fail_count = 0
quota_hit = False

for i, url in enumerate(all_urls):
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
            print(f"\n  {RED}✗ 403 Forbidden — is the service account added as Owner in Search Console?{RESET}")
            fail_count += 1
        else:
            fail_count += 1
    except Exception:
        fail_count += 1

    if (i + 1) % 200 == 0:
        print(f"  Progress: {i+1:,}/{len(all_urls):,}  ({ok_count:,} OK, {fail_count} failed)")

    time.sleep(BATCH_DELAY)

print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}Results{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"  Submitted:  {GREEN}{ok_count:,}{RESET}")
print(f"  Failed:     {RED}{fail_count}{RESET}")
if quota_hit:
    print(f"  {YELLOW}Quota hit — Google allows ~200 URL_UPDATED requests/day per property.{RESET}")
    print(f"  Re-run tomorrow to continue. Google will have already queued the submitted ones.")
else:
    print(f"\n{GREEN}{BOLD}✓ Done! Google will crawl and index these pages within hours.{RESET}")
    print(f"  Check Google Search Console → Coverage for indexing status.\n")
