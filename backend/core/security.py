import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies standard OWASP security headers to all HTTP responses.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        # Enforce HSTS if HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            
        return response

class RateLimiter:
    """
    In-memory Token Bucket rate limiter.
    Limits requests per IP address or user ID over a sliding window.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.window = 60.0
        # client_id -> list of timestamps
        self.history: Dict[str, list[float]] = defaultdict(list)
        
    def check_rate_limit(self, client_id: str):
        now = time.time()
        timestamps = self.history[client_id]
        
        # Filter timestamps within current window
        cutoff = now - self.window
        self.history[client_id] = [t for t in timestamps if t > cutoff]
        
        if len(self.history[client_id]) >= self.rpm:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: maximum {self.rpm} requests per minute. Please try again shortly."
            )
            
        self.history[client_id].append(now)

# Default global rate limiter instances
default_limiter = RateLimiter(requests_per_minute=100)
ai_service_limiter = RateLimiter(requests_per_minute=30) # tighter limit for heavy AI operations

def rate_limit_dependency(request: Request):
    """
    FastAPI dependency applying rate limiting per client IP or Auth Bearer token.
    """
    auth_header = request.headers.get("Authorization", "")
    client_id = auth_header if auth_header else (request.client.host if request.client else "unknown")
    default_limiter.check_rate_limit(client_id)

def ai_rate_limit_dependency(request: Request):
    """
    FastAPI dependency applying strict rate limiting for resource-intensive AI generation.
    """
    auth_header = request.headers.get("Authorization", "")
    client_id = auth_header if auth_header else (request.client.host if request.client else "unknown")
    ai_service_limiter.check_rate_limit(client_id)
