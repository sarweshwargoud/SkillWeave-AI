from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
from pydantic import BaseModel, Field
from core.security import rate_limit_dependency
from services.youtube_service import search_videos

router = APIRouter(dependencies=[Depends(rate_limit_dependency)])

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
    q: str = Query(..., min_length=1, max_length=150, description="Topic or Search Term"),
    limit: int = Query(10, ge=1, le=25, description="Max results (bounded to 25 to protect API quotas)"),
    duration: str = Query("medium", description="Video duration filter: any, long, medium, short")
):
    try:
        videos = search_videos(q, limit, duration)
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail="Search operation failed.")
