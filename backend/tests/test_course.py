from services.course_generator import build_course
from unittest.mock import MagicMock, patch

@patch('services.course_generator.generate_syllabus')
@patch('services.course_generator.search_videos')
@patch('services.course_generator.check_video_continuity')
def test_build_course(mock_continuity, mock_search, mock_syllabus):
    # Mock Syllabus
    mock_syllabus.return_value = {
        "course_title": "Python Course",
        "modules": [
            {"title": "Intro", "search_queries": ["python intro"]},
            {"title": "Advanced", "search_queries": ["python advanced"]}
        ]
    }
    
    # Mock Search Results
    mock_search.return_value = [
        {"id": "vid1", "title": "Vid 1", "rankingScore": 10, "channelTitle": "Ch1"},
        {"id": "vid2", "title": "Vid 2", "rankingScore": 12, "channelTitle": "Ch2"}
    ]
    
    # Mock Continuity
    mock_continuity.return_value = {"continuity_score": 80}
    
    course = build_course("Python", "Beginner")
    
    assert course["title"] == "Python Course"
    assert len(course["modules"]) == 2
    assert course["modules"][0]["video"]["id"] in ["vid1", "vid2"]
