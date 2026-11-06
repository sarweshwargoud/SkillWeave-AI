import os
import json
from google import genai
from dotenv import load_dotenv
from services.youtube_service import (
    extract_youtube_target,
    get_video_details,
    get_playlist_details,
    search_videos
)
from services.transcript_service import fetch_transcript, fetch_transcript_with_timestamps
from utils.cache import cache_with_ttl

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

@cache_with_ttl(ttl_seconds=86400)
def generate_roadmap_from_url(url_or_id: str, level: str = "Beginner"):
    """
    Generates a structured learning roadmap from either an individual video or playlist URL.
    """
    target = extract_youtube_target(url_or_id)
    if not target:
        raise ValueError(f"Could not parse valid YouTube video or playlist from: {url_or_id}")

    target_type = target["type"]

    if target_type == "playlist":
        return generate_playlist_roadmap(target["id"], level)
    else:
        return generate_single_video_roadmap(target["id"], level)

def generate_playlist_roadmap(playlist_id: str, level: str = "Beginner"):
    """
    Organizes playlist videos into pedagogical modules with learning objectives.
    """
    playlist_info = get_playlist_details(playlist_id)
    if not playlist_info:
        raise ValueError(f"Could not retrieve playlist metadata for ID: {playlist_id}")

    videos = playlist_info.get("videos", [])
    if not videos:
        raise ValueError("Playlist contains no public accessible videos.")

    # Prepare video summaries for LLM
    video_catalog = []
    for idx, v in enumerate(videos):
        video_catalog.append({
            "index": idx + 1,
            "id": v["id"],
            "title": v["title"],
            "duration": v["durationFormatted"]
        })

    prompt = f"""
    You are an expert curriculum architect.
    Organize the following YouTube playlist into a structured, modular educational course roadmap.
    
    Course Title: {playlist_info.get('title')}
    Channel: {playlist_info.get('channelTitle')}
    Level: {level}
    Total Videos: {len(videos)}
    
    Playlist Videos:
    {json.dumps(video_catalog[:35], indent=2)}

    Instructions:
    1. Group the videos in their original order into 2 to 5 meaningful thematic modules (e.g., 'Foundations', 'Core Techniques', 'Advanced Patterns').
    2. Assign each video to its module without skipping or reordering videos.
    3. State learning objectives, estimated completion time, and practical exercises for each module.
    4. List 2-3 prerequisites.

    Return strictly valid JSON:
    {{
      "course_title": "{playlist_info.get('title')}",
      "description": "Comprehensive course description...",
      "prerequisites": ["Basic understanding of programming", "Curiosity to learn"],
      "estimated_total_hours": 12.5,
      "modules": [
        {{
          "module_number": 1,
          "module_title": "Module Title",
          "objective": "What student will master",
          "exercise": "Practical coding/reflection task for this module",
          "video_ids": ["video_id_1", "video_id_2"]
        }}
      ]
    }}
    JSON Output:
    """

    try:
        if not client:
            raise ValueError("GEMINI_API_KEY is not configured.")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        ai_structure = json.loads(text.strip())

        # Combine AI modules with actual video objects
        video_map = {v["id"]: v for v in videos}
        final_modules = []

        for m_idx, mod in enumerate(ai_structure.get("modules", [])):
            module_lessons = []
            for vid_id in mod.get("video_ids", []):
                if vid_id in video_map:
                    module_lessons.append(video_map[vid_id])

            # If no videos matched directly, fallback
            if not module_lessons and videos:
                slice_size = max(1, len(videos) // max(1, len(ai_structure.get("modules", []))))
                start_i = m_idx * slice_size
                module_lessons = videos[start_i:start_i + slice_size]

            final_modules.append({
                "module_title": mod.get("module_title", f"Module {m_idx + 1}"),
                "objective": mod.get("objective", "Master module concepts"),
                "exercise": mod.get("exercise", "Build a small prototype"),
                "videos": module_lessons,
                "video": module_lessons[0] if module_lessons else (videos[0] if videos else None),
                "description": mod.get("objective", "")
            })

        return {
            "title": playlist_info.get("title"),
            "type": "playlist",
            "playlist_id": playlist_id,
            "thumbnail": playlist_info.get("thumbnail"),
            "channelTitle": playlist_info.get("channelTitle"),
            "totalVideos": len(videos),
            "totalDuration": playlist_info.get("totalDurationFormatted"),
            "prerequisites": ai_structure.get("prerequisites", ["Foundational interest"]),
            "modules": final_modules,
            "all_videos": videos
        }

    except Exception as e:
        print(f"Error grouping playlist {playlist_id}: {e}")
        # Graceful fallback: Group evenly into 3 modules
        chunk_size = max(1, (len(videos) + 2) // 3)
        fallback_modules = []
        for i in range(0, len(videos), chunk_size):
            chunk = videos[i:i + chunk_size]
            m_num = (i // chunk_size) + 1
            fallback_modules.append({
                "module_title": f"Module {m_num}: Step-by-Step Curriculum",
                "objective": "Progress through sequenced lessons",
                "exercise": "Review lessons and test understanding with quizzes",
                "videos": chunk,
                "video": chunk[0] if chunk else None,
                "description": f"Contains {len(chunk)} video lessons."
            })

        return {
            "title": playlist_info.get("title"),
            "type": "playlist",
            "playlist_id": playlist_id,
            "thumbnail": playlist_info.get("thumbnail"),
            "channelTitle": playlist_info.get("channelTitle"),
            "totalVideos": len(videos),
            "totalDuration": playlist_info.get("totalDurationFormatted"),
            "prerequisites": ["Basic interest in the subject"],
            "modules": fallback_modules,
            "all_videos": videos
        }

def generate_single_video_roadmap(video_id: str, level: str = "Beginner"):
    """
    Deconstructs a single video into a deep multi-module roadmap with timestamped lessons.
    """
    video_details = get_video_details(video_id)
    if not video_details:
        raise ValueError(f"Could not retrieve video metadata for ID: {video_id}")

    transcript = fetch_transcript(video_id)
    transcript_context = transcript[:15000] if transcript else video_details.get("description", "")

    prompt = f"""
    You are an expert curriculum architect.
    Deconstruct the following single YouTube video into a comprehensive modular roadmap with 3 to 5 learning milestones.
    
    Video Title: {video_details.get('title')}
    Channel: {video_details.get('channelTitle')}
    Duration: {video_details.get('durationFormatted')}
    Level: {level}
    
    Transcript Context:
    {transcript_context}

    Return strictly valid JSON:
    {{
      "course_title": "{video_details.get('title')}",
      "description": "Structured curriculum deconstructing this comprehensive masterclass",
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
      "estimated_total_hours": 3.0,
      "modules": [
        {{
          "module_title": "1. Module Milestone Title",
          "timestamp": "00:00",
          "start_seconds": 0,
          "objective": "What is learned in this segment",
          "description": "Clear explanation of topics covered",
          "exercise": "Actionable task for this segment"
        }}
      ]
    }}
    JSON Output:
    """

    try:
        if not client:
            raise ValueError("GEMINI_API_KEY is not configured.")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        ai_structure = json.loads(text.strip())

        # Construct modules where each references this video
        final_modules = []
        for m in ai_structure.get("modules", []):
            final_modules.append({
                "module_title": m.get("module_title"),
                "description": m.get("description"),
                "objective": m.get("objective"),
                "exercise": m.get("exercise"),
                "timestamp": m.get("timestamp", "00:00"),
                "start_seconds": m.get("start_seconds", 0),
                "video": {
                    **video_details,
                    "final_score": 99
                },
                "videos": [video_details]
            })

        return {
            "title": video_details.get("title"),
            "type": "video",
            "video_id": video_id,
            "thumbnail": video_details.get("thumbnail"),
            "channelTitle": video_details.get("channelTitle"),
            "totalVideos": 1,
            "totalDuration": video_details.get("durationFormatted"),
            "prerequisites": ai_structure.get("prerequisites", ["Open mindset to learn"]),
            "modules": final_modules,
            "all_videos": [video_details]
        }

    except Exception as e:
        print(f"Error deconstructing single video {video_id}: {e}")
        return {
            "title": video_details.get("title"),
            "type": "video",
            "video_id": video_id,
            "thumbnail": video_details.get("thumbnail"),
            "channelTitle": video_details.get("channelTitle"),
            "totalVideos": 1,
            "totalDuration": video_details.get("durationFormatted"),
            "prerequisites": ["Basic background"],
            "modules": [
                {
                    "module_title": "1. Conceptual Foundations",
                    "description": "Core ideas and architectural motivations introduced in the first portion of the lesson.",
                    "objective": "Understand foundational principles.",
                    "exercise": "Take notes on key definitions.",
                    "timestamp": "00:00",
                    "video": {**video_details, "final_score": 98},
                    "videos": [video_details]
                },
                {
                    "module_title": "2. Practical Implementation",
                    "description": "Deep-dive into hands-on code examples and execution flow.",
                    "objective": "Follow along with the instructor's implementation.",
                    "exercise": "Write and test the code shown in this section.",
                    "timestamp": "05:00",
                    "video": {**video_details, "final_score": 97},
                    "videos": [video_details]
                },
                {
                    "module_title": "3. Advanced Optimization & Review",
                    "description": "Edge cases, performance nuances, and final summary.",
                    "objective": "Consolidate learning and test retention.",
                    "exercise": "Complete the video quiz.",
                    "timestamp": "12:00",
                    "video": {**video_details, "final_score": 99},
                    "videos": [video_details]
                }
            ],
            "all_videos": [video_details]
        }
