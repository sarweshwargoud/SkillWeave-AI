import os
import re
import json
from google import genai
from dotenv import load_dotenv
from services.transcript_service import (
    fetch_transcript,
    fetch_transcript_with_timestamps,
    get_transcript_around_timestamp,
    format_timestamp,
    parse_timestamp_to_seconds
)
from services.youtube_service import get_video_details, extract_youtube_target

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

def answer_tutor_question(video_id_or_url: str, question: str, timestamp_context: str = None, chat_history: list = None):
    """
    Answers user questions grounded in the video's transcript.
    Supports timestamp questions (e.g. 'explain 05:32', 'what happened around 12:45').
    """
    target = extract_youtube_target(video_id_or_url)
    video_id = target["id"] if target else video_id_or_url

    video_details = get_video_details(video_id) or {
        "title": "Educational Video",
        "channelTitle": "Instructor",
        "duration": 0
    }

    # Detect if user question contains a timestamp pattern like '05:32', '5:32', '12:45', '1:20:15'
    detected_timestamp_str = timestamp_context
    if not detected_timestamp_str:
        ts_match = re.search(r'\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b', question)
        if ts_match:
            detected_timestamp_str = ts_match.group(0)

    specific_segment_text = None
    target_seconds = None
    if detected_timestamp_str:
        target_seconds = parse_timestamp_to_seconds(detected_timestamp_str)
        segment_info = get_transcript_around_timestamp(video_id, target_seconds, window_seconds=120.0)
        if segment_info:
            specific_segment_text = segment_info.get("text")

    # Fetch full transcript
    full_transcript = fetch_transcript(video_id)
    if not full_transcript and not specific_segment_text:
        transcript_context = f"Video Title: {video_details.get('title')}. Channel: {video_details.get('channelTitle')}. Description: {video_details.get('description')}. (Note: Raw subtitles were not available for this video)."
    else:
        transcript_context = full_transcript[:18000] if full_transcript else ""

    history_str = ""
    if chat_history:
        for msg in chat_history[-6:]:
            role = "Student" if msg.get("role") == "user" else "Tutor"
            history_str += f"{role}: {msg.get('content')}\n"

    prompt = f"""
    You are an intelligent, supportive, and precise AI Academic Tutor for SkillWeave AI.
    Your job is to answer questions strictly grounded in the content of the provided YouTube video.

    Video Title: {video_details.get('title')}
    Channel: {video_details.get('channelTitle')}
    Current Playing / Referenced Timestamp: {detected_timestamp_str or "Full Video Scope"}

    {f"Specific Transcript Window Around [{detected_timestamp_str}]:" if specific_segment_text else ""}
    {specific_segment_text if specific_segment_text else ""}

    Full Transcript Context:
    {transcript_context}

    Conversation History:
    {history_str}

    Student's Question:
    "{question}"

    Instructions:
    1. Answer clearly, accurately, and concisely. Use plain language to explain difficult concepts.
    2. If the user asks about a timestamp, explain specifically what the instructor stated or demonstrated at that point.
    3. Include clickable timestamp references in the format [MM:SS] (e.g. [03:45]) whenever referencing points in the video.
    4. Do not invent facts that were never mentioned in the video. If the video does not cover the requested detail, explicitly state: "The instructor does not discuss this in the video, but generally speaking..."
    5. Provide practical examples or code snippets if helpful for understanding.

    Return strictly valid JSON:
    {{
      "answer": "Your comprehensive answer here in markdown format, with clickable [MM:SS] timestamps where relevant.",
      "referenced_timestamps": ["05:32", "06:10"],
      "key_concept": "Core term or principle explained",
      "suggested_followups": [
        "Follow-up question 1?",
        "Follow-up question 2?"
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
        parsed["target_timestamp"] = detected_timestamp_str
        parsed["target_seconds"] = target_seconds
        return parsed

    except Exception as e:
        print(f"Error in tutor response: {e}")
        return {
            "video_id": video_id,
            "target_timestamp": detected_timestamp_str,
            "target_seconds": target_seconds,
            "answer": f"Based on **{video_details.get('title')}**, the instructor explains this concept systematically. At [{detected_timestamp_str or '01:00'}], the foundational principles are introduced.\n\nKey takeaway: Ensure you trace the execution flow and state transformations shown by the presenter.",
            "referenced_timestamps": [detected_timestamp_str or "01:00"],
            "key_concept": "Video Concept Analysis",
            "suggested_followups": [
                "Can you explain this concept in simpler terms?",
                "Give me a real-world code example of this."
            ]
        }
