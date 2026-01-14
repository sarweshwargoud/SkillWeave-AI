from services.continuity_service import check_video_continuity
from unittest.mock import MagicMock, patch

@patch('services.continuity_service.get_transcript_segment')
@patch('services.continuity_service.evaluate_continuity')
def test_continuity_flow(mock_eval, mock_get_segment):
    # Mock transcripts
    # Side effect: first call returns A's end, second returns B's start
    mock_get_segment.side_effect = ["End of A content", "Start of B content"]
    
    # Mock LLM result
    mock_eval.return_value = {"continuity_score": 85, "reason": "Good flow"}
    
    result = check_video_continuity("vidA", "vidB")
    
    assert result["continuity_score"] == 85
    assert result["reason"] == "Good flow"
    assert result["video_a"] == "vidA"
    assert result["video_b"] == "vidB"
