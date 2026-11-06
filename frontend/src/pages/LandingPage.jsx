import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Check
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import TiltCard from '../components/TiltCard';
import Interactive3DGraph from '../components/Interactive3DGraph';
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
        </div>

        {/* 3 Core AI Features Showcase Stage (Full desktop display) */}
        <div className="studio-product-stage">
          <div className="stage-pedestal-arc" />

          {/* Responsive 3-card grid on desktop */}
          <div className="stage-features-grid">
            {/* Feature 1: AI Roadmap Generator */}
            <motion.div
              className={`feature-hero-card ${activePillar === 'roadmap' ? 'active-card' : ''}`}
              whileHover={{ y: -8, scale: 1.02 }}
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

            {/* Feature 2: AI Handwritten Notes Generator */}
            <motion.div
              className={`feature-hero-card ${activePillar === 'notes' ? 'active-card' : ''}`}
              whileHover={{ y: -8, scale: 1.02 }}
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

            {/* Feature 3: AI Video Tutor */}
            <motion.div
              className={`feature-hero-card ${activePillar === 'tutor' ? 'active-card' : ''}`}
              whileHover={{ y: -8, scale: 1.02 }}
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

          {/* Central Workspace Highlight Banner */}
          <motion.div
            className="workspace-dock-banner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="dock-banner-content">
              <div className="dock-banner-left">
                <span className="dock-pill">CENTRAL HUB</span>
                <h3>My Learning Workspace & Progress Tracker</h3>
                <p>3-column learning environment with embedded video player, interactive quizzes, transcript search & persistent course progress.</p>
              </div>
              <div className="dock-banner-buttons">
                <button className="btn-primary dock-btn" onClick={() => navigate('/workspace')}>
                  <PlaySquare size={18} /> Open Workspace
                </button>
                <button className="btn-secondary dock-btn" onClick={() => navigate('/my-learning')}>
                  <GraduationCap size={18} /> My Progress
                </button>
              </div>
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
          className="engine-studio-card"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="engine-card-header">
            <div className="header-left">
              <span className="live-indicator-pill">
                <span className="live-ping"></span> Live Analyzer
              </span>
              <h3>AI Transcript Continuity Engine</h3>
              <p>How Gemini evaluates the conceptual bridges between recommended videos</p>
            </div>
            <div className="header-badge">
              <Sparkles size={16} /> Continuous Sequencing
            </div>
          </div>

          <div className="engine-panes-layout">
            <div className="engine-pane pane-source">
              <div className="pane-header-label">Lesson A Concluding Transcript</div>
              <p className="pane-quote">
                "...and that completes our study of object memory allocations and mutable pointer references in Python.
                In the next session, we must investigate how generator coroutines suspend frame execution states..."
              </p>
              <div className="pane-tag">Topic: Memory Buffers</div>
            </div>

            <div className="engine-connector-middle">
              <div className="connector-circle">
                <Sparkles size={20} className="connector-sparkle" />
              </div>
              <div className="connector-score">98% Match</div>
              <span className="connector-label">Zero Concept Gaps</span>
            </div>

            <div className="engine-pane pane-target">
              <div className="pane-header-label">Lesson B Opening Transcript</div>
              <p className="pane-quote">
                "Welcome back! Now that you grasp Python's memory model and heap frames, let's look at yield generators
                and examine how execution resumes without re-allocating call frames..."
              </p>
              <div className="pane-tag target-tag">Topic: Generator Coroutines</div>
            </div>
          </div>

          <div className="engine-card-footer">
            <CheckCircle2 size={18} className="footer-check" />
            <span>Continuity Verified: Video B continues smoothly from Video A without repeated definitions.</span>
          </div>
        </motion.div>
      </section>

      {/* Interactive Node Graph Section */}
      <section id="interactive-graph" className="interactive-graph-section">
        <div className="section-header-centered">
          <span className="section-overhead-tag">Visual Topology</span>
          <h2 className="section-heading">Interactive Knowledge Graph</h2>
          <p className="section-subtext">Click any curriculum node to inspect module continuity, lesson count, and depth.</p>
        </div>

        <div className="graph-wrapper-studio">
          <Interactive3DGraph />
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

      {/* Minimal Studio Footer */}
      <footer className="studio-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-title">SKILLWEAVE AI</span>
            <span className="footer-sub">The Intelligent Learning Path Architect</span>
          </div>
          <div className="footer-links">
            <span className="footer-copyright">© 2026 SkillWeave AI • Built by Sarweshwar</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
