#!/usr/bin/env python3
"""
Extract trade/suburb data from constants.ts and the Neon DB,
then generate a content-generation spec .md file for Claude to work from.
"""

import re
import os
import json
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Try multiple .env locations
for env_file in [
    ROOT / "apps" / "web" / ".env.local",
    ROOT / "apps" / "web" / ".env.production",
    ROOT / "apps" / "web" / ".env",
    ROOT / ".env",
]:
    if env_file.exists():
        load_dotenv(env_file)
        break

CONSTANTS_PATH = ROOT / "apps" / "web" / "lib" / "constants.ts"

def extract_section(text, const_name):
    """Extract the section of text for a given exported constant."""
    # Find the start of this constant
    pattern = f"export const {const_name}"
    idx = text.find(pattern)
    if idx == -1:
        return ""
    # Find the next 'export const' or end of file
    next_export = text.find("\nexport const ", idx + len(pattern))
    if next_export == -1:
        return text[idx:]
    return text[idx:next_export]

def parse_constants():
    """Parse constants.ts to extract existing trade/suburb data."""
    c = CONSTANTS_PATH.read_text(encoding="utf-8")

    # --- TRADE_COST_GUIDE keys ---
    cost_section = extract_section(c, "TRADE_COST_GUIDE")
    cost_trades = re.findall(r'^\s+"([^"]+)":\s*\{', cost_section, re.M)

    # --- TRADE_FAQ_BANK keys ---
    faq_section = extract_section(c, "TRADE_FAQ_BANK")
    faq_trades = re.findall(r'^\s+"([^"]+)":\s*\[', faq_section, re.M)

    # --- STATE_LICENSING keys ---
    lic_section = extract_section(c, "STATE_LICENSING")
    lic_trades = re.findall(r'^\s+"([^"]+)":\s*\{', lic_section, re.M)

    # --- SUBURB_CONTEXT keys ---
    sub_section = extract_section(c, "SUBURB_CONTEXT")
    existing_suburbs = re.findall(r'^\s+"([a-z][-a-z]*)"\s*:\s*\{', sub_section, re.M)

    # --- JOB_TYPES keys ---
    job_section = extract_section(c, "JOB_TYPES")
    job_trades = re.findall(r'^\s+"([^"]+)":\s*\[', job_section, re.M)

    return {
        "cost_trades": cost_trades,
        "faq_trades": faq_trades,
        "lic_trades": lic_trades,
        "existing_suburbs": existing_suburbs,
        "job_trades": job_trades,
    }

def query_db():
    """Get actual trade+suburb combos and counts from the DB."""
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not db_url:
        print("WARNING: No DATABASE_URL found, skipping DB queries")
        return None

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Unique suburbs with state/city
    cur.execute("""
        SELECT DISTINCT
            LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug,
            suburb,
            city,
            LOWER(state) as state,
            COUNT(*) as biz_count
        FROM businesses
        WHERE status = 'active'
          AND suburb IS NOT NULL AND suburb != ''
          AND city IS NOT NULL AND city != ''
          AND state IS NOT NULL AND state != ''
        GROUP BY suburb_slug, suburb, city, state
        ORDER BY biz_count DESC
    """)
    suburbs = cur.fetchall()

    # Unique trade categories with counts
    cur.execute("""
        SELECT trade_category, COUNT(*) as cnt
        FROM businesses
        WHERE status = 'active'
          AND trade_category IS NOT NULL AND trade_category != ''
        GROUP BY trade_category
        ORDER BY cnt DESC
    """)
    db_trades = cur.fetchall()

    # Top trade+suburb combos by count
    cur.execute("""
        SELECT trade_category, suburb, city, LOWER(state) as state, COUNT(*) as cnt
        FROM businesses
        WHERE status = 'active'
          AND trade_category IS NOT NULL
          AND suburb IS NOT NULL AND suburb != ''
        GROUP BY trade_category, suburb, city, state
        HAVING COUNT(*) >= 2
        ORDER BY cnt DESC
        LIMIT 200
    """)
    top_combos = cur.fetchall()

    cur.close()
    conn.close()

    return {
        "suburbs": suburbs,
        "db_trades": db_trades,
        "top_combos": top_combos,
    }

