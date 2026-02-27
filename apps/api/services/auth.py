from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import httpx
import os
import uuid
import time
from pydantic import BaseModel
from typing import Optional
from utils.logging_config import auth_logger, error_logger

security = HTTPBearer()

# Cache for JWKS with TTL (1 hour)
_jwks = None
_jwks_fetched_at: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour in seconds

async def get_jwks():
    global _jwks, _jwks_fetched_at
    now = time.time()
    if _jwks is None or (now - _jwks_fetched_at) > JWKS_CACHE_TTL:
        jwks_url = os.getenv("CLERK_JWKS_URL") or os.getenv("NEON_AUTH_JWKS_URL")
        if not jwks_url:
            raise Exception("No JWKS URL configured (CLERK_JWKS_URL or NEON_AUTH_JWKS_URL)")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url)
                response.raise_for_status()
                _jwks = response.json()
                _jwks_fetched_at = now
        except Exception as e:
            auth_logger.error(f"Error fetching JWKS: {e}")
            # If we have stale keys, use them rather than failing
            if _jwks is not None:
                return _jwks
            raise HTTPException(status_code=500, detail="Failed to verify authentication provider")
    return _jwks

class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    is_admin: bool = False

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> AuthenticatedUser:
    jwks = await get_jwks()
    
    try:
        # Note: Neon Auth currently doesn't provide the 'aud' in the same way some others do, 
        # or it might be the project ID. For now, we skip 'aud' check if unknown.
        header = jwt.get_unverified_header(token.credentials)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        if rsa_key:
            payload = jwt.decode(
                token.credentials,
                rsa_key,
                algorithms=["RS256"],
                options={"verify_aud": False, "verify_iss": False, "verify_sub": True}
            )
            
            clerk_id = payload.get("sub")
            email = payload.get("email")
            # Generate a stable UUID from the Clerk ID to maintain database compatibility
            stable_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, clerk_id))
            
            # Simple admin check via env var
            admin_emails = (os.getenv("ADMIN_EMAILS") or "").split(",")
            is_admin = email in admin_emails if email else False
            
            return AuthenticatedUser(
                id=stable_uuid,
                email=email,
                is_admin=is_admin
            )
    except Exception as e:
        error_logger.error(f"Auth error (Token Decoding): {e}")
        unverified_header = jwt.get_unverified_header(token.credentials)
        auth_logger.info(f"Token Header: {unverified_header}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
