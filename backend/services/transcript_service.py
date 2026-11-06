from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from utils.cache import cache_with_ttl

def format_timestamp(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    h = int(m // 60)
    if h > 0:
        m = int(m % 60)
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def parse_timestamp_to_seconds(ts_str: str) -> float:
    """
    Parses '05:32' or '01:15:30' into seconds.
    """
    parts = ts_str.strip().split(":")
    if len(parts) == 2:
        return float(int(parts[0]) * 60 + int(parts[1]))
    elif len(parts) == 3:
        return float(int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2]))
    try:
        return float(ts_str)
    except:
        return 0.0

@cache_with_ttl(ttl_seconds=86400)
def get_raw_transcript(video_id: str):
    """
    Returns the raw list of transcript entries (dictionaries with text, start, duration).
    """
    try:
        return YouTubeTranscriptApi().fetch(video_id).to_raw_data()
    except Exception as e:
        print(f"Error fetching raw transcript for {video_id}: {e}")
        return None

@cache_with_ttl(ttl_seconds=86400)
def fetch_transcript_with_timestamps(video_id: str):
    """
    Fetches transcript entries with start timestamps and human-readable formatting.
    """
    try:
        raw_entries = get_raw_transcript(video_id)
        if not raw_entries:
            return []

        formatted_entries = []
        for item in raw_entries:
            start_sec = float(item.get("start", 0))
            formatted_entries.append({
                "text": item.get("text", "").strip(),
                "start": start_sec,
                "duration": float(item.get("duration", 0)),
                "timestamp": format_timestamp(start_sec)
            })
        return formatted_entries
    except Exception as e:
        print(f"Error fetching timestamped transcript for {video_id}: {e}")
        return []

@cache_with_ttl(ttl_seconds=86400)
def fetch_transcript(video_id: str):
    """
    Fetches the full transcript as a continuous string.
    """
    try:
        entries = get_raw_transcript(video_id)
        if not entries:
            return None
        return " ".join([entry['text'].strip() for entry in entries if entry.get('text')])
    except (TranscriptsDisabled, NoTranscriptFound):
        print(f"No transcript found for {video_id}")
        return None
    except Exception as e:
        print(f"Error fetching transcript for {video_id}: {str(e)}")
        return None

def get_transcript_around_timestamp(video_id: str, target_seconds: float, window_seconds: float = 60.0):
    """
    Retrieves the transcript segment around a specific timestamp with context window.
    """
    entries = fetch_transcript_with_timestamps(video_id)
    if not entries:
        return None

    start_window = max(0, target_seconds - (window_seconds / 2))
    end_window = target_seconds + (window_seconds / 2)

    surrounding = [
        e for e in entries
        if (e["start"] + e["duration"]) >= start_window and e["start"] <= end_window
    ]

    if not surrounding:
        closest = min(entries, key=lambda x: abs(x["start"] - target_seconds))
        return {
            "timestamp": closest["timestamp"],
            "seconds": closest["start"],
            "text": closest["text"]
        }

    combined_text = " ".join([e["text"] for e in surrounding])
    return {
        "timestamp": format_timestamp(target_seconds),
        "seconds": target_seconds,
        "text": combined_text,
        "segments": surrounding
    }

def get_transcript_segment(video_id: str, section: str = "full"):
    """
    Fetches specific parts of a transcript.
    section: 'start' (first 20%), 'end' (last 20%), or 'full'.
    """
    try:
        transcript_list = get_raw_transcript(video_id)
        if not transcript_list:
            return None
            
        total_duration = transcript_list[-1]['start'] + transcript_list[-1]['duration']
        
        if section == "start":
            limit = total_duration * 0.2
            filtered_entries = [t for t in transcript_list if t['start'] < limit]
        elif section == "end":
            limit = total_duration * 0.8
            filtered_entries = [t for t in transcript_list if t['start'] > limit]
        else:
            filtered_entries = transcript_list
            
        return " ".join([t['text'] for t in filtered_entries])
    except Exception as e:
        print(f"Error fetching segment for {video_id}: {e}")
        return None
