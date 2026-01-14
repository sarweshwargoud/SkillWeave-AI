import os
import isodate
from googleapiclient.discovery import build
from dotenv import load_dotenv
from utils.cache import cache_with_ttl

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_youtube_client():
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not set in environment variables.")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

@cache_with_ttl(ttl_seconds=3600)
def search_videos(query: str, max_results: int = 10, video_duration: str = "medium"):
    """
    Search for videos on YouTube.
    
    Args:
        query: Search term.
        max_results: Number of results to return.
        video_duration: 'any', 'long', 'medium', 'short'.
                        'medium' is 4-20 mins, usually good for tutorials.
    """
    youtube = get_youtube_client()
    
    search_response = youtube.search().list(
        q=query,
        part="id,snippet",
        maxResults=max_results,
        type="video",
        videoDuration=video_duration,
        relevanceLanguage="en",
        order="relevance" # Or 'viewCount', 'rating'
    ).execute()
    
    videos = []
    
    # We need video details for stats (views, likes, duration)
    video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]
    
    if not video_ids:
        return []
        
    stats_response = youtube.videos().list(
        part="contentDetails,statistics",
        id=",".join(video_ids)
    ).execute()
    
    stats_map = {item["id"]: item for item in stats_response.get("items", [])}
    
    for item in search_response.get("items", []):
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        stats = stats_map.get(video_id)
        
        if not stats:
            continue
            
        # Parse Duration (ISO 8601)
        duration_iso = stats["contentDetails"]["duration"]
        duration_seconds = isodate.parse_duration(duration_iso).total_seconds()
        
        # Basic filtering: > 4 min (240s) and < 4 hr (14400s)
        if duration_seconds < 240 or duration_seconds > 14400:
            continue
            
        video_data = {
            "id": video_id,
            "title": snippet["title"],
            "description": snippet["description"],
            "thumbnail": snippet["thumbnails"]["high"]["url"],
            "channelTitle": snippet["channelTitle"],
            "publishTime": snippet["publishTime"],
            "duration": duration_seconds,
            "viewCount": int(stats["statistics"].get("viewCount", 0)),
            "likeCount": int(stats["statistics"].get("likeCount", 0)),
            "commentCount": int(stats["statistics"].get("commentCount", 0)),
        }
        
        # Calculate Ranking Score (Phase 1 filtered)
        views = video_data["viewCount"]
        likes = video_data["likeCount"]
        comments = video_data["commentCount"]
        
        if views > 0:
            like_ratio = likes / views
            comment_ratio = comments / views
        else:
            like_ratio = 0
            comment_ratio = 0
            
        # Context: A good tutorial has high engagement (likes) relative to views
        # Normalize stats for score:
        # Logarithmic scale for views might be better, but linear for now with cap?
        # Let's use a weighted approach:
        # Score = (Like Ratio * 50) + (Comment Ratio * 100) + (Log(Views)*Factor)
        # Simplified for MVP:
        
        # 1. View Score (Popularity): Cap at 1M for normalization (0-10)
        view_score = min(views / 100000, 10) 
        
        # 2. Engagement Score (Quality): Like ratio standard is ~4%. 
        # If > 10% it's amazing. 
        engagement_score = (like_ratio * 100) # e.g., 0.04 * 100 = 4.
        
        # 3. Discussion Score: Comment ratio
        discussion_score = (comment_ratio * 200) # e.g., 0.005 * 200 = 1.
        
        # 4. Total Score
        total_score = (view_score * 0.4) + (engagement_score * 0.4) + (discussion_score * 0.2)
        
        video_data["rankingScore"] = round(total_score, 2)
        
        videos.append(video_data)
        
    # Sort by ranking score
    videos.sort(key=lambda x: x["rankingScore"], reverse=True)
    
    return videos
