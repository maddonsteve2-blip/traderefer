"""
Google Search Console API Proxy for OpenClaw
Exposes GSC data (crawl stats, indexing, performance) via REST API
Deployed on Railway
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import subprocess
import json
import os
from pathlib import Path
from typing import Optional

app = FastAPI(title="TradeRefer GSC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
GSC_SCRIPT = BASE_DIR / "scripts" / "gsc_pull.js"
GSC_DATA_DIR = BASE_DIR / "gsc-data"
TOKEN_PATH = BASE_DIR / "gsc_token.json"


@app.get("/")
async def root():
    return {
        "service": "TradeRefer GSC API",
        "status": "online",
        "endpoints": {
            "/gsc/pull": "Pull fresh GSC data (runs gsc_pull.js)",
            "/gsc/latest": "Get latest cached GSC report",
            "/gsc/pages": "Get page performance data",
            "/gsc/queries": "Get top queries",
            "/gsc/sitemaps": "Get sitemap status",
            "/gsc/crawl-issues": "Analyze crawl/indexing issues"
        }
    }


@app.post("/gsc/pull")
async def pull_gsc_data():
    """
    Trigger fresh GSC data pull by running gsc_pull.js
    Returns the latest report after pull completes
    """
    if not GSC_SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"GSC script not found at {GSC_SCRIPT}")
    
    if not TOKEN_PATH.exists():
        raise HTTPException(
            status_code=401, 
            detail="GSC OAuth token not found. Run 'node scripts/gsc_pull.js' locally first to authorize."
        )
    
    try:
        # Run the GSC pull script
        result = subprocess.run(
            ["node", str(GSC_SCRIPT)],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"GSC pull failed: {result.stderr}"
            )
        
        # Return the latest report
        return await get_latest_report()
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="GSC pull timed out after 120s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running GSC pull: {str(e)}")


@app.get("/gsc/latest")
async def get_latest_report():
    """Get the most recent GSC report from cache"""
    if not GSC_DATA_DIR.exists():
        raise HTTPException(status_code=404, detail="No GSC data found. Run /gsc/pull first.")
    
    # Find latest report file
    reports = sorted(GSC_DATA_DIR.glob("gsc_report_*.json"), reverse=True)
    if not reports:
        raise HTTPException(status_code=404, detail="No GSC reports found")
    
    latest = reports[0]
    data = json.loads(latest.read_text())
    
    return {
        "reportFile": latest.name,
        "pulledAt": data.get("pulledAt"),
        "summary": data.get("summary"),
        "dateRanges": data.get("dateRanges"),
        "sitemapCount": len(data.get("sitemaps", [])),
    }


@app.get("/gsc/pages")
async def get_pages(
    min_clicks: int = Query(0, description="Minimum clicks filter"),
    min_impressions: int = Query(0, description="Minimum impressions filter"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    period: str = Query("28", regex="^(28|90)$", description="Days period: 28 or 90")
):
    """Get page performance data with filters"""
    data = await _load_latest_data()
    
    pages_key = f"last{period}Days"
    if pages_key not in data:
        raise HTTPException(status_code=404, detail=f"No data for {period} days")
    
    pages = data[pages_key].get("pages", [])
    
    # Filter
    filtered = [
        p for p in pages
        if p.get("clicks", 0) >= min_clicks and p.get("impressions", 0) >= min_impressions
    ]
    
    # Sort by clicks desc
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "period": f"{period} days",
        "total": len(filtered),
        "pages": filtered[:limit]
    }


@app.get("/gsc/queries")
async def get_queries(
    min_clicks: int = Query(0, description="Minimum clicks filter"),
    min_impressions: int = Query(0, description="Minimum impressions filter"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    period: str = Query("28", regex="^(28|90)$", description="Days period: 28 or 90")
):
    """Get top queries with filters"""
    data = await _load_latest_data()
    
    queries_key = f"last{period}Days"
    if queries_key not in data:
        raise HTTPException(status_code=404, detail=f"No data for {period} days")
    
    queries = data[queries_key].get("queries", [])
    
    # Filter
    filtered = [
        q for q in queries
        if q.get("clicks", 0) >= min_clicks and q.get("impressions", 0) >= min_impressions
    ]
    
    # Sort by clicks desc
    filtered.sort(key=lambda x: x.get("clicks", 0), reverse=True)
    
    return {
        "period": f"{period} days",
        "total": len(filtered),
        "queries": filtered[:limit]
    }


@app.get("/gsc/sitemaps")
async def get_sitemaps():
    """Get sitemap submission and indexing status"""
    data = await _load_latest_data()
    sitemaps = data.get("sitemaps", [])
    
    return {
        "total": len(sitemaps),
        "sitemaps": sitemaps
    }


@app.get("/gsc/crawl-issues")
async def analyze_crawl_issues():
    """
    Analyze GSC data to identify crawl/indexing issues:
    - Pages with high impressions but low clicks (poor CTR)
    - Pages with declining positions
    - Sitemap errors
    """
    data = await _load_latest_data()
    
    pages_28 = data.get("last28Days", {}).get("pages", [])
    sitemaps = data.get("sitemaps", [])
    
    # Issue 1: Poor CTR pages (high impressions, low clicks)
    poor_ctr = [
        p for p in pages_28
        if p.get("impressions", 0) > 100 and p.get("ctr", 0) < 0.02  # <2% CTR
    ]
    poor_ctr.sort(key=lambda x: x.get("impressions", 0), reverse=True)
    
    # Issue 2: Low position pages (avg position > 20)
    low_position = [
        p for p in pages_28
        if p.get("position", 0) > 20 and p.get("impressions", 0) > 50
    ]
    low_position.sort(key=lambda x: x.get("position", 0), reverse=True)
    
    # Issue 3: Sitemap errors
    sitemap_errors = [
        s for s in sitemaps
        if s.get("errors", 0) > 0 or s.get("warnings", 0) > 0
    ]
    
    return {
        "issues": {
            "poor_ctr_pages": {
                "count": len(poor_ctr),
                "description": "Pages with >100 impressions but <2% CTR (need better titles/descriptions)",
                "examples": poor_ctr[:10]
            },
            "low_position_pages": {
                "count": len(low_position),
                "description": "Pages ranking below position 20 with decent impressions (need content/backlinks)",
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
                f"Improve content for {len(low_position)} low-ranking pages",
                f"Resolve {len(sitemap_errors)} sitemap issues"
            ]
        }
    }


async def _load_latest_data():
    """Helper to load latest GSC report"""
    if not GSC_DATA_DIR.exists():
        raise HTTPException(status_code=404, detail="No GSC data found. Run /gsc/pull first.")
    
    reports = sorted(GSC_DATA_DIR.glob("gsc_report_*.json"), reverse=True)
    if not reports:
        raise HTTPException(status_code=404, detail="No GSC reports found")
    
    return json.loads(reports[0].read_text())


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
