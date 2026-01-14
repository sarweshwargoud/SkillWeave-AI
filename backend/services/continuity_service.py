from services.transcript_service import get_transcript_segment
from services.llm_service import evaluate_continuity

def check_video_continuity(video_id_a: str, video_id_b: str):
    """
    Orchestrates the continuity check between two videos.
    """
    # Phase 3: Module 4 implementation
    
    # 1. Get End of A
    end_text_a = get_transcript_segment(video_id_a, "end")
    if not end_text_a:
        return {"score": 0, "reason": f"No transcript for A ({video_id_a})"}
        
    # 2. Get Start of B
    start_text_b = get_transcript_segment(video_id_b, "start")
    if not start_text_b:
        return {"score": 0, "reason": f"No transcript for B ({video_id_b})"}
        
    # 3. Compare with LLM
    result = evaluate_continuity(end_text_a, start_text_b)
    
    return {
        "video_a": video_id_a,
        "video_b": video_id_b,
        "continuity_score": result.get("continuity_score", 0),
        "reason": result.get("reason", "Unknown")
    }
