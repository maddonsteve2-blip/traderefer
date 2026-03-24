import argparse
import os
from dataclasses import dataclass
from typing import Iterable

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

from utils.business_slugs import canonical_business_slug, canonical_business_slug_from_name, slugify_value


load_dotenv(".env.local")
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
BATCH_SIZE = 100
MAX_BATCH_RETRIES = 3
PLAN_PROGRESS_EVERY = 1000


def log(message: str):
    print(message, flush=True)


@dataclass
class BusinessRow:
    id: str
    business_name: str
    slug: str
    suburb: str | None
    city: str | None
    state: str | None
    trade_category: str | None
    created_at: object


def candidate_slugs(row: BusinessRow) -> Iterable[str]:
    base = canonical_business_slug_from_name(row.business_name)
    suburb_slug = slugify_value(row.suburb or "")
    city_slug = slugify_value(row.city or "")
    state_slug = slugify_value(row.state or "")
    trade_slug = slugify_value(row.trade_category or "")

    candidates = [base]
    if suburb_slug:
        candidates.append(f"{base}-{suburb_slug}")
    if suburb_slug and state_slug:
        candidates.append(f"{base}-{suburb_slug}-{state_slug}")
    if city_slug and city_slug != suburb_slug:
        candidates.append(f"{base}-{city_slug}")
    if city_slug and state_slug and city_slug != suburb_slug:
        candidates.append(f"{base}-{city_slug}-{state_slug}")
    if trade_slug:
        candidates.append(f"{base}-{trade_slug}")
    if suburb_slug and trade_slug:
        candidates.append(f"{base}-{suburb_slug}-{trade_slug}")

    seen: set[str] = set()
    for candidate in candidates:
        normalized = canonical_business_slug(candidate)
        if normalized and normalized not in seen:
            seen.add(normalized)
            yield normalized

    counter = 2
    while True:
        yield f"{base}-{counter}"
        counter += 1


def choose_slug(row: BusinessRow, reserved: set[str]) -> str:
    for candidate in candidate_slugs(row):
        if candidate not in reserved:
            reserved.add(candidate)
            return candidate
    raise RuntimeError(f"Failed to assign slug for business {row.id}")


