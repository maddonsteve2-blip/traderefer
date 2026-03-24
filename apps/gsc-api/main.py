"""
GSC API for OpenClaw - Railway Deployment
Provides Google Search Console data analysis endpoints
"""

from datetime import datetime, timedelta, timezone
from threading import Lock
from base64 import b64encode
from fastapi import Body, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from pathlib import Path
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

load_dotenv()

app = FastAPI(title="TradeRefer GSC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "latest.json"
ROOT_DIR = Path(__file__).resolve().parent
TOKEN_FILE = ROOT_DIR / "gsc_token.json"
CLIENT_SECRET_FILE = ROOT_DIR / "client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json"
DEFAULT_SITE_URL = os.getenv("GSC_SITE_URL", "sc-domain:traderefer.au")
DEFAULT_SITE_URL_ALT = os.getenv("GSC_SITE_URL_ALT", "https://traderefer.au/")
STALE_AFTER_HOURS = int(os.getenv("GSC_STALE_AFTER_HOURS", "24"))
AUTO_REFRESH_ON_STALE = os.getenv("GSC_AUTO_REFRESH_ON_STALE", "false").strip().lower() in {"1", "true", "yes", "on"}
REFRESH_SECRET = os.getenv("GSC_REFRESH_SECRET", "").strip()
REFRESH_LOCK = Lock()
DATAFORSEO_BASE_URL = os.getenv("DATAFORSEO_BASE_URL", "https://api.dataforseo.com/v3").rstrip("/")
DATAFORSEO_LOGIN = os.getenv("DATAFORSEO_LOGIN", "").strip()
DATAFORSEO_PASSWORD = os.getenv("DATAFORSEO_PASSWORD", "").strip()
DATAFORSEO_LOCATION_CODE = int(os.getenv("DATAFORSEO_LOCATION_CODE", "2036"))
DATAFORSEO_LANGUAGE_CODE = os.getenv("DATAFORSEO_LANGUAGE_CODE", "en").strip() or "en"
DATAFORSEO_KEYWORD_GAP_TARGET = os.getenv("DATAFORSEO_KEYWORD_GAP_TARGET", "airtasker.com").strip() or "airtasker.com"
DATAFORSEO_KEYWORD_GAP_EXCLUDE = os.getenv("DATAFORSEO_KEYWORD_GAP_EXCLUDE", "traderefer.au").strip() or "traderefer.au"
DATAFORSEO_BACKLINK_TARGETS = [
    value.strip()
    for value in os.getenv("DATAFORSEO_BACKLINK_TARGETS", "airtasker.com,hipages.com.au").split(",")
    if value.strip()
]
DATAFORSEO_BACKLINK_EXCLUDE = os.getenv("DATAFORSEO_BACKLINK_EXCLUDE", "traderefer.au").strip() or "traderefer.au"
KEYWORDS_VOLUME_FILE = DATA_DIR / "keywords_volume.json"
KEYWORD_GAP_FILE = DATA_DIR / "keyword_gap.json"
BACKLINK_GAP_FILE = DATA_DIR / "backlink_gap.json"
SERP_RANKINGS_FILE = DATA_DIR / "serp_rankings.json"
EXISTING_PAGES_FILE = DATA_DIR / "existing_pages.json"
API_LOG_FILE = DATA_DIR / "api_log.json"
DATAFORSEO_LOCK = Lock()
DATAFORSEO_TTLS = {
    "keywords_volume": timedelta(days=30),
    "keyword_gap": timedelta(days=7),
    "backlink_gap": timedelta(days=7),
    "serp_rankings": timedelta(days=1),
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso_datetime(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def read_json_file(path: Path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json_atomic(path: Path, payload: dict[str, Any]):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    temp_path.replace(path)


def load_json_from_env_or_file(env_names: list[str], file_path: Path | None = None):
    for env_name in env_names:
        raw = os.getenv(env_name, "").strip()
        if raw:
            return json.loads(raw)
    if file_path and file_path.exists():
        return read_json_file(file_path)
    return None


def dataforseo_is_configured():
    return bool(DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD)


def build_dataforseo_auth_header():
    if not dataforseo_is_configured():
        raise HTTPException(status_code=503, detail="DataForSEO is not configured. Provide DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.")
    encoded = b64encode(f"{DATAFORSEO_LOGIN}:{DATAFORSEO_PASSWORD}".encode("utf-8")).decode("utf-8")
    return {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}


def read_json_file_or_default(path: Path, default: Any):
    if not path.exists():
        return default
    try:
        return read_json_file(path)
    except json.JSONDecodeError:
        return default


def parse_payload_timestamp(payload: dict[str, Any] | None):
    if not isinstance(payload, dict):
        return None
    for key in ("updatedAt", "pulledAt", "generatedAt"):
        parsed = parse_iso_datetime(payload.get(key))
        if parsed:
            return parsed
    return None


def build_cache_freshness(path: Path, ttl: timedelta, payload: dict[str, Any] | None = None):
    updated_at = parse_payload_timestamp(payload)
    if updated_at is None and path.exists():
        updated_at = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    if updated_at is None:
        return {
            "cacheFile": str(path),
            "updatedAt": None,
            "ttlHours": round(ttl.total_seconds() / 3600, 2),
            "ageHours": None,
            "isStale": True,
            "exists": path.exists(),
        }

    age = utc_now() - updated_at
    age_hours = round(age.total_seconds() / 3600, 2)
    return {
        "cacheFile": str(path),
        "updatedAt": updated_at.isoformat(),
        "ttlHours": round(ttl.total_seconds() / 3600, 2),
        "ageHours": age_hours,
        "isStale": age > ttl,
        "exists": True,
    }


def read_cache_payload(path: Path):
    return read_json_file_or_default(path, {})


def write_dataforseo_cache(path: Path, payload: dict[str, Any]):
    cache_payload = {
        **payload,
        "updatedAt": utc_now().isoformat(),
    }
    write_json_atomic(path, cache_payload)
    return cache_payload


def cache_is_fresh(path: Path, ttl: timedelta):
    payload = read_cache_payload(path)
    freshness = build_cache_freshness(path, ttl, payload)
    return payload, not freshness["isStale"] and freshness["exists"], freshness


def append_api_log(entry: dict[str, Any]):
    with DATAFORSEO_LOCK:
        existing = read_json_file_or_default(API_LOG_FILE, [])
        if not isinstance(existing, list):
            existing = []
        existing.append(entry)
        write_json_atomic(API_LOG_FILE, existing)


def normalise_keyword(keyword: str):
    return " ".join(keyword.strip().lower().split())


def normalise_page_path(value: str):
    if not value:
        return ""
    trimmed = value.strip()
    if "://" in trimmed:
        try:
            after_host = trimmed.split("://", 1)[1]
            return "/" + after_host.split("/", 1)[1].strip("/") if "/" in after_host else "/"
        except IndexError:
            return "/"
    return trimmed if trimmed.startswith("/") else f"/{trimmed}"


def extract_dataforseo_result(payload: dict[str, Any]):
    tasks = payload.get("tasks") or []
    if not tasks:
        raise HTTPException(status_code=502, detail="DataForSEO returned no tasks")
    task = tasks[0]
    status_code = task.get("status_code", payload.get("status_code", 50000))
    if status_code != 20000:
        raise HTTPException(status_code=502, detail=task.get("status_message") or payload.get("status_message") or "DataForSEO request failed")
    results = task.get("result") or []
    return task, results


def extract_first_dataforseo_result(results: Any):
    if isinstance(results, list):
        first = results[0] if results else {}
        return first if isinstance(first, dict) else {}
    if isinstance(results, dict):
        return results
    return {}


def extract_dataforseo_cost(payload: dict[str, Any], task: dict[str, Any] | None = None):
    if task and task.get("cost") is not None:
        return task.get("cost")
    return payload.get("cost", 0)


async def call_dataforseo(method: str, endpoint: str, data: Any = None):
    headers = build_dataforseo_auth_header()
    url = f"{DATAFORSEO_BASE_URL}{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.request(method=method, url=url, headers=headers, json=data)
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=f"DataForSEO HTTP error: {detail}")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach DataForSEO: {str(exc)}")

    task = None
    try:
        tasks = payload.get("tasks") or []
        task = tasks[0] if tasks else None
    except AttributeError:
        task = None

    append_api_log({
        "timestamp": utc_now().isoformat(),
        "endpoint": endpoint,
        "method": method,
        "cost": extract_dataforseo_cost(payload, task),
        "status_code": task.get("status_code") if task else payload.get("status_code"),
    })
    return payload


def refresh_is_configured():
    token_data = load_json_from_env_or_file(["GSC_TOKEN_JSON", "GSC_TOKEN"], TOKEN_FILE)
    client_secret_data = load_json_from_env_or_file(["GSC_CLIENT_SECRET_JSON", "GOOGLE_CLIENT_SECRET_JSON"], CLIENT_SECRET_FILE)
    return bool(token_data and client_secret_data)


def require_refresh_secret(x_refresh_secret: str | None = None):
    if REFRESH_SECRET and x_refresh_secret != REFRESH_SECRET:
        raise HTTPException(status_code=401, detail="Invalid refresh secret")


def load_cached_gsc_data():
    try:
        return read_json_file(DATA_FILE)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"GSC data file not found at {DATA_FILE}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in data file: {str(exc)}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error loading GSC data: {str(exc)}")


def build_freshness(data: dict[str, Any]):
    pulled_at = parse_iso_datetime(data.get("pulledAt"))
    if not pulled_at:
        return {
            "pulledAt": data.get("pulledAt"),
            "staleAfterHours": STALE_AFTER_HOURS,
            "ageHours": None,
            "isStale": True,
            "reason": "missing_or_invalid_pulled_at",
        }

    age = utc_now() - pulled_at
    age_hours = round(age.total_seconds() / 3600, 2)
    is_stale = age > timedelta(hours=STALE_AFTER_HOURS)
    return {
        "pulledAt": pulled_at.isoformat(),
        "staleAfterHours": STALE_AFTER_HOURS,
        "ageHours": age_hours,
        "isStale": is_stale,
        "reason": "fresh" if not is_stale else "stale_threshold_exceeded",
    }


def enrich_with_service_meta(data: dict[str, Any]):
    return {
        "data": data,
        "freshness": build_freshness(data),
        "refreshAvailable": refresh_is_configured(),
        "cacheFile": str(DATA_FILE),
        "autoRefreshOnStale": AUTO_REFRESH_ON_STALE,
    }


def build_search_console_client():
    token_data = load_json_from_env_or_file(["GSC_TOKEN_JSON", "GSC_TOKEN"], TOKEN_FILE)
    client_secret_data = load_json_from_env_or_file(["GSC_CLIENT_SECRET_JSON", "GOOGLE_CLIENT_SECRET_JSON"], CLIENT_SECRET_FILE)

    if not token_data or not client_secret_data:
        raise HTTPException(status_code=503, detail="GSC refresh is not configured. Provide token and client secret JSON via env vars or files.")

    client_config = client_secret_data.get("web") or client_secret_data.get("installed") or client_secret_data
    client_id = client_config.get("client_id")
    client_secret = client_config.get("client_secret")
    refresh_token = token_data.get("refresh_token")

    if not client_id or not client_secret or not refresh_token:
        raise HTTPException(status_code=503, detail="GSC credentials are incomplete. client_id, client_secret, and refresh_token are required.")

    credentials = Credentials(
        token=token_data.get("access_token"),
        refresh_token=refresh_token,
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )
    if not credentials.valid:
        credentials.refresh(Request())

    return build("searchconsole", "v1", credentials=credentials, cache_discovery=False)


def detect_site_url(searchconsole):
    sites = searchconsole.sites().list().execute()
    site_list = sites.get("siteEntry", [])
    available = [site.get("siteUrl") for site in site_list if site.get("siteUrl")]

    if DEFAULT_SITE_URL in available:
        return DEFAULT_SITE_URL
    if DEFAULT_SITE_URL_ALT in available:
        return DEFAULT_SITE_URL_ALT

    for site_url in available:
        if "traderefer" in site_url:
            return site_url

    raise HTTPException(status_code=503, detail=f"TradeRefer property not found in GSC. Available sites: {available}")


def run_search_analytics_query(
    searchconsole,
    site_url: str,
    start_date: str,
    end_date: str,
    dimensions: list[str],
    row_limit: int = 1000,
    filters: list[dict[str, Any]] | None = None,
 ):
    body: dict[str, Any] = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": dimensions,
        "rowLimit": row_limit,
        "dataState": "all",
    }
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return searchconsole.searchanalytics().query(siteUrl=site_url, body=body).execute()


def map_rows(rows: list[dict[str, Any]] | None, key_name: str):
    return [
        {
            key_name: row.get("keys", [None])[0],
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": row.get("ctr", 0),
            "position": row.get("position", 0),
        }
        for row in (rows or [])
    ]


def pull_performance_data(searchconsole, site_url: str, start_date: str, end_date: str):
    queries = run_search_analytics_query(searchconsole, site_url, start_date, end_date, ["query"])
    pages = run_search_analytics_query(searchconsole, site_url, start_date, end_date, ["page"])
    devices = run_search_analytics_query(searchconsole, site_url, start_date, end_date, ["device"], row_limit=100)
    countries = run_search_analytics_query(searchconsole, site_url, start_date, end_date, ["country"], row_limit=25)
    date_trend = run_search_analytics_query(searchconsole, site_url, start_date, end_date, ["date"], row_limit=120)

    queries_by_page = []
    for page_row in (pages.get("rows") or [])[:25]:
        page_url = page_row.get("keys", [None])[0]
        if not page_url:
            continue
        result = run_search_analytics_query(
            searchconsole,
            site_url,
            start_date,
            end_date,
            ["query"],
            row_limit=50,
            filters=[{"dimension": "page", "expression": page_url}],
        )
        queries_by_page.append({
            "page": page_url,
            "clicks": page_row.get("clicks", 0),
            "impressions": page_row.get("impressions", 0),
            "ctr": page_row.get("ctr", 0),
            "position": page_row.get("position", 0),
            "queries": map_rows(result.get("rows"), "query"),
        })

    return {
        "queries": map_rows(queries.get("rows"), "query"),
        "pages": map_rows(pages.get("rows"), "page"),
        "queriesByPage": queries_by_page,
        "devices": map_rows(devices.get("rows"), "device"),
        "countries": map_rows(countries.get("rows"), "country"),
        "dateTrend": map_rows(date_trend.get("rows"), "date"),
    }


def pull_indexing_data(searchconsole, site_url: str):
    try:
        response = searchconsole.sitemaps().list(siteUrl=site_url).execute()
        return [
            {
                "path": sitemap.get("path"),
                "lastSubmitted": sitemap.get("lastSubmitted"),
                "lastDownloaded": sitemap.get("lastDownloaded"),
                "isPending": sitemap.get("isPending"),
                "warnings": sitemap.get("warnings"),
                "errors": sitemap.get("errors"),
                "contents": sitemap.get("contents"),
            }
            for sitemap in (response.get("sitemap") or [])
        ]
    except Exception:
        return []


def build_summary(perf_28: dict[str, Any], perf_90: dict[str, Any]):
    clicks_28 = sum(row.get("clicks", 0) for row in perf_28.get("dateTrend", []))
    impressions_28 = sum(row.get("impressions", 0) for row in perf_28.get("dateTrend", []))
    clicks_90 = sum(row.get("clicks", 0) for row in perf_90.get("dateTrend", []))
    impressions_90 = sum(row.get("impressions", 0) for row in perf_90.get("dateTrend", []))

    return {
        "last28": {
            "totalClicks": clicks_28,
            "totalImpressions": impressions_28,
            "avgPosition": round(sum(row.get("position", 0) for row in perf_28.get("dateTrend", [])) / len(perf_28.get("dateTrend", []) or [1]), 1) if perf_28.get("dateTrend") else None,
            "uniqueQueries": len(perf_28.get("queries", [])),
            "uniquePages": len(perf_28.get("pages", [])),
        },
        "last90": {
            "totalClicks": clicks_90,
            "totalImpressions": impressions_90,
            "avgPosition": round(sum(row.get("position", 0) for row in perf_90.get("dateTrend", [])) / len(perf_90.get("dateTrend", []) or [1]), 1) if perf_90.get("dateTrend") else None,
            "uniqueQueries": len(perf_90.get("queries", [])),
            "uniquePages": len(perf_90.get("pages", [])),
        },
        "clicks_28d": clicks_28,
        "impressions_28d": impressions_28,
        "ctr_28d": clicks_28 / max(impressions_28, 1),
        "position_28d": round(sum(row.get("position", 0) for row in perf_28.get("dateTrend", [])) / len(perf_28.get("dateTrend", []) or [1]), 1) if perf_28.get("dateTrend") else None,
    }


def build_gsc_payload():
    searchconsole = build_search_console_client()
    site_url = detect_site_url(searchconsole)

    today = utc_now().date()
    end_date = today - timedelta(days=2)
    start_date_28 = today - timedelta(days=30)
    start_date_90 = today - timedelta(days=92)

    perf_28 = pull_performance_data(searchconsole, site_url, start_date_28.isoformat(), end_date.isoformat())
    perf_90 = pull_performance_data(searchconsole, site_url, start_date_90.isoformat(), end_date.isoformat())
    sitemaps = pull_indexing_data(searchconsole, site_url)

    return {
        "pulledAt": utc_now().isoformat(),
        "siteUrl": site_url,
        "dateRanges": {
            "last28": {"start": start_date_28.isoformat(), "end": end_date.isoformat()},
            "last90": {"start": start_date_90.isoformat(), "end": end_date.isoformat()},
        },
        "last28Days": perf_28,
        "last90Days": perf_90,
        "sitemaps": sitemaps,
        "summary": build_summary(perf_28, perf_90),
    }


def refresh_gsc_data():
    with REFRESH_LOCK:
        payload = build_gsc_payload()
        write_json_atomic(DATA_FILE, payload)
        return payload


def load_gsc_data(force_refresh: bool = False, refresh_if_stale: bool = False):
    data = load_cached_gsc_data()
    freshness = build_freshness(data)
    should_refresh = force_refresh or (refresh_if_stale and freshness["isStale"]) or (AUTO_REFRESH_ON_STALE and freshness["isStale"])

    if should_refresh:
        if not refresh_is_configured():
            return data
        try:
            return refresh_gsc_data()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to refresh GSC data: {str(exc)}")

    return data


def fetch_pagespeed_data(url: str, strategy: str, categories: list[str]):
    params = [("url", url), ("strategy", strategy)] + [("category", category) for category in categories]
    api_key = os.getenv("PAGESPEED_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()
    if api_key:
        params.append(("key", api_key))

    request_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + urlencode(params)

    try:
        with urlopen(request_url, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=exc.code, detail=f"PageSpeed API error: {detail or exc.reason}")
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"PageSpeed API unavailable: {exc.reason}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch PageSpeed data: {str(exc)}")


def safe_nested(data: dict[str, Any], *keys: str):
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def audit_summary(lhr: dict[str, Any], audit_id: str):
    audit = safe_nested(lhr, "audits", audit_id) or {}
    return {
        "id": audit_id,
        "title": audit.get("title"),
        "score": audit.get("score"),
        "displayValue": audit.get("displayValue"),
        "description": audit.get("description"),
    }


def category_score(categories: dict[str, Any], category_id: str):
    category = categories.get(category_id, {}) if isinstance(categories, dict) else {}
    score = category.get("score")
    return None if score is None else round(score * 100)


def build_lighthouse_summary(payload: dict[str, Any]):
    lhr = payload.get("lighthouseResult", {})
    categories = lhr.get("categories", {})
    analysis = payload.get("analysisUTCTimestamp")
    final_url = lhr.get("finalUrl") or payload.get("id")
    metrics = safe_nested(payload, "loadingExperience", "metrics") or {}
    origin_metrics = safe_nested(payload, "originLoadingExperience", "metrics") or {}

    return {
        "requestedUrl": payload.get("id"),
        "finalUrl": final_url,
        "analysisUTCTimestamp": analysis,
        "strategy": safe_nested(payload, "configSettings", "emulatedFormFactor") or lhr.get("requestedUrl"),
        "scores": {
            "performance": category_score(categories, "performance"),
            "accessibility": category_score(categories, "accessibility"),
            "bestPractices": category_score(categories, "best-practices"),
            "seo": category_score(categories, "seo"),
            "pwa": category_score(categories, "pwa"),
        },
        "coreWebVitals": {
            "lab": {
                "largestContentfulPaint": audit_summary(lhr, "largest-contentful-paint"),
                "cumulativeLayoutShift": audit_summary(lhr, "cumulative-layout-shift"),
                "speedIndex": audit_summary(lhr, "speed-index"),
                "totalBlockingTime": audit_summary(lhr, "total-blocking-time"),
                "interactive": audit_summary(lhr, "interactive"),
            },
            "field": {
                "loadingExperience": metrics,
                "originLoadingExperience": origin_metrics,
            },
        },
        "opportunities": [
            audit_summary(lhr, "render-blocking-resources"),
            audit_summary(lhr, "unused-css-rules"),
            audit_summary(lhr, "unused-javascript"),
            audit_summary(lhr, "modern-image-formats"),
            audit_summary(lhr, "offscreen-images"),
            audit_summary(lhr, "uses-text-compression"),
        ],
        "diagnostics": [
            audit_summary(lhr, "server-response-time"),
            audit_summary(lhr, "dom-size"),
            audit_summary(lhr, "bootup-time"),
            audit_summary(lhr, "mainthread-work-breakdown"),
            audit_summary(lhr, "uses-long-cache-ttl"),
        ],
    }


def get_keyword_volume_cache_items(cache_payload: dict[str, Any]):
    items = cache_payload.get("items", {}) if isinstance(cache_payload, dict) else {}
    return items if isinstance(items, dict) else {}


def keyword_volume_entry_is_fresh(entry: dict[str, Any]):
    timestamp = parse_payload_timestamp(entry)
    if timestamp is None:
        return False
    return utc_now() - timestamp <= DATAFORSEO_TTLS["keywords_volume"]


def map_keyword_volume_item(item: dict[str, Any]):
    return {
        "keyword": item.get("keyword"),
        "searchVolume": item.get("search_volume"),
        "competition": item.get("competition"),
        "competitionIndex": item.get("competition_index"),
        "cpc": item.get("cpc"),
        "lowTopOfPageBid": item.get("low_top_of_page_bid"),
        "highTopOfPageBid": item.get("high_top_of_page_bid"),
        "monthlySearches": item.get("monthly_searches"),
        "updatedAt": utc_now().isoformat(),
    }


def collect_keyword_volume_results(cache_payload: dict[str, Any], keywords: list[str]):
    cache_items = get_keyword_volume_cache_items(cache_payload)
    found_items = []
    missing_keywords = []
    for keyword in keywords:
        normalised = normalise_keyword(keyword)
        cached_item = cache_items.get(normalised)
        if cached_item and keyword_volume_entry_is_fresh(cached_item):
            found_items.append(cached_item)
        else:
            missing_keywords.append(keyword)
    return found_items, missing_keywords


async def fetch_keyword_volume_live(keywords: list[str]):
    payload = [{
        "keywords": keywords,
        "location_code": DATAFORSEO_LOCATION_CODE,
        "language_code": DATAFORSEO_LANGUAGE_CODE,
    }]
    response_payload = await call_dataforseo("POST", "/keywords_data/google_ads/search_volume/live", payload)
    task, results = extract_dataforseo_result(response_payload)
    result = extract_first_dataforseo_result(results)
    items = [
        map_keyword_volume_item(item)
        for item in (result.get("items") or [])
        if item.get("keyword")
    ]
    return items, extract_dataforseo_cost(response_payload, task)


def merge_keyword_volume_cache(existing_payload: dict[str, Any], fresh_items: list[dict[str, Any]]):
    merged_items = get_keyword_volume_cache_items(existing_payload).copy()
    for item in fresh_items:
        merged_items[normalise_keyword(item["keyword"])] = item
    return write_dataforseo_cache(KEYWORDS_VOLUME_FILE, {
        "items": merged_items,
        "locationCode": DATAFORSEO_LOCATION_CODE,
        "languageCode": DATAFORSEO_LANGUAGE_CODE,
    })


def get_existing_pages(existing_pages: str | None = None):
    page_paths: list[str] = []
    if existing_pages:
        page_paths.extend(part.strip() for part in existing_pages.split(",") if part.strip())
    else:
        existing_payload = read_json_file_or_default(EXISTING_PAGES_FILE, {})
        stored_pages = existing_payload.get("pages", []) if isinstance(existing_payload, dict) else []
        if isinstance(stored_pages, list):
            page_paths.extend(stored_pages)
    return {normalise_page_path(page) for page in page_paths if page}


def find_keyword_opportunities(limit: int, existing_pages: str | None = None):
    cache_payload = read_cache_payload(KEYWORDS_VOLUME_FILE)
    cache_items = list(get_keyword_volume_cache_items(cache_payload).values())
    current_pages = get_existing_pages(existing_pages)
    opportunities = []
    for item in cache_items:
        keyword = item.get("keyword")
        if not keyword:
            continue
        path = "/local/" + "-".join(keyword.strip().lower().split())
        if path in current_pages:
            continue
        opportunities.append({
            "keyword": keyword,
            "suggestedPath": path,
            "searchVolume": item.get("searchVolume"),
            "competition": item.get("competition"),
            "competitionIndex": item.get("competitionIndex"),
            "cpc": item.get("cpc"),
            "updatedAt": item.get("updatedAt"),
        })
    opportunities.sort(key=lambda item: item.get("searchVolume") or 0, reverse=True)
    freshness = build_cache_freshness(KEYWORDS_VOLUME_FILE, DATAFORSEO_TTLS["keywords_volume"], cache_payload)
    return {
        "items": opportunities[:limit],
        "freshness": freshness,
        "existingPagesCount": len(current_pages),
        "totalCandidates": len(opportunities),
    }


async def fetch_account_balance_live():
    response_payload = await call_dataforseo("GET", "/appendix/user_data")
    task, results = extract_dataforseo_result(response_payload)
    result = extract_first_dataforseo_result(results)
    return {
        "login": result.get("login"),
        "balance": result.get("money", {}).get("balance"),
        "totalSpent": result.get("money", {}).get("spent") or result.get("money", {}).get("total"),
        "money": result.get("money"),
        "updatedAt": utc_now().isoformat(),
    }, extract_dataforseo_cost(response_payload, task)


def map_keyword_gap_item(item: dict[str, Any]):
    keyword_data = item.get("keyword_data") or {}
    keyword_info = keyword_data.get("keyword_info") or {}
    first_domain = item.get("first_domain_serp_element") or {}
    second_domain = item.get("second_domain_serp_element") or {}
    return {
        "keyword": keyword_data.get("keyword"),
        "searchVolume": keyword_info.get("search_volume"),
        "competition": keyword_info.get("competition"),
        "competitionLevel": keyword_info.get("competition_level"),
        "cpc": keyword_info.get("cpc"),
        "firstDomainRank": first_domain.get("rank_absolute"),
        "firstDomainUrl": first_domain.get("url"),
        "secondDomainRank": second_domain.get("rank_absolute"),
        "secondDomainUrl": second_domain.get("url"),
    }


async def refresh_keyword_gap_cache():
    payload = [{
        "target1": DATAFORSEO_KEYWORD_GAP_TARGET,
        "target2": DATAFORSEO_KEYWORD_GAP_EXCLUDE,
        "location_code": DATAFORSEO_LOCATION_CODE,
        "language_code": DATAFORSEO_LANGUAGE_CODE,
        "limit": 100,
        "intersections": False,
        "item_types": ["organic"],
    }]
    response_payload = await call_dataforseo("POST", "/dataforseo_labs/google/domain_intersection/live", payload)
    task, results = extract_dataforseo_result(response_payload)
    result = extract_first_dataforseo_result(results)
    items = [
        map_keyword_gap_item(item)
        for item in (result.get("items") or [])
        if (item.get("keyword_data") or {}).get("keyword")
    ]
    items.sort(key=lambda item: item.get("searchVolume") or 0, reverse=True)
    cache_payload = write_dataforseo_cache(KEYWORD_GAP_FILE, {
        "target": DATAFORSEO_KEYWORD_GAP_TARGET,
        "exclude": DATAFORSEO_KEYWORD_GAP_EXCLUDE,
        "locationCode": DATAFORSEO_LOCATION_CODE,
        "languageCode": DATAFORSEO_LANGUAGE_CODE,
        "items": items,
    })
    return cache_payload, extract_dataforseo_cost(response_payload, task)


def map_backlink_gap_item(item: dict[str, Any]):
    return {
        "domain": item.get("domain") or item.get("referring_domain") or item.get("target"),
        "domainRank": item.get("domain_from_rank") or item.get("rank") or item.get("domain_rank"),
        "backlinksCount": item.get("backlinks") or item.get("backlinks_count") or item.get("referring_links"),
        "firstSeen": item.get("first_seen"),
    }


async def refresh_backlink_gap_cache():
    targets = {str(index + 1): target for index, target in enumerate(DATAFORSEO_BACKLINK_TARGETS)}
    payload = [{
        "targets": targets,
        "exclude_targets": [DATAFORSEO_BACKLINK_EXCLUDE],
        "limit": 100,
        "intersection_mode": "all",
        "include_subdomains": True,
        "exclude_internal_backlinks": True,
        "backlinks_status_type": "live",
        "rank_scale": "one_hundred",
        "order_by": ["backlinks,desc", "domain_from_rank,desc"],
    }]
    response_payload = await call_dataforseo("POST", "/backlinks/domain_intersection/live", payload)
    task, results = extract_dataforseo_result(response_payload)
    result = extract_first_dataforseo_result(results)
    items = [
        map_backlink_gap_item(item)
        for item in (result.get("items") or [])
        if item.get("domain") or item.get("referring_domain") or item.get("target")
    ]
    items.sort(key=lambda item: ((item.get("domainRank") or 0), (item.get("backlinksCount") or 0)), reverse=True)
    cache_payload = write_dataforseo_cache(BACKLINK_GAP_FILE, {
        "targets": DATAFORSEO_BACKLINK_TARGETS,
        "exclude": DATAFORSEO_BACKLINK_EXCLUDE,
        "items": items,
    })
    return cache_payload, extract_dataforseo_cost(response_payload, task)


@app.get("/api/account/balance")
async def get_account_balance(response: Response):
    balance, cost = await fetch_account_balance_live()
    response.headers["X-DataForSEO-Cost"] = str(cost or 0)
    return balance


@app.post("/api/keywords/volume")
async def get_keyword_volume(
    response: Response,
    body: dict[str, Any] = Body(...),
):
    keywords = body.get("keywords") or []
    if not isinstance(keywords, list) or not keywords:
        raise HTTPException(status_code=400, detail="Body must include a non-empty keywords array")
    if len(keywords) > 1000:
        raise HTTPException(status_code=400, detail="A maximum of 1000 keywords is allowed per request")

    cache_payload = read_cache_payload(KEYWORDS_VOLUME_FILE)
    cached_items, missing_keywords = collect_keyword_volume_results(cache_payload, keywords)
    fetched_items: list[dict[str, Any]] = []
    cost = 0

    if missing_keywords:
        fetched_items, cost = await fetch_keyword_volume_live(missing_keywords)
        cache_payload = merge_keyword_volume_cache(cache_payload, fetched_items)

    merged_items = {normalise_keyword(item["keyword"]): item for item in cached_items + fetched_items if item.get("keyword")}
    ordered_items = []
    for keyword in keywords:
        cached_item = merged_items.get(normalise_keyword(keyword))
        if cached_item:
            ordered_items.append(cached_item)

    response.headers["X-DataForSEO-Cost"] = str(cost or 0)
    return {
        "keywords": ordered_items,
        "requested": len(keywords),
        "cached": len(cached_items),
        "fetched": len(fetched_items),
        "freshness": build_cache_freshness(KEYWORDS_VOLUME_FILE, DATAFORSEO_TTLS["keywords_volume"], cache_payload),
    }


@app.post("/api/keywords/bulk-volume")
async def get_bulk_keyword_volume(
    response: Response,
    body: dict[str, Any] = Body(...),
):
    return await get_keyword_volume(response=response, body=body)


@app.get("/api/keywords/opportunities")
def get_keyword_opportunities(
    limit: int = Query(50, ge=1, le=1000),
    existing_pages: str | None = Query(default=None),
):
    result = find_keyword_opportunities(limit=limit, existing_pages=existing_pages)
    return {
        "opportunities": result["items"],
        "freshness": result["freshness"],
        "existingPagesCount": result["existingPagesCount"],
        "totalCandidates": result["totalCandidates"],
    }


@app.post("/api/pages/update")
def update_existing_pages(body: dict[str, Any] = Body(...)):
    pages = body.get("pages") or []
    if not isinstance(pages, list):
        raise HTTPException(status_code=400, detail="Body must include a pages array")
    normalised_pages = sorted({normalise_page_path(page) for page in pages if isinstance(page, str) and page.strip()})
    payload = write_dataforseo_cache(EXISTING_PAGES_FILE, {"pages": normalised_pages})
    return {
        "ok": True,
        "pages": payload.get("pages", []),
        "count": len(payload.get("pages", [])),
        "updatedAt": payload.get("updatedAt"),
    }


@app.get("/api/competitors/keyword-gap")
async def get_keyword_gap(
    response: Response,
    refresh: bool = Query(False),
):
    cache_payload, is_fresh, freshness = cache_is_fresh(KEYWORD_GAP_FILE, DATAFORSEO_TTLS["keyword_gap"])
    cost = 0
    if refresh or not is_fresh:
        cache_payload, cost = await refresh_keyword_gap_cache()
        freshness = build_cache_freshness(KEYWORD_GAP_FILE, DATAFORSEO_TTLS["keyword_gap"], cache_payload)
    response.headers["X-DataForSEO-Cost"] = str(cost or 0)
    return {
        "target": cache_payload.get("target", DATAFORSEO_KEYWORD_GAP_TARGET),
        "exclude": cache_payload.get("exclude", DATAFORSEO_KEYWORD_GAP_EXCLUDE),
        "keywords": cache_payload.get("items", []),
        "freshness": freshness,
    }


@app.get("/api/backlinks/gap")
async def get_backlink_gap(
    response: Response,
    refresh: bool = Query(False),
):
    cache_payload, is_fresh, freshness = cache_is_fresh(BACKLINK_GAP_FILE, DATAFORSEO_TTLS["backlink_gap"])
    cost = 0
    if refresh or not is_fresh:
        cache_payload, cost = await refresh_backlink_gap_cache()
        freshness = build_cache_freshness(BACKLINK_GAP_FILE, DATAFORSEO_TTLS["backlink_gap"], cache_payload)
    response.headers["X-DataForSEO-Cost"] = str(cost or 0)
    return {
        "targets": cache_payload.get("targets", DATAFORSEO_BACKLINK_TARGETS),
        "exclude": cache_payload.get("exclude", DATAFORSEO_BACKLINK_EXCLUDE),
        "domains": cache_payload.get("items", []),
        "freshness": freshness,
    }


@app.get("/api/status")
async def get_dataforseo_status(response: Response):
    balance, cost = await fetch_account_balance_live()
    response.headers["X-DataForSEO-Cost"] = str(cost or 0)
    keyword_cache = read_cache_payload(KEYWORDS_VOLUME_FILE)
    keyword_gap_cache = read_cache_payload(KEYWORD_GAP_FILE)
    backlink_gap_cache = read_cache_payload(BACKLINK_GAP_FILE)
    serp_cache = read_cache_payload(SERP_RANKINGS_FILE)
    existing_pages_cache = read_cache_payload(EXISTING_PAGES_FILE)
    api_log = read_json_file_or_default(API_LOG_FILE, [])
    return {
        "service": "TradeRefer DataForSEO API",
        "status": "online",
        "configured": dataforseo_is_configured(),
        "account": balance,
        "cache": {
            "keywordsVolume": build_cache_freshness(KEYWORDS_VOLUME_FILE, DATAFORSEO_TTLS["keywords_volume"], keyword_cache),
            "keywordGap": build_cache_freshness(KEYWORD_GAP_FILE, DATAFORSEO_TTLS["keyword_gap"], keyword_gap_cache),
            "backlinkGap": build_cache_freshness(BACKLINK_GAP_FILE, DATAFORSEO_TTLS["backlink_gap"], backlink_gap_cache),
            "serpRankings": build_cache_freshness(SERP_RANKINGS_FILE, DATAFORSEO_TTLS["serp_rankings"], serp_cache),
            "existingPages": build_cache_freshness(EXISTING_PAGES_FILE, DATAFORSEO_TTLS["keywords_volume"], existing_pages_cache),
        },
        "apiLogEntries": len(api_log) if isinstance(api_log, list) else 0,
    }


@app.get("/")
def root():
    return {
        "service": "TradeRefer SEO API",
        "status": "online",
        "freshness": build_freshness(load_cached_gsc_data()),
        "refreshAvailable": refresh_is_configured(),
        "dataforseoConfigured": dataforseo_is_configured(),
        "endpoints": {
            "/api/status": "Check DataForSEO cache freshness and live account balance",
            "/api/account/balance": "Get DataForSEO account balance and spend",
            "/api/keywords/volume": "Get cached keyword search volumes and fetch missing keywords live",
            "/api/keywords/bulk-volume": "Get cached keyword search volumes for bulk batches up to 1000 keywords",
            "/api/keywords/opportunities": "Get top cached keyword opportunities without matching local pages",
            "/api/pages/update": "Update the cached list of existing local page paths",
            "/api/competitors/keyword-gap": "Get cached competitor keyword gap data",
            "/api/backlinks/gap": "Get cached backlink gap data",
            "/api/gsc/status": "Check cache freshness, refresh capability, and service configuration",
            "/api/gsc/refresh": "Refresh Google Search Console data and overwrite the cache file",
            "/api/gsc/latest": "Get latest GSC report summary",
            "/api/gsc/pages": "Get page performance with filters",
            "/api/gsc/queries": "Get top queries with filters",
            "/api/gsc/top-opportunities": "Get AI-scored SEO improvement opportunities",
            "/api/gsc/pages-by-pattern": "Filter pages by URL pattern (e.g., /local/, /b/)",
            "/api/gsc/query-intent": "Analyze query intent (local/info/transactional)",
            "/api/gsc/ctr-analysis": "Analyze CTR by position ranges",
            "/api/gsc/position-changes": "Find pages with ranking changes (28d vs 90d)",
            "/api/gsc/zero-click": "Find pages with impressions but no clicks",
            "/api/gsc/crawl-issues": "Analyze crawl and indexing issues",
            "/api/lighthouse": "Run a Lighthouse/PageSpeed analysis for a URL",
            "/api/lighthouse/health": "Check Lighthouse/PageSpeed configuration",
            "/debug/files": "Debug: List available files"
        }
    }


@app.get("/api/lighthouse/health")
def lighthouse_health():
    api_key = os.getenv("PAGESPEED_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()
    return {
        "service": "TradeRefer Lighthouse API",
        "status": "online",
        "provider": "Google PageSpeed Insights API",
        "apiKeyConfigured": bool(api_key),
        "notes": "OAuth is not required for basic Lighthouse/PageSpeed runs.",
    }


@app.get("/api/lighthouse")
def run_lighthouse(
    url: str = Query(..., description="Full URL to analyze"),
    strategy: str = Query("mobile", pattern="^(mobile|desktop)$"),
    categories: str = Query("performance,accessibility,best-practices,seo", description="Comma-separated Lighthouse categories")
):
    requested_categories = [part.strip() for part in categories.split(",") if part.strip()]
    allowed_categories = {"performance", "accessibility", "best-practices", "seo", "pwa"}
    invalid = [category for category in requested_categories if category not in allowed_categories]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid categories: {', '.join(invalid)}")

    payload = fetch_pagespeed_data(url=url, strategy=strategy, categories=requested_categories or ["performance"])
    return build_lighthouse_summary(payload)


@app.get("/debug/files")
def debug_files():
    """Debug endpoint to see what files are available"""
    import os
    current_dir = Path(__file__).parent
    files_found = []
    
    # Check current directory
    if current_dir.exists():
        files_found.append(f"Current dir: {current_dir}")
        files_found.extend([f"  - {f}" for f in os.listdir(current_dir)])
    
    # Check for data directory
    data_dir = current_dir / "data"
    if data_dir.exists():
        files_found.append(f"Data dir exists: {data_dir}")
        files_found.extend([f"  - {f}" for f in os.listdir(data_dir)])
    else:
        files_found.append(f"Data dir NOT found: {data_dir}")
    
    return {"files": files_found}


@app.get("/api/gsc/status")
def get_gsc_status():
    payload = enrich_with_service_meta(load_cached_gsc_data())
    return {
        "service": "TradeRefer GSC API",
        "status": "online",
        "freshness": payload["freshness"],
        "refreshAvailable": payload["refreshAvailable"],
        "autoRefreshOnStale": payload["autoRefreshOnStale"],
        "cacheFile": payload["cacheFile"],
        "siteUrl": payload["data"].get("siteUrl"),
        "dateRanges": payload["data"].get("dateRanges"),
    }


@app.post("/api/gsc/refresh")
def refresh_gsc(x_refresh_secret: str | None = Header(default=None)):
    require_refresh_secret(x_refresh_secret)
    data = refresh_gsc_data()
    payload = enrich_with_service_meta(data)
    return {
        "ok": True,
        "message": "GSC cache refreshed successfully",
        "freshness": payload["freshness"],
        "siteUrl": data.get("siteUrl"),
        "dateRanges": data.get("dateRanges"),
    }


@app.get("/api/gsc/latest")
def get_latest(refresh_if_stale: bool = Query(False)):
    """Get latest GSC report summary"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    freshness = build_freshness(data)
    return {
        "pulledAt": data.get("pulledAt"),
        "siteUrl": data.get("siteUrl"),
        "summary": data.get("summary"),
        "dateRanges": data.get("dateRanges"),
        "freshness": freshness,
        "refreshAvailable": refresh_is_configured(),
    }


@app.get("/api/gsc/pages")
def get_pages(
    min_clicks: int = Query(0),
    limit: int = Query(100),
    period: str = Query("28", pattern="^(28|90)$"),
    refresh_if_stale: bool = Query(False),
):
    """Get page performance data"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    filtered = [p for p in pages if p.get("clicks", 0) >= min_clicks]
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {"period": f"{period} days", "total": len(filtered), "pages": filtered[:limit]}


@app.get("/api/gsc/queries")
def get_queries(
    min_clicks: int = Query(0),
    limit: int = Query(100),
    period: str = Query("28", pattern="^(28|90)$"),
    refresh_if_stale: bool = Query(False),
):
    """Get top queries"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    queries = data.get(f"last{period}Days", {}).get("queries", [])
    
    filtered = [q for q in queries if q.get("clicks", 0) >= min_clicks]
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {"period": f"{period} days", "total": len(filtered), "queries": filtered[:limit]}


@app.get("/api/gsc/top-opportunities")
def get_opportunities(refresh_if_stale: bool = Query(False)):
    """Get top SEO improvement opportunities"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages = data.get("last28Days", {}).get("pages", [])
    
    opportunities = []
    for page in pages:
        score = 0
        reasons = []
        
        if page.get("impressions", 0) > 500 and page.get("ctr", 0) < 0.02:
            score += 50
            reasons.append("High impressions but <2% CTR - optimize title/description")
        
        if 11 <= page.get("position", 0) <= 20 and page.get("impressions", 0) > 100:
            score += 40
            reasons.append("Page 2 ranking - small improvements could reach page 1")
        
        if page.get("clicks", 0) == 0 and page.get("impressions", 0) > 100:
            score += 35
            reasons.append("Zero clicks despite impressions - CTR issue")
        
        if score > 0:
            opportunities.append({
                "page": page.get("page"),
                "score": score,
                "reasons": reasons,
                "metrics": {
                    "clicks": page.get("clicks"),
                    "impressions": page.get("impressions"),
                    "ctr": page.get("ctr"),
                    "position": page.get("position")
                }
            })
    
    opportunities.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "totalOpportunities": len(opportunities),
        "top20": opportunities[:20]
    }


@app.get("/api/gsc/pages-by-pattern")
def get_pages_by_pattern(
    pattern: str = Query(..., description="URL pattern to filter (e.g., /local/, /b/)"),
    period: str = Query("28", pattern="^(28|90)$"),
    refresh_if_stale: bool = Query(False),
):
    """Filter pages by URL pattern"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    filtered = [p for p in pages if pattern in p.get("page", "")]
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "pattern": pattern,
        "period": f"{period} days",
        "total": len(filtered),
        "pages": filtered
    }


@app.get("/api/gsc/query-intent")
def analyze_query_intent(period: str = Query("28", pattern="^(28|90)$"), refresh_if_stale: bool = Query(False)):
    """Analyze query intent (local/info/transactional)"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    queries = data.get(f"last{period}Days", {}).get("queries", [])
    
    local_keywords = ["near me", "in ", "plumber", "electrician", "builder", "tradie"]
    info_keywords = ["how to", "what is", "why", "guide", "tips"]
    transactional_keywords = ["quote", "hire", "book", "cost", "price"]
    
    intent_breakdown = {"local": [], "informational": [], "transactional": [], "other": []}
    
    for q in queries:
        query_text = q.get("query", "").lower()
        if any(kw in query_text for kw in local_keywords):
            intent_breakdown["local"].append(q)
        elif any(kw in query_text for kw in info_keywords):
            intent_breakdown["informational"].append(q)
        elif any(kw in query_text for kw in transactional_keywords):
            intent_breakdown["transactional"].append(q)
        else:
            intent_breakdown["other"].append(q)
    
    return {
        "period": f"{period} days",
        "summary": {
            "local": len(intent_breakdown["local"]),
            "informational": len(intent_breakdown["informational"]),
            "transactional": len(intent_breakdown["transactional"]),
            "other": len(intent_breakdown["other"])
        },
        "breakdown": {
            "local": intent_breakdown["local"][:20],
            "informational": intent_breakdown["informational"][:20],
            "transactional": intent_breakdown["transactional"][:20]
        }
    }


@app.get("/api/gsc/ctr-analysis")
def analyze_ctr(period: str = Query("28", pattern="^(28|90)$"), refresh_if_stale: bool = Query(False)):
    """Analyze CTR by position ranges"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    position_ranges = {
        "1-3": {"pages": [], "avg_ctr": 0},
        "4-10": {"pages": [], "avg_ctr": 0},
        "11-20": {"pages": [], "avg_ctr": 0},
        "21+": {"pages": [], "avg_ctr": 0}
    }
    
    for page in pages:
        pos = page.get("position", 0)
        if 1 <= pos <= 3:
            position_ranges["1-3"]["pages"].append(page)
        elif 4 <= pos <= 10:
            position_ranges["4-10"]["pages"].append(page)
        elif 11 <= pos <= 20:
            position_ranges["11-20"]["pages"].append(page)
        elif pos > 20:
            position_ranges["21+"]["pages"].append(page)
    
    for range_name, range_data in position_ranges.items():
        if range_data["pages"]:
            avg_ctr = sum(p.get("ctr", 0) for p in range_data["pages"]) / len(range_data["pages"])
            range_data["avg_ctr"] = round(avg_ctr, 4)
            range_data["count"] = len(range_data["pages"])
            range_data["pages"] = range_data["pages"][:10]
    
    return {"period": f"{period} days", "position_ranges": position_ranges}


@app.get("/api/gsc/position-changes")
def get_position_changes(refresh_if_stale: bool = Query(False)):
    """Find pages with ranking changes (28d vs 90d)"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages_28 = {p["page"]: p for p in data.get("last28Days", {}).get("pages", [])}
    pages_90 = {p["page"]: p for p in data.get("last90Days", {}).get("pages", [])}
    
    changes = []
    for url, page_28 in pages_28.items():
        if url in pages_90:
            pos_28 = page_28.get("position", 0)
            pos_90 = pages_90[url].get("position", 0)
            change = pos_90 - pos_28
            
            if abs(change) >= 5:
                changes.append({
                    "page": url,
                    "position_28d": pos_28,
                    "position_90d": pos_90,
                    "change": round(change, 1),
                    "direction": "improved" if change > 0 else "declined",
                    "clicks_28d": page_28.get("clicks", 0),
                    "impressions_28d": page_28.get("impressions", 0)
                })
    
    changes.sort(key=lambda x: abs(x["change"]), reverse=True)
    
    return {
        "total_changes": len(changes),
        "improved": len([c for c in changes if c["direction"] == "improved"]),
        "declined": len([c for c in changes if c["direction"] == "declined"]),
        "changes": changes[:50]
    }


@app.get("/api/gsc/zero-click")
def get_zero_click_pages(min_impressions: int = Query(100), refresh_if_stale: bool = Query(False)):
    """Find pages with impressions but no clicks"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages = data.get("last28Days", {}).get("pages", [])
    
    zero_click = [
        p for p in pages
        if p.get("clicks", 0) == 0 and p.get("impressions", 0) >= min_impressions
    ]
    zero_click.sort(key=lambda x: x.get("impressions", 0), reverse=True)
    
    return {
        "total": len(zero_click),
        "min_impressions": min_impressions,
        "pages": zero_click[:50]
    }


@app.get("/api/gsc/crawl-issues")
def analyze_crawl_issues(refresh_if_stale: bool = Query(False)):
    """Analyze crawl and indexing issues"""
    data = load_gsc_data(refresh_if_stale=refresh_if_stale)
    pages_28 = data.get("last28Days", {}).get("pages", [])
    sitemaps = data.get("sitemaps", [])
    
    poor_ctr = [
        p for p in pages_28
        if p.get("impressions", 0) > 100 and p.get("ctr", 0) < 0.02
    ]
    poor_ctr.sort(key=lambda x: x.get("impressions", 0), reverse=True)
    
    low_position = [
        p for p in pages_28
        if p.get("position", 0) > 20 and p.get("impressions", 0) > 50
    ]
    low_position.sort(key=lambda x: x.get("position", 0), reverse=True)
    
    sitemap_errors = [
        s for s in sitemaps
        if int(s.get("errors", 0)) > 0 or int(s.get("warnings", 0)) > 0
    ]
    
    return {
        "issues": {
            "poor_ctr_pages": {
                "count": len(poor_ctr),
                "description": "Pages with >100 impressions but <2% CTR",
                "examples": poor_ctr[:10]
            },
            "low_position_pages": {
                "count": len(low_position),
                "description": "Pages ranking below position 20",
                "examples": low_position[:10]
            },
            "sitemap_errors": {
                "count": len(sitemap_errors),
                "description": "Sitemaps with errors or warnings",
                "sitemaps": sitemap_errors
            }
        },
        "summary": {
            "total_issues": len(poor_ctr) + len(low_position) + len(sitemap_errors)
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
