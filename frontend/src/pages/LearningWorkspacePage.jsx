import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  AlignLeft, 
  Search, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Home, 
  User, 
  BookOpen, 
  SidebarClose, 
  SidebarOpen, 
  Folder, 
  FolderOpen, 
  Bot, 
  X
} from 'lucide-react';

import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import AuthGateModal from '../components/AuthGateModal';
import AITutorChat from '../components/AITutorChat';
import HandwrittenNotesViewer from '../components/HandwrittenNotesViewer';
import LessonQuiz from '../components/LessonQuiz';

import { 
  fetchTranscript, 
  generateHandwrittenNotes, 
  getUserCourses, 
  fetchUserCourseById 
} from '../services/api';
import { getClient } from '../services/supabaseClient';
import './LearningWorkspacePage.css';

// Default Docker course fallback so workspace never renders blank or broken
export const DEFAULT_WORKSPACE_COURSE = {
  id: 'course-docker-mastery',
  title: 'Docker & Container Engineering Mastery',
  channel: 'TechWorld with Nana',
  description: 'Master Docker containers, images, multi-stage builds, and deployment orchestration.',
  thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
  progress: 25,
  status: 'In Progress',
  total_videos: 4,
  total_duration: '3h 15m',
  modules: [
    {
      module_title: 'Step 01: Container Engine & Architecture',
      objective: 'Understand namespaces, cgroups, container isolation, and virtualization contracts.',
      videos: [
        {
          id: 'fqMOX6JJhGo',
          title: 'Docker Tutorial for Beginners [Full Course in 3 Hours]',
          channelTitle: 'TechWorld with Nana',
          duration: '3h 15m',
          durationFormatted: '15:59',
          thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&q=80',
          completed: true
        }
      ]
    },
    {
      module_title: 'Step 02: Image Layering & Caching',
      objective: 'Build lean container images with multi-stage build optimization and cache ordering.',
      videos: [
        {
          id: '3c-iBn73dDE',
          title: 'Docker Image Layer Optimization & Caching Strategies',
          channelTitle: 'DevOpsDirective',
          duration: '18m',
          durationFormatted: '18:14',
          thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
          completed: false
        }
      ]
    },
    {
      module_title: 'Step 03: Storage Volumes & Persistence',
      objective: 'Manage stateful container data with bind mounts and named Docker volumes.',
      videos: [
        {
          id: 'pTFZFxd4hOI',
          title: 'Docker Volumes Explained: Bind Mounts vs Named Volumes',
          channelTitle: 'TechWorld with Nana',
          duration: '14m',
          durationFormatted: '14:20',
          thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80',
          completed: false
        }
      ]
    },
    {
      module_title: 'Step 04: Compose & Multi-Container Networking',
      objective: 'Orchestrate microservices and bridge networks using docker-compose.yml.',
      videos: [
        {
          id: 'HG6yLjDHICQ',
          title: 'Docker Compose Full Tutorial for Multi-Container Apps',
          channelTitle: 'TechWorld with Nana',
          duration: '22m',
          durationFormatted: '22:45',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80',
          completed: false
        }
      ]
    }
  ]
};

// Safe YouTube ID extractor
const getCleanYoutubeId = (raw) => {
  if (!raw) return '';
  const str = typeof raw === 'object' ? (raw.id || raw.videoId || raw.youtubeId || '') : String(raw);
  const trimmed = str.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const cleanParamMatch = trimmed.match(/([a-zA-Z0-9_-]{11})/);
  if (cleanParamMatch && cleanParamMatch[1]) return cleanParamMatch[1];
  return trimmed;
};

