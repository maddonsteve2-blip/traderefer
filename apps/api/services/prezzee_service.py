"""
Prezzee Partner API service.
Handles OAuth2 token auth, gift card creation, idempotency, and float checks.
Credentials: PREZZEE_USERNAME / PREZZEE_PASSWORD (portal creds used for API auth)
Environment: PREZZEE_ENV=sandbox (default) or production
"""
import os
import asyncio
import httpx
from datetime import datetime, timedelta
from utils.logging_config import payment_logger, error_logger

PREZZEE_ENV = os.getenv("PREZZEE_ENV", "sandbox")
PREZZEE_USERNAME = os.getenv("PREZZEE_USERNAME", "")
PREZZEE_PASSWORD = os.getenv("PREZZEE_PASSWORD", "")
PREZZEE_API_KEY = os.getenv("PREZZEE_API_KEY", "")
PREZZEE_PRODUCT_CODE = os.getenv("PREZZEE_PRODUCT_CODE", "PREZZEE_SWAP")
PREZZEE_SENDER_NAME = os.getenv("PREZZEE_SENDER_NAME", "TradeRefer")

BASE_URL = (
    "https://partner-api.prezzee.com"
    if PREZZEE_ENV == "production"
    else "https://sb.partner-api.prezzee.com"
)

# ── Token cache ──────────────────────────────────────────────────────────────
_token_cache: dict = {"access_token": None, "expires_at": None}
_token_lock = asyncio.Lock()


async def _get_access_token() -> str:
    """Obtain (or return cached) Bearer token via username/password auth."""
    async with _token_lock:
        now = datetime.utcnow()
        if _token_cache["access_token"] and _token_cache["expires_at"] and now < _token_cache["expires_at"]:
            return _token_cache["access_token"]

        # Try API key first if available
        if PREZZEE_API_KEY:
            _token_cache["access_token"] = PREZZEE_API_KEY
            _token_cache["expires_at"] = now + timedelta(days=365)
            return PREZZEE_API_KEY

        # OAuth2 password grant
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{BASE_URL}/api/v1/auth/token",
                json={
                    "username": PREZZEE_USERNAME,
                    "password": PREZZEE_PASSWORD,
                    "grant_type": "password",
                },
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code not in (200, 201):
                # Try alternate auth endpoint
                resp = await client.post(
                    f"{BASE_URL}/api/v2/auth/",
                    json={"username": PREZZEE_USERNAME, "password": PREZZEE_PASSWORD},
                    headers={"Content-Type": "application/json"},
                )

            resp.raise_for_status()
            data = resp.json()
            token = data.get("access_token") or data.get("token") or data.get("data", {}).get("access_token")
            if not token:
                raise ValueError(f"No access_token in Prezzee auth response: {data}")

            expires_in = data.get("expires_in", 3600)
            _token_cache["access_token"] = token
            _token_cache["expires_at"] = now + timedelta(seconds=int(expires_in) - 60)
            payment_logger.info("Prezzee: obtained new access token")
            return token


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def get_float_balance() -> dict:
    """Return the current Prezzee float balance."""
    token = await _get_access_token()
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{BASE_URL}/api/v2/float/", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


async def get_order_by_reference(reference: str) -> dict | None:
    """Idempotency check — return existing order or None."""
    try:
        token = await _get_access_token()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{BASE_URL}/api/v2/orders/",
                params={"reference": reference},
                headers=_headers(token),
            )
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results") or data.get("data") or []
            if results:
                return results[0]
            return None
    except Exception as e:
        error_logger.warning(f"Prezzee idempotency check failed: {e}")
        return None


async def create_gift_card(
    reference: str,
    amount_dollars: float,
    recipient_name: str,
    recipient_email: str,
    product_code: str = None,
) -> dict:
    """
    Purchase a Prezzee Swap gift card and deliver it to recipient_email.
    reference must be unique per order (use 'tr-{lead_id}').
    Raises on failure.
    """
    product_code = product_code or PREZZEE_PRODUCT_CODE

    # Idempotency: don't double-issue
    existing = await get_order_by_reference(reference)
    if existing:
        payment_logger.info(f"Prezzee: duplicate order skipped | ref={reference} | existing={existing.get('uuid')}")
        return existing

    # Float check
    try:
        float_data = await get_float_balance()
        float_balance = float(
            float_data.get("balance")
            or float_data.get("data", {}).get("balance")
            or 0
        )
        if float_balance < amount_dollars:
            error_logger.error(
                f"Prezzee float insufficient: have ${float_balance:.2f}, need ${amount_dollars:.2f}"
            )
            raise ValueError(f"Prezzee float too low (${float_balance:.2f} < ${amount_dollars:.2f}). Top up the TradeRefer Prezzee account.")
    except ValueError:
        raise
    except Exception as e:
        error_logger.warning(f"Prezzee float check failed (proceeding): {e}")

    token = await _get_access_token()

    payload = {
        "reference": reference,
        "products": [
            {
                "product_code": product_code,
                "face_value": round(amount_dollars, 2),
                "quantity": 1,
                "recipient": {
                    "name": recipient_name,
                    "email": recipient_email,
                },
                "sender": {
                    "name": PREZZEE_SENDER_NAME,
                },
                "personalisation": {
                    "message": f"Thanks for being a great TradeRefer! Here's your ${amount_dollars:.0f} reward.",
                },
            }
        ],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BASE_URL}/api/v2/orders/",
            json=payload,
            headers=_headers(token),
        )
        if resp.status_code not in (200, 201, 202):
            error_logger.error(f"Prezzee order failed: {resp.status_code} {resp.text}")
            raise ValueError(f"Prezzee API error {resp.status_code}: {resp.text}")

        data = resp.json()
        order = data.get("data") or data
        payment_logger.info(
            f"Prezzee gift card issued | ref={reference} | amount=${amount_dollars:.2f} | email={recipient_email} | uuid={order.get('uuid')}"
        )
        return order
