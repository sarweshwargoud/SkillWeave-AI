from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional
from core.security import rate_limit_dependency, ai_rate_limit_dependency
from services.transcript_service import fetch_transcript
from services.llm_service import analyze_transcript

router = APIRouter(dependencies=[Depends(rate_limit_dependency)])

class AnalysisResult(BaseModel):
    video_id: str
    transcript_found: bool
    ai_analysis: Optional[dict] = None

@router.get("/analyze", response_model=AnalysisResult, dependencies=[Depends(ai_rate_limit_dependency)])
def analyze_video_endpoint(video_id: str = Query(..., min_length=5, max_length=50, description="YouTube Video ID")):
    """
    Fetches transcript and runs AI analysis for a single video.
    """
    try:
        transcript = fetch_transcript(video_id)
        
        if not transcript:
            return {
                "video_id": video_id,
                "transcript_found": False,
                "ai_analysis": None
            }
            
        analysis = analyze_transcript(transcript)
        
        return {
            "video_id": video_id,
            "transcript_found": True,
            "ai_analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Video analysis failed.")
