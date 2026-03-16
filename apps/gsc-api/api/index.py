"""
Vercel serverless function for GSC API
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel uses /tmp for temporary storage
GSC_DATA_DIR = Path("/tmp/gsc-data")


@app.get("/")
async def root():
    return {
        "service": "TradeRefer GSC API (Vercel)",
        "status": "online",
        "endpoints": {
            "/api/gsc/latest": "Get latest cached GSC report summary",
            "/api/gsc/pages": "Get page performance with filters",
            "/api/gsc/queries": "Get top queries with filters",
            "/api/gsc/queries-by-page": "Get queries for specific pages",
            "/api/gsc/sitemaps": "Get sitemap status",
            "/api/gsc/devices": "Get device breakdown (mobile/desktop/tablet)",
            "/api/gsc/countries": "Get geographic performance by country",
            "/api/gsc/date-trend": "Get daily performance trend",
            "/api/gsc/crawl-issues": "Analyze crawl/indexing issues",
            "/api/gsc/pages-by-pattern": "Filter pages by URL pattern",
            "/api/gsc/query-intent": "Analyze query intent (local/info/transactional)",
            "/api/gsc/ctr-analysis": "CTR analysis by position",
            "/api/gsc/position-changes": "Pages with position changes",
            "/api/gsc/zero-click": "Pages with impressions but no clicks",
            "/api/gsc/top-opportunities": "Best SEO improvement opportunities"
        },
        "note": "Data updated daily via GitHub Actions"
    }


@app.get("/api/gsc/latest")
async def get_latest_report():
    """Get the most recent GSC report summary"""
    data = await _load_latest_data()
    
    return {
        "pulledAt": data.get("pulledAt"),
        "siteUrl": data.get("siteUrl"),
        "summary": data.get("summary"),
        "dateRanges": data.get("dateRanges"),
        "sitemapCount": len(data.get("sitemaps", [])),
    }


@app.get("/api/gsc/pages")
async def get_pages(
    min_clicks: int = Query(0),
    min_impressions: int = Query(0),
    limit: int = Query(100, ge=1, le=1000),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get page performance data"""
    data = await _load_latest_data()
    
    pages_key = f"last{period}Days"
    pages = data.get(pages_key, {}).get("pages", [])
    
    filtered = [
        p for p in pages
        if p.get("clicks", 0) >= min_clicks and p.get("impressions", 0) >= min_impressions
    ]
    
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "period": f"{period} days",
        "total": len(filtered),
        "pages": filtered[:limit]
    }


