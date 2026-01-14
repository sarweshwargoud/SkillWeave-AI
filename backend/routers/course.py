from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.course_generator import build_course

router = APIRouter()

class CourseRequest(BaseModel):
    topic: str
    level: str = "Beginner"
    accent_preference: Optional[str] = "Any"

@router.post("/generate")
def generate_course_endpoint(request: CourseRequest):
    """
    Generates a full course playlist.
    """
    try:
        course = build_course(request.topic, request.level, request.accent_preference)
        if "error" in course:
             raise HTTPException(status_code=500, detail=course["error"])
        return course
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DocDownloadRequest(BaseModel):
    course_data: dict

from fastapi.responses import StreamingResponse
from services.doc_generator import generate_course_docx
import urllib.parse

@router.post("/download-docx")
def download_docx_endpoint(request: DocDownloadRequest):
    try:
        buffer = generate_course_docx(request.course_data)
        safe_title = urllib.parse.quote(request.course_data.get('title', 'Roadmap').replace(' ', '_'))
        filename = f"{safe_title}.docx"
        
        return StreamingResponse(
            buffer, 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
