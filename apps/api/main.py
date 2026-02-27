from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import public, leads, business, referrer, admin, webhooks, media, messages, deals, campaigns, notifications as notif_router
import os
from dotenv import load_dotenv
from utils.sentry_config import init_sentry

# Load environment variables
load_dotenv(".env.local")
load_dotenv() # Fallback to .env

# Initialize Sentry for error tracking
init_sentry()

app = FastAPI(title="TradeRefer API")

# CORS configuration
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "https://traderefer.au",
    "https://www.traderefer.au",
    "https://web-weld-xi.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8081",    # Expo dev server
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.0\.2\.2)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(public.router, tags=["Public"])
app.include_router(leads.router, prefix="/leads", tags=["Leads"])
app.include_router(business.router, prefix="/business", tags=["Business"])
app.include_router(referrer.router, prefix="/referrer", tags=["Referrer"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(media.router, prefix="/media", tags=["Media"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(deals.router, prefix="/business", tags=["Deals"])
app.include_router(campaigns.router, prefix="/business", tags=["Campaigns"])
app.include_router(notif_router.router, prefix="/api", tags=["Notifications"])

@app.get("/")
async def root():
    return {"message": "TradeRefer API is running"}


# ── Auth Status: lightweight role check for routing ──
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
import uuid

@app.get("/auth/status")
async def auth_status(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Returns the user's role(s) and onboarding status for routing."""
    user_uuid = uuid.UUID(user.id)

    biz_res = await db.execute(
        text("SELECT id, status FROM businesses WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    biz = biz_res.fetchone()

    ref_res = await db.execute(
        text("SELECT id, status FROM referrers WHERE user_id = :uid"),
        {"uid": user_uuid}
    )
    ref = ref_res.fetchone()

    return {
        "user_id": user.id,
        "has_business": biz is not None,
        "business_status": biz[1] if biz else None,
        "has_referrer": ref is not None,
        "referrer_status": ref[1] if ref else None,
        "needs_onboarding": biz is None and ref is None
    }
