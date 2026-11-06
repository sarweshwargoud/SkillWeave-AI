import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Search,
  Sparkles,
  ArrowLeft,
  Compass,
  Youtube,
  Layers,
  BookOpen,
  ArrowRight,
  FileText,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { generateCourse, generateRoadmapFromURL } from '../services/api';
import { getClient } from '../services/supabaseClient';
import FloatingTiles from '../components/FloatingTiles';
import Navbar from '../components/Navbar';
import './CourseInputPage.css';

const CourseInputPage = () => {
  const [mode, setMode] = useState('url'); // 'url' or 'topic'
  const [inputValue, setInputValue] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [accent, setAccent] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState(null);
  const navigate = useNavigate();
  const client = getClient();

  const loadingMessages = [
    "Analyzing YouTube video / playlist target...",
    "Retrieving timestamped captions & transcripts...",
    "Extracting core concepts, definitions & code examples...",
    "Sequencing logical beginner-to-advanced milestones...",
    "Synthesizing structured roadmap & learning objectives...",
    "Readying your personalized curriculum..."
  ];

  const popularTopics = [
    "Python for Machine Learning",
    "React Server Components & Next.js",
    "System Design & Microservices",
    "Docker & Kubernetes in Production",
    "LangChain & Vector DBs (RAG)"
  ];

  const sampleUrls = [
    {
      label: "Python Full Course (Video)",
      url: "https://www.youtube.com/watch?v=kqtD5dpn9C8"
    },
    {
      label: "React 19 Deep Dive (Video)",
      url: "https://www.youtube.com/watch?v=8pDqJVdNa44"
    },
    {
      label: "AI Engineering Playlist",
      url: "https://www.youtube.com/playlist?list=PLoROMvodv4rOABXSygHTsbvUz4G_YQh50"
    }
  ];

  const handleGenerate = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setGeneratedResult(null);

    let interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 1600);

    try {
      const isYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(inputValue.trim());

      if (isYouTubeUrl || mode === 'url') {
        const roadmapData = await generateRoadmapFromURL(inputValue.trim(), level);
        clearInterval(interval);

        // Save course to Supabase client so it shows up in /workspace and /my-learning
        const newCourse = {
          id: `course_${Date.now()}`,
          title: roadmapData.title || "Custom YouTube Course",
          channel: roadmapData.channelTitle || "YouTube Academy",
          thumbnail: roadmapData.modules?.[0]?.video?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
          progress: 0,
          totalVideos: roadmapData.total_videos || (roadmapData.modules ? roadmapData.modules.length : 1),
          totalDuration: roadmapData.estimated_time || "45m",
          roadmap: roadmapData,
          created_at: new Date().toISOString()
        };

        await client.from('courses').insert([newCourse]);
        setGeneratedResult({ course: newCourse, roadmapData });
      } else {
        const courseData = await generateCourse(inputValue.trim(), level, accent);
        clearInterval(interval);
        navigate('/roadmap', { state: { courseData, level, accent } });
      }
    } catch (error) {
      clearInterval(interval);
      console.error("Roadmap generation failed:", error);
      alert("Failed to generate roadmap: " + (error.message || "Please check the input and try again."));
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="input-studio-page">
      <Navbar />
      <FloatingTiles />

      <div className="input-page-header">
        <button className="back-nav-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>
        <div className="brand-minimal-badge" onClick={() => navigate('/')}>
          SKILLWEAVE AI • ROADMAP ARCHITECT
        </div>
      </div>

      <div className="input-studio-card">
        <div className="card-top-icon">
          <Compass size={28} className="icon-compass" />
        </div>

        <h1 className="input-card-title typo-hero-title">AI ROADMAP GENERATOR</h1>
        <p className="input-card-sub">
          Convert any YouTube video, playlist, or topic into a structured, milestone-driven learning roadmap.
        </p>

        {/* Mode Selector Tabs */}
        <div className="input-mode-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => {
              setMode('url');
              setInputValue('');
              setGeneratedResult(null);
            }}
          >
            <Youtube size={18} />
            <span>YouTube URL (Video or Playlist)</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${mode === 'topic' ? 'active' : ''}`}
            onClick={() => {
              setMode('topic');
              setInputValue('');
              setGeneratedResult(null);
            }}
          >
            <Search size={18} />
            <span>Topic Discovery Search</span>
          </button>
        </div>

        <div className="studio-form">
          <div className="form-group">
            <label className="form-label">
              {mode === 'url' ? 'Paste YouTube Video or Playlist URL' : 'What topic do you want to learn?'}
            </label>
            <div className="search-input-box">
              {mode === 'url' ? (
                <Youtube size={22} className="search-icon yt-red" />
              ) : (
                <Search size={22} className="search-icon" />
              )}
              <input
                type="text"
                className="studio-input"
                placeholder={
                  mode === 'url'
                    ? "https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                    : "e.g., Python for Machine Learning or Next.js SaaS"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
              />
            </div>

            {/* Suggestions */}
            {mode === 'url' ? (
              <div className="quick-topics-row">
                <span className="quick-label">Try Examples:</span>
                <div className="topics-chips">
                  {sampleUrls.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="topic-chip"
                      onClick={() => setInputValue(item.url)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="quick-topics-row">
                <span className="quick-label">Popular Topics:</span>
                <div className="topics-chips">
                  {popularTopics.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="topic-chip"
                      onClick={() => setInputValue(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="options-dual-grid">
            <div className="form-group">
              <label className="form-label">Target Proficiency</label>
              <select
                className="studio-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="Beginner">Beginner (Foundations & Prerequisites)</option>
                <option value="Intermediate">Intermediate (Core Engineering & Code)</option>
                <option value="Advanced">Advanced (Deep Internals & Scale)</option>
              </select>
            </div>

            {mode === 'topic' ? (
              <div className="form-group">
                <label className="form-label">Teaching Accent & Tone</label>
                <select
                  className="studio-select"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                >
                  <option value="Any">Any Style (Best Matches)</option>
                  <option value="Indian English">Indian English (Structured & Detailed)</option>
                  <option value="US English">US English (Paced & Conceptual)</option>
                  <option value="British English">British English (Formal & In-Depth)</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Extraction Scope</label>
                <select className="studio-select" defaultValue="complete">
                  <option value="complete">Full Transcript + Timestamps</option>
                  <option value="summary">Modular Milestone Breakdown</option>
                </select>
              </div>
            )}
          </div>

          <button
            className="generate-action-btn"
            onClick={handleGenerate}
            disabled={loading || !inputValue.trim()}
          >
            {loading ? (
              <span className="btn-inner-loading">
                <Loader2 className="spinner" size={20} /> Generating Custom Roadmap...
              </span>
            ) : (
              <span className="btn-inner-ready">
                <Sparkles size={20} /> Generate AI Roadmap
              </span>
            )}
          </button>
        </div>

        {/* Success Modal / Card when generated */}
        {generatedResult && (
          <motion.div
            className="roadmap-success-box"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="success-header">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <div>
                <h4>Roadmap Generated Successfully!</h4>
                <p>{generatedResult.course.title}</p>
              </div>
            </div>

            <div className="success-action-btns">
              <button
                className="btn-primary"
                onClick={() => navigate(`/workspace?courseId=${generatedResult.course.id}`)}
              >
                <BookOpen size={18} /> Open in Learning Workspace
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  navigate('/roadmap', {
                    state: {
                      courseData: generatedResult.roadmapData,
                      level,
                      accent
                    }
                  })
                }
              >
                <Layers size={18} /> View Visual Roadmap
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="studio-loading-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="loading-content-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="loading-orbit">
                <div className="orbit-center">
                  <Sparkles size={28} className="orbit-sparkle" />
                </div>
                <div className="orbit-ring"></div>
              </div>
              <h3>Curating Your Learning Pathway</h3>
              <p className="loading-step-text">{loadingMessages[loadingStep]}</p>
              <div className="loading-indicator-dots">
                <span className="dot dot-1"></span>
                <span className="dot dot-2"></span>
                <span className="dot dot-3"></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseInputPage;
