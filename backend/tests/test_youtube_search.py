from services.youtube_service import search_videos
from unittest.mock import MagicMock, patch

@patch('services.youtube_service.get_youtube_client')
def test_search_videos_integration(mock_get_client):
    # Mock the YouTube API response
    mock_youtube = MagicMock()
    mock_search = MagicMock()
    mock_videos = MagicMock()
    
    mock_get_client.return_value = mock_youtube
    mock_youtube.search.return_value = mock_search
    mock_youtube.videos.return_value = mock_videos
    
    # Mock Search Response
    mock_search.list.return_value.execute.return_value = {
        "items": [
            {
                "id": {"videoId": "vid123"},
                "snippet": {
                    "title": "Test Video",
                    "description": "Description",
                    "thumbnails": {"high": {"url": "http://image.com"}},
                    "channelTitle": "Test Channel",
                    "publishTime": "2023-01-01T00:00:00Z"
                }
            }
        ]
    }
    
    # Mock Videos Details Response
    mock_videos.list.return_value.execute.return_value = {
        "items": [
            {
                "id": "vid123",
                "contentDetails": {"duration": "PT5M"}, # 5 Minutes
                "statistics": {
                    "viewCount": "100000",
                    "likeCount": "1000",
                    "commentCount": "50"
                }
            }
        ]
    }
    
    results = search_videos("python")
    
    assert len(results) == 1
    assert results[0]["id"] == "vid123"
    assert results[0]["title"] == "Test Video"
    assert results[0]["duration"] == 300.0 # 5 * 60
    assert results[0]["rankingScore"] > 0
