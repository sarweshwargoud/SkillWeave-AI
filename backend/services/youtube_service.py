import os
import re
import isodate
from urllib.parse import urlparse, parse_qs
from googleapiclient.discovery import build
from dotenv import load_dotenv
from utils.cache import cache_with_ttl

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_youtube_client():
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not set in environment variables.")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

def extract_youtube_target(url_or_id: str):
    """
    Parses a YouTube URL or ID and determines if it is a video or playlist.
    Returns:
        dict: {"type": "playlist" | "video", "id": str, "video_id": Optional[str]}
    """
    clean_str = url_or_id.strip()
    
    # Check if raw playlist ID
    if clean_str.startswith("PL") and len(clean_str) >= 16 and " " not in clean_str:
        return {"type": "playlist", "id": clean_str}
        
    # Check if raw 11-char video ID
    if len(clean_str) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", clean_str):
        return {"type": "video", "id": clean_str}

    parsed = urlparse(clean_str)
    qs = parse_qs(parsed.query)

    # Playlist URL check
    if "list" in qs and qs["list"]:
        playlist_id = qs["list"][0]
        video_id = qs.get("v", [None])[0]
        # If it's a playlist URL or watch with playlist
        return {"type": "playlist", "id": playlist_id, "video_id": video_id}

    # Video URL checks
    if "v" in qs and qs["v"]:
        return {"type": "video", "id": qs["v"][0]}

    if "youtu.be" in parsed.netloc:
        path_parts = parsed.path.strip("/").split("/")
        if path_parts and path_parts[0]:
            return {"type": "video", "id": path_parts[0]}

    if "embed" in parsed.path or "v" in parsed.path:
        parts = [p for p in parsed.path.split("/") if p]
        if parts:
            return {"type": "video", "id": parts[-1]}

    # Fallback default assuming video id if matched
    match = re.search(r"([a-zA-Z0-9_-]{11})", clean_str)
    if match:
        return {"type": "video", "id": match.group(1)}

    return None

@cache_with_ttl(ttl_seconds=3600)
def get_video_details(video_id: str):
    """
    Fetch comprehensive details for a single video.
    """
    youtube = get_youtube_client()
    response = youtube.videos().list(
        part="snippet,contentDetails,statistics",
        id=video_id
    ).execute()

    items = response.get("items", [])
    if not items:
        return None

    item = items[0]
    snippet = item["snippet"]
    content_details = item["contentDetails"]
    statistics = item.get("statistics", {})

    duration_iso = content_details.get("duration", "PT0S")
    duration_seconds = isodate.parse_duration(duration_iso).total_seconds()

    return {
        "id": video_id,
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url") or 
                     snippet.get("thumbnails", {}).get("medium", {}).get("url") or 
                     f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "channelTitle": snippet.get("channelTitle", ""),
        "publishTime": snippet.get("publishedAt", ""),
        "duration": duration_seconds,
        "durationFormatted": f"{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}",
        "viewCount": int(statistics.get("viewCount", 0)),
        "likeCount": int(statistics.get("likeCount", 0)),
        "commentCount": int(statistics.get("commentCount", 0)),
    }

