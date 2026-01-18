import os
import json
from google import genai
from services.transcript_service import get_raw_transcript
from dotenv import load_dotenv
from utils.cache import cache_with_ttl

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# New Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


def calculate_wpm(transcript_list):
    if not transcript_list:
        return 0
    try:
        full_text = " ".join([t['text'] for t in transcript_list])
        word_count = len(full_text.split())
        start = transcript_list[0]['start']
        end_entry = transcript_list[-1]
        end = end_entry['start'] + end_entry['duration']
        duration_minutes = (end - start) / 60.0
        if duration_minutes <= 0:
            return 0
        return round(word_count / duration_minutes)
    except Exception:
        return 0


@cache_with_ttl(ttl_seconds=86400)
def infer_accent_and_style(transcript_sample: str, channel_title: str = ""):
    if not GEMINI_API_KEY:
        return {"accent": "Unknown", "tone": "Unknown"}

    prompt = f"""
    Analyze the speaking style and probable region/accent of this teacher based on their transcript sample and channel name.
    
    Channel Name: {channel_title}
    Transcript Sample: "{transcript_sample[:2000]}"
    
    Task:
    1. Guess the probable Accent/Region (e.g., "Indian English", "US English", "British English", "Non-Native Neutral").
    2. Identify the Tone (e.g., "Formal/Academic", "Casual/Youtuber", "Fast-Paced", "Slow/Tutorial").
    
    Return JSON:
    {{
        "accent": "...", 
        "tone": "..."
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )

        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

    except Exception as e:
        print(f"Error inferring style: {e}")
        return {"accent": "Unknown", "tone": "Unknown"}


def analyze_style(video_id: str, channel_title: str = ""):
    raw_transcript = get_raw_transcript(video_id)
    if not raw_transcript:
        return {"wpm": 0, "accent": "Unknown", "tone": "Unknown"}

    wpm = calculate_wpm(raw_transcript)
    sample_text = " ".join([t['text'] for t in raw_transcript[:50]])
    style_info = infer_accent_and_style(sample_text, channel_title)

    return {
        "video_id": video_id,
        "wpm": wpm,
        "accent": style_info.get("accent", "Unknown"),
        "tone": style_info.get("tone", "Unknown")
    }
