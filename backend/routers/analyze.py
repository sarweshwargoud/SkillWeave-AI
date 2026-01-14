from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from services.transcript_service import fetch_transcript
from services.llm_service import analyze_transcript
from services.youtube_service import search_videos

router = APIRouter()

class AnalysisResult(BaseModel):
    video_id: str
    transcript_found: bool
    ai_analysis: Optional[dict] = None

@router.get("/analyze", response_model=AnalysisResult)
def analyze_video_endpoint(video_id: str = Query(..., description="YouTube Video ID")):
    """
    Fetches transcript and runs AI analysis for a single video.
    """
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
