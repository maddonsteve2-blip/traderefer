# Deploy GSC API to Vercel

## Setup Steps

### 1. Run GSC Pull Locally (One-Time Setup)

First, authorize and pull GSC data locally:

```bash
cd c:\Users\61479\Documents\trade-refer-stitch
node scripts/gsc_pull.js
```

This creates:
- `gsc_token.json` - OAuth refresh token
- `gsc-data/gsc_report_*.json` - Latest GSC data

### 2. Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

**GSC_TOKEN** - Content of `gsc_token.json`:
```bash
cat gsc_token.json
```

**GOOGLE_CLIENT_SECRET** - Content of `client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json`:
```bash
cat client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json
```

### 3. Create Initial Data File

```bash
mkdir -p apps/gsc-api/data
cp gsc-data/gsc_report_$(date +%Y-%m-%d).json apps/gsc-api/data/latest.json
git add apps/gsc-api/data/latest.json
git commit -m "Add initial GSC data"
git push
```

### 4. Deploy to Vercel

```bash
cd apps/gsc-api
vercel --prod
```

Or link to your existing Vercel project:
```bash
vercel link
vercel --prod
```

### 5. Test the API

Once deployed, test:
```bash
curl https://your-gsc-api.vercel.app/
curl https://your-gsc-api.vercel.app/api/gsc/latest
curl https://your-gsc-api.vercel.app/api/gsc/crawl-issues
```

## How It Works

1. **GitHub Actions** runs daily at 2 AM UTC
2. Pulls fresh GSC data using `gsc_pull.js`
3. Commits `latest.json` to the repo
4. Vercel auto-deploys on commit
5. API serves the latest GSC data

## OpenClaw Integration

Add to OpenClaw config:

```yaml
tools:
  gsc_api:
    type: http
    baseUrl: https://your-gsc-api.vercel.app
    endpoints:
      - path: /api/gsc/crawl-issues
        method: GET
        description: "Analyze TradeRefer crawl and indexing issues"
      - path: /api/gsc/pages
        method: GET
        description: "Get page performance data"
      - path: /api/gsc/queries
        method: GET
        description: "Get top search queries"
```

OpenClaw can now analyze your GSC data and suggest SEO improvements!
