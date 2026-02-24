from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import public, leads, business, referrer, admin, webhooks, media, messages, deals
import os
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv() # Fallback to .env

app = FastAPI(title="TradeRefer API")

# CORS configuration
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
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

@app.get("/")
async def root():
    return {"message": "TradeRefer API is running"}