def generate_spec(parsed, db_data):
    """Generate the .md spec file."""

    # Trades that NEED FAQs (have cost guide but no FAQs)
    trades_needing_faqs = [t for t in parsed["cost_trades"] if t not in parsed["faq_trades"]]

    # Suburbs that NEED context (in DB but not in SUBURB_CONTEXT)
    if db_data:
        all_db_suburbs = [(r[0], r[1], r[2], r[3], r[4]) for r in db_data["suburbs"]]
        suburbs_needing_context = [
            s for s in all_db_suburbs if s[0] not in parsed["existing_suburbs"]
        ]
        # Top 150 by business count
        suburbs_needing_context = suburbs_needing_context[:150]
    else:
        suburbs_needing_context = []

    md = []
    md.append("# TradeRefer Content Generation Spec\n")
    md.append("## Purpose\n")
    md.append("Generate unique, factual SEO content for TradeRefer.au programmatic pages.")
    md.append("This content will be inserted into the TypeScript constants file at `apps/web/lib/constants.ts`.")
    md.append("All content must be **factually accurate for Australia**, not generic filler.\n")

    # ─── TASK 1: SUBURB_CONTEXT ───
    md.append("---\n## TASK 1: SUBURB_CONTEXT Expansion\n")
    md.append("Generate suburb context objects for the suburbs listed below.")
    md.append("Each entry populates a callout on the trade page providing genuinely useful local context.\n")
    md.append("### Required TypeScript Format\n")
    md.append("```typescript")
    md.append('"suburb-slug": {')
    md.append('    housing: "description of typical housing stock and era",')
    md.append('    climate: "local climate conditions relevant to trade work",')
    md.append('    council: "local council name",')
    md.append('    region: "region/area name",')
    md.append('    tradeNotes: {')
    md.append('        "Trade Category": "1-2 sentence note specific to THIS trade in THIS suburb. Must reference real local conditions.",')
    md.append("    },")
    md.append("},")
    md.append("```\n")
    md.append("### Rules")
    md.append("- `housing`: Mention the **era** (e.g. 1960s–1980s) and **type** (brick veneer, weatherboard, terrace, etc)")
    md.append("- `climate`: Must be **locally accurate** — coastal salt air, western plains heat, tropical humidity, etc")
    md.append("- `council`: The **actual local council name** (e.g. 'City of Parramatta', 'Brisbane City Council')")
    md.append("- `region`: Geographic region (e.g. 'Inner West Sydney', 'Gold Coast Hinterland')")
    md.append("- `tradeNotes`: Only include trades where there's a **genuinely local factor** (soil type, heritage, climate, etc). 2-4 trades per suburb is ideal. Don't force notes for trades where there's nothing suburb-specific to say.\n")

    md.append("### Suburbs Needing Context (sorted by business count)\n")
    md.append("| Slug | Suburb | City | State | Businesses |")
    md.append("|------|--------|------|-------|-----------|")
    for s in suburbs_needing_context:
        md.append(f"| {s[0]} | {s[1]} | {s[2]} | {s[3].upper()} | {s[4]} |")

    md.append(f"\n**Total: {len(suburbs_needing_context)} suburbs need context** (currently only {len(parsed['existing_suburbs'])} have it)\n")

    # ─── TASK 2: TRADE_FAQ_BANK ───
    md.append("---\n## TASK 2: TRADE_FAQ_BANK Expansion\n")
    md.append("Generate 6-8 FAQs per trade for the trades listed below.")
    md.append("These appear on every trade+suburb page with FAQ schema markup (rich snippets in Google).\n")
    md.append("### Required TypeScript Format\n")
    md.append("```typescript")
    md.append('"Trade Category": [')
    md.append('    { q: "Question text?", a: "Detailed answer 2-4 sentences. Must be factually accurate for Australia." },')
    md.append("],")
    md.append("```\n")
    md.append("### Rules")
    md.append("- Questions must be **what real Australians search for** (think Google autocomplete)")
    md.append("- Answers must reference **Australian standards, laws, and pricing** (not US/UK)")
    md.append("- Include specific numbers: costs in AUD, timeframes, legal thresholds")
    md.append("- Reference state-specific rules where applicable (e.g. 'In QLD...')")
    md.append("- Each FAQ should be **genuinely different** — avoid repetitive pricing questions\n")

    md.append("### Existing FAQ Trades (already done, skip these)")
    for t in parsed["faq_trades"]:
        md.append(f"- ✅ {t}")

    md.append(f"\n### Trades Needing FAQs ({len(trades_needing_faqs)} trades)\n")
    for t in trades_needing_faqs:
        md.append(f"- {t}")

    # ─── TASK 3: HOW_TO_CHOOSE (trade-specific) ───
    md.append("\n---\n## TASK 3: TRADE_HIRING_TIPS (New Constant)\n")
    md.append("Generate 6 hiring tips per trade. Currently the 'How to Choose' section is **identical on every page**.")
    md.append("We need trade-specific hiring advice.\n")
    md.append("### Required TypeScript Format\n")
    md.append("```typescript")
    md.append('export const TRADE_HIRING_TIPS: Record<string, Array<{ title: string; body: string }>> = {')
    md.append('    "Plumbing": [')
    md.append('        { title: "Check Their Licence Class", body: "In Australia, plumbers must hold a licence appropriate to the work type..." },')
    md.append('        { title: "Ask About Warranty on Parts", body: "..." },')
    md.append("    ],")
    md.append("};")
    md.append("```\n")
    md.append("### Rules")
    md.append("- 6 tips per trade")
    md.append("- `title`: Short imperative (5-8 words)")
    md.append("- `body`: 1-2 sentences, Australian-specific, practical")
    md.append("- Must be **different for each trade** — a roofer tip is not a painter tip")
    md.append("- Reference real Australian licensing bodies, standards (AS/NZS), or consumer protection where relevant\n")

    md.append("### Generate for these trades:\n")
    top_trades = parsed["cost_trades"][:30]  # Top 30 most important
    for t in top_trades:
        md.append(f"- {t}")

    # ─── EXISTING DATA REFERENCE ───
    md.append("\n---\n## Reference: Existing SUBURB_CONTEXT (don't regenerate these)\n")
    for s in parsed["existing_suburbs"]:
        md.append(f"- {s}")

    md.append("\n## Reference: All Trade Categories in TRADE_COST_GUIDE\n")
    for i, t in enumerate(parsed["cost_trades"], 1):
        md.append(f"{i}. {t}")

    if db_data:
        md.append("\n## Reference: Top Trade+Suburb Combos by Business Count\n")
        md.append("| Trade | Suburb | City | State | Count |")
        md.append("|-------|--------|------|-------|-------|")
        for r in db_data["top_combos"][:50]:
            md.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3].upper()} | {r[4]} |")

    # ─── OUTPUT FORMAT ───
    md.append("\n---\n## Output Format\n")
    md.append("Please output **valid TypeScript** that can be directly pasted into `constants.ts`.")
    md.append("Split into 3 clearly labelled sections:\n")
    md.append("1. **SUBURB_CONTEXT additions** — new entries to add to the existing object")
    md.append("2. **TRADE_FAQ_BANK additions** — new entries to add to the existing object")
    md.append("3. **TRADE_HIRING_TIPS** — complete new exported constant\n")
    md.append("Do NOT regenerate existing entries. Only output NEW content to add.")

    return "\n".join(md)


if __name__ == "__main__":
    print("Parsing constants.ts...")
    parsed = parse_constants()
    print(f"  TRADE_COST_GUIDE: {len(parsed['cost_trades'])} trades")
    print(f"  TRADE_FAQ_BANK: {len(parsed['faq_trades'])} trades")
    print(f"  STATE_LICENSING: {len(parsed['lic_trades'])} trades")
    print(f"  SUBURB_CONTEXT: {len(parsed['existing_suburbs'])} suburbs")
    print(f"  JOB_TYPES: {len(parsed['job_trades'])} trades")

    print("\nQuerying database...")
    db_data = query_db()
    if db_data:
        print(f"  Unique suburbs: {len(db_data['suburbs'])}")
        print(f"  Trade categories: {len(db_data['db_trades'])}")
        print(f"  Top combos (>=2 biz): {len(db_data['top_combos'])}")

    print("\nGenerating spec...")
    spec = generate_spec(parsed, db_data)

    out_path = ROOT / "CONTENT_GENERATION_SPEC.md"
    out_path.write_text(spec, encoding="utf-8")
    print(f"\n✅ Written to {out_path}")
    print(f"   File size: {len(spec):,} chars")
