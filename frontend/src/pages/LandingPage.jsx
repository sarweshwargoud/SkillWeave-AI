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
  Network, 
  TrendingUp,
  UserCheck,
  Play,
  Code
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import ParticleBackground from '../components/ParticleBackground';
import TiltCard from '../components/TiltCard';
import Interactive3DGraph from '../components/Interactive3DGraph';
import './LandingPage.css';

// Pre-baked demo roadmaps for instant sandbox rendering
const DEMO_ROADMAPS = {
  python: {
    title: "Python Foundations",
    modules: [
      {
        module_title: "Variables & Memory Allocation",
        description: "How Python assigns memory references to dynamically typed variables under the hood.",
        video: {
          id: "t_k_k_t",
          title: "Python Memory Management & Variables Explained",
          channelTitle: "TechDemystified",
          duration: 412,
          thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80",
          final_score: 98
        }
      },
      {
        module_title: "Control Flows & Loops Execution",
        description: "Implementing conditional logic, while-loops, and optimized list comprehension iterators.",
        video: {
          id: "loop_t",
          title: "Learn Python Loops & Iterators: The Right Way",
          channelTitle: "PyGuru",
          duration: 620,
          thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=300&q=80",
          final_score: 97
        }
      },
      {
        module_title: "Functional Programming & Scope Rules",
        description: "Understanding scope hierarchies (LEGB rule) and writing optimized reusable lambda arguments.",
        video: {
          id: "fn_t",
          title: "Python Functions: Scopes, Closures, and LEGB Rules",
          channelTitle: "CodeBlocks",
          duration: 540,
          thumbnail: "https://images.unsplash.com/photo-1484417894907-623942c8ea29?auto=format&fit=crop&w=300&q=80",
          final_score: 99
        }
      }
    ]
  },
  react: {
    title: "Modern React SaaS Setup",
    modules: [
      {
        module_title: "React Server Components (RSC) Architecture",
        description: "Distinguishing client and server components and rendering optimized static pages.",
        video: {
          id: "rsc_t",
          title: "React Server Components vs Client Components in Next.js",
          channelTitle: "WebDevMastery",
          duration: 820,
          thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=300&q=80",
          final_score: 99
        }
      },
      {
        module_title: "State Hydration & Context Providers",
        description: "Passing data boundaries from server elements into interactive context hooks securely.",
        video: {
          id: "hydr_t",
          title: "Mastering React State & Hydration Patterns",
          channelTitle: "DesignSystems",
          duration: 590,
          thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80",
          final_score: 96
        }
      },
      {
        module_title: "Real-time Queries & Optimistic Updates",
        description: "Syncing UI states instantly while fetching database mutations asynchronously in the background.",
        video: {
          id: "db_mut_t",
          title: "React Query Optimistic Updates & Local Cache Mutation",
          channelTitle: "SaaSArchitecture",
          duration: 710,
          thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=300&q=80",
          final_score: 98
        }
      }
    ]
  },
  llm: {
    title: "Intro to LLMs & RAG",
    modules: [
      {
        module_title: "Tokenization & Vector Embeddings",
        description: "Converting raw text structures into high-dimensional float vectors using open source encoders.",
        video: {
          id: "emb_t",
          title: "How Embeddings and Tokenization Work in Generative AI",
          channelTitle: "MLPioneers",
          duration: 940,
          thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300&q=80",
          final_score: 97
        }
      },
      {
        module_title: "Vector Databases & Cosine Similarity Indexes",
        description: "Storing indexes, querying cosine similarities, and compiling metadata retrieval filters.",
        video: {
          id: "vec_db_t",
          title: "Vector DBs Decoded: Pinecone vs Chroma vs PGVector",
          channelTitle: "DBEngines",
          duration: 680,
          thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80",
          final_score: 98
        }
      },
      {
        module_title: "Retrieval Augmented Generation (RAG) Loops",
        description: "Injecting custom database contexts into context windows before executing final generation models.",
        video: {
          id: "rag_loop_t",
          title: "Step-by-Step RAG Implementation with LangChain",
          channelTitle: "AICore",
          duration: 1110,
          thumbnail: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&w=300&q=80",
          final_score: 96
        }
      }
    ]
  }
};