@cache_with_ttl(ttl_seconds=3600)
def get_playlist_details(playlist_id: str, max_items: int = 50):
    """
    Fetch full playlist details and ordered video items.
    """
    youtube = get_youtube_client()

    # 1. Fetch playlist metadata
    playlist_res = youtube.playlists().list(
        part="snippet,contentDetails",
        id=playlist_id
    ).execute()

    items = playlist_res.get("items", [])
    if not items:
        return None

    p_snippet = items[0]["snippet"]
    p_title = p_snippet.get("title", "Untitled Playlist")
    p_description = p_snippet.get("description", "")
    p_channel = p_snippet.get("channelTitle", "")
    p_thumbnail = p_snippet.get("thumbnails", {}).get("high", {}).get("url") or ""

    # 2. Fetch playlist items
    videos = []
    next_page_token = None

    while len(videos) < max_items:
        items_res = youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=min(50, max_items - len(videos)),
            pageToken=next_page_token
        ).execute()

        video_ids = []
        raw_items = items_res.get("items", [])

        for it in raw_items:
            vid_id = it["contentDetails"].get("videoId")
            # Skip private/deleted videos
            if vid_id and it["snippet"].get("title") != "Private video" and it["snippet"].get("title") != "Deleted video":
                video_ids.append(vid_id)

        if not video_ids:
            break

        # Fetch durations for these videos
        stats_res = youtube.videos().list(
            part="contentDetails,statistics",
            id=",".join(video_ids)
        ).execute()
        stats_map = {v["id"]: v for v in stats_res.get("items", [])}

        for it in raw_items:
            vid_id = it["contentDetails"].get("videoId")
            if not vid_id or vid_id not in stats_map:
                continue

            snip = it["snippet"]
            stat_obj = stats_map[vid_id]
            dur_iso = stat_obj["contentDetails"].get("duration", "PT0S")
            dur_sec = isodate.parse_duration(dur_iso).total_seconds()

            videos.append({
                "id": vid_id,
                "title": snip.get("title", ""),
                "description": snip.get("description", ""),
                "thumbnail": snip.get("thumbnails", {}).get("high", {}).get("url") or 
                             snip.get("thumbnails", {}).get("medium", {}).get("url") or 
                             f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg",
                "channelTitle": snip.get("channelTitle", p_channel),
                "duration": dur_sec,
                "durationFormatted": f"{int(dur_sec // 60)}:{int(dur_sec % 60):02d}",
                "position": snip.get("position", len(videos))
            })

        next_page_token = items_res.get("nextPageToken")
        if not next_page_token:
            break

    total_duration_sec = sum(v["duration"] for v in videos)

    return {
        "id": playlist_id,
        "title": p_title,
        "description": p_description,
        "channelTitle": p_channel,
        "thumbnail": p_thumbnail or (videos[0]["thumbnail"] if videos else ""),
        "videoCount": len(videos),
        "totalDuration": total_duration_sec,
        "totalDurationFormatted": f"{int(total_duration_sec // 3600)}h {int((total_duration_sec % 3600) // 60)}m",
        "videos": videos
    }

@cache_with_ttl(ttl_seconds=3600)
def search_videos(query: str, max_results: int = 10, video_duration: str = "medium"):
    """
    Search for videos on YouTube.
    """
    youtube = get_youtube_client()
    
    search_response = youtube.search().list(
        q=query,
        part="id,snippet",
        maxResults=max_results,
        type="video",
        videoDuration=video_duration,
        relevanceLanguage="en",
        order="relevance"
    ).execute()
    
    videos = []
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
            
        duration_iso = stats["contentDetails"]["duration"]
        duration_seconds = isodate.parse_duration(duration_iso).total_seconds()
        
        if duration_seconds < 120 or duration_seconds > 28800:
            continue
            
        video_data = {
            "id": video_id,
            "title": snippet["title"],
            "description": snippet["description"],
            "thumbnail": snippet["thumbnails"]["high"]["url"],
            "channelTitle": snippet["channelTitle"],
            "publishTime": snippet["publishTime"],
            "duration": duration_seconds,
            "durationFormatted": f"{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}",
            "viewCount": int(stats["statistics"].get("viewCount", 0)),
            "likeCount": int(stats["statistics"].get("likeCount", 0)),
            "commentCount": int(stats["statistics"].get("commentCount", 0)),
        }
        
        views = video_data["viewCount"]
        likes = video_data["likeCount"]
        comments = video_data["commentCount"]
        
        like_ratio = (likes / views) if views > 0 else 0
        comment_ratio = (comments / views) if views > 0 else 0
            
        view_score = min(views / 100000, 10) 
        engagement_score = like_ratio * 100
        discussion_score = comment_ratio * 200
        total_score = (view_score * 0.4) + (engagement_score * 0.4) + (discussion_score * 0.2)
        video_data["rankingScore"] = round(total_score, 2)
        
        videos.append(video_data)
        
    videos.sort(key=lambda x: x["rankingScore"], reverse=True)
    return videos
