# OpenClaw Setup Guide for TradeRefer SEO Bot

Complete instructions to install and configure OpenClaw to analyze your GSC data and optimize SEO.

---

## Part 1: Install OpenClaw

### Option A: Install via pip (Recommended)

```bash
pip install openclaw
```

### Option B: Install from source

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pip install -e .
```

---

## Part 2: Deploy Your GSC API to Vercel

### 1. Complete Vercel Deployment

```bash
cd c:\Users\61479\Documents\trade-refer-stitch\apps\gsc-api
vercel --prod
```

Follow the prompts:
- **Project name**: `traderefer-gsc-api` (or your choice)
- **Link to existing project?**: No (first time) or Yes (if re-deploying)
- **Framework**: None (it will auto-detect Python)

After deployment, note your URL: `https://traderefer-gsc-api.vercel.app`

### 2. Test the API

```bash
curl https://your-gsc-api.vercel.app/
curl https://your-gsc-api.vercel.app/api/gsc/latest
curl https://your-gsc-api.vercel.app/api/gsc/top-opportunities
```

---

## Part 3: Set Up GitHub Actions (Daily Data Updates)

### 1. Get Your OAuth Tokens

```bash
# Copy GSC token
cat c:\Users\61479\Documents\trade-refer-stitch\gsc_token.json

# Copy Google OAuth credentials
cat c:\Users\61479\Documents\trade-refer-stitch\client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json
```

### 2. Add GitHub Secrets

Go to: https://github.com/maddonsteve2-blip/traderefer/settings/secrets/actions

Click **New repository secret** and add:

**Secret 1: GSC_TOKEN**
- Name: `GSC_TOKEN`
- Value: Paste entire content of `gsc_token.json`

**Secret 2: GOOGLE_CLIENT_SECRET**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: Paste entire content of `client_secret_*.json`

### 3. Test GitHub Action

Go to: https://github.com/maddonsteve2-blip/traderefer/actions/workflows/gsc-update.yml

Click **Run workflow** → **Run workflow**

This will:
- Pull fresh GSC data
- Commit `latest.json` to repo
- Trigger Vercel auto-deploy

---

## Part 4: Configure OpenClaw

### 1. Create OpenClaw Config File

Create `openclaw_config.yaml`:

```yaml
# OpenClaw Configuration for TradeRefer SEO Bot
agent:
  name: "TradeRefer SEO Analyst"
  model: "claude-3-5-sonnet-20241022"  # or gpt-4
  temperature: 0.7
  
tools:
  # Your GSC API
  - name: gsc_api
    type: http
    base_url: "https://your-gsc-api.vercel.app"  # REPLACE with your Vercel URL
    endpoints:
      - path: /api/gsc/latest
        method: GET
        description: "Get latest GSC report summary"
        
      - path: /api/gsc/top-opportunities
        method: GET
        description: "Get AI-scored SEO improvement opportunities"
        
      - path: /api/gsc/pages-by-pattern
        method: GET
        description: "Filter pages by URL pattern (e.g., /local/, /b/)"
        parameters:
          - name: pattern
            required: true
            type: string
          - name: period
            required: false
            type: string
            default: "28"
            
      - path: /api/gsc/query-intent
        method: GET
        description: "Analyze query intent (local/info/transactional)"
        
      - path: /api/gsc/ctr-analysis
        method: GET
        description: "Analyze CTR by position ranges"
        
      - path: /api/gsc/position-changes
        method: GET
        description: "Find pages with ranking changes (28d vs 90d)"
        
      - path: /api/gsc/zero-click
        method: GET
        description: "Find pages with impressions but no clicks"
        parameters:
          - name: min_impressions
            required: false
            type: integer
            default: 100
            
      - path: /api/gsc/crawl-issues
        method: GET
        description: "Analyze crawl and indexing issues"
        
      - path: /api/gsc/pages
        method: GET
        description: "Get page performance with filters"
        parameters:
          - name: min_clicks
            required: false
            type: integer
          - name: min_impressions
            required: false
            type: integer
          - name: limit
            required: false
            type: integer
            default: 100
          - name: period
            required: false
            type: string
            default: "28"
            
      - path: /api/gsc/queries
        method: GET
        description: "Get top queries with filters"
        parameters:
          - name: min_clicks
            required: false
            type: integer
          - name: limit
            required: false
            type: integer
            default: 100
            
  # Web search (optional - for research)
  - name: brave_search
    type: brave
    api_key: ${BRAVE_API_KEY}  # Optional: get from https://brave.com/search/api/

# Task prompts
prompts:
  system: |
    You are an expert SEO analyst for TradeRefer.au, an Australian trades referral platform.
    
    Your goal is to analyze Google Search Console data and provide actionable SEO recommendations.
    
    Focus areas:
    - Programmatic pages (/local/[state]/[city]/[suburb]/[trade])
    - Business profiles (/b/[slug])
    - CTR optimization (titles, meta descriptions)
    - Position improvements (content, internal linking)
    - Technical SEO (crawl issues, sitemaps)
    
    Always prioritize high-impact, low-effort improvements first.
    
  daily_analysis: |
    Analyze the latest GSC data and provide:
    
    1. **Top 5 Opportunities** (from /api/gsc/top-opportunities)
       - What pages to optimize
       - Why they're high-priority
       - Specific actions to take
    
    2. **Crawl Issues** (from /api/gsc/crawl-issues)
       - Poor CTR pages
       - Low position pages
       - Sitemap errors
    
    3. **Query Intent Analysis** (from /api/gsc/query-intent)
       - What types of queries drive traffic
       - Content gaps to fill
    
    4. **Position Changes** (from /api/gsc/position-changes)
       - Pages improving (what's working)
       - Pages declining (what to fix)
    
    Format as a concise executive summary with actionable next steps.
    
  page_audit: |
    Audit a specific page pattern (e.g., /local/ pages):
    
    1. Get pages matching pattern
    2. Analyze performance metrics
    3. Compare to site average
    4. Identify underperformers
    5. Suggest specific optimizations
    
    Focus on: titles, descriptions, content quality, internal linking.

# Scheduled tasks
schedule:
  - name: daily_seo_report
    cron: "0 9 * * *"  # 9 AM daily
    prompt: daily_analysis
    
  - name: weekly_local_pages_audit
    cron: "0 10 * * 1"  # 10 AM Monday
    prompt: page_audit
    context:
      pattern: "/local/"
```

