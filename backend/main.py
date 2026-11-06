from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import search, analyze, course, learning
import os

app = FastAPI(title="SkillWeave AI Learning Platform API", version="0.2.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(course.router, prefix="/api/v1", tags=["Course"])
app.include_router(learning.router, prefix="/api/v1", tags=["Learning Ecosystem"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.2.0"}

# SPA Frontend Fallback Routing (Solves 404 on page refresh on any endpoint)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_app(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return {"detail": "API endpoint not found"}

        # Serve static file if exists in dist
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)

        # Fallback to index.html for client-side routing on any endpoint
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "SkillWeave AI Platform API"}
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to SkillWeave AI Platform API"}
