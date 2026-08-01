"""Crawl Bunnings category listing pages into retail-products.jsonl.

Reads categories.xml, keeps LEAF categories in the requested departments,
paginates each listing page, and extracts {sku, name, brand, price, category}
from __NEXT_DATA__ — facts only. Fast HTTP fetch first, stealth browser as
fallback. Polite: ~2.5s between requests. Resumable: already-crawled category
URLs are recorded in crawl-state.json and skipped on re-run.

Usage:
  python scripts/materials/crawl_catalog.py --depts building-hardware,paint-decorating --limit 25
  python scripts/materials/crawl_catalog.py --depts core        # the 8 trade departments
  python scripts/materials/crawl_catalog.py --all
"""
import json
import re
import sys
import time
from pathlib import Path

from scrapling.fetchers import Fetcher, StealthyFetcher

HERE = Path(__file__).parent
OUT = HERE / "retail-products.jsonl"
STATE = HERE / "crawl-state.json"

CORE_DEPTS = [
    "building-hardware", "bathroom-plumbing", "electrical-smart-home",
    "paint-decorating", "flooring-tiles", "garden", "kitchen", "lighting",
]


def get_categories() -> list[str]:
    page = Fetcher.get("https://www.bunnings.com.au/categories.xml")
    locs = re.findall(r"<loc>(https://www\.bunnings\.com\.au/products/[^<]+)</loc>", page.html_content)
    # leaf-only: drop any category that is a prefix of a deeper one
    locs = sorted(set(locs))
    return [u for u in locs if not any(v != u and v.startswith(u + "/") for v in locs)]


def extract_products(html: str):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError:
        return []
    found = []

    def walk(node, depth=0):
        if depth > 16 or len(found) >= 120:
            return
        if isinstance(node, dict):
            if ("title" in node or "name" in node) and "price" in node and "itemnumber" in node:
                title = node.get("title") or node.get("name") or ""
                price = node.get("price")
                if isinstance(price, (int, float)) and price > 0:
                    found.append({
                        "sku": str(node["itemnumber"]),
                        "name": str(title),
                        "brand": str(node.get("brand") or "") or None,
                        "price": round(float(price), 2),
                    })
                return
            for v in node.values():
                walk(v, depth + 1)
        elif isinstance(node, list):
            for v in node[:150]:
                walk(v, depth + 1)

    walk(data)
    # dedupe by sku within the page
    seen, out = set(), []
    for p in found:
        if p["sku"] not in seen:
            seen.add(p["sku"])
            out.append(p)
    return out


def fetch_page(url: str):
    try:
        page = Fetcher.get(url)
        if page.status == 200:
            products = extract_products(page.html_content)
            if products:
                return products
    except Exception:
        pass
    try:
        page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
        if page.status == 200:
            return extract_products(page.html_content)
    except Exception:
        pass
    return []


def main():
    args = sys.argv[1:]
    max_pages = int(args[args.index("--max-pages") + 1]) if "--max-pages" in args else 5
    limit = int(args[args.index("--limit") + 1]) if "--limit" in args else None
    if "--all" in args:
        depts = None
    else:
        raw = args[args.index("--depts") + 1] if "--depts" in args else "core"
        depts = CORE_DEPTS if raw == "core" else raw.split(",")

    state = json.loads(STATE.read_text()) if STATE.exists() else {"done": []}
    done = set(state["done"])

    cats = get_categories()
    if depts is not None:
        cats = [c for c in cats if c.split("/products/")[1].split("/")[0] in depts]
    todo = [c for c in cats if c not in done]
    if limit:
        todo = todo[:limit]
    print(f"{len(cats)} leaf categories in scope, {len(todo)} to crawl this run")

    total = 0
    with OUT.open("a", encoding="utf-8") as out:
        for i, cat in enumerate(todo):
            cat_path = cat.split("/products/")[1]
            cat_products = []
            for page_no in range(1, max_pages + 1):
                url = cat if page_no == 1 else f"{cat}?page={page_no}"
                products = fetch_page(url)
                new = [p for p in products if p["sku"] not in {c["sku"] for c in cat_products}]
                cat_products.extend(new)
                if len(new) < 10:  # short page → last page
                    break
                time.sleep(2.5)
            for p in cat_products:
                p["category"] = cat_path
                out.write(json.dumps(p, ensure_ascii=False) + "\n")
            out.flush()
            total += len(cat_products)
            done.add(cat)
            STATE.write_text(json.dumps({"done": sorted(done)}))
            print(f"[{i + 1}/{len(todo)}] {cat_path}: {len(cat_products)} products (total {total})")
            time.sleep(2.5)

    print(f"\nDone: {total} products appended to {OUT.name}")


if __name__ == "__main__":
    main()
