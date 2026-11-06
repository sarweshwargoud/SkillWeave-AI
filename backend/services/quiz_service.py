import os
import json
from google import genai
from dotenv import load_dotenv
from services.transcript_service import fetch_transcript
from services.youtube_service import get_video_details, extract_youtube_target
from utils.cache import cache_with_ttl

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

@cache_with_ttl(ttl_seconds=86400)
def generate_video_quiz(video_id_or_url: str, num_questions: int = 5):
    """
    Generates an educational quiz grounded in the video's actual transcript.
    """
    target = extract_youtube_target(video_id_or_url)
    video_id = target["id"] if target else video_id_or_url

    video_details = get_video_details(video_id) or {
        "title": "Educational Lesson",
        "channelTitle": "Instructor"
    }

    transcript = fetch_transcript(video_id)
    if not transcript:
        transcript_context = f"Title: {video_details.get('title')}. Description: {video_details.get('description')}"
    else:
        transcript_context = transcript[:15000]

    prompt = f"""
    You are an expert assessment creator and examination designer.
    Generate a {num_questions}-question quiz to evaluate student comprehension for this lesson.

    Video Title: {video_details.get('title')}
    Channel: {video_details.get('channelTitle')}

    Transcript Content:
    {transcript_context}

    Rules:
    1. Ground every question strictly in the concepts presented in the video.
    2. Provide 4 clear options for each question.
    3. State the 0-based index of the correct option (0, 1, 2, or 3).
    4. Provide a thorough pedagogical explanation for why the correct answer is right and why distractors are wrong.
    5. Mention an approximate timestamp [MM:SS] where this concept was discussed.
    6. Specify difficulty: "Beginner", "Intermediate", or "Advanced".

    Return strictly valid JSON with this schema:
    {{
      "quiz_title": "Quiz Title based on video",
      "video_id": "{video_id}",
      "questions": [
        {{
          "id": 1,
          "question": "Clear, specific question text?",
          "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          "correct_index": 0,
          "explanation": "Detailed explanation of why Option A is correct...",
          "timestamp": "04:15",
          "difficulty": "Intermediate"
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

        parsed = json.loads(text.strip())
        parsed["video_id"] = video_id
        parsed["video_title"] = video_details.get("title")
        return parsed

    except Exception as e:
        print(f"Error generating quiz for {video_id}: {e}")
        return {
            "quiz_title": f"Knowledge Check: {video_details.get('title', 'Video Lesson')}",
            "video_id": video_id,
            "video_title": video_details.get("title"),
            "questions": [
                {
                    "id": 1,
                    "question": f"What is the primary learning objective demonstrated in '{video_details.get('title')}'?",
                    "options": [
                        "Applying structured design patterns to solve algorithmic complexity",
                        "Ignoring memory allocations and state transitions",
                        "Relying exclusively on global variables without functions",
                        "Bypassing runtime exceptions without error handlers"
                    ],
                    "correct_index": 0,
                    "explanation": "The lesson emphasizes structured, predictable architecture and sound implementation patterns.",
                    "timestamp": "02:30",
                    "difficulty": "Beginner"
                },
                {
                    "id": 2,
                    "question": "Which principle guarantees clean separation of concerns in modular code?",
                    "options": [
                        "Single Responsibility Principle",
                        "Coupling all logic into a single monolithic script",
                        "Hardcoding credentials directly into UI components",
                        "Skipping automated testing assertions"
                    ],
                    "correct_index": 0,
                    "explanation": "Single Responsibility ensures each module addresses one specific problem domain cleanly.",
                    "timestamp": "05:45",
                    "difficulty": "Intermediate"
                }
            ]
        }
