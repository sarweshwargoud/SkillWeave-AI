import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  PlayCircle,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
  ShieldCheck,
  TrendingUp,
  PlaySquare,
  FileText,
  MessageSquare,
  GraduationCap,
  Play,
  Code,
  CheckCircle2,
  Cpu,
  Compass,
  Zap,
  Check,
  Bot,
  Video,
  Youtube,
  Search
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import TiltCard from '../components/TiltCard';
import TypographicVideo from '../components/TypographicVideo';
import FloatingTiles from '../components/FloatingTiles';
import { TypoWordReveal, TypoCharReveal } from '../components/TextReveal';
import './LandingPage.css';

// Pre-baked demo roadmaps for instant sandbox rendering
const DEMO_ROADMAPS = {
  python: {
    title: "Python AI & System Foundations",
    modules: [
      {
        module_title: "1. Memory References & LEGB Scope",
        description: "How Python assigns memory addresses to variables and enforces namespace scope rules under the hood.",
        video: {
          id: "t_k_k_t",
          title: "Python Memory Architecture & Variables Demystified",
          channelTitle: "TechDemystified",
          duration: 412,
          thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80",
          final_score: 99
        }
      },
      {
        module_title: "2. Iterators, Generators & Event Loops",
        description: "Optimized list comprehensions, yield generators, and asynchronous execution loop pipelines.",
        video: {
          id: "loop_t",
          title: "Mastering Python Generators & Async Coroutines",
          channelTitle: "PyGuru",
          duration: 620,
          thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80",
          final_score: 98
        }
      },
      {
        module_title: "3. Metaclasses & Dynamic Object Models",
        description: "Dunder protocols, class factories, and type-system metaprogramming for scalable frameworks.",
        video: {
          id: "fn_t",
          title: "Python Metaprogramming & Advanced Class Internals",
          channelTitle: "CodeBlocks",
          duration: 540,
          thumbnail: "https://images.unsplash.com/photo-1484417894907-623942c8ea29?auto=format&fit=crop&w=400&q=80",
          final_score: 97
        }
      }
    ]
  },
  react: {
    title: "Modern Next.js & React Architecture",
    modules: [
      {
        module_title: "1. React Server Components (RSC) Topology",
        description: "Distinguishing boundary contracts between zero-bundle server trees and client interactive components.",
        video: {
          id: "rsc_t",
          title: "Deep Dive into React Server Components Architecture",
          channelTitle: "WebDevMastery",
          duration: 820,
          thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80",
          final_score: 99
        }
      },
      {
        module_title: "2. Streaming Hydration & Suspense Boundaries",
        description: "Progressive HTML streaming, selective hydration, and waterfall avoidance patterns.",
        video: {
          id: "hydr_t",
          title: "Progressive Hydration & Edge Streaming in React",
          channelTitle: "DesignSystems",
          duration: 590,
          thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
          final_score: 96
        }
      },
      {
        module_title: "3. Optimistic Cache Mutations",
        description: "Syncing UI states instantly while managing background validation, rollback, and race conditions.",
        video: {
          id: "db_mut_t",
          title: "Optimistic UI & Cache Synchronization",
          channelTitle: "SaaSArchitecture",
          duration: 710,
          thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=400&q=80",
          final_score: 98
        }
      }
    ]
  },
  llm: {
    title: "GenAI, RAG & Vector Systems",
    modules: [
      {
        module_title: "1. High-Dimensional Token Embeddings",
        description: "Converting raw textual structures into semantic float vectors using sentence transformer models.",
        video: {
          id: "emb_t",
          title: "Understanding Mathematical Vector Embeddings in LLMs",
          channelTitle: "MLPioneers",
          duration: 940,
          thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80",
          final_score: 98
        }
      },
      {
        module_title: "2. Vector Databases & HNSW Indexes",
        description: "Approximate nearest-neighbor algorithms, cosine similarity queries, and metadata partition filters.",
        video: {
          id: "vec_db_t",
          title: "Vector DB Internals: HNSW vs IVFFlat Algorithms",
          channelTitle: "DBEngines",
          duration: 680,
          thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
          final_score: 97
        }
      },
      {
        module_title: "3. Context Re-Ranking & RAG Pipelines",
        description: "Dynamic chunk retrieval, cross-encoder re-ranking, and grounded prompt synthesis.",
        video: {
          id: "rag_loop_t",
          title: "Production RAG: Chunking, Re-Ranking & Grounding",
          channelTitle: "AICore",
          duration: 1110,
          thumbnail: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&w=400&q=80",
          final_score: 96
        }
      }
    ]
  }
};