// Helper to extract flattened videos synchronously from any course structure
const extractCourseVideos = (courseObj) => {
  if (!courseObj || !courseObj.modules) return [];
  const allVideos = [];
  courseObj.modules.forEach((mod, mIdx) => {
    const vList = (mod.videos && mod.videos.length > 0)
      ? mod.videos
      : (mod.video ? [mod.video] : (mod.lessons && mod.lessons.length > 0 ? mod.lessons : []));
    const modTitle = mod.module_title || mod.title || mod.name || mod.topic || `Module ${mIdx + 1}`;

    vList.forEach((rawVid, vIdx) => {
      const vidObj = typeof rawVid === 'string' ? { id: rawVid } : { ...rawVid };
      const cleanId = getCleanYoutubeId(vidObj) || 'fqMOX6JJhGo';
      const cleanTitle = (vidObj.title || vidObj.video_title || vidObj.name || '').toString().trim() || `Lesson ${vIdx + 1}: Video Lecture`;
      const cleanDuration = (vidObj.duration || vidObj.durationFormatted || vidObj.time || '').toString().trim() || '15m';

      allVideos.push({
        ...vidObj,
        id: cleanId,
        title: cleanTitle,
        duration: cleanDuration,
        durationFormatted: cleanDuration,
        moduleIdx: mIdx,
        videoIdx: vIdx,
        moduleTitle: modTitle,
        completed: !!vidObj.completed
      });
    });
  });
  return allVideos;
};

// Helper to resolve initial course synchronously
const resolveInitialCourse = (state, urlCourseId) => {
  if (state?.courseData && state.courseData.modules?.length > 0) {
    return state.courseData;
  }
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('skillweave_active_course');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.modules?.length > 0) {
          if (!urlCourseId || parsed.id === urlCourseId || parsed._id === urlCourseId) {
            return parsed;
          }
        }
      }
    } catch (e) {}

    try {
      const cachedRoadmap = localStorage.getItem('skillweave_active_roadmap');
      if (cachedRoadmap) {
        const parsed = JSON.parse(cachedRoadmap);
        if (parsed && parsed.modules?.length > 0) {
          return {
            id: parsed.id || `course_${Date.now()}`,
            title: parsed.title || 'Personalized AI Course',
            modules: parsed.modules,
            description: parsed.description || 'Interactive Learning Course',
            total_videos: parsed.modules.length,
            total_duration: parsed.estimated_time || '45m'
          };
        }
      }
    } catch (e) {}
  }
  return DEFAULT_WORKSPACE_COURSE;
};

