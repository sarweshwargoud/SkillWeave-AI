import urllib.parse
import re
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from core.security import rate_limit_dependency, ai_rate_limit_dependency
from services.course_generator import build_course
from services.doc_generator import generate_course_docx

router = APIRouter(dependencies=[Depends(rate_limit_dependency)])

class CourseRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=150)
    level: str = Field(default="Beginner", max_length=30)
    accent_preference: Optional[str] = Field(default="Any", max_length=50)

class DocDownloadRequest(BaseModel):
    course_data: dict

@router.post("/generate", dependencies=[Depends(ai_rate_limit_dependency)])
def generate_course_endpoint(request: CourseRequest):
    """
    Generates a full course playlist with continuity and accent grouping.
    """
    try:
        course = build_course(request.topic, request.level, request.accent_preference)
        if "error" in course:
            raise HTTPException(status_code=500, detail=course["error"])
        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Course generation failed: {str(e)}")

@router.post("/download-docx")
def download_docx_endpoint(request: DocDownloadRequest):
    """
    Exports structured syllabus as Microsoft Word (.docx) document.
    """
    try:
        buffer = generate_course_docx(request.course_data)
        raw_title = request.course_data.get('title', 'SkillWeave_Roadmap')
        # Sanitize filename against header injection or path traversal
        clean_title = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', raw_title)[:60]
        filename = f"{clean_title}.docx"
        safe_header = urllib.parse.quote(filename)
        
        return StreamingResponse(
            buffer, 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_header}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document generation failed: {str(e)}")
