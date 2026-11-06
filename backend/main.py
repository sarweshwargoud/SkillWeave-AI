import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from routers import search, analyze, course, learning, user_workspace
from core.config import settings
from core.security import SecurityHeadersMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# 1. OWASP Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. Hardened CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# 3. Global Sanitized Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log securely without leaking credentials or internal database traces
    print(f"[SECURITY ALERT] Unhandled Exception at {request.method} {request.url.path}: {type(exc).__name__}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. The incident has been logged."}
    )

# 4. Include Routers
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(course.router, prefix="/api/v1", tags=["Course"])
app.include_router(learning.router, prefix="/api/v1", tags=["Learning Ecosystem"])
app.include_router(user_workspace.router, prefix="/api/v1", tags=["User Workspace & Cloud Hub"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "auth_provider": "Supabase"
    }

# 5. SPA Frontend Fallback Routing
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_app(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found."})

        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "SkillWeave AI Platform API"}
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to SkillWeave AI Platform API"}