const LearningWorkspacePage = () => {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const urlCourseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const client = getClient();
  const iframeRef = useRef(null);

  // Authentication & User State
  const [user, setUser] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Synchronously initialized course
  const [course, setCourse] = useState(() => resolveInitialCourse(state, urlCourseId));
  
  // Synchronously initialized active video
  const [activeVideo, setActiveVideo] = useState(() => {
    const initCourse = resolveInitialCourse(state, urlCourseId);
    const vids = extractCourseVideos(initCourse);
    if (vids.length === 0) return null;
    const savedVidId = typeof window !== 'undefined' ? localStorage.getItem('skillweave_active_vid_id') : null;
    if (state?.initialVideoId) {
      const match = vids.find(v => v.id === state.initialVideoId);
      if (match) return match;
    }
    if (savedVidId) {
      const match = vids.find(v => v.id === savedVidId);
      if (match) return match;
    }
    return vids[0];
  });

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [openFolders, setOpenFolders] = useState({});

  // Active Feature Drawer (null = full width video; 'chat' | 'notes' | 'quiz' | 'transcript' | 'objectives' = side drawer like YouTube comments!)
  const [activeFeature, setActiveFeature] = useState(null);

  // Video assets state
  const [videoNotes, setVideoNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [completedVideos, setCompletedVideos] = useState({});
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  // Sidebar & Theater modes
  const [playlistCollapsed, setPlaylistCollapsed] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Initialize session & check auth
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
        }
      } catch (err) {
        console.warn('Session check note:', err);
      }
    };
    initUser();
  }, [client]);

  // Clean scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync course when state or query param changes
  useEffect(() => {
    const loaded = resolveInitialCourse(state, urlCourseId);
    setCourse(loaded);
    const vids = extractCourseVideos(loaded);
    if (vids.length > 0 && !activeVideo) {
      setActiveVideo(vids[0]);
    }
  }, [state, urlCourseId]);

  // Load Transcript when active video changes
  useEffect(() => {
    if (activeVideo?.id) {
      loadTranscript(activeVideo.id);
      setVideoNotes(null);
      setNotesLoading(false);
    }
  }, [activeVideo?.id]);

  const loadTranscript = async (vidId) => {
    setTranscriptLoading(true);
    try {
      const data = await fetchTranscript(vidId);
      setTranscriptData(data);
    } catch (e) {
      setTranscriptData(null);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const loadNotesForVideo = async (vidId) => {
    setNotesLoading(true);
    try {
      const notes = await generateHandwrittenNotes(vidId, 'detailed');
      setVideoNotes(notes);
    } catch (e) {
      console.error("Notes generation error:", e);
    } finally {
      setNotesLoading(false);
    }
  };

  const toggleFolder = (mIdx) => {
    setOpenFolders(prev => ({
      ...prev,
      [mIdx]: !(prev[mIdx] ?? true)
    }));
  };

  const handleSelectVideo = (modIdx, vidIdx, videoObj) => {
    setActiveModuleIdx(modIdx);
    setActiveVideoIdx(vidIdx);
    setActiveVideo(videoObj);
    setMobileDrawerOpen(false);

    if (videoObj?.id) {
      try {
        localStorage.setItem('skillweave_active_vid_id', videoObj.id);
      } catch (e) {}
    }

    if (iframeRef.current && videoObj?.id) {
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${getCleanYoutubeId(videoObj.id)}?autoplay=1&enablejsapi=1&rel=0`;
    }
  };

  const handleToggleComplete = async (vidId) => {
    const newStatus = !completedVideos[vidId];
    const updated = { ...completedVideos, [vidId]: newStatus };
    setCompletedVideos(updated);

    if (course) {
      let totalVids = 0;
      let finishedVids = 0;

      course.modules?.forEach(m => {
        const vList = (m.videos && m.videos.length > 0) ? m.videos : (m.video ? [m.video] : (m.lessons || []));
        vList.forEach(v => {
          totalVids++;
          if (updated[v.id]) finishedVids++;
        });
      });

      const progressPercent = totalVids > 0 ? Math.round((finishedVids / totalVids) * 100) : 0;
      try {
        await client.from('courses').update({
          progress: progressPercent,
          last_watched_video_id: vidId,
          lastActivity: new Date().toISOString()
        }).eq('id', course.id);
      } catch (err) {
        console.warn('Update progress note:', err);
      }
    }
  };

  const handleNextVideo = () => {
    if (!course?.modules) return;
    const currentMod = course.modules[activeModuleIdx];
    const vList = (currentMod?.videos && currentMod.videos.length > 0)
      ? currentMod.videos
      : (currentMod?.video ? [currentMod.video] : (currentMod?.lessons || []));

    if (activeVideoIdx < vList.length - 1) {
      const nextVid = vList[activeVideoIdx + 1];
      handleSelectVideo(activeModuleIdx, activeVideoIdx + 1, nextVid);
    } else if (activeModuleIdx < course.modules.length - 1) {
      const nextMod = course.modules[activeModuleIdx + 1];
      const nextVList = (nextMod?.videos && nextMod.videos.length > 0)
        ? nextMod.videos
        : (nextMod?.video ? [nextMod.video] : (nextMod?.lessons || []));
      if (nextVList.length > 0) {
        handleSelectVideo(activeModuleIdx + 1, 0, nextVList[0]);
      }
    }
  };

  const handlePrevVideo = () => {
    if (!course?.modules) return;
    if (activeVideoIdx > 0) {
      const currentMod = course.modules[activeModuleIdx];
      const vList = (currentMod?.videos && currentMod.videos.length > 0)
        ? currentMod.videos
        : (currentMod?.video ? [currentMod.video] : (currentMod?.lessons || []));
      handleSelectVideo(activeModuleIdx, activeVideoIdx - 1, vList[activeVideoIdx - 1]);
    } else if (activeModuleIdx > 0) {
      const prevMod = course.modules[activeModuleIdx - 1];
      const prevVList = (prevMod?.videos && prevMod.videos.length > 0)
        ? prevMod.videos
        : (prevMod?.video ? [prevMod.video] : (prevMod?.lessons || []));
      if (prevVList.length > 0) {
        handleSelectVideo(activeModuleIdx - 1, prevVList.length - 1, prevVList[prevVList.length - 1]);
      }
    }
  };

  const handleSeekTimestamp = (ts) => {
    setCurrentTimestamp(ts);
    if (!ts || !iframeRef.current) return;
    const parts = ts.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];

    const currentSrc = iframeRef.current.src || '';
    const cleanId = getCleanYoutubeId(activeVideo?.id) || 'fqMOX6JJhGo';
    iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${cleanId}?start=${seconds}&autoplay=1&enablejsapi=1&rel=0`;
  };

  // Calculate overall course progress
  const allVideos = extractCourseVideos(course);
  let doneCount = 0;
  allVideos.forEach(v => {
    if (completedVideos[v.id] || v.completed) doneCount++;
  });
  const overallPercent = allVideos.length > 0 ? Math.round((doneCount / allVideos.length) * 100) : 0;

  // Upcoming videos stream directly beneath video player
  const currentVideoIndex = allVideos.findIndex(v => v.id === activeVideo?.id);
  const nextVideos = currentVideoIndex >= 0 
    ? allVideos.filter((_, idx) => idx !== currentVideoIndex) 
    : allVideos;

  // Filtered transcript lines
  const filteredTranscript = transcriptData?.transcript?.filter(item => 
    !transcriptSearch || item.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  // =========================================================================
  // MODULAR FEATURE CONTENT RENDERER
  // =========================================================================
  const renderFeatureContent = (featureName) => {
    switch (featureName) {
      case 'chat':
        return (
          <div className="feature-wrapper chat-feature-wrapper">
            <AITutorChat
              videoId={activeVideo?.id}
              videoTitle={activeVideo?.title}
              currentTimestamp={currentTimestamp}
              onSeekTimestamp={handleSeekTimestamp}
            />
          </div>
        );

      case 'notes':
        return (
          <div className="feature-wrapper notes-feature-wrapper">
            <div className="feature-pane-hero-bar">
              <div className="feature-hero-title-box">
                <FileText size={18} className="text-amber-500" />
                <div>
                  <h4 className="feature-main-heading">AI Handwritten Study Notes</h4>
                  <p className="feature-sub-heading">Ruled paper summary with LaTeX math</p>
                </div>
              </div>

              {!videoNotes && (
                <button
                  className="btn-feature-generate"
                  onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                  disabled={notesLoading || !activeVideo?.id}
                >
                  <Sparkles size={13} />
                  <span>{notesLoading ? 'Synthesizing...' : 'Generate Notes'}</span>
                </button>
              )}
            </div>

            {notesLoading ? (
              <div className="feature-loading-box">
                <Sparkles size={24} className="spinning text-amber-500" />
                <h4>Synthesizing Handwritten Notes from Lecture Transcript...</h4>
                <p>Generating formulas, code examples, and study sheets.</p>
              </div>
            ) : (
              <div className="handwritten-notes-view-box">
                <HandwrittenNotesViewer notesData={videoNotes} />
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="feature-wrapper quiz-feature-wrapper">
            <LessonQuiz
              videoId={activeVideo?.id}
              videoTitle={activeVideo?.title}
              onQuizComplete={(sc) => console.log('Quiz score:', sc)}
            />
          </div>
        );

      case 'transcript':
        return (
          <div className="feature-wrapper transcript-feature-wrapper">
            <div className="transcript-controls-strip">
              <div className="transcript-search-box">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter synchronized captions..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="transcript-search-input-field"
                />
              </div>
              <span className="transcript-matches-pill">{filteredTranscript.length} lines</span>
            </div>

            {transcriptLoading ? (
              <div className="feature-loading-box">
                <AlignLeft size={22} className="spinning text-sky-500" />
                <h4>Fetching synchronized video captions...</h4>
              </div>
            ) : filteredTranscript.length > 0 ? (
              <div className="transcript-scroll-stream">
                {filteredTranscript.map((line, idx) => (
                  <div
                    key={idx}
                    className="transcript-line-card"
                    onClick={() => handleSeekTimestamp(line.timestamp || '00:00')}
                    title={`Click to jump video to ${line.timestamp}`}
                  >
                    <span className="transcript-time-badge">
                      <Clock size={11} /> {line.timestamp}
                    </span>
                    <span className="transcript-text-body">{line.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="feature-empty-state-box">
                <AlignLeft size={32} className="text-gray-400" />
                <h4>No transcript available for this lesson</h4>
                <p>Captions could not be loaded or no matching lines found.</p>
              </div>
            )}
          </div>
        );

      case 'objectives':
        return (
          <div className="feature-wrapper objectives-feature-wrapper">
            <div className="objectives-header-strip">
              <div>
                <h4 className="feature-main-heading">Module Objectives & Milestones</h4>
                <p className="feature-sub-heading">Step-by-step progress checklist</p>
              </div>
              <span className="curriculum-badge-pill">{doneCount} of {allVideos.length} Done ({overallPercent}%)</span>
            </div>

            <div className="objectives-cards-grid">
              {course.modules?.map((mod, mIdx) => {
                const modTitle = mod.module_title || mod.title || mod.name || `Module ${mIdx + 1}`;
                const modVideos = (mod.videos && mod.videos.length > 0)
                  ? mod.videos
                  : (mod.video ? [mod.video] : (mod.lessons || []));

                return (
                  <div key={mIdx} className="objective-module-box">
                    <div className="objective-mod-head">
                      <span className="obj-step-tag">Step {String(mIdx + 1).padStart(2, '0')}</span>
                      <h5 className="obj-title">{modTitle}</h5>
                    </div>
                    <div className="objective-lessons-list">
                      {modVideos.map((v, vIdx) => {
                        const isDone = completedVideos[v.id] || v.completed;
                        const isCurrent = activeVideo?.id === v.id;
                        const vTitle = v.title || v.video_title || v.name || `Lesson ${vIdx + 1}`;
                        const vDur = v.durationFormatted || (v.duration ? `${Math.floor(v.duration / 60)}:${String(Math.floor(v.duration % 60)).padStart(2, '0')}` : '');
                        return (
                          <div
                            key={vIdx}
                            className={`objective-leaf-row ${isCurrent ? 'is-active-leaf' : ''} ${isDone ? 'is-done-leaf' : ''}`}
                            onClick={() => handleSelectVideo(mIdx, vIdx, v)}
                          >
                            {isDone ? (
                              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Circle size={14} className="text-gray-400 flex-shrink-0" />
                            )}
                            <span className="obj-leaf-name">{vTitle}</span>
                            <span className="obj-leaf-dur">{vDur}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // =========================================================================
  // CURRICULUM EXPLORER SIDEBAR RENDERER
  // =========================================================================
  const renderCurriculumNavigation = () => (
    <div className="curriculum-tree-container">
      <div className="curriculum-header-box">
        <div className="curriculum-meta-row">
          <span className="curriculum-tag">CURRICULUM EXPLORER</span>
          <span className="curriculum-badge">{doneCount}/{allVideos.length} Done</span>
        </div>
        <h3 className="course-curriculum-title" title={course.title}>{course.title}</h3>
        <div className="curriculum-progress-track">
          <div className="curriculum-progress-fill" style={{ width: `${overallPercent}%` }} />
        </div>
      </div>

      <div className="curriculum-scroll-tree">
        {course.modules?.map((module, mIdx) => {
          const modTitle = module.module_title || module.title || module.name || `Module ${mIdx + 1}`;
          const isFolderOpen = openFolders[mIdx] ?? true;
          const vList = (module.videos && module.videos.length > 0)
            ? module.videos
            : (module.video ? [module.video] : (module.lessons || []));

          return (
            <div key={mIdx} className="curriculum-module-group">
              <div 
                className="module-folder-row"
                onClick={() => toggleFolder(mIdx)}
                title={`Toggle ${modTitle}`}
              >
                <div className="folder-left-meta">
                  {isFolderOpen ? (
                    <FolderOpen size={15} className="folder-icon is-open" />
                  ) : (
                    <Folder size={15} className="folder-icon" />
                  )}
                  <span className="module-step-badge">STEP {String(mIdx + 1).padStart(2, '0')}</span>
                  <span className="module-title-text" title={modTitle}>{modTitle}</span>
                </div>
                <span className="module-count-badge">{vList.length}</span>
              </div>

              {isFolderOpen && (
                <div className="module-lessons-nest">
                  {vList.map((video, vIdx) => {
                    const cleanId = getCleanYoutubeId(video) || 'fqMOX6JJhGo';
                    const isPlaying = activeVideo?.id === cleanId;
                    const isDone = completedVideos[cleanId] || video.completed;
                    const vTitle = video.title || video.video_title || `Lesson ${vIdx + 1}: Video Lecture`;
                    const vDur = video.durationFormatted || video.duration || '15m';

                    return (
                      <div
                        key={vIdx}
                        className={`lesson-leaf-item ${isPlaying ? 'is-active-leaf' : ''} ${isDone ? 'is-done-leaf' : ''}`}
                        onClick={() => handleSelectVideo(mIdx, vIdx, video)}
                      >
                        <div className="lesson-leaf-left">
                          {isDone ? (
                            <CheckCircle2 size={14} className="leaf-status-icon done" />
                          ) : (
                            <Circle size={14} className="leaf-status-icon" />
                          )}
                          <span className="lesson-leaf-title" title={vTitle}>{vTitle}</span>
                        </div>
                        <span className="lesson-leaf-duration">{vDur}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="workspace-page-container">
      {/* Global Brand Navbar */}
      <Navbar />

      {/* Top Sub-Navbar & Breadcrumbs (Small, Refined, Professional Typography) */}
      <nav className="workspace-sticky-top-nav">
        <div className="workspace-nav-left-group">
          <BackButton fallback="/create" label="Back" className="workspace-theme" />

          <span className="nav-sep">/</span>

          <button className="workspace-nav-btn return-home" onClick={() => navigate('/')} title="Return to Home">
            <Home size={14} /> <span>Home</span>
          </button>
          
          <span className="nav-sep">/</span>

          <button className="workspace-nav-btn return-mylearning" onClick={() => navigate('/my-learning')} title="My Learning">
            <BookOpen size={14} /> <span>My Learning</span>
          </button>

          <span className="nav-sep">/</span>

          <button className="workspace-nav-btn return-profile" onClick={() => navigate('/profile')} title="Profile & Projects">
            <User size={14} /> <span>Profile & Projects</span>
          </button>
        </div>

        {/* Small refined course metadata */}
        <div className="workspace-nav-center-meta">
          <span className="nav-course-icon">🎓</span>
          <h2 className="active-course-label" title={course.title}>{course.title}</h2>
          <span className="active-progress-pill">{overallPercent}% Done</span>
        </div>

        <div className="workspace-nav-right-actions">
          <button 
            className="workspace-toggle-sidebar-btn"
            onClick={() => setPlaylistCollapsed(!playlistCollapsed)}
            title={playlistCollapsed ? "Show Curriculum Playlist" : "Hide Curriculum Playlist"}
          >
            {playlistCollapsed ? <SidebarOpen size={15} /> : <SidebarClose size={15} />}
            <span>{playlistCollapsed ? "Show Playlist" : "Hide Playlist"}</span>
          </button>

          <button 
            className="mobile-playlist-drawer-trigger"
            onClick={() => setMobileDrawerOpen(true)}
            title="Open Playlist"
          >
            <Layers size={15} />
            <span>Playlist ({doneCount}/{allVideos.length})</span>
          </button>
        </div>
      </nav>

      {/* Main Workspace Stage: Scrollable Body (NOT fixed!) */}
      <div className={`workspace-main-body ${playlistCollapsed ? 'playlist-is-collapsed' : ''}`}>
        
        {/* Main Content Flow: Holds Video Stage, Dynamic Side Feature Drawer, and Scrollable Next Videos */}
        <div className={`workspace-content-flow ${activeFeature ? 'has-active-drawer' : 'video-is-full'}`}>
          
          {/* Top Video Stage & Dynamic Side Feature Container */}
          <div className="workspace-stage-row">
            
            {/* VIDEO COLUMN: Full width when activeFeature is null; scaled alongside drawer when feature is open */}
            <div className={`workspace-video-column ${activeFeature ? 'with-drawer' : 'full-width'}`}>
              <div className="in-app-player-aspect-frame">
                {activeVideo ? (
                  <iframe
                    key={activeVideo.id}
                    ref={iframeRef}
                    src={`https://www.youtube-nocookie.com/embed/${getCleanYoutubeId(activeVideo.id) || 'fqMOX6JJhGo'}?autoplay=1&enablejsapi=1&rel=0`}
                    title={activeVideo.title}
                    className="yt-theater-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="no-video-placeholder">
                    <Play size={40} />
                    <h4>Select a lesson from the curriculum</h4>
                  </div>
                )}
              </div>

              {/* Lesson Control & Metadata Bar Under Player */}
              {activeVideo && (
                <div className="player-meta-control-bar">
                  <div className="player-left-info">
                    <span className="pulsing-red-circle" title="Now Playing" />
                    <h3 className="current-video-heading" title={activeVideo.title}>
                      {activeVideo.title}
                    </h3>
                  </div>

                  <div className="player-right-actions">
                    <button
                      className={`btn-complete-toggle ${completedVideos[activeVideo.id] ? 'is-completed' : ''}`}
                      onClick={() => handleToggleComplete(activeVideo.id)}
                      title={completedVideos[activeVideo.id] ? 'Lesson Done' : 'Mark Completed'}
                    >
                      <CheckCircle2 size={14} />
                      <span>{completedVideos[activeVideo.id] ? 'Done' : 'Complete'}</span>
                    </button>

                    <div className="prev-next-arrows-box">
                      <button className="step-arrow-btn" onClick={handlePrevVideo} title="Previous Lesson">
                        <ChevronLeft size={15} /> Prev
                      </button>
                      <button className="step-arrow-btn" onClick={handleNextVideo} title="Next Lesson">
                        Next <ChevronRight size={15} />
                      </button>
                    </div>

                    <button
                      className="theater-expand-btn"
                      onClick={() => setTheaterMode(!theaterMode)}
                      title={theaterMode ? "Exit Theater" : "Theater Mode"}
                    >
                      {theaterMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* FEATURE ACTION BUTTONS (Displayed directly under main video) */}
              <div className="workspace-feature-launch-bar">
                <span className="launch-bar-label">WORKSPACE FEATURES:</span>

                <button 
                  className={`feature-launch-btn ${activeFeature === 'chat' ? 'is-active' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === 'chat' ? null : 'chat')}
                  title="Ask questions grounded in lecture"
                >
                  <Bot size={15} className="text-indigo-600" />
                  <span>AI Video Tutor</span>
                </button>

                <button 
                  className={`feature-launch-btn ${activeFeature === 'notes' ? 'is-active' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === 'notes' ? null : 'notes')}
                  title="Generate handwritten notes"
                >
                  <FileText size={15} className="text-amber-600" />
                  <span>Handwritten Notes</span>
                </button>

                <button 
                  className={`feature-launch-btn ${activeFeature === 'quiz' ? 'is-active' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === 'quiz' ? null : 'quiz')}
                  title="Take lesson retention quiz"
                >
                  <HelpCircle size={15} className="text-emerald-600" />
                  <span>Lesson Quiz</span>
                </button>

                <button 
                  className={`feature-launch-btn ${activeFeature === 'transcript' ? 'is-active' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === 'transcript' ? null : 'transcript')}
                  title="Interactive transcript timestamps"
                >
                  <AlignLeft size={15} className="text-sky-600" />
                  <span>Transcript</span>
                </button>

                <button 
                  className={`feature-launch-btn ${activeFeature === 'objectives' ? 'is-active' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === 'objectives' ? null : 'objectives')}
                  title="Module objectives and progression"
                >
                  <Layers size={15} className="text-rose-600" />
                  <span>Objectives</span>
                </button>
              </div>

              {/* UP NEXT IN CURRICULUM (Scrollable under video, YouTube style!) */}
              <div className="workspace-up-next-section">
                <div className="up-next-header-row">
                  <div className="up-next-title-group">
                    <Play size={16} className="text-rose-600" />
                    <h4 className="up-next-main-title">Up Next in Curriculum</h4>
                    <span className="up-next-count-pill">{nextVideos.length} Lessons</span>
                  </div>
                  <span className="up-next-hint">Scroll down to explore upcoming lectures</span>
                </div>

                <div className="up-next-cards-grid">
                  {nextVideos.map((vid, vIdx) => {
                    const isDone = completedVideos[vid.id] || vid.completed;
                    return (
                      <div 
                        key={vid.id || vIdx} 
                        className={`up-next-video-card ${isDone ? 'is-completed-card' : ''}`}
                        onClick={() => handleSelectVideo(vid.moduleIdx, vid.videoIdx, vid)}
                        title={`Play: ${vid.title}`}
                      >
                        <div className="up-next-thumb-wrapper">
                          <img 
                            src={vid.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'} 
                            alt={vid.title}
                            className="up-next-thumb-img"
                            loading="lazy"
                          />
                          <span className="up-next-time-pill">{vid.durationFormatted || vid.duration || '15m'}</span>
                        </div>
                        <div className="up-next-info-col">
                          <span className="up-next-step-badge">{vid.moduleTitle || `Module ${vid.moduleIdx + 1}`}</span>
                          <h5 className="up-next-card-title">{vid.title}</h5>
                          <div className="up-next-bottom-row">
                            {isDone ? (
                              <span className="up-next-status-tag done">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : (
                              <span className="up-next-status-tag up-next">
                                <Play size={10} /> Up Next
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* YOUTUBE-STYLE DYNAMIC FEATURE DRAWER (Opens to the side with Cancel/Close button) */}
            {activeFeature && (
              <div className="feature-youtube-drawer">
                <div className="drawer-header-strip">
                  <div className="drawer-title-group">
                    {activeFeature === 'chat' && <Bot size={16} className="text-indigo-600" />}
                    {activeFeature === 'notes' && <FileText size={16} className="text-amber-600" />}
                    {activeFeature === 'quiz' && <HelpCircle size={16} className="text-emerald-600" />}
                    {activeFeature === 'transcript' && <AlignLeft size={16} className="text-sky-600" />}
                    {activeFeature === 'objectives' && <Layers size={16} className="text-rose-600" />}
                    <h4 className="drawer-feature-title">
                      {activeFeature === 'chat' && 'AI Video Tutor'}
                      {activeFeature === 'notes' && 'Handwritten Study Notes'}
                      {activeFeature === 'quiz' && 'Lesson Knowledge Quiz'}
                      {activeFeature === 'transcript' && 'Interactive Transcript'}
                      {activeFeature === 'objectives' && 'Module Objectives'}
                    </h4>
                  </div>

                  <div className="drawer-actions-group">
                    {/* Feature Quick-Switcher Icons */}
                    <div className="drawer-quick-tabs">
                      <button 
                        className={`drawer-tab-btn ${activeFeature === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('chat')}
                        title="AI Tutor"
                      >
                        <Bot size={13} />
                      </button>
                      <button 
                        className={`drawer-tab-btn ${activeFeature === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('notes')}
                        title="Notes"
                      >
                        <FileText size={13} />
                      </button>
                      <button 
                        className={`drawer-tab-btn ${activeFeature === 'quiz' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('quiz')}
                        title="Quiz"
                      >
                        <HelpCircle size={13} />
                      </button>
                      <button 
                        className={`drawer-tab-btn ${activeFeature === 'transcript' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('transcript')}
                        title="Transcript"
                      >
                        <AlignLeft size={13} />
                      </button>
                      <button 
                        className={`drawer-tab-btn ${activeFeature === 'objectives' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('objectives')}
                        title="Objectives"
                      >
                        <Layers size={13} />
                      </button>
                    </div>

                    {/* Prominent Cancel / Exit Feature Button */}
                    <button 
                      className="drawer-cancel-btn"
                      onClick={() => setActiveFeature(null)}
                      title="Exit feature and expand video to full width"
                      aria-label="Exit feature"
                    >
                      <X size={15} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Body Container */}
                <div className="drawer-content-body">
                  {renderFeatureContent(activeFeature)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CURRICULUM EXPLORER SIDEBAR */}
        <aside className={`workspace-curriculum-sidebar ${playlistCollapsed ? 'is-collapsed' : ''}`}>
          {renderCurriculumNavigation()}
        </aside>
      </div>

      {/* Mobile Curtain Drawer for Curriculum */}
      {mobileDrawerOpen && (
        <div className="mobile-curtain-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h4>Curriculum Explorer</h4>
              <button className="mobile-drawer-close" onClick={() => setMobileDrawerOpen(false)}>✕</button>
            </div>
            {renderCurriculumNavigation()}
          </div>
        </div>
      )}

      {/* Feature Access Sign-In Gate */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        featureName="Learning Workspace"
        featureIcon={Play}
        featureDescription="Sign in with your account to save your learning progress, curriculum milestones, notes, and AI questions in the cloud."
      />
    </div>
  );
};

export default LearningWorkspacePage;
