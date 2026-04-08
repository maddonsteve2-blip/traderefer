"""
Bulk IndexNow submission — push all 53,000+ traderefer.au URLs to Bing/Yandex.
Free. No rate limit for initial bulk submissions.

Run: python submit_indexnow.py

What this does:
1. Fetches all URLs from each sub-sitemap (via traderefer.au)
2. Submits them in batches of 10,000 to IndexNow API
3. IndexNow distributes to Bing, Yandex, and other participating engines
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import json
import time
import sys

SITEMAP_INDEX    = "https://traderefer.au/sitemap.xml"
INDEXNOW_API     = "https://api.indexnow.org/IndexNow"
INDEXNOW_HOST    = "traderefer.au"
INDEXNOW_KEY     = "0068d2eb419248bca5f302a93103550a"
INDEXNOW_KEY_URL = f"https://traderefer.au/{INDEXNOW_KEY}.txt"
BATCH_SIZE       = 10_000

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def fetch(url: str, timeout: int = 60) -> tuple[int, bytes]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TradeReferIndexNow/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:
        print(f"  {RED}Fetch error {url}: {e}{RESET}")
        return 0, b""

def parse_locs(xml_bytes: bytes) -> list[str]:
    locs = []
    try:
        root = ET.fromstring(xml_bytes)
        for el in root.iter():
            if el.tag.endswith("}loc") and el.text:
                locs.append(el.text.strip())
    except Exception as e:
        print(f"  {RED}XML parse error: {e}{RESET}")
    return locs

def submit_batch(urls: list[str]) -> bool:
    payload = json.dumps({
        "host": INDEXNOW_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": INDEXNOW_KEY_URL,
        "urlList": urls,
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            INDEXNOW_API,
            data=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            status = r.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception as e:
        print(f"  {RED}Submit error: {e}{RESET}")
        return False

    if status == 200:
        return True
    elif status == 202:
        return True  # Accepted — some engines return 202
    else:
        print(f"  {RED}IndexNow returned HTTP {status}{RESET}")
        return False

print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}{CYAN}   TradeRefer — IndexNow Bulk Submission{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}\n")

# ── Step 1: Verify key file is hosted ─────────────────────────────────────
key_url = f"https://traderefer.au/{INDEXNOW_KEY}.txt"
print(f"{BOLD}Step 1 — Verifying key file:{RESET} {key_url}")
kstatus, kbody = fetch(key_url, timeout=10)
if kstatus == 200 and INDEXNOW_KEY.encode() in kbody:
    print(f"  {GREEN}✓ Key file found and valid{RESET}\n")
else:
    print(f"  {RED}✗ Key file not found (HTTP {kstatus}). Deploy first, then re-run.{RESET}\n")
    sys.exit(1)

# ── Step 2: Collect all URLs from sitemaps ────────────────────────────────
print(f"{BOLD}Step 2 — Collecting URLs from sitemaps:{RESET}")
status, body = fetch(SITEMAP_INDEX)
if status != 200:
    print(f"  {RED}Could not fetch sitemap index (HTTP {status}){RESET}")
    sys.exit(1)

sub_sitemap_urls = parse_locs(body)
print(f"  Found {len(sub_sitemap_urls)} sub-sitemaps\n")

all_urls: list[str] = []
for sub_url in sub_sitemap_urls:
    name = sub_url.rstrip("/").split("/")[-1]
    print(f"  Fetching {name}...")
    st, bd = fetch(sub_url, timeout=60)
    if st == 200:
        locs = parse_locs(bd)
        # Filter: skip the sitemap URLs themselves, keep only content URLs
        content_locs = [u for u in locs if not u.startswith("https://traderefer-api-production")]
        all_urls.extend(content_locs)
        print(f"    {GREEN}+{len(content_locs):,} URLs{RESET}")
    else:
        print(f"    {RED}HTTP {st} — skipping{RESET}")

print(f"\n  {BOLD}Total URLs to submit: {len(all_urls):,}{RESET}\n")

# ── Step 3: Submit in batches of 10,000 ──────────────────────────────────
print(f"{BOLD}Step 3 — Submitting to IndexNow (api.indexnow.org):{RESET}\n")

total_batches = (len(all_urls) + BATCH_SIZE - 1) // BATCH_SIZE
submitted = 0
failed_batches = 0

for i in range(total_batches):
    batch = all_urls[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
    start = i * BATCH_SIZE + 1
    end   = start + len(batch) - 1
    print(f"  Batch {i+1}/{total_batches}  ({start:,}–{end:,} of {len(all_urls):,})  ", end="", flush=True)

    ok = submit_batch(batch)
    if ok:
        submitted += len(batch)
        print(f"{GREEN}✓ Accepted{RESET}")
    else:
        failed_batches += 1
        print(f"{RED}✗ Failed{RESET}")

    if i < total_batches - 1:
        time.sleep(1)  # polite delay between batches

# ── Summary ───────────────────────────────────────────────────────────────
print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}Results{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"  URLs submitted:   {GREEN}{submitted:,}{RESET}")
print(f"  Failed batches:   {RED if failed_batches else GREEN}{failed_batches}{RESET}")
print()

if failed_batches == 0:
    print(f"{GREEN}{BOLD}✓ All URLs submitted to IndexNow.{RESET}")
    print(f"  Bing and Yandex will now prioritise crawling these pages.")
    print(f"  Check Bing Webmaster Tools → IndexNow to see submission history.\n")
else:
    print(f"{YELLOW}⚠  Some batches failed. Re-run the script to retry.{RESET}\n")
    sys.exit(1)
