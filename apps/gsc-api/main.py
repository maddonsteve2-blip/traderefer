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
    # Try multiple possible paths for Railway deployment
    possible_paths = [
        Path(__file__).parent / "data" / "latest.json",
        Path("/app/data/latest.json"),
        Path("/app/apps/gsc-api/data/latest.json"),
    ]
    
    for data_file in possible_paths:
        if data_file.exists():
            with open(data_file, 'r') as f:
                return json.load(f)
    
    raise HTTPException(status_code=404, detail=f"No GSC data found. Tried paths: {[str(p) for p in possible_paths]}")


@app.get("/")
def root():
    return {
        "service": "TradeRefer GSC API",
        "status": "online",
        "endpoints": {
            "/api/gsc/latest": "Get latest GSC report summary",
            "/api/gsc/pages": "Get page performance",
            "/api/gsc/queries": "Get top queries",
            "/api/gsc/top-opportunities": "Get SEO improvement opportunities",
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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
