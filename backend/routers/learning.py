from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from core.auth import get_optional_user, AuthenticatedUser
from core.security import rate_limit_dependency, ai_rate_limit_dependency
from core.db import save_note_for_user, save_project_for_user
from services.youtube_service import (
    extract_youtube_target,
    get_video_details,
    get_playlist_details
)
from services.transcript_service import (
    fetch_transcript,
    fetch_transcript_with_timestamps
)
from services.notes_service import generate_handwritten_notes
from services.tutor_service import answer_tutor_question
from services.quiz_service import generate_video_quiz
from services.roadmap_service import generate_roadmap_from_url

router = APIRouter(dependencies=[Depends(rate_limit_dependency)])

# --- Request / Response Models ---
class URLParseRequest(BaseModel):
    url_or_id: str = Field(..., min_length=2, max_length=500)

class NotesRequest(BaseModel):
    video_id_or_url: str = Field(..., min_length=2, max_length=500)
    note_style: Optional[str] = "detailed"
    auto_save: Optional[bool] = False

class TutorChatRequest(BaseModel):
    video_id_or_url: str = Field(..., min_length=2, max_length=500)
    question: str = Field(..., min_length=1, max_length=2000)
    timestamp_context: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None

class QuizRequest(BaseModel):
    video_id_or_url: str = Field(..., min_length=2, max_length=500)
    num_questions: Optional[int] = Field(default=5, ge=1, le=15)

class RoadmapURLRequest(BaseModel):
    url_or_id: str = Field(..., min_length=2, max_length=500)
    level: Optional[str] = "Beginner"
    auto_save: Optional[bool] = False

# --- Endpoints ---

@router.post("/youtube/parse")
def parse_youtube_endpoint(request: URLParseRequest):
    """
    Parses a YouTube URL or ID, detects if it is a video or playlist,
    and returns verified public metadata.
    """
    try:
        target = extract_youtube_target(request.url_or_id)
        if not target:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID format.")

        if target["type"] == "playlist":
            data = get_playlist_details(target["id"])
            if not data:
                raise HTTPException(status_code=404, detail="Playlist not found or is private.")
            return {"type": "playlist", "data": data}
        else:
            data = get_video_details(target["id"])
            if not data:
                raise HTTPException(status_code=404, detail="Video not found or is private.")
            return {"type": "video", "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse YouTube target.")

@router.get("/youtube/transcript")
def get_transcript_endpoint(video_id: str = Query(..., min_length=5, max_length=50, description="YouTube Video ID")):
    """
    Fetches transcript segments with start timestamps.
    """
    try:
        segments = fetch_transcript_with_timestamps(video_id)
        full_text = fetch_transcript(video_id)
        return {
            "video_id": video_id,
            "has_transcript": bool(segments),
            "segments": segments or [],
            "full_text": full_text or ""
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch video transcript.")

@router.post("/notes/generate", dependencies=[Depends(ai_rate_limit_dependency)])
def generate_notes_endpoint(
    request: NotesRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    AI Handwritten Notes Generator.
    Grounded in the video transcript. If authenticated and auto_save is True,
    securely saves note with encryption at rest to the user's private library.
    """
    try:
        notes = generate_handwritten_notes(request.video_id_or_url, request.note_style)
        
        # If user is logged in and requested auto-save, persist to Supabase notes
        if user and request.auto_save and notes:
            try:
                save_note_for_user(
                    user_id=user.id,
                    note_data={
                        "video_id": notes.get("video_id", "general"),
                        "title": notes.get("title", "Study Notes"),
                        "notes_data": notes
                    },
                    encrypt_at_rest=True
                )
            except Exception as save_err:
                # Log but do not block response
                pass
                
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study notes: {str(e)}")

@router.post("/tutor/chat", dependencies=[Depends(ai_rate_limit_dependency)])
def tutor_chat_endpoint(
    request: TutorChatRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    AI Video Tutor: Answers questions grounded in the video's transcript.
    """
    try:
        reply = answer_tutor_question(
            video_id_or_url=request.video_id_or_url,
            question=request.question,
            timestamp_context=request.timestamp_context,
            chat_history=request.chat_history or []
        )
        return reply
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Tutor error: {str(e)}")

@router.post("/quiz/generate", dependencies=[Depends(ai_rate_limit_dependency)])
def generate_quiz_endpoint(request: QuizRequest):
    """
    AI Quiz & Knowledge Assessment: Generates interactive MCQs grounded in lesson transcript.
    """
    try:
        quiz = generate_video_quiz(request.video_id_or_url, request.num_questions)
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.post("/roadmap/generate-from-url", dependencies=[Depends(ai_rate_limit_dependency)])
def generate_roadmap_from_url_endpoint(
    request: RoadmapURLRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    AI Roadmap Generator from Video or Playlist URL.
    If authenticated and auto_save is True, saves to user's private project roadmaps.
    """
    try:
        roadmap = generate_roadmap_from_url(request.url_or_id, request.level)
        
        if user and request.auto_save and roadmap:
            try:
                save_project_for_user(
                    user_id=user.id,
                    project_data={
                        "title": roadmap.get("title", "YouTube Learning Roadmap"),
                        "description": roadmap.get("description", ""),
                        "level": request.level,
                        "roadmap_data": roadmap
                    }
                )
            except Exception:
                pass
                
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")
