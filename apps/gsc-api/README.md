# GSC API Proxy for OpenClaw

REST API that exposes Google Search Console data for OpenClaw SEO bot.

## Endpoints

- `GET /` - Service info
- `POST /gsc/pull` - Pull fresh GSC data (runs gsc_pull.js)
- `GET /gsc/latest` - Get latest cached report summary
- `GET /gsc/pages?period=28&min_clicks=0&limit=100` - Page performance data
- `GET /gsc/queries?period=28&min_clicks=0&limit=100` - Top queries
- `GET /gsc/sitemaps` - Sitemap status
- `GET /gsc/crawl-issues` - Analyze crawl/indexing issues

## Deployment to Railway

### Prerequisites

1. **Run GSC auth locally first**:
   ```bash
   cd c:\Users\61479\Documents\trade-refer-stitch
   node scripts/gsc_pull.js
   ```
   This creates `gsc_token.json` with your OAuth token.

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

### Deploy

```bash
cd apps/gsc-api
railway init
railway up
```

### Environment Setup on Railway

Railway will auto-detect the Python app. You need to:

1. **Upload `gsc_token.json`** to Railway:
   - Option A: Add as environment variable (base64 encoded)
   - Option B: Use Railway volumes (mount the token file)

2. **Install Node.js** on Railway (for running gsc_pull.js):
   - Railway's Nixpacks will detect `package.json` if you add one
   - Or use a custom Dockerfile

### Alternative: Use Railway Volumes

Create a `Dockerfile` to include both Python and Node.js:

```dockerfile
FROM node:20-slim

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy everything
WORKDIR /app
COPY . .
COPY ../../scripts/gsc_pull.js /app/scripts/
COPY ../../gsc_token.json /app/
COPY ../../client_secret_*.json /app/

# Install Node deps for gsc_pull.js
RUN npm install googleapis

# Install Python deps
RUN pip3 install -r requirements.txt

CMD ["python3", "main.py"]
```

## OpenClaw Integration

Once deployed, add this tool to OpenClaw's MCP config:

```json
{
  "tools": {
    "gsc_api": {
      "type": "http",
      "baseUrl": "https://your-railway-app.railway.app",
      "endpoints": {
        "get_crawl_issues": "/gsc/crawl-issues",
        "get_pages": "/gsc/pages",
        "get_queries": "/gsc/queries"
      }
    }
  }
}
```

OpenClaw can then analyze your GSC data and suggest SEO improvements.
