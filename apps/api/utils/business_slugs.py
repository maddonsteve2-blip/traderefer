import re
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


LEGACY_HASH_SUFFIX_RE = re.compile(r"^(?P<base>.+)-(?P<suffix>[a-z0-9]{5,8})$", re.IGNORECASE)
SLUGIFY_RE = re.compile(r"[^a-z0-9]+")


def slugify_value(value: str) -> str:
    return SLUGIFY_RE.sub("-", StringOrEmpty(value).lower()).strip("-")


def StringOrEmpty(value: Any) -> str:
    return str(value or "").strip()


def has_legacy_hash_suffix(slug: str) -> bool:
    slug = StringOrEmpty(slug).lower()
    match = LEGACY_HASH_SUFFIX_RE.match(slug)
    if not match:
        return False
    suffix = match.group("suffix")
    return any(char.isdigit() for char in suffix) or not any(char in "aeiou" for char in suffix)


def canonical_business_slug(slug: str) -> str:
    slug = slugify_value(slug)
    if has_legacy_hash_suffix(slug):
        return slug.rsplit("-", 1)[0]
    return slug


def canonical_business_slug_from_name(name: str) -> str:
    return canonical_business_slug(slugify_value(name))


def serialize_business_slug(slug: str) -> str:
    return canonical_business_slug(slug)


async def find_business_by_slug(
    db: AsyncSession,
    columns: str,
    slug: str,
    extra_where: str = "",
    extra_params: Optional[dict[str, Any]] = None,
):
    params = dict(extra_params or {})
    requested_slug = slugify_value(slug)
    canonical_slug = canonical_business_slug(requested_slug)
    params["requested_slug"] = requested_slug
    params["canonical_slug"] = canonical_slug
    params["legacy_pattern"] = f"{canonical_slug}-%"

    query = text(
        f"""
        SELECT {columns}
        FROM businesses
        WHERE (slug = :requested_slug OR slug = :canonical_slug OR slug LIKE :legacy_pattern)
        {extra_where}
        ORDER BY CASE
            WHEN slug = :requested_slug THEN 0
            WHEN slug = :canonical_slug THEN 1
            ELSE 2
        END, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        """
    )
    result = await db.execute(query, params)
    for row in result.mappings().all():
        row_slug = StringOrEmpty(row.get("slug"))
        if canonical_business_slug(row_slug) == canonical_slug:
            return row
    return None


async def business_slug_exists(
    db: AsyncSession,
    slug: str,
    exclude_id: Optional[str] = None,
) -> bool:
    params: dict[str, Any] = {
        "canonical_slug": canonical_business_slug(slug),
        "legacy_pattern": f"{canonical_business_slug(slug)}-%",
    }
    exclude_sql = ""
    if exclude_id:
        params["exclude_id"] = exclude_id
        exclude_sql = "AND id != :exclude_id"

    result = await db.execute(
        text(
            f"""
            SELECT id, slug
            FROM businesses
            WHERE (slug = :canonical_slug OR slug LIKE :legacy_pattern)
            {exclude_sql}
            """
        ),
        params,
    )
    for row in result.mappings().all():
        if canonical_business_slug(StringOrEmpty(row.get("slug"))) == params["canonical_slug"]:
            return True
    return False


async def generate_unique_business_slug(
    db: AsyncSession,
    business_name: str,
    suburb: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    trade_category: Optional[str] = None,
    exclude_id: Optional[str] = None,
) -> str:
    base = canonical_business_slug_from_name(business_name)
    suburb_slug = slugify_value(suburb or "")
    city_slug = slugify_value(city or "")
    state_slug = slugify_value(state or "")
    trade_slug = slugify_value(trade_category or "")

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
        candidate = canonical_business_slug(candidate)
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        if not await business_slug_exists(db, candidate, exclude_id=exclude_id):
            return candidate

    counter = 2
    while True:
        candidate = f"{base}-{counter}"
        if not await business_slug_exists(db, candidate, exclude_id=exclude_id):
            return candidate
        counter += 1