### 2. Set Environment Variables

Create `.env` file:

```bash
# OpenClaw API Keys
ANTHROPIC_API_KEY=your_claude_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Brave Search API (for web research)
BRAVE_API_KEY=your_brave_api_key_here
```

Get API keys:
- **Claude**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/api-keys
- **Brave Search** (optional): https://brave.com/search/api/

---

## Part 5: Run OpenClaw

### Interactive Mode (Manual Analysis)

```bash
openclaw --config openclaw_config.yaml

# Then ask questions:
> Analyze my top SEO opportunities
> What pages have the worst CTR?
> Show me pages ranking on page 2 that could reach page 1
> Analyze all /local/ pages performance
```

### Scheduled Mode (Automated Daily Reports)

```bash
# Run as background service
openclaw --config openclaw_config.yaml --daemon

# Or use cron/Task Scheduler
# Windows Task Scheduler:
# - Program: python
# - Arguments: -m openclaw --config C:\path\to\openclaw_config.yaml --run daily_seo_report
# - Schedule: Daily at 9 AM
```

### One-Off Analysis

```bash
openclaw --config openclaw_config.yaml --run daily_analysis
```

---

## Part 6: Example OpenClaw Queries

Once running, try these:

```
1. "What are my top 10 SEO opportunities right now?"
   → Calls /api/gsc/top-opportunities
   → Prioritizes by score
   → Suggests specific fixes

2. "Analyze all /local/ pages - which ones need work?"
   → Calls /api/gsc/pages-by-pattern?pattern=/local/
   → Compares performance
   → Identifies underperformers

3. "Show me pages that dropped in rankings"
   → Calls /api/gsc/position-changes
   → Lists declined pages
   → Suggests recovery actions

4. "What queries drive the most traffic?"
   → Calls /api/gsc/query-intent
   → Categorizes by intent
   → Suggests content strategy

5. "Find pages with high impressions but no clicks"
   → Calls /api/gsc/zero-click
   → Lists CTR problems
   → Suggests title/description improvements
```

---

## Part 7: Advanced: Deploy OpenClaw Online (Railway)

To run OpenClaw 24/7 as a service:

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
```

### 2. Create `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install OpenClaw
RUN pip install openclaw

# Copy config
COPY openclaw_config.yaml .
COPY .env .

# Run in daemon mode
CMD ["openclaw", "--config", "openclaw_config.yaml", "--daemon"]
```

### 3. Deploy

```bash
railway up
```

### 4. Set Environment Variables on Railway

In Railway dashboard, add:
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `BRAVE_API_KEY` (optional)

---

## Troubleshooting

### GSC API returns 404
- Run GitHub Action to generate `latest.json`
- Check Vercel deployment logs
- Verify `apps/gsc-api/data/latest.json` exists in repo

### OpenClaw can't connect to API
- Check Vercel URL is correct in `openclaw_config.yaml`
- Test API manually: `curl https://your-gsc-api.vercel.app/`
- Check CORS settings (should allow all origins)

### No data in GSC
- Run `node scripts/gsc_pull.js` locally first
- Check `gsc_token.json` exists and is valid
- Verify GitHub secrets are set correctly

---

## Summary

**You now have:**
1. ✅ GSC API with 15 endpoints deployed on Vercel
2. ✅ GitHub Actions updating data daily
3. ✅ OpenClaw config ready to analyze your SEO
4. ✅ Automated daily reports and manual query support

**Next steps:**
1. Deploy GSC API to Vercel (get your URL)
2. Add GitHub secrets for daily updates
3. Install OpenClaw: `pip install openclaw`
4. Update `openclaw_config.yaml` with your Vercel URL
5. Run: `openclaw --config openclaw_config.yaml`

**OpenClaw will now:**
- Analyze your 47,836 impressions and 131 clicks
- Find why avg position is 41.1 (page 5!)
- Suggest specific pages to optimize
- Monitor ranking changes
- Identify CTR problems
- Provide daily SEO reports