const LandingPage = () => {
  const [activeDemoKey, setActiveDemoKey] = useState('python');
  const [demoRoadmap, setDemoRoadmap] = useState(DEMO_ROADMAPS.python);
  const [activePillar, setActivePillar] = useState('roadmap'); // 'roadmap', 'notes', 'tutor'
  const [heroInputUrl, setHeroInputUrl] = useState('');
  
  // AI Continuity Scanner Live Simulation
  const [isScanning, setIsScanning] = useState(false);
  const [matchScore, setMatchScore] = useState(98);
  const [scanStatusText, setScanStatusText] = useState("Continuity Verified: Video B continues smoothly from Video A without repeated definitions.");

  const triggerContinuityScan = () => {
    setIsScanning(true);
    setScanStatusText("Scanning transcript tokens & evaluating conceptual bridges with Gemini embeddings...");
    let ticks = 0;
    const interval = setInterval(() => {
      setMatchScore(Math.floor(92 + Math.random() * 8));
      ticks++;
      if (ticks >= 7) {
        clearInterval(interval);
        setMatchScore(98.6);
        setIsScanning(false);
        setScanStatusText("Continuity Verified: 98.6% concept alignment. Zero prerequisite gaps detected.");
      }
    }, 280);
  };

  const navigate = useNavigate();

  const handleDemoTagClick = (key) => {
    setActiveDemoKey(key);
    setDemoRoadmap(DEMO_ROADMAPS[key]);
  };

  return (
    <div className="landing-studio-container">
      {/* Global Responsive Navbar with mobile drawer */}
      <Navbar />

      {/* Floating Translucent Frosted Glass Tiles */}
      <FloatingTiles />

      {/* Hero Section */}
      <section id="studio-hero" className="studio-hero-section">
        <div className="hero-typography-container">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-status-pill"
          >
            <Sparkles size={14} className="pill-sparkle" />
            <span>AI-Sequenced Continuous Syllabus Engine</span>
          </motion.div>

          {/* Massive Typographic Headline inspired by "WEAR THE FUTURE" */}
          <div className="hero-massive-headline">
            <TypoCharReveal text="WEAVE THE FUTURE" className="typo-hero-title" delay={0.1} />
          </div>

          {/* Subtitle inspired by "Minimal Look Maximum Impact" */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hero-minimal-sub"
          >
            Minimal Friction · Maximum Knowledge
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hero-descriptor-text"
          >
            Transform scattered YouTube educational videos into a continuous, structured, and personalized learning roadmap.
            Transcribed and continuity-verified by Gemini AI.
          </motion.p>

          {/* Hero Action CTA Group */}
          <motion.div 
            className="hero-cta-group"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <button className="btn-primary hero-main-btn" onClick={() => navigate('/create')}>
              <Compass size={18} />
              <span>Generate AI Roadmap</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn-secondary hero-secondary-btn" onClick={() => navigate('/workspace')}>
              <PlaySquare size={18} />
              <span>Explore Learning Workspace</span>
            </button>
          </motion.div>

          {/* Quick YouTube URL / Topic Starter Bar */}
          <motion.div 
            className="hero-quick-input-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <div className="quick-input-row">
              <Youtube size={22} className="quick-yt-icon text-rose-500" />
              <input 
                type="text"
                placeholder="Paste YouTube video or playlist URL (e.g. Python, Docker, Next.js)..."
                value={heroInputUrl}
                onChange={(e) => setHeroInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && heroInputUrl.trim()) {
                    navigate('/create');
                  }
                }}
              />
              <button 
                type="button"
                className="quick-submit-btn"
                onClick={() => navigate('/create')}
              >
                <span>Curate</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="quick-topics-chips">
              <span className="chips-label">Popular:</span>
              <button type="button" className="chip-btn" onClick={() => navigate('/create')}>Python ML</button>
              <button type="button" className="chip-btn" onClick={() => navigate('/create')}>React 19 Deep Dive</button>
              <button type="button" className="chip-btn" onClick={() => navigate('/create')}>Docker & K8s</button>
              <button type="button" className="chip-btn" onClick={() => navigate('/create')}>LangChain & RAG</button>
            </div>
          </motion.div>

          {/* 3D Action Banner inspired by "SHOP NOW / Simply Wearsland" */}
          <motion.div
            className="hero-3d-action-block"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button className="action-3d-btn" onClick={() => navigate('/create')}>
              <span className="typo-3d-text">LEARN NOW</span>
              <ArrowRight size={24} className="action-3d-arrow" />
            </button>
            <span className="action-3d-subtext">Simply SkillWeave</span>
          </motion.div>

          {/* Three Pillars of Accelerated Mastery (Image 2 reference: placed directly under LEARN NOW) */}
          <div className="hero-pillars-stage">
            <div className="section-header-centered" style={{ marginTop: '3.5rem', marginBottom: '2rem' }}>
              <span className="section-overhead-tag">CORE PLATFORM CAPABILITIES</span>
              <h2 className="section-heading" style={{ fontSize: '2.1rem' }}>Three Pillars of Accelerated Mastery</h2>
              <p className="section-subtext">Deconstruct any video lecture into calibrated milestones, authentic study sheets, and interactive tutor grounding.</p>
            </div>

            <div className="stage-features-grid">
              {/* Feature 01: AI Roadmap Generator */}
              <motion.div
                className={`feature-hero-card ${activePillar === 'roadmap' ? 'active-card' : ''}`}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate('/create')}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <Compass size={24} className="text-rose-600" />
                  </div>
                  <span className="feature-top-badge">FEATURE 01</span>
                </div>
                <h3 className="feature-card-title">AI Roadmap Generator</h3>
                <p className="feature-card-desc">
                  Paste any YouTube video or playlist URL. Synthesizes clear beginner, intermediate & advanced milestones with time estimates.
                </p>
                <div className="feature-card-tags">
                  <span className="tag-pill">Playlists & Videos</span>
                  <span className="tag-pill">Timestamped</span>
                </div>
                <div className="feature-card-action">
                  <span>Generate Roadmap</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>

              {/* Feature 02: AI Handwritten Notes Generator */}
              <motion.div
                className={`feature-hero-card ${activePillar === 'notes' ? 'active-card' : ''}`}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate('/notes')}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="feature-card-header">
                  <div className="feature-icon-box bg-amber-50">
                    <FileText size={24} className="text-amber-600" />
                  </div>
                  <span className="feature-top-badge badge-amber">FEATURE 02</span>
                </div>
                <h3 className="feature-card-title">AI Handwritten Notes</h3>
                <p className="feature-card-desc">
                  Generates authentic handwritten-style study sheets on ruled, grid or parchment paper with highlighted definitions and PDF export.
                </p>
                <div className="feature-card-tags">
                  <span className="tag-pill">Ruled & Grid Layouts</span>
                  <span className="tag-pill">Editable & PDF</span>
                </div>
                <div className="feature-card-action">
                  <span>Create Notes</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>

              {/* Feature 03: AI Video Tutor */}
              <motion.div
                className={`feature-hero-card ${activePillar === 'tutor' ? 'active-card' : ''}`}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate('/tutor')}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="feature-card-header">
                  <div className="feature-icon-box bg-indigo-50">
                    <MessageSquare size={24} className="text-indigo-600" />
                  </div>
                  <span className="feature-top-badge badge-indigo">FEATURE 03</span>
                </div>
                <h3 className="feature-card-title">AI Video Tutor</h3>
                <p className="feature-card-desc">
                  Ask questions about any video concept or timestamp ("Explain what was taught at 05:32"). Click timestamps to jump the player.
                </p>
                <div className="feature-card-tags">
                  <span className="tag-pill">Timestamp Jumps</span>
                  <span className="tag-pill">Context-Grounded</span>
                </div>
                <div className="feature-card-action">
                  <span>Ask AI Tutor</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Kinetic Typographical Video / Stream Banner */}
      <section className="typo-banner-section">
        <TypographicVideo />
      </section>

      {/* Staggered Animated Highlights Grid */}
      <section className="studio-stats-section">
        <div className="section-header-centered">
          <span className="section-overhead-tag">Engine Metrics</span>
          <h2 className="section-heading">Designed for High-Impact Learning</h2>
          <p className="section-subtext">Every video is filtered, transcribed, and sequenced for seamless comprehension.</p>
        </div>

        <div className="stats-cards-grid">
          <motion.div
            className="stat-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="stat-num-row">
              <span className="stat-big-num">24<span className="stat-plus">+</span></span>
              <TrendingUp size={24} className="stat-trend-icon" />
            </div>
            <h4>Hours Saved per Path</h4>
            <p>Bypass redundant intros, subscribe plugs, and repeated basic definitions across videos.</p>
          </motion.div>

          <motion.div
            className="stat-box featured-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-num-row">
              <span className="stat-big-num">98.6<span className="stat-percent">%</span></span>
              <ShieldCheck size={24} className="stat-trend-icon text-accent" />
            </div>
            <h4>Transcript Continuity</h4>
            <p>Video B logically connects to Video A's concluding takeaways via verified transcript embeddings.</p>
          </motion.div>

          <motion.div
            className="stat-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-num-row">
              <span className="stat-big-num">100<span className="stat-percent">%</span></span>
              <Cpu size={24} className="stat-trend-icon" />
            </div>
            <h4>Accent & Style Matching</h4>
            <p>Select your preferred pace and explanation tone: Indian English, US English, or British English.</p>
          </motion.div>
        </div>
      </section>

      {/* AI Continuity Engine Live Monitor */}
      <section id="engine-showcase" className="engine-monitor-section">
        <motion.div
          className={`engine-studio-card ${isScanning ? 'is-active-scanning' : ''}`}
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="engine-card-header">
            <div className="header-left">
              <span className={`live-indicator-pill ${isScanning ? 'scanning-pill' : ''}`}>
                <span className="live-ping"></span> {isScanning ? 'Active Laser Scan' : 'Live Analyzer'}
              </span>
              <h3>AI Transcript Continuity Engine</h3>
              <p>How Gemini evaluates the conceptual bridges between recommended videos</p>
            </div>
            <div className="header-actions-group">
              <button 
                type="button" 
                className="trigger-scan-btn"
                onClick={triggerContinuityScan}
                disabled={isScanning}
                title="Simulate transcript scanning and zero-gap verification"
              >
                <Sparkles size={15} className={isScanning ? 'animate-spin text-rose-500' : 'text-blue-500'} />
                <span>{isScanning ? 'Scanning Transcripts...' : 'Run Live Continuity Scan'}</span>
              </button>
            </div>
          </div>

          <div className="engine-panes-layout">
            {/* Real-time laser scanning line sweep */}
            <div className="engine-scanning-laser" />

            <div className={`engine-pane pane-source ${isScanning ? 'pulse-scanning-pane' : ''}`}>
              <div className="pane-header-label">Lesson A Concluding Transcript</div>
              <p className="pane-quote">
                "...and that completes our study of object memory allocations and mutable pointer references in Python.
                In the next session, we must investigate how generator coroutines suspend frame execution states..."
              </p>
              <div className="pane-tag">Topic: Memory Buffers</div>
            </div>

            <div className="engine-connector-middle">
              <div className={`connector-circle ${isScanning ? 'pulse-connector' : ''}`}>
                <Sparkles size={20} className="connector-sparkle" />
              </div>
              <div className="connector-score">{matchScore}% Match</div>
              <span className="connector-label">Zero Concept Gaps</span>
            </div>

            <div className={`engine-pane pane-target ${isScanning ? 'pulse-scanning-pane' : ''}`}>
              <div className="pane-header-label">Lesson B Opening Transcript</div>
              <p className="pane-quote">
                "Welcome back! Now that you grasp Python's memory model and heap frames, let's look at yield generators
                and examine how execution resumes without re-allocating call frames..."
              </p>
              <div className="pane-tag target-tag">Topic: Generator Coroutines</div>
            </div>
          </div>

          <div className={`engine-card-footer ${isScanning ? 'footer-scanning' : ''}`}>
            {isScanning ? (
              <Zap size={18} className="footer-check text-rose-500 animate-pulse" />
            ) : (
              <CheckCircle2 size={18} className="footer-check" />
            )}
            <span>{scanStatusText}</span>
          </div>
        </motion.div>
      </section>

      {/* DEEP WORKSPACE CAPABILITIES (Full Alternating Zig-Zag Feature Showcase with Layered Motion Cards) */}
      <section id="zigzag-showcase" className="deep-showcase-section">
        <div className="section-header-centered" style={{ marginBottom: '3.5rem' }}>
          <span className="section-overhead-tag">DEEP WORKSPACE CAPABILITIES</span>
          <h2 className="section-heading">Engineered for Frictionless Knowledge Acquisition</h2>
          <p className="section-subtext">Every lecture is augmented with synchronized timestamps, instant quizzes, and active tutor grounding.</p>
        </div>

        <div className="zigzag-container">
          {/* Row 1 (Zig): Feature 01 Sequential Sequencing (Text Left, Card Right) */}
          <div className="zigzag-row">
            <motion.div 
              className="zigzag-content-col compact-text-col"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="zigzag-badge badge-blue">
                <Sparkles size={13} /> <span>Feature 01 • Sequential Sequencing</span>
              </div>
              <h3 className="zigzag-title small-title">Deconstruct Any Playlist Into Calibrated Milestones</h3>
              <p className="zigzag-desc small-desc">
                Raw YouTube playlists are filled with repeated basics, clickbait intros, and jarring gaps. SkillWeave's AI reads video transcripts, identifies the conceptual prerequisite order, and stitches together a seamless step-by-step curriculum.
              </p>
              <div className="zigzag-points small-points">
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Zero concept gaps across consecutive videos</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Automatic duration & milestone estimation</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Continuity verified by Gemini embeddings</span></div>
              </div>
              <button className="btn-primary zigzag-cta-btn compact-btn" onClick={() => navigate('/create')}>
                Create Roadmap <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              className="zigzag-visual-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="layered-card-wrapper">
                <div className="layered-back-card bg-blue-glow" />
                <div className="layered-front-card">
                  <div className="card-mock-header">
                    <span className="mock-dot red" />
                    <span className="mock-dot yellow" />
                    <span className="mock-dot green" />
                    <span className="mock-header-title">Docker Mastery Curriculum</span>
                  </div>
                  <div className="mock-milestones-list">
                    <div className="mock-step-row is-done">
                      <span className="mock-step-num">01</span>
                      <div className="mock-step-info">
                        <strong>Container Engine & Namespaces</strong>
                        <span>5:19 • 100% Verified</span>
                      </div>
                      <span className="mock-status-pill done">Done</span>
                    </div>
                    <div className="mock-step-row is-active">
                      <span className="mock-step-num active-num">02</span>
                      <div className="mock-step-info">
                        <strong>Layer Caching & Dockerfiles</strong>
                        <span>11:53 • Now Playing</span>
                      </div>
                      <span className="mock-status-pill active">In Progress</span>
                    </div>
                    <div className="mock-step-row">
                      <span className="mock-step-num">03</span>
                      <div className="mock-step-info">
                        <strong>Multi-Stage Alpine Builds</strong>
                        <span>14:20 • Up Next</span>
                      </div>
                      <span className="mock-status-pill">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 2 (Zag): Feature 02 Context Grounding (Card Left, Text Right via reverse-row) */}
          <div className="zigzag-row reverse-row">
            <motion.div 
              className="zigzag-visual-col"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="layered-card-wrapper">
                <div className="layered-back-card bg-violet-glow" />
                <div className="layered-front-card">
                  <div className="card-mock-header">
                    <span className="mock-dot red" />
                    <span className="mock-dot yellow" />
                    <span className="mock-dot green" />
                    <span className="mock-header-title">AI Video Tutor Grounding</span>
                  </div>
                  <div className="mock-chat-stream">
                    <div className="mock-user-bubble">
                      "Why does the instructor use multi-stage builds at 04:15?"
                    </div>
                    <div className="mock-tutor-bubble">
                      <div className="tutor-head">
                        <Bot size={13} className="text-blue-500" />
                        <span>AI Video Tutor</span>
                      </div>
                      <p>
                        At <span className="mock-timestamp-badge">[04:15]</span>, the instructor separates compilation tools from the final image, reducing production container size from 1.2 GB to 48 MB!
                      </p>
                      <div className="mock-jump-cta">
                        <Play size={10} /> <span>Jump player to [04:15]</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="zigzag-content-col compact-text-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="zigzag-badge badge-violet">
                <MessageSquare size={13} /> <span>Feature 02 • Context Grounding</span>
              </div>
              <h3 className="zigzag-title small-title">Instant Clarifications with Lecture Timestamp Seeking</h3>
              <p className="zigzag-desc small-desc">
                Don't waste time scouring comment sections or scrubbing through video timelines. Ask questions directly to your AI tutor. It identifies the exact moments concepts are taught and lets you jump the embedded cinema player with one click.
              </p>
              <div className="zigzag-points small-points">
                <div className="point-item"><CheckCircle2 size={15} className="text-violet-600" /> <span>Clickable timestamps seek YouTube video instantly</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-violet-600" /> <span>ChatGPT-style persistent history threads</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-violet-600" /> <span>Encrypted session history saved in Supabase</span></div>
              </div>
              <button className="btn-primary zigzag-cta-btn compact-btn" onClick={() => navigate('/tutor')}>
                Launch AI Tutor <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>

          {/* Row 3 (Zig): Feature 03 Visual Synthesis (Text Left, Card Right) */}
          <div className="zigzag-row">
            <motion.div 
              className="zigzag-content-col compact-text-col"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="zigzag-badge badge-amber">
                <FileText size={13} /> <span>Feature 03 • Visual Synthesis</span>
              </div>
              <h3 className="zigzag-title small-title">Authentic Handwritten Notes on Ruled & Grid Notebooks</h3>
              <p className="zigzag-desc small-desc">
                Transform fast-paced lecture audio into high-yield, handwritten-style notebook study sheets. Styled with realistic ink fonts, highlighter accents, formulas, and structural ASCII diagrams.
              </p>
              <div className="zigzag-points small-points">
                <div className="point-item"><CheckCircle2 size={15} className="text-amber-600" /> <span>Ruled paper, engineering grid & parchment skins</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-amber-600" /> <span>One-click PDF download & printing format</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-amber-600" /> <span>Definitions, formulas & exam summary cards</span></div>
              </div>
              <button className="btn-primary zigzag-cta-btn compact-btn" onClick={() => navigate('/notes')}>
                Open Notes Studio <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              className="zigzag-visual-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="layered-card-wrapper">
                <div className="layered-back-card bg-amber-glow" />
                <div className="layered-front-card paper-texture-card">
                  <div className="mock-paper-header">
                    <span className="paper-date">Lecture Notes • 2026</span>
                    <span className="paper-subj">Python Memory Models</span>
                  </div>
                  <div className="mock-handwritten-body">
                    <h4 className="hw-heading">Core Concept: The Private Heap</h4>
                    <p className="hw-text">
                      Everything in Python is an object! Variable names are references (pointers) pointing to addresses in memory.
                    </p>
                    <div className="hw-highlight-box">
                      <span className="hw-hl-tag">Important Rule:</span>
                      <p className="hw-hl-text">LEGB: Local &rarr; Enclosing &rarr; Global &rarr; Built-in</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 4 (Zag): Feature 04 Knowledge Testing (Card Left, Text Right via reverse-row - EXACT IMAGE 1 & 2) */}
          <div className="zigzag-row reverse-row">
            <motion.div 
              className="zigzag-visual-col"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="layered-card-wrapper">
                <div className="layered-back-card bg-emerald-glow" />
                <div className="layered-front-card">
                  <div className="card-mock-header">
                    <span className="mock-dot red" />
                    <span className="mock-dot yellow" />
                    <span className="mock-dot green" />
                    <span className="mock-header-title">Knowledge Assessment</span>
                  </div>
                  <div className="mock-quiz-body">
                    <span className="mock-q-num">Question 1 of 5</span>
                    <h5 className="mock-q-title">What happens when a Python object's reference count drops to 0?</h5>
                    <div className="mock-options-group">
                      <div className="mock-opt-item">A) Stored in swap partition</div>
                      <div className="mock-opt-item is-correct">
                        <Check size={14} className="text-emerald-500" />
                        <span>B) Memory is reclaimed instantly by garbage collector</span>
                      </div>
                      <div className="mock-opt-item">C) Raises a MemoryError exception</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="zigzag-content-col compact-text-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="zigzag-badge badge-emerald">
                <CheckCircle2 size={13} /> <span>Feature 04 • Knowledge Testing</span>
              </div>
              <h3 className="zigzag-title small-title">Instant Lesson Quizzes Grounded in the Lecture</h3>
              <p className="zigzag-desc small-desc">
                Passive watching leads to forgetting. SkillWeave tests your retention immediately with realistic scenario-based questions generated directly from the instructor's spoken words.
              </p>
              <div className="zigzag-points small-points">
                <div className="point-item"><CheckCircle2 size={15} className="text-emerald-600" /> <span>Immediate explanation rationale for every choice</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-emerald-600" /> <span>Tracks retention scores across course modules</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-emerald-600" /> <span>Grounded in actual lecture transcripts</span></div>
              </div>
              <button className="btn-primary zigzag-cta-btn compact-btn" onClick={() => navigate('/workspace')}>
                Try in Workspace <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>

          {/* Row 5 (Zig): Feature 05 Multi-Modal Workspace Central Hub (Text Left, Card Right) */}
          <div className="zigzag-row">
            <motion.div 
              className="zigzag-content-col compact-text-col"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="zigzag-badge badge-blue">
                <PlaySquare size={13} /> <span>Feature 05 • Central Hub</span>
              </div>
              <h3 className="zigzag-title small-title">Multi-Modal Learning Workspace & Progress Tracking</h3>
              <p className="zigzag-desc small-desc">
                A unified 3-column learning canvas combining cinema playback, module milestones, handwritten notes, and instant AI tutor chat with zero tab-switching.
              </p>
              <div className="zigzag-points small-points">
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Interactive module folder tree and lesson checklist</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Auto-syncs timestamps between video and lecture notes</span></div>
                <div className="point-item"><CheckCircle2 size={15} className="text-blue-600" /> <span>Cloud persistence saved to your Supabase account</span></div>
              </div>
              <button className="btn-primary zigzag-cta-btn compact-btn" onClick={() => navigate('/workspace')}>
                Open Workspace <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              className="zigzag-visual-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="layered-card-wrapper">
                <div className="layered-back-card bg-blue-glow" />
                <div className="layered-front-card">
                  <div className="card-mock-header">
                    <span className="mock-dot red" />
                    <span className="mock-dot yellow" />
                    <span className="mock-dot green" />
                    <span className="mock-header-title">VS Code Cinema Workspace</span>
                  </div>
                  <div className="mock-milestones-list">
                    <div className="mock-step-row is-done">
                      <span className="mock-step-num">01</span>
                      <div className="mock-step-info">
                        <strong>Integrated Cinema Player</strong>
                        <span>Embedded Zero-Ad Playback</span>
                      </div>
                      <span className="mock-status-pill done">Active</span>
                    </div>
                    <div className="mock-step-row is-active">
                      <span className="mock-step-num active-num">02</span>
                      <div className="mock-step-info">
                        <strong>Live AI Tutor Sidecar</strong>
                        <span>Context-Aware Chat Dock</span>
                      </div>
                      <span className="mock-status-pill active">Connected</span>
                    </div>
                    <div className="mock-step-row">
                      <span className="mock-step-num">03</span>
                      <div className="mock-step-info">
                        <strong>Synchronized Study Pad</strong>
                        <span>Auto-Tagged Notes & Quizzes</span>
                      </div>
                      <span className="mock-status-pill">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Sandbox Area */}
      <section id="demo-sandbox" className="demo-sandbox-section">
        <div className="sandbox-studio-container">
          <div className="sandbox-top-bar">
            <div>
              <span className="sandbox-mini-tag"><Code size={13} /> Interactive Sandbox</span>
              <h3 className="sandbox-heading">Instant Curriculum Explorer</h3>
            </div>
            
            <div className="sandbox-pill-selector">
              <button
                className={`selector-pill ${activeDemoKey === 'python' ? 'active' : ''}`}
                onClick={() => handleDemoTagClick('python')}
              >
                Python AI
              </button>
              <button
                className={`selector-pill ${activeDemoKey === 'react' ? 'active' : ''}`}
                onClick={() => handleDemoTagClick('react')}
              >
                Next.js SaaS
              </button>
              <button
                className={`selector-pill ${activeDemoKey === 'llm' ? 'active' : ''}`}
                onClick={() => handleDemoTagClick('llm')}
              >
                GenAI & RAG
              </button>
            </div>
          </div>

          <div className="sandbox-cards-row">
            {demoRoadmap.modules.map((mod, index) => (
              <motion.div
                key={index}
                className="sandbox-step-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="step-number-tag">Step {index + 1}</div>
                <div className="step-video-thumb">
                  <img src={mod.video.thumbnail} alt={mod.video.title} />
                  <span className="step-score-badge">{mod.video.final_score}% Match</span>
                </div>
                <div className="step-text-body">
                  <h5>{mod.module_title}</h5>
                  <p>{mod.description}</p>
                </div>
                <div className="step-card-footer">
                  <span className="step-channel">{mod.video.channelTitle}</span>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mod.video.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="step-watch-btn"
                  >
                    <Play size={12} /> Play
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="sandbox-bottom-action">
            <button className="btn-primary" onClick={() => navigate('/create')}>
              Generate Your Own Custom Roadmap <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Core Pillars Grid */}
      <section className="core-pillars-section">
        <div className="section-header-centered">
          <span className="section-overhead-tag">Core Advantages</span>
          <h2 className="section-heading">Why SkillWeave Outperforms Raw Playlists</h2>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box"><BookOpen size={24} /></div>
            <h3>Structured Syllabus</h3>
            <p>AI decomposes any subject into calibrated milestones tailored for your current skill level.</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon-box"><Layers size={24} /></div>
            <h3>Sequence Check</h3>
            <p>Gemini analyzes transcripts to guarantee lessons progress naturally without unexpected jumps.</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon-box"><PlayCircle size={24} /></div>
            <h3>Clickbait Free</h3>
            <p>Ranked strictly by content density, high-resolution explanations, and instructor clarity.</p>
          </div>
        </div>
      </section>

      {/* Comprehensive Platform Footer */}
      <footer className="studio-footer-deep">
        <div className="footer-top-grid">
          {/* Brand & Deep Platform Description */}
          <div className="footer-brand-col">
            <div className="navbar-brand footer-brand-header" onClick={() => navigate('/')}>
              <div className="brand-icon-box">
                <span className="brand-dot"></span>
                <span className="brand-bar"></span>
              </div>
              <span className="brand-title">SKILLWEAVE</span>
              <span className="brand-ai-badge">AI</span>
            </div>
            <p className="footer-brand-summary">
              SkillWeave AI is an intelligent curriculum synthesis and active learning platform that transforms YouTube playlists and video lectures into sequential, continuity-verified learning paths with in-app AI tutoring, authentic handwritten study sheets, and interactive milestone evaluations.
            </p>
            <div className="footer-security-trust">
              <span className="trust-pill"><ShieldCheck size={13} /> Supabase Auth JWT Protected</span>
              <span className="trust-pill"><ShieldCheck size={13} /> AES-256-GCM Encrypted</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-col">
            <h5>Learning Products</h5>
            <ul>
              <li><Link to="/create">AI Roadmap Generator</Link></li>
              <li><Link to="/workspace">VS Code Cinema Workspace</Link></li>
              <li><Link to="/tutor">AI Video Tutor</Link></li>
              <li><Link to="/notes">Handwritten Notes Studio</Link></li>
              <li><Link to="/my-learning">My Learning & Progress</Link></li>
            </ul>
          </div>

          {/* Technology & Architecture */}
          <div className="footer-col">
            <h5>Architecture & Engine</h5>
            <ul>
              <li><span>Gemini 2.5 Flash Transcript Engine</span></li>
              <li><span>Continuity & Gap Verification</span></li>
              <li><span>YouTube Data API v3 Services</span></li>
              <li><span>Multi-Panel Draggable Workspace</span></li>
              <li><span>Instant Timestamp Seeking</span></li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="footer-col">
            <h5>Legal & Policies</h5>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">YouTube Terms of Service</a></li>
              <li><a href="/robots.txt" target="_blank" rel="noreferrer">Robots & Indexing (robots.txt)</a></li>
              <li><a href="/sitemap.xml" target="_blank" rel="noreferrer">Sitemap (sitemap.xml)</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-strip">
          <div className="footer-bottom-inner">
            <span>© 2026 SkillWeave AI. Engineered by Sarweshwar Buddolla. All rights reserved.</span>
            <span className="footer-disclaimer">YouTube is a registered trademark of Google LLC. SkillWeave AI is an independent educational platform adhering to YouTube API Terms of Service.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
