import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SkillWeave AI"
    VERSION: str = "0.3.0"
    
    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://hzxkqugdfyaizzibiexx.supabase.co").rstrip("/")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    
    # JWT Settings
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", os.getenv("SUPABASE_SECRET_KEY", ""))
    SUPABASE_JWKS_URL: str = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    SUPABASE_ISSUER: str = f"{SUPABASE_URL}/auth/v1"
    SUPABASE_AUDIENCE: str = "authenticated"
    
    # At-rest Envelope Encryption Key (AES-256 requires 32 bytes)
    # If not set, derives deterministic fallback from SUPABASE_SECRET_KEY for stability
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    
    # External APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    
    # CORS Allowlists
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://skill-weave-ai.vercel.app",
        "https://skill-weave-ai-1.onrender.com",
    ]

settings = Settings()
