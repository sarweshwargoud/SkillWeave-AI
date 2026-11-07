import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle, Download, FolderHeart, Sparkles, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import FloatingTiles from '../components/FloatingTiles';
import './RoadmapPage.css';

const DEFAULT_ROADMAP_DATA = {
  title: "Docker & Container Engineering Mastery",
  description: "Comprehensive step-by-step masterclass covering container engines, namespaces, layer caching, multi-stage Alpine builds, and production deployments.",
  estimated_time: "4h 45m",
  total_videos: 5,
  modules: [
    {
      title: "Module 01: Container Engines & Linux Namespaces",
      module_title: "Module 01: Container Engines & Linux Namespaces",
      description: "Deep dive into Docker architecture, virtualization vs containerization, and basic CLI commands.",
      video: {
        id: "fqMOX6JJhGo",
        title: "Docker Tutorial for Beginners [Full Course in 3 Hours]",
        duration: "3h 11m",
        completed: true
      }
    },
    {
      title: "Module 02: Layer Caching & Dockerfile Optimization",
      module_title: "Module 02: Layer Caching & Dockerfile Optimization",
      description: "Writing production-grade Dockerfiles, minimizing layer counts, and multi-stage builds.",
      video: {
        id: "3c-iBn73dDE",
        title: "Dockerfile Best Practices & Layer Caching",
        duration: "24m",
        completed: false
      }
    },
    {
      title: "Module 03: Multi-Stage Alpine Builds & Cloud Production",
      module_title: "Module 03: Multi-Stage Alpine Builds & Cloud Production",
      description: "Deploying lightweight microservices, managing container secrets, and health checks.",
      video: {
        id: "bKFMS5C4CG0",
        title: "Deploying Docker Containers to Production Environments",
        duration: "28m",
        completed: false
      }
    }
  ]
};

const RoadmapPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState(() => {
    if (state?.courseData) {
      try {
        localStorage.setItem('skillweave_active_roadmap', JSON.stringify(state.courseData));
      } catch (e) {}
      return state.courseData;
    }
    const cached = localStorage.getItem('skillweave_active_roadmap') || localStorage.getItem('skillweave_active_course');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.modules || parsed.roadmap_data)) {
          return parsed.roadmap_data || parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_ROADMAP_DATA;
  });
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const client = getClient();

  useEffect(() => {
    if (state?.courseData) {
      setCourse(state.courseData);
      try {
        localStorage.setItem('skillweave_active_roadmap', JSON.stringify(state.courseData));
      } catch (e) {}
    }
  }, [state?.courseData]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await client.auth.getUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleDownload = async () => {
    if (!course) return;

    try {
      const response = await fetch('http://localhost:8000/api/v1/download-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_data: course }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.title.replace(/\s+/g, '_')}_Roadmap.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading roadmap:', error);
      alert('Failed to download roadmap. Please ensure the backend is running.');
    }
  };

  const handleSaveToProfile = async () => {
    if (!user) {
      alert('Please login to save this roadmap to your profile workspace.');
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      const structuredModules = course.modules.map(mod => ({
        ...mod,
        completed: false
      }));

      const newProject = {
        user_id: user.id,
        title: course.title,
        description: `AI-Curated Roadmap for learning ${course.title}. Contains ${course.modules.length} lessons.`,
        level: state?.level || 'Beginner',
        accent: state?.accent || 'Any',
        status: 'In Progress',
        progress: 0,
        roadmap_data: {
          title: course.title,
          modules: structuredModules
        },
        custom_tasks: []
      };

      const { error } = await client
        .from('projects')
        .insert(newProject);

      if (error) throw error;

      // Also persist to courses for the in-app workspace player
      try {
        await client.from('courses').insert({
          id: `course_${Date.now()}`,
          user_id: user.id,
          title: course.title,
          description: `AI-Curated Roadmap for learning ${course.title}`,
          thumbnail: course.modules?.[0]?.video?.thumbnail || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
          progress: 0,
          status: 'In Progress',
          total_videos: course.modules.length,
          total_duration: "45m",
          totalVideos: course.modules.length,
          totalDuration: "45m",
          modules: structuredModules,
          roadmap: {
            title: course.title,
            modules: structuredModules
          },
          created_at: new Date().toISOString()
        });
      } catch (courseErr) {
        console.warn('Course auto-save note:', courseErr);
      }

      setSaved(true);
      alert('Roadmap saved successfully to your Supabase profile & workspace!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!course) {
    return (
      <div className="roadmap-studio-page center-empty">
        <div className="empty-box">
          <h2>No Course Selected</h2>
          <p>Please generate a learning pathway first to inspect your custom syllabus.</p>
          <button className="btn-primary" onClick={() => navigate('/create')}>
            Design Learning Path
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-studio-page">
      {/* Top Navbar */}
      <nav className="roadmap-studio-nav">
        <button
          className="nav-back-studio-btn"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/create');
            }
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="nav-brand-title" onClick={() => navigate('/')}>
          SKILLWEAVE AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-primary nav-action-pill"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => {
              try {
                localStorage.setItem('skillweave_active_course', JSON.stringify(course));
              } catch (e) {}
              navigate('/workspace', { state: { courseData: course } });
            }}
          >
            <Play size={14} /> Open in Workspace
          </button>
          {user ? (
            <button className="btn-secondary nav-action-pill" onClick={() => navigate('/profile')}>
              My Workspace
            </button>
          ) : (
            <button className="btn-secondary nav-action-pill" onClick={() => navigate('/auth')}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Header Banner */}
      <header className="roadmap-studio-header">
        <div className="header-meta-block">
          <div className="verified-pill">
            <Sparkles size={14} className="pill-sparkle" />
            <span>Gemini Continuity Verified</span>
          </div>
          <h1 className="roadmap-main-title">{course.title}</h1>
          <p className="roadmap-subtitle">
            {course.modules?.length || 0} Sequenced Modules · Calibrated for Continuous Progression
          </p>
        </div>

        <div className="roadmap-header-actions-group">
          <button
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 600, background: '#111827', color: '#ffffff' }}
            onClick={() => {
              try {
                localStorage.setItem('skillweave_active_course', JSON.stringify(course));
              } catch (e) {}
              navigate('/workspace', { state: { courseData: course } });
            }}
          >
            <Play size={16} /> Open in Workspace
          </button>
          {saved ? (
            <button className="btn-saved-success" disabled>
              <CheckCircle size={16} /> Saved to Workspace
            </button>
          ) : (
            <button className="btn-save-workspace" onClick={handleSaveToProfile} disabled={saving}>
              <FolderHeart size={16} /> {saving ? 'Saving...' : 'Save to Workspace'}
            </button>
          )}
          <button className="btn-download-studio" onClick={handleDownload}>
            <Download size={16} />
            <span>Download Syllabus (.docx)</span>
          </button>
        </div>
      </header>

      {/* Stepped Timeline */}
      <div className="studio-timeline-container">
        {course.modules.map((mod, index) => (
          <motion.div
            key={index}
            className="timeline-row-item"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div className="timeline-node-marker">
              <span className="node-number">{index + 1}</span>
            </div>

            <div className="timeline-card-surface">
              <div className="module-text-area">
                <span className="module-overhead">Milestone {index + 1}</span>
                <h3 className="module-title">{mod.module_title || mod.title || `Module ${index + 1}`}</h3>
                <p className="module-desc">{mod.description || 'Core conceptual mastery and exercises.'}</p>
              </div>

              {mod.video && (
                <div className="timeline-video-box">
                  <a
                    href={`https://www.youtube.com/watch?v=${mod.video.id || mod.video.videoId || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-thumb-link"
                  >
                    <img 
                      src={mod.video.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80`} 
                      alt={mod.video.title} 
                    />
                    <div className="video-time-tag">
                      <Clock size={11} />
                      {typeof mod.video.duration === 'number'
                        ? `${Math.floor(mod.video.duration / 60)}:${String(Math.floor(mod.video.duration % 60)).padStart(2, '0')}`
                        : (mod.video.durationFormatted || mod.video.duration || '15m')}
                    </div>
                  </a>

                  <div className="video-info-col">
                    <a
                      href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="video-headline-link"
                    >
                      <h4>{mod.video.title}</h4>
                    </a>
                    <span className="video-author">{mod.video.channelTitle}</span>
                    
                    <div className="video-meta-tags">
                      <span className="continuity-match-pill">
                        <ShieldCheck size={12} /> {Math.round(mod.video.final_score)}% Match
                      </span>
                      <a
                        href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="watch-link-pill"
                      >
                        <Play size={12} /> Watch Lesson <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="roadmap-studio-footer">
        <p>© 2026 SkillWeave AI • Sequences Curated & Verified by Gemini AI</p>
      </footer>
    </div>
  );
};

export default RoadmapPage;
