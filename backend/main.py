from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, analyze, course, learning

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

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillWeave AI Platform API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.2.0"}