const LandingPage = () => {
  const [user, setUser] = useState(null);
  
  // Sandbox demo state
  const [activeDemoKey, setActiveDemoKey] = useState(null);
  const [demoRoadmap, setDemoRoadmap] = useState(null);

  const navigate = useNavigate();
  const client = getClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await client.auth.getUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleDemoTagClick = (key) => {
    if (activeDemoKey === key) {
      setActiveDemoKey(null);
      setDemoRoadmap(null);
    } else {
      setActiveDemoKey(key);
      setDemoRoadmap(DEMO_ROADMAPS[key]);
    }
  };

  const scrollToSandbox = () => {
    const sandboxEl = document.querySelector('.quick-sandbox-tags') || document.querySelector('.sandbox-viewer-section');
    if (sandboxEl) {
      sandboxEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container">
      {/* Particle Background Layer */}
      <ParticleBackground />

      {/* Glassmorphic Navbar */}
      <nav className="navbar fade-in">
        <div className="logo" onClick={() => navigate('/')}>
          SkillWeave <span className="logo-ai">AI</span>
        </div>
        <div className="navbar-actions">
          {user ? (
            <button className="btn-secondary" onClick={() => navigate('/profile')}>
              <UserCheck size={16} /> Profile Dashboard
            </button>
          ) : (
            <>
              <button className="nav-link-btn" onClick={() => navigate('/auth')}>
                Login
              </button>
              <button className="btn-secondary" onClick={() => navigate('/auth')}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content-grid">
          <div className="hero-text-block">
            <div className="hero-badge">
              <Sparkles size={14} className="sparkle-icon" /> AI-Sequenced Continuous Syllabus
            </div>
            
            <h1 className="hero-title">
              SkillWeave <span className="gradient-text">AI</span>
            </h1>
            <h2 className="hero-subtitle">Master Any Skill with 3D-Curated Learning Paths</h2>
            <p className="hero-description">
              Stop drowning in YouTube clickbait. We fetch, transcribe, and analyze videos using 
              Gemini to guarantee absolute learning continuity between lessons.
            </p>

            {/* CTA buttons redirecting to create roadmap page */}
            <div className="hero-cta-buttons">
              <button className="btn-primary btn-lg" onClick={() => navigate('/create')}>
                Start Generating <ArrowRight size={20} />
              </button>
              <button className="btn-secondary btn-lg" onClick={scrollToSandbox}>
                Try Demo Sandbox
              </button>
            </div>

            {/* Quick Demo Sandbox Tags */}
            <div className="quick-sandbox-tags">
              <span>Try a demo sandbox:</span>
              <div className="sandbox-tags-row">
                <button 
                  className={`tag-btn ${activeDemoKey === 'python' ? 'tag-active' : ''}`}
                  onClick={() => handleDemoTagClick('python')}
                >
                  Python Basics
                </button>
                <button 
                  className={`tag-btn ${activeDemoKey === 'react' ? 'tag-active' : ''}`}
                  onClick={() => handleDemoTagClick('react')}
                >
                  Next.js SaaS
                </button>
                <button 
                  className={`tag-btn ${activeDemoKey === 'llm' ? 'tag-active' : ''}`}
                  onClick={() => handleDemoTagClick('llm')}
                >
                  LLMs & Vector DBs
                </button>
              </div>
            </div>
          </div>

          <div className="hero-graph-block">
            {/* Interactive node mind-map preview */}
            <Interactive3DGraph />
          </div>
        </div>
      </section>

      {/* Instant Demo Roadmap Renderer (Sandbox Area) */}
      <AnimatePresence>
        {demoRoadmap && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="sandbox-viewer-section"
          >
            <div className="card sandbox-card">
              <div className="sandbox-header">
                <span className="sandbox-badge"><Code size={14} /> Sandbox Play Area</span>
                <h3>{demoRoadmap.title} • Syllabus Preview</h3>
                <p>Click on lesson watches to see simulated video continuity.</p>
              </div>

              <div className="sandbox-timeline">
                {demoRoadmap.modules.map((mod, index) => (
                  <div key={index} className="sandbox-timeline-item">
                    <div className="sandbox-marker">{index + 1}</div>
                    <div className="sandbox-content card">
                      <div className="sandbox-mod-info">
                        <h5>{mod.module_title}</h5>
                        <p>{mod.description}</p>
                      </div>
                      
                      <div className="sandbox-video-card">
                        <img src={mod.video.thumbnail} alt={mod.video.title} />
                        <div className="sandbox-video-details">
                          <h6>{mod.video.title}</h6>
                          <span>{mod.video.channelTitle} • Match: {mod.video.final_score}%</span>
                          <a 
                            href="https://www.youtube.com" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="sandbox-play-link"
                          >
                            <Play size={12} /> Play
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Show off platform features (stats) */}
      <section className="dashboard-stats">
        <h3 className="section-title-center">Platform Highlights</h3>
        <p className="section-desc-center">Why thousands of self-directed learners structure their education with SkillWeave</p>
        
        <div className="stats-grid">
          <TiltCard className="stat-card" maxTilt={8}>
            <TrendingUp className="stat-icon text-indigo" />
            <h4>24+ Hours Saved</h4>
            <p>Average time saved per topic by bypassing duplicative tutorial intro segments.</p>
          </TiltCard>

          <TiltCard className="stat-card" maxTilt={8}>
            <ShieldCheck className="stat-icon text-green" />
            <h4>98.6% Continuity</h4>
            <p>Video B always picks up right where Video A transcript content finished.</p>
          </TiltCard>

          <TiltCard className="stat-card" maxTilt={8}>
            <Clock className="stat-icon text-pink" />
            <h4>Accent Matching</h4>
            <p>Filter teaching playlists by US English, UK English, or Indian English teaching pacing.</p>
          </TiltCard>
        </div>
      </section>

      {/* AI Continuity Engine Visualizer */}
      <section className="engine-showcase">
        <div className="card engine-card">
          <div className="engine-header">
            <span className="live-pill">Live Monitor</span>
            <h4>AI Transcript Continuity Engine</h4>
            <p>How Gemini evaluates the gaps between playlist recommendations</p>
          </div>

          <div className="engine-display-grid">
            <div className="transcript-pane pane-a">
              <div className="pane-title">Video A Ending (Transcribed)</div>
              <div className="pane-content">
                "...so that covers the fundamentals of defining objects and initializers in JavaScript. 
                Next, we need to look at how subclasses inherit methods using prototype chains..."
              </div>
            </div>

            <div className="engine-center-pulse">
              <div className="pulse-arrow-wrapper">
                <div className="glowing-line"></div>
                <div className="glowing-dot"></div>
              </div>
              <span className="overlap-badge">Analyzing Overlap</span>
              <div className="continuity-percentage">98% Match</div>
            </div>

            <div className="transcript-pane pane-b">
              <div className="pane-title">Video B Start (Transcribed)</div>
              <div className="pane-content">
                "Hi there! In this tutorial, we will explore prototypal inheritance in JS, 
                building on top of class definitions and initializer constructors we wrote last time..."
              </div>
            </div>
          </div>

          {/* Glowing scanner scanner animation overlay */}
          <div className="engine-laser-scanner"></div>

          <div className="engine-footer-msg">
            <Sparkles size={16} /> Continuity validated: Logical sequence verified. No topics skipped, no repeated intros!
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="features-grid-section">
        <h3 className="section-title-center">Core Pillars of SkillWeave</h3>
        
        <div className="features">
          <div className="feature-card">
            <BookOpen className="icon" />
            <h3>Structured Syllabus</h3>
            <p>AI breaks down complex subjects into modular subtopics custom-fit to your level.</p>
          </div>
          <div className="feature-card">
            <Layers className="icon" />
            <h3>Sequence Check</h3>
            <p>We ensure that lessons are properly stacked without complexity gaps.</p>
          </div>
          <div className="feature-card">
            <PlayCircle className="icon" />
            <h3>Clickbait Filtering</h3>
            <p>Filtered for clickbait, ranked for quality of examples and code density.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 SkillWeave AI • Built by Sarweshwar</p>
      </footer>
    </div>
  );
};

export default LandingPage;
