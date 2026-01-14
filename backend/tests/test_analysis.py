from services.transcript_service import fetch_transcript
from services.llm_service import analyze_transcript
from unittest.mock import MagicMock, patch

@patch('services.transcript_service.YouTubeTranscriptApi')
def test_transcript_fetch(mock_api):
    # Mock the get_transcript static method on the mocked class
    mock_api.get_transcript.return_value = [{'text': 'Hello world', 'start': 0, 'duration': 1}]
    transcript = fetch_transcript("vid123")
    assert transcript == "Hello world"

@patch('services.llm_service.genai.GenerativeModel')
def test_llm_analysis(mock_model_match):
    # Mock Gemini response
    mock_response = MagicMock()
    mock_response.text = '```json\n{"main_topic": "Python", "subtopics": ["Intro"], "difficulty_level": "Beginner", "completeness_score": 8}\n```'
    
    mock_model_instance = MagicMock()
    mock_model_instance.generate_content.return_value = mock_response
    mock_model_match.return_value = mock_model_instance
    
    result = analyze_transcript("some text")
    
    assert result["main_topic"] == "Python"
    assert result["difficulty_level"] == "Beginner"