@app.get("/api/gsc/queries")
async def get_queries(
    min_clicks: int = Query(0),
    min_impressions: int = Query(0),
    limit: int = Query(100, ge=1, le=1000),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get top queries"""
    data = await _load_latest_data()
    
    queries_key = f"last{period}Days"
    queries = data.get(queries_key, {}).get("queries", [])
    
    filtered = [
        q for q in queries
        if q.get("clicks", 0) >= min_clicks and q.get("impressions", 0) >= min_impressions
    ]
    
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "period": f"{period} days",
        "total": len(filtered),
        "queries": filtered[:limit]
    }


@app.get("/api/gsc/sitemaps")
async def get_sitemaps():
    """Get sitemap status"""
    data = await _load_latest_data()
    sitemaps = data.get("sitemaps", [])
    
    return {
        "total": len(sitemaps),
        "sitemaps": sitemaps
    }


@app.get("/api/gsc/crawl-issues")
async def analyze_crawl_issues():
    """Analyze crawl/indexing issues for OpenClaw"""
    data = await _load_latest_data()
    
    pages_28 = data.get("last28Days", {}).get("pages", [])
    sitemaps = data.get("sitemaps", [])
    
    # Poor CTR pages
    poor_ctr = [
        p for p in pages_28
        if p.get("impressions", 0) > 100 and p.get("ctr", 0) < 0.02
    ]
    poor_ctr.sort(key=lambda x: x.get("impressions", 0), reverse=True)
    
    # Low position pages
    low_position = [
        p for p in pages_28
        if p.get("position", 0) > 20 and p.get("impressions", 0) > 50
    ]
    low_position.sort(key=lambda x: x.get("position", 0), reverse=True)
    
    # Sitemap errors
    sitemap_errors = [
        s for s in sitemaps
        if s.get("errors", 0) > 0 or s.get("warnings", 0) > 0
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
            "total_issues": len(poor_ctr) + len(low_position) + len(sitemap_errors),
            "priority_actions": [
                f"Fix {len(poor_ctr)} pages with poor CTR",
                f"Improve {len(low_position)} low-ranking pages",
                f"Resolve {len(sitemap_errors)} sitemap issues"
            ]
        }
    }


@app.get("/api/gsc/queries-by-page")
async def get_queries_by_page(
    page_url: str = Query(..., description="Full page URL to get queries for"),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get queries that drive traffic to a specific page"""
    data = await _load_latest_data()
    queries_by_page = data.get(f"last{period}Days", {}).get("queriesByPage", [])
    
    page_data = next((p for p in queries_by_page if p.get("page") == page_url), None)
    
    if not page_data:
        return {
            "page": page_url,
            "found": False,
            "message": "Page not in top 25 pages or no data available"
        }
    
    return {
        "page": page_url,
        "found": True,
        "pageMetrics": {
            "clicks": page_data.get("clicks"),
            "impressions": page_data.get("impressions"),
            "ctr": page_data.get("ctr"),
            "position": page_data.get("position")
        },
        "queries": page_data.get("queries", [])
    }


@app.get("/api/gsc/devices")
async def get_devices(period: str = Query("28", regex="^(28|90)$")):
    """Get performance breakdown by device type"""
    data = await _load_latest_data()
    devices = data.get(f"last{period}Days", {}).get("devices", [])
    
    return {
        "period": f"{period} days",
        "devices": devices,
        "summary": {
            "mobile": next((d for d in devices if d.get("device") == "MOBILE"), {}),
            "desktop": next((d for d in devices if d.get("device") == "DESKTOP"), {}),
            "tablet": next((d for d in devices if d.get("device") == "TABLET"), {})
        }
    }


@app.get("/api/gsc/countries")
async def get_countries(
    limit: int = Query(25, ge=1, le=100),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get performance by country"""
    data = await _load_latest_data()
    countries = data.get(f"last{period}Days", {}).get("countries", [])
    
    return {
        "period": f"{period} days",
        "total": len(countries),
        "countries": countries[:limit]
    }


@app.get("/api/gsc/date-trend")
async def get_date_trend(period: str = Query("28", regex="^(28|90)$")):
    """Get daily performance trend"""
    data = await _load_latest_data()
    trend = data.get(f"last{period}Days", {}).get("dateTrend", [])
    
    return {
        "period": f"{period} days",
        "dataPoints": len(trend),
        "trend": trend
    }


@app.get("/api/gsc/pages-by-pattern")
async def get_pages_by_pattern(
    pattern: str = Query(..., description="URL pattern to match (e.g., '/local/', '/b/'))"),
    min_clicks: int = Query(0),
    limit: int = Query(100, ge=1, le=1000),
    period: str = Query("28", regex="^(28|90)$")
):
    """Filter pages by URL pattern"""
    data = await _load_latest_data()
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    # Filter by pattern
    filtered = [
        p for p in pages
        if pattern.lower() in p.get("page", "").lower() and p.get("clicks", 0) >= min_clicks
    ]
    
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "pattern": pattern,
        "period": f"{period} days",
        "total": len(filtered),
        "pages": filtered[:limit],
        "summary": {
            "totalClicks": sum(p.get("clicks", 0) for p in filtered),
            "totalImpressions": sum(p.get("impressions", 0) for p in filtered),
            "avgPosition": sum(p.get("position", 0) for p in filtered) / len(filtered) if filtered else 0
        }
    }


@app.get("/api/gsc/query-intent")
async def analyze_query_intent(
    limit: int = Query(100, ge=1, le=1000),
    period: str = Query("28", regex="^(28|90)$")
):
    """Categorize queries by search intent"""
    data = await _load_latest_data()
    queries = data.get(f"last{period}Days", {}).get("queries", [])
    
    # Intent patterns
    local_keywords = ["near me", "in ", " nsw", " vic", " qld", " wa", " sa", " tas", " nt", " act", "sydney", "melbourne", "brisbane", "perth", "adelaide"]
    info_keywords = ["how to", "what is", "why", "cost", "price", "how much"]
    transactional_keywords = ["hire", "book", "quote", "find", "best", "top", "compare"]
    
    local = []
    informational = []
    transactional = []
    other = []
    
    for q in queries[:limit]:
        query_lower = q.get("query", "").lower()
        
        if any(kw in query_lower for kw in local_keywords):
            local.append(q)
        elif any(kw in query_lower for kw in info_keywords):
            informational.append(q)
        elif any(kw in query_lower for kw in transactional_keywords):
            transactional.append(q)
        else:
            other.append(q)
    
    return {
        "period": f"{period} days",
        "intents": {
            "local": {
                "count": len(local),
                "clicks": sum(q.get("clicks", 0) for q in local),
                "examples": local[:10]
            },
            "informational": {
                "count": len(informational),
                "clicks": sum(q.get("clicks", 0) for q in informational),
                "examples": informational[:10]
            },
            "transactional": {
                "count": len(transactional),
                "clicks": sum(q.get("clicks", 0) for q in transactional),
                "examples": transactional[:10]
            },
            "other": {
                "count": len(other),
                "clicks": sum(q.get("clicks", 0) for q in other),
                "examples": other[:10]
            }
        }
    }


@app.get("/api/gsc/ctr-analysis")
async def analyze_ctr_by_position(period: str = Query("28", regex="^(28|90)$")):
    """Analyze CTR by average position to find optimization opportunities"""
    data = await _load_latest_data()
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    # Group by position ranges
    position_ranges = {
        "1-3": [],
        "4-10": [],
        "11-20": [],
        "21-50": [],
        "50+": []
    }
    
    for page in pages:
        pos = page.get("position", 0)
        if pos <= 3:
            position_ranges["1-3"].append(page)
        elif pos <= 10:
            position_ranges["4-10"].append(page)
        elif pos <= 20:
            position_ranges["11-20"].append(page)
        elif pos <= 50:
            position_ranges["21-50"].append(page)
        else:
            position_ranges["50+"].append(page)
    
    analysis = {}
    for range_name, pages_in_range in position_ranges.items():
        if pages_in_range:
            avg_ctr = sum(p.get("ctr", 0) for p in pages_in_range) / len(pages_in_range)
            total_impressions = sum(p.get("impressions", 0) for p in pages_in_range)
            total_clicks = sum(p.get("clicks", 0) for p in pages_in_range)
            
            analysis[range_name] = {
                "pageCount": len(pages_in_range),
                "avgCTR": round(avg_ctr, 4),
                "totalImpressions": total_impressions,
                "totalClicks": total_clicks,
                "examples": pages_in_range[:5]
            }
    
    return {
        "period": f"{period} days",
        "analysis": analysis
    }


@app.get("/api/gsc/position-changes")
async def get_position_changes():
    """Compare 28-day vs 90-day positions to find ranking changes"""
    data = await _load_latest_data()
    
    pages_28 = {p["page"]: p for p in data.get("last28Days", {}).get("pages", [])}
    pages_90 = {p["page"]: p for p in data.get("last90Days", {}).get("pages", [])}
    
    changes = []
    for url, page_28 in pages_28.items():
        if url in pages_90:
            pos_28 = page_28.get("position", 0)
            pos_90 = pages_90[url].get("position", 0)
            change = pos_90 - pos_28  # Positive = improved (lower position number)
            
            if abs(change) >= 5:  # Significant change
                changes.append({
                    "page": url,
                    "position28d": pos_28,
                    "position90d": pos_90,
                    "change": change,
                    "direction": "improved" if change > 0 else "declined",
                    "clicks28d": page_28.get("clicks", 0),
                    "impressions28d": page_28.get("impressions", 0)
                })
    
    # Sort by absolute change
    changes.sort(key=lambda x: abs(x["change"]), reverse=True)
    
    improved = [c for c in changes if c["direction"] == "improved"]
    declined = [c for c in changes if c["direction"] == "declined"]
    
    return {
        "totalChanges": len(changes),
        "improved": {
            "count": len(improved),
            "pages": improved[:20]
        },
        "declined": {
            "count": len(declined),
            "pages": declined[:20]
        }
    }


@app.get("/api/gsc/zero-click")
async def get_zero_click_pages(
    min_impressions: int = Query(100),
    period: str = Query("28", regex="^(28|90)$")
):
    """Find pages with impressions but zero clicks"""
    data = await _load_latest_data()
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    zero_click = [
        p for p in pages
        if p.get("clicks", 0) == 0 and p.get("impressions", 0) >= min_impressions
    ]
    
    zero_click.sort(key=lambda x: x.get("impressions", 0), reverse=True)
    
    return {
        "period": f"{period} days",
        "count": len(zero_click),
        "totalWastedImpressions": sum(p.get("impressions", 0) for p in zero_click),
        "pages": zero_click[:50],
        "recommendation": "These pages need better titles and meta descriptions to improve CTR"
    }


@app.get("/api/gsc/top-opportunities")
async def get_top_opportunities():
    """Identify best SEO improvement opportunities"""
    data = await _load_latest_data()
    pages_28 = data.get("last28Days", {}).get("pages", [])
    
    opportunities = []
    
    for page in pages_28:
        score = 0
        reasons = []
        
        # High impressions, low CTR
        if page.get("impressions", 0) > 500 and page.get("ctr", 0) < 0.02:
            score += 50
            reasons.append("High impressions but <2% CTR - optimize title/description")
        
        # Position 11-20 (page 2)
        if 11 <= page.get("position", 0) <= 20 and page.get("impressions", 0) > 100:
            score += 40
            reasons.append("Page 2 ranking - small improvements could reach page 1")
        
        # Position 4-10 (bottom of page 1)
        if 4 <= page.get("position", 0) <= 10 and page.get("impressions", 0) > 200:
            score += 30
            reasons.append("Bottom of page 1 - optimize to reach top 3")
        
        # Zero clicks with impressions
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
        "top20": opportunities[:20],
        "summary": {
            "highPriority": len([o for o in opportunities if o["score"] >= 50]),
            "mediumPriority": len([o for o in opportunities if 30 <= o["score"] < 50]),
            "lowPriority": len([o for o in opportunities if o["score"] < 30])
        }
    }


async def _load_latest_data():
    """Load latest GSC data from static file"""
    # Try multiple possible paths for Vercel deployment
    possible_paths = [
        Path(__file__).parent.parent / "data" / "latest.json",  # Local dev
        Path("/var/task/data/latest.json"),  # Vercel serverless
        Path("/var/task/apps/gsc-api/data/latest.json"),  # Vercel with full path
    ]
    
    for data_file in possible_paths:
        if data_file.exists():
            return json.loads(data_file.read_text())
    
    # If no file found, return the existing data we already have
    raise HTTPException(
        status_code=404, 
        detail="No GSC data found. Run 'scripts/update_gsc_api.bat' to update."
    )


# Vercel handler
from mangum import Mangum
handler = Mangum(app)
