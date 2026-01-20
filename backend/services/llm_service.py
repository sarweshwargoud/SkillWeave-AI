import os
import json
import typing
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from utils.cache import cache_with_ttl

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# NEW CLIENT (replaces configure + GenerativeModel)
client = genai.Client(api_key=GEMINI_API_KEY)

# Define structured output models for Gemini
class VideoTopic(BaseModel):
    main_topic: str
    subtopics: list[str]
    difficulty_level: str  # Beginner, Intermediate, Advanced
    completeness_score: int # 1-10


@cache_with_ttl(ttl_seconds=86400)
def analyze_transcript(transcript_text: str):
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    prompt = f"""
    You are an expert educational content analyzer. 
    Analyze the following YouTube video transcript and extract the learning structure.
    
    Transcript:
    {transcript_text[:10000]}
    
    Return the response in strictly valid JSON format with the following keys:
    - main_topic: The core subject being taught.
    - subtopics: A list of specific concepts covered.
    - difficulty_level: "Beginner", "Intermediate", or "Advanced".
    - completeness_score: 1-10 (How well does it cover the topic?)
    
    JSON Output:
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {
            "main_topic": "Unknown",
            "subtopics": [],
            "difficulty_level": "Unknown",
            "completeness_score": 0
        }


@cache_with_ttl(ttl_seconds=86400)
def evaluate_continuity(text_prev_end: str, text_next_start: str):
    if not GEMINI_API_KEY:
        return 0, "No API Key"

    prompt = f"""
    Compare the ending of Video A and the beginning of Video B to check for learning continuity.
    
    End of Video A:
    "{text_prev_end[:2000]}"
    
    Start of Video B:
    "{text_next_start[:2000]}"
    
    Do these videos flow well? Consider:
    1. Is Video B a logical next step?
    2. Does Video B repeat too much?
    3. Is there a huge gap in complexity?
    
    Return a valid JSON with:
    - continuity_score: 0-100 (High is good flow)
    - reason: Short explanation.
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
        print(f"Error evaluating continuity: {e}")
        return {"continuity_score": 0, "reason": "Error"}
