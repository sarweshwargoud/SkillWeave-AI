from services.style_service import analyze_style, calculate_wpm
from unittest.mock import MagicMock, patch

def test_calculate_wpm():
    mock_transcript = [
        {'text': 'one two three four five', 'start': 0, 'duration': 2},
        {'text': 'six seven eight nine ten', 'start': 2, 'duration': 2},
    ]
    # Total words = 10. Total duration = 4 seconds = 4/60 min.
    # WPM = 10 / (4/60) = 150
    wpm = calculate_wpm(mock_transcript)
    assert wpm == 150

@patch('services.style_service.get_raw_transcript')
@patch('services.style_service.genai.GenerativeModel')
def test_analyze_style(mock_model_cls, mock_get_transcript):
    # Mock Transcript
    mock_get_transcript.return_value = [
        {'text': 'Hello students', 'start': 0, 'duration': 2},
        {'text': 'Welcome to class', 'start': 2, 'duration': 2}
    ]
    
    # Mock LLM
    mock_response = MagicMock()
    mock_response.text = '{"accent": "Indian English", "tone": "Formal"}'
    
    mock_model_inst = MagicMock()
    mock_model_inst.generate_content.return_value = mock_response
    mock_model_cls.return_value = mock_model_inst
    
    result = analyze_style("vid123", "ChannelName")
    
    assert result["wpm"] > 0
    assert result["accent"] == "Indian English"
    assert result["tone"] == "Formal"
