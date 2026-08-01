"""Sample retail price ranges for materials via Bunnings search.

Fetches the search page per material with scrapling's stealth fetcher, parses
products out of __NEXT_DATA__, keeps title-relevant matches, and writes
low/median/high to samples.json for ingest-prices.mjs. Facts only (name +
price) — no descriptions or images are stored. Polite: one request per
material with a delay.

Usage:  python scripts/materials/sample_prices.py [--limit N] [--only slug,slug]
"""
import json
import re
import statistics
import sys
import time
from pathlib import Path

from scrapling.fetchers import StealthyFetcher

HERE = Path(__file__).parent
MATERIALS = json.loads((HERE / "materials.json").read_text(encoding="utf-8"))

STOPWORDS = {"per", "each", "with", "and", "kit", "pack", "the", "mm", "kg", "l", "m", "lm"}


def stem(word: str) -> str:
    # Trailing-s stemming so "paver" matches "Pavers" — keep in sync with
    # the JS matchers in ingest-products.mjs / refine-ranges.mjs.
    return word[:-1] if len(word) > 3 and word.endswith("s") else word


def tokens(text: str) -> set[str]:
    return {stem(t) for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2 and t not in STOPWORDS}


AREA_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:m²|m2|sqm|square met)", re.I)


def unit_price(material, title: str, price: float) -> float | None:
    """Per-m² materials are only comparable after pack normalisation: parse
    the pack area from the product title and divide. Products that state no
    area can't be compared, so they're dropped rather than guessed."""
    if material.get("unit") != "per m²":
        return price
    m = AREA_RE.search(title)
    if not m:
        return None
    area = float(m.group(1))
    if not (0.2 <= area <= 100):
        return None
    return price / area


def extract_products(html: str):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    data = json.loads(m.group(1))
    found = []

    def walk(node, depth=0):
        if depth > 14 or len(found) >= 40:
            return
        if isinstance(node, dict):
            if ("title" in node or "name" in node) and "price" in node:
                title = node.get("title") or node.get("name") or ""
                price = node.get("price")
                if isinstance(price, (int, float)) and price > 0:
                    found.append((str(title), float(price)))
                return
            for v in node.values():
                walk(v, depth + 1)
        elif isinstance(node, list):
            for v in node[:80]:
                walk(v, depth + 1)

    walk(data)
    return found


def sample(material) -> dict | None:
    query = material.get("query") or material["name"]
    url = "https://www.bunnings.com.au/search/products?q=" + query.replace(" ", "%20")
    page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
    if page.status != 200:
        print(f"  ! HTTP {page.status}")
        return None
    products = extract_products(page.html_content)
    want = tokens(material["name"] + " " + " ".join(material.get("aliases", [])))
    matched = []
    for t, p in products:
        if len(want & tokens(t)) < min(2, len(want)):
            continue
        up = unit_price(material, t, p)
        if up is not None:
            matched.append((t, up))
    if len(matched) < 2:
        print(f"  ! only {len(matched)} relevant of {len(products)} products — skipped")
        return None
    prices = sorted(p for _, p in matched)[:8]
    return {
        "slug": material["slug"],
        "retailer": "bunnings",
        "low": round(prices[0], 2),
        "typical": round(statistics.median(prices), 2),
        "high": round(prices[-1], 2),
        "sample_size": len(prices),
        "examples": [t for t, _ in matched[:3]],
    }


def main():
    args = sys.argv[1:]
    limit = int(args[args.index("--limit") + 1]) if "--limit" in args else None
    only = set(args[args.index("--only") + 1].split(",")) if "--only" in args else None

    todo = [m for m in MATERIALS if not only or m["slug"] in only]
    if limit:
        todo = todo[:limit]

    results = []
    for i, mat in enumerate(todo):
        print(f"[{i + 1}/{len(todo)}] {mat['slug']}")
        try:
            row = sample(mat)
            if row:
                print(f"  ${row['low']} / ${row['typical']} / ${row['high']} (n={row['sample_size']})")
                results.append(row)
        except Exception as e:  # noqa: BLE001 — keep sampling the rest
            print(f"  ! {e}")
        time.sleep(4)

    out = HERE / "samples.json"
    out.write_text(json.dumps(results, indent=1), encoding="utf-8")
    print(f"\nWrote {len(results)}/{len(todo)} samples to {out}")


if __name__ == "__main__":
    main()
