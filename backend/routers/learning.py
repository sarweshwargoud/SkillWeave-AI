from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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

router = APIRouter()

# --- Request / Response Models ---
class URLParseRequest(BaseModel):
    url_or_id: str

class NotesRequest(BaseModel):
    video_id_or_url: str
    note_style: Optional[str] = "detailed"

class TutorChatRequest(BaseModel):
    video_id_or_url: str
    question: str
    timestamp_context: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None

class QuizRequest(BaseModel):
    video_id_or_url: str
    num_questions: Optional[int] = 5

class RoadmapURLRequest(BaseModel):
    url_or_id: str
    level: Optional[str] = "Beginner"

# --- Endpoints ---

@router.post("/youtube/parse")
def parse_youtube_endpoint(request: URLParseRequest):
    """
    Parses a YouTube URL or ID, detects if it is a video or playlist,
    and returns its details.
    """
    try:
        target = extract_youtube_target(request.url_or_id)
        if not target:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID.")

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
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/youtube/transcript")
def get_transcript_endpoint(video_id: str = Query(..., description="YouTube Video ID")):
    """
    Fetches the full transcript with start timestamps and formatted MM:SS time strings.
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notes/generate")
def generate_notes_endpoint(request: NotesRequest):
    """
    Feature 2: AI Handwritten Notes Generator.
    Generates structured study notes from any YouTube video.
    """
    try:
        notes = generate_handwritten_notes(request.video_id_or_url, request.note_style)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tutor/chat")
def tutor_chat_endpoint(request: TutorChatRequest):
    """
    Feature 3: AI Video Tutor.
    Answers questions grounded in the video's transcript with clickable timestamps.
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/generate")
def generate_quiz_endpoint(request: QuizRequest):
    """
    Feature 5: AI Quiz and Knowledge Assessment.
    Generates interactive MCQs grounded in the lesson transcript.
    """
    try:
        quiz = generate_video_quiz(request.video_id_or_url, request.num_questions)
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roadmap/generate-from-url")
def generate_roadmap_from_url_endpoint(request: RoadmapURLRequest):
    """
    Feature 1 & 6: AI Roadmap Generator from Video or Playlist URL.
    """
    try:
        roadmap = generate_roadmap_from_url(request.url_or_id, request.level)
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
