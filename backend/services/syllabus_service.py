import json
import os
from dotenv import load_dotenv
from utils.cache import cache_with_ttl
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# New Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


@cache_with_ttl(ttl_seconds=3600)
def generate_syllabus(topic: str, level: str = "Beginner"):
    """
    Generates a structured syllabus for the course using Gemini.
    """
    if not GEMINI_API_KEY:
        return None

    prompt = f"""
        Create a structured learning syllabus for "{topic}" at a "{level}" level.
        Return a JSON object with a list of "modules".
        Each module should have:
        - title: string
        - description: string
        - search_queries: list of strings (specific YouTube search terms to find videos for this module)
        
        Cover the entire topic comprehensively. Do not limit the number of modules; generate as many as needed to fully teach the subject from start to finish.
        
        JSON Format:
        {{
            "course_title": "...",
            "modules": [
                {{ "title": "...", "description": "...", "search_queries": ["...", "..."] }},
                ...
            ]
        }}
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
        print(f"Error generating syllabus: {e}")
        return None
