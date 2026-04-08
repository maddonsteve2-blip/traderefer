"""
Sitemap crawler test — simulates what Google does when it fetches sitemaps.
Run: python test_sitemaps.py
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import time
import sys

SITEMAP_INDEX = "https://traderefer.au/sitemap.xml"
# Sub-sitemaps now served at traderefer.au/sitemaps/* (Vercel proxies to Railway)
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def fetch(url: str, timeout: int = 30) -> tuple[int, bytes, float]:
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TradeReferSitemapTest/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            elapsed = time.time() - t0
            return r.status, body, elapsed
    except urllib.error.HTTPError as e:
        return e.code, b"", time.time() - t0
    except Exception as e:
        print(f"  {RED}ERROR: {e}{RESET}")
        return 0, b"", time.time() - t0

def parse_locs(xml_bytes: bytes, tag: str) -> list[str]:
    try:
        root = ET.fromstring(xml_bytes)
        return [el.text.strip() for el in root.findall(f".//{{{NS['sm']['']}}}loc") if el.text]
    except ET.ParseError:
        # Try with namespace
        try:
            root = ET.fromstring(xml_bytes)
            locs = []
            for el in root.iter():
                if el.tag.endswith("}loc") and el.text:
                    locs.append(el.text.strip())
            return locs
        except Exception:
            return []

def status_badge(code: int) -> str:
    if code == 200:
        return f"{GREEN}[200 OK]{RESET}"
    elif code == 0:
        return f"{RED}[TIMEOUT/ERROR]{RESET}"
    else:
        return f"{RED}[{code}]{RESET}"

def bar(n: int, mx: int = 50) -> str:
    filled = int(n / max(mx, 1) * 40)
    return f"[{'█' * filled}{'░' * (40 - filled)}]"

print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}{CYAN}   TradeRefer Sitemap Crawler Simulation{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}\n")

# ── Step 1: Fetch sitemap index ──────────────────────────────────────────
print(f"{BOLD}Step 1 — Fetching sitemap index:{RESET}")
print(f"  URL: {SITEMAP_INDEX}")
status, body, elapsed = fetch(SITEMAP_INDEX)
print(f"  Status: {status_badge(status)}   Time: {elapsed:.2f}s   Size: {len(body):,} bytes")

if status != 200:
    print(f"\n{RED}✗ Sitemap index is not reachable. Aborting.{RESET}\n")
    sys.exit(1)

# Parse sub-sitemap URLs from the index
sub_urls: list[str] = []
try:
    root = ET.fromstring(body)
    for el in root.iter():
        if el.tag.endswith("}loc") and el.text:
            sub_urls.append(el.text.strip())
except ET.ParseError as e:
    print(f"  {RED}XML parse error: {e}{RESET}")
    sys.exit(1)

if not sub_urls:
    print(f"  {RED}No sub-sitemaps found in index.{RESET}")
    sys.exit(1)

print(f"\n  Found {BOLD}{len(sub_urls)}{RESET} sub-sitemaps in index:\n")
for u in sub_urls:
    print(f"    • {u}")

# ── Step 2: Fetch each sub-sitemap ───────────────────────────────────────
print(f"\n{BOLD}Step 2 — Fetching each sub-sitemap (simulating Googlebot):{RESET}\n")

results: list[dict] = []
total_urls = 0

for url in sub_urls:
    name = url.split("/")[-1] or url.split("/")[-2]
    print(f"  {CYAN}▶ {name}{RESET}")
    print(f"    {url}")

    status, body, elapsed = fetch(url, timeout=60)
    print(f"    Status: {status_badge(status)}   Time: {elapsed:.2f}s   Size: {len(body)/1024:.1f} KB")

    url_count = 0
    error_detail = None

    if status == 200:
        try:
            root = ET.fromstring(body)
            url_count = sum(1 for el in root.iter() if el.tag.endswith("}loc"))
            # Subtract 1 if the urlset itself has no loc — actually just count <url><loc> pairs
            # More accurate: count <url> elements
            url_count = sum(1 for el in root.iter() if el.tag.endswith("}url"))
            total_urls += url_count
            print(f"    URLs found: {BOLD}{url_count:,}{RESET}")

            # Spot-check first 3 URLs
            sample_locs = []
            for el in root.iter():
                if el.tag.endswith("}loc") and el.text:
                    sample_locs.append(el.text.strip())
                if len(sample_locs) >= 3:
                    break
            if sample_locs:
                print(f"    Sample URLs:")
                for loc in sample_locs:
                    print(f"      → {loc}")

            ok = True
        except ET.ParseError as e:
            error_detail = f"XML parse error: {e}"
            print(f"    {RED}{error_detail}{RESET}")
            ok = False
    else:
        ok = False

    results.append({
        "url": url,
        "name": name,
        "status": status,
        "elapsed": elapsed,
        "size_kb": len(body) / 1024,
        "url_count": url_count,
        "ok": ok,
        "error": error_detail,
    })
    print()

# ── Step 3: Summary ──────────────────────────────────────────────────────
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}")
print(f"{BOLD}Results Summary{RESET}")
print(f"{BOLD}{CYAN}══════════════════════════════════════════════════{RESET}\n")

passed = sum(1 for r in results if r["ok"])
failed = len(results) - passed

print(f"  {'Name':<20} {'Status':<16} {'Time':>8} {'Size':>10} {'URLs':>10}")
print(f"  {'-'*20} {'-'*16} {'-'*8} {'-'*10} {'-'*10}")
for r in results:
    badge = f"{GREEN}✓ 200{RESET}" if r["ok"] else f"{RED}✗ {r['status']}{RESET}"
    print(f"  {r['name']:<20} {badge:<25} {r['elapsed']:>6.2f}s {r['size_kb']:>8.1f}KB {r['url_count']:>10,}")

print(f"\n  Total URLs across all sitemaps: {BOLD}{total_urls:,}{RESET}")
print(f"  Passed: {GREEN}{passed}/{len(results)}{RESET}   Failed: {RED}{failed}{RESET}\n")

if failed == 0:
    print(f"{GREEN}{BOLD}✓ All sitemaps are healthy and reachable by Google.{RESET}\n")
else:
    print(f"{RED}{BOLD}✗ {failed} sitemap(s) failed — check errors above.{RESET}\n")
    sys.exit(1)
