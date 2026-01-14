import os
import google.generativeai as genai
import json
from services.transcript_service import get_raw_transcript, get_transcript_segment
from dotenv import load_dotenv
from utils.cache import cache_with_ttl

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def calculate_wpm(transcript_list):
    """
    Calculates Words Per Minute from the raw transcript.
    """
    if not transcript_list:
        return 0
        
    try:
        # Total words
        full_text = " ".join([t['text'] for t in transcript_list])
        word_count = len(full_text.split())
        
        # Duration in minutes
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
    """
    Uses LLM to infer the accent/region of the speaker based on the text.
    (Note: This is imperfect but works for distinct styles, e.g. "Indian English" 
    often uses specific phrasings or covers specific curriculum topics in a certain way, 
    but mainly we are guessing Region from context or just categorizing the 'Text Style').
    
    Actually, for true accent detection without audio, we rely on:
    1. Channel Name (often indicative).
    2. Transcript nuances (spelling, idioms).
    """
    if not GEMINI_API_KEY:
        return {"accent": "Unknown", "tone": "Unknown"}

    model = genai.GenerativeModel('gemini-flash-latest')
    
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
        response = model.generate_content(prompt)
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
    """
    Orchestrates the style analysis (WPM + Accent/Tone).
    """
    raw_transcript = get_raw_transcript(video_id)
    if not raw_transcript:
        return {"wpm": 0, "accent": "Unknown", "tone": "Unknown"}
        
    # 1. Calculate and classify Speed (WPM)
    wpm = calculate_wpm(raw_transcript)
    
    # 2. Infer Accent/Tone
    # We use a sample of the text for cost/speed efficiency
    sample_text = " ".join([t['text'] for t in raw_transcript[:50]]) # First 50 lines
    style_info = infer_accent_and_style(sample_text, channel_title)
    
    return {
        "video_id": video_id,
        "wpm": wpm,
        "accent": style_info.get("accent", "Unknown"),
        "tone": style_info.get("tone", "Unknown")
    }
