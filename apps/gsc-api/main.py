"""
GSC API for OpenClaw - Railway Deployment
Provides Google Search Console data analysis endpoints
"""

from datetime import datetime, timedelta, timezone
from threading import Lock
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
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
ROOT_DIR = Path(__file__).resolve().parents[2]
TOKEN_FILE = ROOT_DIR / "gsc_token.json"
CLIENT_SECRET_FILE = ROOT_DIR / "client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json"
DEFAULT_SITE_URL = os.getenv("GSC_SITE_URL", "sc-domain:traderefer.au")
DEFAULT_SITE_URL_ALT = os.getenv("GSC_SITE_URL_ALT", "https://traderefer.au/")
STALE_AFTER_HOURS = int(os.getenv("GSC_STALE_AFTER_HOURS", "24"))
AUTO_REFRESH_ON_STALE = os.getenv("GSC_AUTO_REFRESH_ON_STALE", "false").strip().lower() in {"1", "true", "yes", "on"}
REFRESH_SECRET = os.getenv("GSC_REFRESH_SECRET", "").strip()
REFRESH_LOCK = Lock()


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


@app.get("/")
def root():
    return {
        "service": "TradeRefer GSC API",
        "status": "online",
        "freshness": build_freshness(load_cached_gsc_data()),
        "refreshAvailable": refresh_is_configured(),
        "endpoints": {
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
