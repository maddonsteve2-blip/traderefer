"""
GSC API for OpenClaw - Railway Deployment
Provides Google Search Console data analysis endpoints
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import os

app = FastAPI(title="TradeRefer GSC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_gsc_data():
    """Load latest GSC data from file"""
    # Railway deploys to /app, so data is at /app/data/latest.json
    data_file = Path(__file__).parent / "data" / "latest.json"
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"GSC data file not found at {data_file}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in data file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading GSC data: {str(e)}")


@app.get("/")
def root():
    return {
        "service": "TradeRefer GSC API",
        "status": "online",
        "endpoints": {
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
            "/debug/files": "Debug: List available files"
        }
    }


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


@app.get("/api/gsc/latest")
def get_latest():
    """Get latest GSC report summary"""
    data = load_gsc_data()
    return {
        "pulledAt": data.get("pulledAt"),
        "siteUrl": data.get("siteUrl"),
        "summary": data.get("summary"),
        "dateRanges": data.get("dateRanges")
    }


@app.get("/api/gsc/pages")
def get_pages(
    min_clicks: int = Query(0),
    limit: int = Query(100),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get page performance data"""
    data = load_gsc_data()
    pages = data.get(f"last{period}Days", {}).get("pages", [])
    
    filtered = [p for p in pages if p.get("clicks", 0) >= min_clicks]
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {"period": f"{period} days", "total": len(filtered), "pages": filtered[:limit]}


@app.get("/api/gsc/queries")
def get_queries(
    min_clicks: int = Query(0),
    limit: int = Query(100),
    period: str = Query("28", regex="^(28|90)$")
):
    """Get top queries"""
    data = load_gsc_data()
    queries = data.get(f"last{period}Days", {}).get("queries", [])
    
    filtered = [q for q in queries if q.get("clicks", 0) >= min_clicks]
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {"period": f"{period} days", "total": len(filtered), "queries": filtered[:limit]}


@app.get("/api/gsc/top-opportunities")
def get_opportunities():
    """Get top SEO improvement opportunities"""
    data = load_gsc_data()
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
    period: str = Query("28", regex="^(28|90)$")
):
    """Filter pages by URL pattern"""
    data = load_gsc_data()
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
def analyze_query_intent(period: str = Query("28", regex="^(28|90)$")):
    """Analyze query intent (local/info/transactional)"""
    data = load_gsc_data()
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
def analyze_ctr(period: str = Query("28", regex="^(28|90)$")):
    """Analyze CTR by position ranges"""
    data = load_gsc_data()
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
def get_position_changes():
    """Find pages with ranking changes (28d vs 90d)"""
    data = load_gsc_data()
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
def get_zero_click_pages(min_impressions: int = Query(100)):
    """Find pages with impressions but no clicks"""
    data = load_gsc_data()
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
def analyze_crawl_issues():
    """Analyze crawl and indexing issues"""
    data = load_gsc_data()
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
