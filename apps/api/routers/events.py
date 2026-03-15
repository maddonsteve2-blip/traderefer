"""
SSE (Server-Sent Events) endpoint for real-time dashboard updates.
Clients connect via EventSource to receive push notifications instantly.
"""

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from services.event_bus import event_bus
from services.auth import get_jwks
from jose import jwt
import asyncio
import uuid
from utils.logging_config import error_logger

router = APIRouter()

KEEPALIVE_INTERVAL = 25  # seconds — below typical 30s proxy timeout


async def _verify_sse_token(token: str) -> str | None:
    """Verify a Clerk JWT from an SSE query param. Returns user_id or None."""
    try:
        jwks = await get_jwks()
        header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
        if not rsa_key:
            return None
        payload = jwt.decode(
            token, rsa_key, algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False, "verify_sub": True}
        )
        clerk_id = payload.get("sub")
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, clerk_id)) if clerk_id else None
    except Exception as e:
        error_logger.warning(f"SSE auth error: {e}")
        return None


async def _event_generator(user_id: str):
    """Async generator that yields SSE-formatted events."""
    q = event_bus.subscribe(user_id)
    try:
        # Send initial connected event
        yield f"data: {{\"type\":\"connected\",\"payload\":{{}}}}\n\n"

        while True:
            try:
                # Wait for next event or keepalive timeout
                message = await asyncio.wait_for(q.get(), timeout=KEEPALIVE_INTERVAL)
                yield f"data: {message}\n\n"
            except asyncio.TimeoutError:
                # Send keepalive comment to prevent proxy/browser timeout
                yield ": keepalive\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        event_bus.unsubscribe(user_id, q)


@router.get("/events/stream")
async def sse_stream(token: str = Query(...)):
    """
    SSE endpoint for real-time dashboard events.

    Connect with: new EventSource('https://api.../api/events/stream?token=<jwt>')

    Events are JSON objects: { "type": "notification", "payload": { ... } }
    """
    user_id = await _verify_sse_token(token)
    if not user_id:
        return StreamingResponse(
            iter(["data: {\"type\":\"error\",\"payload\":{\"message\":\"Unauthorized\"}}\n\n"]),
            status_code=401,
            media_type="text/event-stream",
        )

    return StreamingResponse(
        _event_generator(user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
