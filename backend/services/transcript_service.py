from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from utils.cache import cache_with_ttl

def get_raw_transcript(video_id: str):
    """
    Returns the raw list of transcript entries (dictionaries with text, start, duration).
    """
    try:
        return YouTubeTranscriptApi.get_transcript(video_id)
    except Exception as e:
        print(f"Error fetching raw transcript for {video_id}: {e}")
        return None

@cache_with_ttl(ttl_seconds=86400) # Cache transcripts for 24 hours
def fetch_transcript(video_id: str):
    """
    Fetches the transcript for a given YouTube video ID.
    Returns:
        String containing the full transcript text.
    """
    try:
        # Get transcript (prefer manually created, fall back to auto-generated)
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine into a single text block for LLM processing
        full_text = " ".join([entry['text'] for entry in transcript_list])
        return full_text
        
    except (TranscriptsDisabled, NoTranscriptFound):
        print(f"No transcript found for {video_id}")
        return None
    except Exception as e:
        print(f"Error fetching transcript for {video_id}: {str(e)}")
        return None

def get_transcript_segment(video_id: str, section: str = "full"):
    """
    Fetches specific parts of a transcript.
    section: 'start' (first 20%), 'end' (last 20%), or 'full'.
    """
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        if not transcript_list:
            return None
            
        total_duration = transcript_list[-1]['start'] + transcript_list[-1]['duration']
        
        filtered_entries = []
        
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
