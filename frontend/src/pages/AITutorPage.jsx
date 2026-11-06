import { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Search, 
  Play, 
  Clock, 
  ExternalLink,
  Bot
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FloatingTiles from '../components/FloatingTiles';
import AITutorChat from '../components/AITutorChat';
import { parseYouTube } from '../services/api';
import './AITutorPage.css';

const AITutorPage = () => {
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=t_k_k_t');
  const [activeVideoId, setActiveVideoId] = useState('t_k_k_t');
  const [videoTitle, setVideoTitle] = useState('Python Memory Architecture & Variables Demystified');
  const [currentTimestamp, setCurrentTimestamp] = useState('02:15');
  const iframeRef = useRef(null);

  const sampleTutorVideos = [
    { label: "Python Memory Models", id: "t_k_k_t", title: "Python Memory Architecture & Variables Demystified" },
    { label: "React Server Components", id: "rsc_t", title: "React Server Components Deep Dive" },
    { label: "Vector Embeddings & RAG", id: "emb_t", title: "Mathematical Vector Embeddings in LLMs" }
  ];

  const handleLoadVideo = async () => {
    if (!videoUrl.trim()) return;
    try {
      const parsed = await parseYouTube(videoUrl);
      if (parsed.type === 'video') {
        setActiveVideoId(parsed.data.id);
        setVideoTitle(parsed.data.title);
      } else if (parsed.type === 'playlist' && parsed.data.videos.length > 0) {
        setActiveVideoId(parsed.data.videos[0].id);
        setVideoTitle(parsed.data.videos[0].title);
      }
    } catch (e) {
      // Fallback extract id
      const match = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      if (match) {
        setActiveVideoId(match[1]);
        setVideoTitle("Loaded YouTube Lesson");
      }
    }
  };

  const handleSeekTimestamp = (timeStr) => {
    setCurrentTimestamp(timeStr);
    // Convert timeStr to seconds
    const parts = timeStr.split(':');
    let secs = 0;
    if (parts.length === 2) secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);

    if (iframeRef.current) {
      // Send postMessage seekTo or reload iframe with start param
      iframeRef.current.src = `https://www.youtube.com/embed/${activeVideoId}?start=${secs}&autoplay=1&enablejsapi=1`;
    }
  };

  return (
    <div className="tutor-page-container">
      <Navbar />
      <FloatingTiles />

      <main className="studio-container-full tutor-page-main">
        {/* Top Input Bar */}
        <div className="tutor-top-bar">
          <div className="tutor-intro-left">
            <span className="tutor-badge-pill">
              <Sparkles size={13} /> Interactive Video Tutor
            </span>
            <h1 className="tutor-main-heading">Ask Questions About Any Video</h1>
          </div>

          <div className="tutor-search-wrapper">
            <Search size={18} className="search-icon-dim" />
            <input
              type="text"
              className="tutor-url-input"
              placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLoadVideo();
              }}
            />
            <button className="btn-primary tutor-load-btn" onClick={handleLoadVideo}>
              Load Video
            </button>
          </div>
        </div>

        {/* Video Presets */}
        <div className="tutor-presets-bar">
          <span className="presets-label">Quick Samples:</span>
          {sampleTutorVideos.map((sample, idx) => (
            <button
              key={idx}
              className={`preset-btn ${activeVideoId === sample.id ? 'active' : ''}`}
              onClick={() => {
                setActiveVideoId(sample.id);
                setVideoTitle(sample.title);
                setVideoUrl(`https://www.youtube.com/watch?v=${sample.id}`);
              }}
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Split Screen Workspace for Video Tutor */}
        <div className="tutor-split-stage">
          {/* Left: Video Player */}
          <div className="tutor-player-column">
            <div className="player-aspect-frame">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${activeVideoId}?enablejsapi=1`}
                title={videoTitle}
                className="yt-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="player-meta-box">
              <h3 className="playing-video-title">{videoTitle}</h3>
              <div className="player-meta-tags">
                <span className="current-pos-tag">
                  <Clock size={12} /> Active Pointer: {currentTimestamp}
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-watch-direct"
                >
                  Open on YouTube <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Right: AI Tutor Chat */}
          <div className="tutor-chat-column">
            <AITutorChat
              videoId={activeVideoId}
              videoTitle={videoTitle}
              currentTimestamp={currentTimestamp}
              onSeekTimestamp={handleSeekTimestamp}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AITutorPage;
