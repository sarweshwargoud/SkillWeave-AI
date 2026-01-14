from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from services.youtube_service import search_videos
from pydantic import BaseModel

router = APIRouter()

class VideoResult(BaseModel):
    id: str
    title: str
    description: str
    thumbnail: str
    channelTitle: str
    publishTime: str
    duration: float
    viewCount: int
    likeCount: int
    commentCount: int
    rankingScore: float

@router.get("/search", response_model=List[VideoResult])
def search_videos_endpoint(
    q: str = Query(..., description="Topic or Search Term"),
    limit: int = Query(10, description="Max results"),
    duration: str = Query("medium", description="Video duration filter: any, long, medium, short")
):
    try:
        videos = search_videos(q, limit, duration)
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
