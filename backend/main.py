from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, analyze, course

app = FastAPI(title="EduPath API", version="0.1.0")

# CORS Setup
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://skill-weave-ai.vercel.app,
    "https://your-vercel-domain.vercel.app"
]
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(course.router, prefix="/api/v1", tags=["Course"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillWeave API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