def fetch_businesses(conn) -> list[BusinessRow]:
    log("Fetching businesses from database...")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, business_name, slug, suburb, city, state, trade_category, created_at
            FROM businesses
            ORDER BY
                CASE WHEN slug = regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g') THEN 0 ELSE 1 END,
                created_at ASC,
                id ASC
            """
        )
        rows = cur.fetchall()
    log(f"Fetched {len(rows)} businesses.")
    return [BusinessRow(**row) for row in rows]


def connect():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


def plan_updates(rows: list[BusinessRow]) -> list[tuple[str, str, str, str]]:
    log("Classifying current slugs...")
    clean_rows: list[BusinessRow] = []
    legacy_rows: list[BusinessRow] = []

    for index, row in enumerate(rows, start=1):
        if canonical_business_slug(row.slug) == row.slug:
            clean_rows.append(row)
        else:
            legacy_rows.append(row)
        if index % PLAN_PROGRESS_EVERY == 0 or index == len(rows):
            log(f"Classified {index}/{len(rows)} businesses...")

    ordered_rows = clean_rows + legacy_rows
    reserved: set[str] = set()
    updates: list[tuple[str, str, str, str]] = []

    log("Planning canonical slug assignments...")
    for index, row in enumerate(ordered_rows, start=1):
        next_slug = choose_slug(row, reserved)
        if row.slug != next_slug:
            updates.append((row.id, row.business_name, row.slug, next_slug))
        if index % PLAN_PROGRESS_EVERY == 0 or index == len(ordered_rows):
            log(f"Planned {index}/{len(ordered_rows)} businesses... updates so far: {len(updates)}")

    return updates


def temporary_slug(business_id: str) -> str:
    return f"tmp-business-slug-{business_id}"


def apply_batch(batch: list[tuple[str, str, str, str]], batch_number: int, total_batches: int, phase_label: str, slug_index: int):
    attempt = 0
    while True:
        conn = connect()
        try:
            attempt += 1
            if attempt == 1:
                log(f"Starting {phase_label} batch {batch_number}/{total_batches} ({len(batch)} updates)...")
            else:
                log(f"Retrying {phase_label} batch {batch_number}/{total_batches} (attempt {attempt}/{MAX_BATCH_RETRIES + 1})...")
            with conn.cursor() as cur:
                for update in batch:
                    business_id = update[0]
                    next_slug = update[slug_index]
                    cur.execute(
                        "UPDATE businesses SET slug = %s, updated_at = now() WHERE id = %s",
                        (next_slug, business_id),
                    )
            conn.commit()
            return
        except psycopg2.OperationalError as exc:
            if not conn.closed:
                conn.rollback()
            conn.close()
            if attempt > MAX_BATCH_RETRIES:
                raise RuntimeError(
                    f"{phase_label.title()} batch {batch_number}/{total_batches} failed after {MAX_BATCH_RETRIES + 1} attempts"
                ) from exc
            log(f"Connection lost during {phase_label} batch {batch_number}/{total_batches}: {exc}")
            continue
        except Exception:
            if not conn.closed:
                conn.rollback()
            raise
        finally:
            if not conn.closed:
                conn.close()


def apply_updates(updates: list[tuple[str, str, str, str]]):
    total_applied = 0
    staged_updates = [
        (business_id, business_name, old_slug, temporary_slug(business_id), new_slug)
        for business_id, business_name, old_slug, new_slug in updates
    ]
    total_batches = (len(staged_updates) + BATCH_SIZE - 1) // BATCH_SIZE if staged_updates else 0
    log(f"Applying {len(staged_updates)} updates in {total_batches} batches of up to {BATCH_SIZE}...")

    log("Phase 1/2: moving remaining businesses to temporary slugs...")
    for offset in range(0, len(staged_updates), BATCH_SIZE):
        batch = staged_updates[offset:offset + BATCH_SIZE]
        batch_number = offset // BATCH_SIZE + 1
        apply_batch(batch, batch_number, total_batches, "temporary-slug", 3)

    log("Phase 2/2: moving businesses from temporary slugs to final canonical slugs...")
    for offset in range(0, len(updates), BATCH_SIZE):
        batch = staged_updates[offset:offset + BATCH_SIZE]
        batch_number = offset // BATCH_SIZE + 1
        apply_batch(batch, batch_number, total_batches, "finalize", 4)
        total_applied += len(batch)
        log(f"Applied final batch {batch_number}/{total_batches}: {len(batch)} updates ({total_applied}/{len(staged_updates)})")

    return total_applied


def main():
    parser = argparse.ArgumentParser(description="Backfill business slugs to canonical clean values.")
    parser.add_argument("--apply", action="store_true", help="Apply updates instead of running in dry-run mode")
    parser.add_argument("--limit", type=int, default=50, help="How many planned changes to print")
    args = parser.parse_args()

    if not DATABASE_URL:
        raise SystemExit("DATABASE_URL not found in environment variables")

    conn = connect()

    try:
        log("Starting business slug migration...")
        rows = fetch_businesses(conn)
        updates = plan_updates(rows)

        log(f"Businesses scanned: {len(rows)}")
        log(f"Slug updates planned: {len(updates)}")
        log("")

        for business_id, business_name, old_slug, new_slug in updates[: max(0, args.limit)]:
            log(f"{business_name} [{business_id}]")
            log(f"  {old_slug} -> {new_slug}")

        if len(updates) > args.limit:
            log("")
            log(f"... {len(updates) - args.limit} more changes not shown")

        if not args.apply:
            conn.rollback()
            log("")
            log("Dry run only. Re-run with --apply to update the database.")
            return

        conn.close()
        applied = apply_updates(updates)
        log("")
        log(f"Applied {applied} slug updates.")
    except Exception:
        if not conn.closed:
            conn.rollback()
        raise
    finally:
        if not conn.closed:
            conn.close()


if __name__ == "__main__":
    main()
