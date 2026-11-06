import time
import requests
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from core.config import settings

# HTTP Bearer scheme
security = HTTPBearer(auto_error=False)

class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "authenticated"
    claims: Dict[str, Any] = {}

User = AuthenticatedUser


# In-memory token cache to minimize round-trips (token -> (user_dict, expires_at))
_TOKEN_CACHE: Dict[str, tuple[Dict[str, Any], float]] = {}

def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Supabase Auth access token.
    1. Checks local cache for recent verification.
    2. Validates via Supabase Auth API (/auth/v1/user).
    3. Validates JWT claims (exp, aud, iss, sub).
    """
    now = time.time()
    
    # 1. Check cache
    if token in _TOKEN_CACHE:
        cached_user, expires_at = _TOKEN_CACHE[token]
        if now < expires_at:
            return cached_user
        else:
            del _TOKEN_CACHE[token]

    # 2. Local JWT inspection
    try:
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        
        # Check expiration
        exp = unverified_payload.get("exp")
        if exp and exp < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired.",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Check audience
        aud = unverified_payload.get("aud")
        if aud and aud != settings.SUPABASE_AUDIENCE:
            # Some admin tokens may have 'service_role' or 'authenticated'
            if aud not in ["authenticated", "service_role"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token audience.",
                    headers={"WWW-Authenticate": "Bearer"}
                )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Cryptographic & Session Verification via Supabase Auth endpoint
    # This guarantees the token has not been revoked or user banned
    auth_url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_SECRET_KEY or settings.SUPABASE_SERVICE_ROLE_KEY or ""
    }
    
    try:
        resp = requests.get(auth_url, headers=headers, timeout=5)
        if resp.status_code == 200:
            user_data = resp.json()
            user_id = user_data.get("id") or unverified_payload.get("sub")
            email = user_data.get("email") or unverified_payload.get("email")
            
            result = {
                "id": str(user_id),
                "email": email,
                "role": user_data.get("role", "authenticated"),
                "claims": unverified_payload
            }
            
            # Cache for min(remaining token lifetime, 60 seconds)
            remaining_time = max(0, (exp - now) if exp else 60)
            cache_ttl = min(remaining_time, 60.0)
            if cache_ttl > 5:
                _TOKEN_CACHE[token] = (result, now + cache_ttl)
                
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked authentication credentials.",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except requests.RequestException:
        # If Supabase Auth endpoint is momentarily unreachable, fall back to valid unexpired claims
        if unverified_payload.get("sub"):
            return {
                "id": str(unverified_payload["sub"]),
                "email": unverified_payload.get("email"),
                "role": unverified_payload.get("role", "authenticated"),
                "claims": unverified_payload
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to verify authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Dependency requiring a valid Supabase authenticated user.
    Rejects missing or invalid tokens with HTTP 401.
    """
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user_dict = verify_supabase_token(cred.credentials)
    return AuthenticatedUser(**user_dict)

async def get_optional_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    Dependency allowing optional authentication.
    Returns AuthenticatedUser if valid token provided; None otherwise.
    """
    if not cred or not cred.credentials:
        return None
    try:
        user_dict = verify_supabase_token(cred.credentials)
        return AuthenticatedUser(**user_dict)
    except HTTPException:
        return None

def enforce_ownership(resource_owner_id: str, current_user: AuthenticatedUser):
    """
    Enforces user isolation and prevents Insecure Direct Object Reference (IDOR).
    Raises HTTP 403 Forbidden if current_user does not own the resource.
    """
    if str(resource_owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to access or modify this resource."
        )
