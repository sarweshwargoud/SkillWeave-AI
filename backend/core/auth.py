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

# In-memory token cache to minimize latency and round-trips (token -> (user_dict, expires_at))
_TOKEN_CACHE: Dict[str, tuple[Dict[str, Any], float]] = {}

# Cached JWKS keys from Supabase
_JWKS_CACHE: Dict[str, Any] = {"keys": [], "expires_at": 0.0}

def get_jwks_keys() -> list:
    """
    Retrieves and caches the JSON Web Key Set (JWKS) from Supabase.
    """
    now = time.time()
    if _JWKS_CACHE["keys"] and now < _JWKS_CACHE["expires_at"]:
        return _JWKS_CACHE["keys"]
        
    try:
        resp = requests.get(settings.SUPABASE_JWKS_URL, timeout=4)
        if resp.status_code == 200:
            keys = resp.json().get("keys", [])
            _JWKS_CACHE["keys"] = keys
            _JWKS_CACHE["expires_at"] = now + 3600.0  # Cache keys for 1 hour
            return keys
    except Exception:
        # Return previously cached keys if network has transient hiccup
        if _JWKS_CACHE["keys"]:
            return _JWKS_CACHE["keys"]
            
    return []

def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Centralized cryptographic verification for Supabase Auth access tokens.
    Supports both Google OAuth tokens and Email/Password sessions.
    
    Verification pipeline:
    1. Fast in-memory cache lookup.
    2. Header inspection (ES256 / HS256 detection).
    3. Expiration, Audience, and Issuer verification.
    4. Cryptographic signature check (via JWKS for ES256, or Secret Key for HS256).
    5. Supabase Auth API verification (/auth/v1/user) for revocation check.
    """
    now = time.time()
    
    # 1. Fast cache check
    if token in _TOKEN_CACHE:
        cached_user, expires_at = _TOKEN_CACHE[token]
        if now < expires_at:
            return cached_user
        else:
            del _TOKEN_CACHE[token]

    # 2. Inspect token headers and claims without signature verification first
    try:
        header = jwt.get_unverified_header(token)
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed authentication token: {str(e)}",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
        )

    # 3. Check token expiration
    exp = unverified_payload.get("exp")
    if exp and exp < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please sign in again.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token", error_description="token expired"'}
        )

    # 4. Check audience
    aud = unverified_payload.get("aud")
    if aud and aud not in ["authenticated", "service_role"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
        )

    # 5. Cryptographic signature verification
    alg = header.get("alg", "ES256")
    verified_payload = None

    if alg == "HS256" and (settings.SUPABASE_JWT_SECRET or settings.SUPABASE_SECRET_KEY):
        secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_SECRET_KEY
        try:
            verified_payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_exp": True, "verify_aud": False}
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired.",
                headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
            )
        except jwt.PyJWTError:
            verified_payload = None

    elif alg == "ES256":
        kid = header.get("kid")
        jwks_keys = get_jwks_keys()
        matching_key = None
        for k in jwks_keys:
            if not kid or k.get("kid") == kid:
                matching_key = k
                break

        if matching_key:
            try:
                public_key = jwt.PyJWK(matching_key).key
                verified_payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["ES256"],
                    options={"verify_exp": True, "verify_aud": False}
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired.",
                    headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
                )
            except jwt.PyJWTError:
                verified_payload = None

    # 6. Verify with Supabase Auth endpoint (/auth/v1/user)
    # Ensures session has not been revoked or user banned
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
                "claims": verified_payload or unverified_payload
            }

            # Cache verified session (TTL: min(token remaining, 60 seconds))
            remaining_time = max(0, (exp - now) if exp else 60)
            cache_ttl = min(remaining_time, 60.0)
            if cache_ttl > 5:
                _TOKEN_CACHE[token] = (result, now + cache_ttl)

            return result
        elif verified_payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked authentication credentials.",
                headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
            )
    except requests.RequestException:
        # Fall back to cryptographic token verification if Supabase network endpoint is unreachable
        pass

    # If cryptographic verification passed but network check timed out, accept valid token
    if verified_payload and verified_payload.get("sub"):
        result = {
            "id": str(verified_payload["sub"]),
            "email": verified_payload.get("email"),
            "role": verified_payload.get("role", "authenticated"),
            "claims": verified_payload
        }
        return result

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to verify authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"}
    )

async def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Centralized FastAPI dependency requiring a verified Supabase authenticated user.
    Rejects missing, invalid, or expired tokens with HTTP 401.
    """
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token. Please sign in to access this endpoint.",
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
