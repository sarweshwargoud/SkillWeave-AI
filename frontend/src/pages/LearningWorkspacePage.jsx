import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Map, 
  Search, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  Home,
  User,
  BookOpen,
  SidebarClose,
  SidebarOpen,
  Folder,
  FolderOpen,
  ArrowUpDown,
  Bot,
  MessageSquare,
  Check,
  Zap,
  ListOrdered
} from 'lucide-react';

import Navbar from '../components/Navbar';
import AITutorChat from '../components/AITutorChat';
import HandwrittenNotesViewer from '../components/HandwrittenNotesViewer';
import LessonQuiz from '../components/LessonQuiz';

import { 
  fetchTranscript, 
  generateHandwrittenNotes, 
  getWorkspaceSettings, 
  updateWorkspaceSettings,
  getUserCourses,
  getUserProjects,
  saveUserNote
} from '../services/api';
import { getClient } from '../services/supabaseClient';
import { encryptData, isEncryptedPayload } from '../services/crypto';
import './LearningWorkspacePage.css';

const LearningWorkspacePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = getClient();
  const iframeRef = useRef(null);
  const workspaceContainerRef = useRef(null);
  const centerStageRef = useRef(null);
  const topRowRef = useRef(null);

  // Authentication & User State
  const [user, setUser] = useState(null);

  // Active course data
  const [course, setCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [openFolders, setOpenFolders] = useState({});

  // Video-specific assets state
  const [videoNotes, setVideoNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [completedVideos, setCompletedVideos] = useState({});
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  // --- Flexible Yellow-Bar Guided Workspace Layout State ---
  // 1. Top row: Video vs Side-Middle Feature width percentage
  const [videoWidthPercent, setVideoWidthPercent] = useState(() => {
    return Number(localStorage.getItem('sw_video_width_pct')) || 52;
  });

  // 2. Vertical split: Top row (Video + Middle Feature) vs Bottom row (Features) height percentage
  const [topRowHeightPercent, setTopRowHeightPercent] = useState(() => {
    return Number(localStorage.getItem('sw_top_height_pct')) || 58;
  });

  // 3. Right Sidebar width (pixels)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return Number(localStorage.getItem('sw_sidebar_width_px')) || 360;
  });

  const [playlistCollapsed, setPlaylistCollapsed] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // --- Feature Switchers ---
  // Middle pane feature (defaults to 'chat' / AI Assistant Chatbot!)
  const [middleFeature, setMiddleFeature] = useState(() => {
    return localStorage.getItem('sw_middle_feature') || 'chat';
  });

  // Bottom pane feature (defaults to 'notes' / AI Handwritten Notes!)
  const [bottomFeature, setBottomFeature] = useState(() => {
    return localStorage.getItem('sw_bottom_feature') || 'notes';
  });

  // Active dragging flag to prevent iframe event interception
  const [isResizing, setIsResizing] = useState(false);

  // Load User & Layout Settings on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.warn('Session check note:', err);
      }
    };
    initUser();
  }, []);

  // Lock root document scroll so the workspace acts like an IDE canvas
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Save layout state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sw_video_width_pct', videoWidthPercent);
      localStorage.setItem('sw_top_height_pct', topRowHeightPercent);
      localStorage.setItem('sw_sidebar_width_px', sidebarWidth);
      localStorage.setItem('sw_middle_feature', middleFeature);
      localStorage.setItem('sw_bottom_feature', bottomFeature);
    } catch (e) {}
  }, [videoWidthPercent, topRowHeightPercent, sidebarWidth, middleFeature, bottomFeature]);

  // Load Course data
  useEffect(() => {
    loadCourseData();
  }, [state]);

  const loadCourseData = async () => {
    let courseToLoad = state?.courseData;

    // Fallback 1: Restore from localStorage
    if (!courseToLoad) {
      const cached = localStorage.getItem('skillweave_active_course');
      if (cached) {
        try {
          courseToLoad = JSON.parse(cached);
        } catch (e) {}
      }
    }

    // Fallback 2: Fetch user's latest course from DB
    if (!courseToLoad) {
      try {
        const courses = await getUserCourses();
        if (courses && courses.length > 0) {
          courseToLoad = courses[0];
        }
      } catch (e) {}
    }

    if (courseToLoad) {
      try {
        localStorage.setItem('skillweave_active_course', JSON.stringify(courseToLoad));
      } catch (e) {}
      setCourse(courseToLoad);

      // Extract all flattened videos
      const allVideos = [];
      courseToLoad.modules?.forEach((mod, mIdx) => {
        const vList = (mod.videos && mod.videos.length > 0)
          ? mod.videos
          : (mod.video ? [mod.video] : (mod.lessons && mod.lessons.length > 0 ? mod.lessons : []));
        const modTitle = mod.module_title || mod.title || mod.name || mod.topic || `Module ${mIdx + 1}`;

        vList.forEach((vid, vIdx) => {
          allVideos.push({
            ...vid,
            moduleIdx: mIdx,
            videoIdx: vIdx,
            moduleTitle: modTitle
          });
        });
      });

      if (allVideos.length > 0) {
        let selectedVid = allVideos[0];
        const savedVidId = localStorage.getItem('skillweave_active_vid_id');
        if (state?.initialVideoId) {
          const matched = allVideos.find(v => v.id === state.initialVideoId);
          if (matched) selectedVid = matched;
        } else if (savedVidId) {
          const matched = allVideos.find(v => v.id === savedVidId);
          if (matched) selectedVid = matched;
        }

        setActiveVideo(selectedVid);
        setActiveModuleIdx(selectedVid.moduleIdx);
        setActiveVideoIdx(selectedVid.videoIdx);
      }
    }
  };

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
      iframeRef.current.src = `https://www.youtube.com/embed/${videoObj.id}?autoplay=1&enablejsapi=1`;
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

  const handleSeekTimestamp = (timeStr) => {
    setCurrentTimestamp(timeStr);
    const parts = timeStr.split(':');
    let secs = 0;
    if (parts.length === 2) secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);

    if (iframeRef.current && activeVideo?.id) {
      iframeRef.current.src = `https://www.youtube.com/embed/${activeVideo.id}?start=${secs}&autoplay=1&enablejsapi=1`;
    }
  };

  // Swap feature displayed in middle with bottom feature
  const handleSwapPanes = () => {
    const currentMiddle = middleFeature;
    const currentBottom = bottomFeature;
    setMiddleFeature(currentBottom);
    setBottomFeature(currentMiddle);
  };

  // =========================================================================
  // DRAGGING SPLITTERS HANDLERS (Simple Dragging Edges)
  // =========================================================================

  // 1. Drag Splitter 1: Video Width vs Side-Middle Feature Width
  const handleStartDragVideo = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      if (!topRowRef.current) return;
      const rect = topRowRef.current.getBoundingClientRect();
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const newPct = Math.min(76, Math.max(30, ((clientX - rect.left) / rect.width) * 100));
      setVideoWidthPercent(Math.round(newPct));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  // 2. Drag Splitter 2: Top Row (Video + Chat) Height vs Bottom Row Height
  const handleStartDragRow = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      if (!centerStageRef.current) return;
      const rect = centerStageRef.current.getBoundingClientRect();
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const newPct = Math.min(80, Math.max(34, ((clientY - rect.top) / rect.height) * 100));
      setTopRowHeightPercent(Math.round(newPct));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  // 3. Drag Splitter 3: Right Sidebar Width (Curriculum Explorer)
  const handleStartDragSidebar = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = 'none';
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const initialWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const delta = startX - clientX;
      const newWidth = Math.min(550, Math.max(260, initialWidth + delta));
      setSidebarWidth(Math.round(newWidth));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  if (!course) {
    return (
      <div className="workspace-page-container">
        <Navbar />
        <div className="workspace-empty-center">
          <h2>No Active Course in Workspace</h2>
          <p>Generate a new syllabus or select a saved course from your profile or library.</p>
          <div className="empty-actions-row">
            <button className="btn-primary" onClick={() => navigate('/create')}>
              Generate New Roadmap
            </button>
            <button className="btn-secondary" onClick={() => navigate('/profile')}>
              Open Profile & Projects
            </button>
            <button className="btn-secondary" onClick={() => navigate('/my-learning')}>
              My Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall course progress
  let totalCount = 0;
  let doneCount = 0;
  course.modules?.forEach(m => {
    const list = (m.videos && m.videos.length > 0) ? m.videos : (m.video ? [m.video] : (m.lessons || []));
    list.forEach(v => {
      totalCount++;
      if (completedVideos[v.id] || v.completed) doneCount++;
    });
  });
  const overallPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Filtered transcript lines
  const filteredTranscript = transcriptData?.transcript?.filter(item => 
    !transcriptSearch || item.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  // =========================================================================
  // MODULAR FEATURE RENDERER (Used in both Middle Pane and Bottom Pane!)
  // =========================================================================
  const renderFeatureContent = (featureName, paneLocation = 'bottom') => {
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
                <FileText size={20} className="text-amber-500" />
                <div>
                  <h3 className="feature-main-heading">AI Handwritten Study Notes</h3>
                  <p className="feature-sub-heading">Detailed handwritten lecture summary on ruled notebook paper with LaTeX math</p>
                </div>
              </div>

              {!videoNotes && (
                <button
                  className="btn-feature-generate"
                  onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                  disabled={notesLoading || !activeVideo?.id}
                >
                  <Sparkles size={14} />
                  <span>{notesLoading ? 'Synthesizing...' : 'Generate Notes'}</span>
                </button>
              )}
            </div>

            {notesLoading ? (
              <div className="feature-loading-box">
                <Sparkles size={26} className="spinning text-amber-500" />
                <h4>Synthesizing Handwritten Notes from Lecture Transcript...</h4>
                <p>Generating structured topics, code examples, formulas, and flashcards.</p>
              </div>
            ) : videoNotes ? (
              <div className="handwritten-notes-view-box">
                <HandwrittenNotesViewer notesData={videoNotes} />
              </div>
            ) : (
              <div className="feature-empty-state-box">
                <FileText size={38} className="text-gray-400" />
                <h4>Handwritten notes not generated yet for this lesson</h4>
                <p>Click below to generate clean, ruled-paper handwritten study notes.</p>
                <button
                  className="btn-primary"
                  onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                >
                  Generate Handwritten Notes
                </button>
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
                <Search size={15} className="text-gray-400" />
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
                <AlignLeft size={24} className="spinning text-sky-500" />
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
                <AlignLeft size={36} className="text-gray-400" />
                <h4>No transcript available for this lesson</h4>
                <p>Captions could not be loaded or no matching lines were found.</p>
              </div>
            )}
          </div>
        );

      case 'objectives':
        return (
          <div className="feature-wrapper objectives-feature-wrapper">
            <div className="objectives-header-strip">
              <div>
                <h3 className="feature-main-heading">Module Objectives & Roadmap</h3>
                <p className="feature-sub-heading">Step-by-step learning progression and curriculum milestone tracker</p>
              </div>
              <span className="curriculum-badge-pill">{doneCount} of {totalCount} Lessons Done ({overallPercent}%)</span>
            </div>

            <div className="objectives-cards-grid">
              {course.modules?.map((mod, mIdx) => {
                const modTitle = mod.module_title || mod.title || mod.name || mod.topic || `Module ${mIdx + 1}`;
                const modVideos = (mod.videos && mod.videos.length > 0)
                  ? mod.videos
                  : (mod.video ? [mod.video] : (mod.lessons && mod.lessons.length > 0 ? mod.lessons : []));

                return (
                  <div key={mIdx} className="objective-module-box">
                    <div className="objective-mod-head">
                      <span className="obj-step-tag">Step {String(mIdx + 1).padStart(2, '0')}</span>
                      <h4 className="obj-title">{modTitle}</h4>
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
                              <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Circle size={15} className="text-gray-400 flex-shrink-0" />
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

  // Curriculum Step-by-Step Navigation List (Folder Tree)
  const renderCurriculumNavigation = () => (
    <div className="curriculum-playlist-inner">
      <div className="sidebar-course-header">
        <div className="header-meta-row">
          <span className="course-type-tag">Curriculum Explorer</span>
          <span className="course-done-badge">{doneCount}/{totalCount} Completed</span>
        </div>
        <h3 className="sidebar-course-title">{course.title}</h3>
        
        <div className="course-progress-indicator">
          <div className="progress-text-row">
            <span>Overall Progress</span>
            <strong>{overallPercent}%</strong>
          </div>
          <div className="progress-track-small">
            <div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="sidebar-modules-scroll">
        {course.modules?.map((module, mIdx) => {
          const videoList = (module.videos && module.videos.length > 0)
            ? module.videos
            : (module.video ? [module.video] : (module.lessons && module.lessons.length > 0 ? module.lessons : []));
          const isCurrentModule = mIdx === activeModuleIdx;
          const isFolderOpen = openFolders[mIdx] ?? true; // open by default
          const rawModTitle = (module.module_title || module.title || module.name || module.topic || '').toString().trim();
          const moduleTitle = rawModTitle || `Module ${mIdx + 1}: Core Concepts`;

          return (
            <div key={mIdx} className={`folder-module-block ${isCurrentModule ? 'current-active-folder' : ''}`}>
              {/* Folder Step Header */}
              <div 
                className="folder-module-header"
                onClick={() => toggleFolder(mIdx)}
                title="Click to toggle folder"
              >
                <div className="folder-icon-wrapper">
                  {isFolderOpen ? (
                    <FolderOpen size={16} className="icon-folder-open" />
                  ) : (
                    <Folder size={16} className="icon-folder-closed" />
                  )}
                </div>
                
                <div className="folder-label-group">
                  <span className="folder-step-badge">Step {String(mIdx + 1).padStart(2, '0')}</span>
                  <h5 className="folder-name-title" title={moduleTitle}>{moduleTitle}</h5>
                </div>

                <span className="folder-lesson-count">{videoList.length}</span>
              </div>

              {/* Offset Nested Video Items with Branch Connectors */}
              {isFolderOpen && videoList.length > 0 && (
                <div className="folder-contents-tree">
                  {videoList.map((vid, vIdx) => {
                    const isPlaying = activeVideo?.id === vid.id;
                    const isDone = completedVideos[vid.id] || vid.completed;
                    const rawVidTitle = (vid.title || vid.video_title || vid.name || '').toString().trim();
                    const videoTitle = rawVidTitle || `Lesson ${vIdx + 1}: Video`;
                    const videoDuration = vid.durationFormatted || (vid.duration ? `${Math.floor(vid.duration / 60)}:${String(Math.floor(vid.duration % 60)).padStart(2, '0')}` : 'Lesson');

                    return (
                      <div
                        key={vIdx}
                        className={`tree-leaf-item ${isPlaying ? 'active-tree-leaf' : ''} ${isDone ? 'done-tree-leaf' : ''}`}
                        onClick={() => handleSelectVideo(mIdx, vIdx, vid)}
                      >
                        {/* Branch Connector Line */}
                        <div className="tree-branch-line" />

                        <button
                          className="leaf-status-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(vid.id);
                          }}
                          title={isDone ? "Mark incomplete" : "Mark completed"}
                          aria-label="Toggle completed"
                        >
                          {isDone ? (
                            <CheckCircle2 size={15} className="icon-leaf-done" />
                          ) : (
                            <Circle size={15} className="icon-leaf-pending" />
                          )}
                        </button>

                        <div className="tree-leaf-details">
                          <span className="tree-leaf-title" title={videoTitle}>{videoTitle}</span>
                          <span className="tree-leaf-meta">
                            <Clock size={11} /> {videoDuration}
                          </span>
                        </div>

                        {isPlaying && (
                          <div className="tree-playing-pulse" title="Now Playing">
                            <span className="pulse-bar" />
                            <span className="pulse-bar" />
                            <span className="pulse-bar" />
                          </div>
                        )}
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
    <div className={`workspace-page-container ${isResizing ? 'is-resizing' : ''}`}>
      {/* Global Brand Navbar */}
      <Navbar />

      {/* Top Sub-Navbar & Breadcrumbs Bar with Increased Prominent Typography */}
      <nav className="workspace-sticky-top-nav">
        <div className="workspace-nav-left-group">
          <button 
            className="workspace-nav-btn return-home"
            onClick={() => navigate('/')}
            title="Return to Home"
          >
            <Home size={16} /> <span>Home</span>
          </button>
          
          <span className="nav-sep">/</span>

          <button 
            className="workspace-nav-btn return-mylearning"
            onClick={() => navigate('/my-learning')}
            title="Return to My Learning"
          >
            <BookOpen size={16} /> <span>My Learning</span>
          </button>

          <span className="nav-sep">/</span>

          <button 
            className="workspace-nav-btn return-profile"
            onClick={() => navigate('/profile')}
            title="Return to Profile & Projects"
          >
            <User size={16} /> <span>Profile & Projects</span>
          </button>
        </div>

        {/* Scaled-up prominent course header */}
        <div className="workspace-nav-center-meta">
          <h1 className="active-course-label" title={course.title}>{course.title}</h1>
          <span className="active-progress-pill">{overallPercent}% Done</span>
        </div>

        <div className="workspace-nav-right-actions">
          <button 
            className="workspace-toggle-sidebar-btn"
            onClick={() => setPlaylistCollapsed(!playlistCollapsed)}
            title={playlistCollapsed ? "Show Playlist Sidebar" : "Hide Playlist Sidebar"}
          >
            {playlistCollapsed ? <SidebarOpen size={17} /> : <SidebarClose size={17} />}
            <span>{playlistCollapsed ? "Show Playlist" : "Hide Playlist"}</span>
          </button>

          <button 
            className="mobile-playlist-drawer-trigger"
            onClick={() => setMobileDrawerOpen(true)}
            title="Open Playlist"
          >
            <Layers size={17} />
            <span>Playlist ({doneCount}/{totalCount})</span>
          </button>
        </div>
      </nav>

      {/* Main Workspace Canvas: Split between Center Stage & Right Playlist Sidebar */}
      <div 
        className={`workspace-main-body ${playlistCollapsed ? 'playlist-is-collapsed' : ''} ${theaterMode ? 'theater-is-expanded' : ''}`}
        ref={workspaceContainerRef}
      >
        {/* CENTER / LEFT STAGE: Holds TOP ROW and BOTTOM ROW with horizontal resize splitter */}
        <div className="workspace-center-stage" ref={centerStageRef}>

          {/* TOP ROW: Video Player (Left) + Side-Middle Feature / Chatbot (Right) */}
          <div 
            className="workspace-top-row" 
            ref={topRowRef}
            style={{ height: `${topRowHeightPercent}%` }}
          >
            {/* TOP LEFT: In-App Cinema Video Player */}
            <div 
              className="top-video-column"
              style={{ width: `${videoWidthPercent}%` }}
            >
              <div className="video-player-bezel-frame">
                {activeVideo ? (
                  <>
                    <div className="in-app-player-aspect-frame">
                      <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&enablejsapi=1`}
                        title={activeVideo.title}
                        className="yt-theater-iframe"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    {/* Integrated Lesson Controls Strip */}
                    <div className="player-meta-control-bar">
                      <div className="player-left-info">
                        <span className="pulsing-red-circle" title="Now Playing" />
                        <h2 className="current-video-heading" title={activeVideo.title}>
                          {activeVideo.title}
                        </h2>
                      </div>

                      <div className="player-right-actions">
                        <button
                          className={`btn-complete-toggle ${completedVideos[activeVideo.id] ? 'is-completed' : ''}`}
                          onClick={() => handleToggleComplete(activeVideo.id)}
                          title={completedVideos[activeVideo.id] ? 'Lesson Done' : 'Mark Completed'}
                        >
                          <CheckCircle2 size={15} />
                          <span>{completedVideos[activeVideo.id] ? 'Done' : 'Complete'}</span>
                        </button>

                        <div className="prev-next-arrows-box">
                          <button
                            className="step-arrow-btn"
                            onClick={handlePrevVideo}
                            title="Previous Lesson"
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>
                          <button
                            className="step-arrow-btn"
                            onClick={handleNextVideo}
                            title="Next Lesson"
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>

                        <button
                          className="theater-expand-btn"
                          onClick={() => setTheaterMode(!theaterMode)}
                          title={theaterMode ? "Exit Full Theater" : "Full Theater Mode"}
                        >
                          {theaterMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-video-placeholder">
                    <Play size={44} />
                    <h3>Select a lesson from the curriculum playlist</h3>
                  </div>
                )}
              </div>
            </div>

            {/* SPLITTER 1 (Vertical Drag Bar): Between Video Player and Side-Middle Feature */}
            <div 
              className="resize-splitter splitter-vertical splitter-video-middle"
              onMouseDown={handleStartDragVideo}
              onTouchStart={handleStartDragVideo}
              title="Drag to resize Video vs Side Feature (Double-click to reset)"
              onDoubleClick={() => setVideoWidthPercent(52)}
            >
              <div className="splitter-handle-pill" />
            </div>

            {/* TOP RIGHT: Side-Middle Feature (Defaults to AI Assistant Chatbot!) */}
            <div 
              className="top-side-middle-feature-column"
              style={{ width: `calc(${100 - videoWidthPercent}% - 10px)` }}
            >
              {/* Feature Switcher Header Strip */}
              <div className="side-middle-switcher-header">
                <div className="side-feature-selector-tabs">
                  <button 
                    className={`side-feat-tab ${middleFeature === 'chat' ? 'is-active' : ''}`}
                    onClick={() => setMiddleFeature('chat')}
                    title="Display AI Video Tutor in side-middle"
                  >
                    <Bot size={15} /> <span>AI Tutor</span>
                  </button>
                  <button 
                    className={`side-feat-tab ${middleFeature === 'notes' ? 'is-active' : ''}`}
                    onClick={() => setMiddleFeature('notes')}
                    title="Display Handwritten Notes in side-middle"
                  >
                    <FileText size={15} /> <span>Notes</span>
                  </button>
                  <button 
                    className={`side-feat-tab ${middleFeature === 'quiz' ? 'is-active' : ''}`}
                    onClick={() => setMiddleFeature('quiz')}
                    title="Display Lesson Quiz in side-middle"
                  >
                    <HelpCircle size={15} /> <span>Quiz</span>
                  </button>
                  <button 
                    className={`side-feat-tab ${middleFeature === 'transcript' ? 'is-active' : ''}`}
                    onClick={() => setMiddleFeature('transcript')}
                    title="Display Transcript in side-middle"
                  >
                    <AlignLeft size={15} /> <span>Transcript</span>
                  </button>
                  <button 
                    className={`side-feat-tab ${middleFeature === 'objectives' ? 'is-active' : ''}`}
                    onClick={() => setMiddleFeature('objectives')}
                    title="Display Objectives in side-middle"
                  >
                    <Map size={15} /> <span>Objectives</span>
                  </button>
                </div>

                {/* Quick Swap with Bottom Pane Button */}
                <button 
                  className="side-swap-panes-btn"
                  onClick={handleSwapPanes}
                  title="Swap feature with bottom panel"
                >
                  <ArrowUpDown size={14} />
                  <span>Swap with Bottom</span>
                </button>
              </div>

              {/* Render selected middle feature */}
              <div className="side-middle-feature-canvas">
                {renderFeatureContent(middleFeature, 'middle')}
              </div>
            </div>
          </div>

          {/* SPLITTER 2 (Horizontal Drag Bar): Between Top Row (Video+Chat) and Bottom Features Row */}
          <div 
            className="resize-splitter splitter-horizontal splitter-top-bottom"
            onMouseDown={handleStartDragRow}
            onTouchStart={handleStartDragRow}
            title="Drag to resize Top (Video + Chat) vs Bottom Features (Double-click to reset)"
            onDoubleClick={() => setTopRowHeightPercent(58)}
          >
            <div className="splitter-handle-pill horizontal-pill" />
          </div>

          {/* BOTTOM ROW: The Rest of the Features */}
          <div 
            className="workspace-bottom-row"
            style={{ height: `calc(${100 - topRowHeightPercent}% - 10px)` }}
          >
            {/* Bottom Feature Selector Tab Strip */}
            <div className="bottom-feature-tab-strip">
              <div className="bottom-feature-tabs-group">
                <button 
                  className={`bottom-feat-tab ${bottomFeature === 'notes' ? 'active-tab' : ''}`}
                  onClick={() => setBottomFeature('notes')}
                >
                  <FileText size={17} /> <span>✍️ AI Handwritten Notes</span>
                </button>
                <button 
                  className={`bottom-feat-tab ${bottomFeature === 'chat' ? 'active-tab' : ''}`}
                  onClick={() => setBottomFeature('chat')}
                >
                  <Bot size={17} /> <span>💬 AI Video Tutor</span>
                </button>
                <button 
                  className={`bottom-feat-tab ${bottomFeature === 'quiz' ? 'active-tab' : ''}`}
                  onClick={() => setBottomFeature('quiz')}
                >
                  <HelpCircle size={17} /> <span>🎯 Lesson Quiz</span>
                </button>
                <button 
                  className={`bottom-feat-tab ${bottomFeature === 'transcript' ? 'active-tab' : ''}`}
                  onClick={() => setBottomFeature('transcript')}
                >
                  <AlignLeft size={17} /> <span>📋 Interactive Transcript</span>
                </button>
                <button 
                  className={`bottom-feat-tab ${bottomFeature === 'objectives' ? 'active-tab' : ''}`}
                  onClick={() => setBottomFeature('objectives')}
                >
                  <Map size={17} /> <span>📖 Module Objectives</span>
                </button>
              </div>

              <div className="bottom-tab-right-meta">
                <button 
                  className="quick-swap-bottom-btn"
                  onClick={handleSwapPanes}
                  title="Swap with middle pane"
                >
                  <ArrowUpDown size={13} /> <span>Swap with Middle</span>
                </button>
              </div>
            </div>

            {/* Bottom Feature Independent Scroll Canvas */}
            <div className="bottom-feature-scroll-canvas">
              {renderFeatureContent(bottomFeature, 'bottom')}
            </div>
          </div>
        </div>

        {/* SPLITTER 3 (Vertical Drag Bar): Between Main Workspace and Curriculum Playlist Sidebar */}
        {!playlistCollapsed && (
          <div 
            className="resize-splitter splitter-vertical splitter-main-sidebar"
            onMouseDown={handleStartDragSidebar}
            onTouchStart={handleStartDragSidebar}
            title="Drag to resize Playlist Sidebar (Double-click to reset)"
            onDoubleClick={() => setSidebarWidth(360)}
          >
            <div className="splitter-handle-pill" />
          </div>
        )}

        {/* RIGHT COLUMN: Curriculum Explorer Playlist Sidebar */}
        {!playlistCollapsed && (
          <aside 
            className="workspace-curriculum-sidebar"
            style={{ width: `${sidebarWidth}px` }}
          >
            {renderCurriculumNavigation()}
          </aside>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h4>Curriculum Explorer</h4>
              <button className="mobile-drawer-close" onClick={() => setMobileDrawerOpen(false)}>✕</button>
            </div>
            {renderCurriculumNavigation()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningWorkspacePage;
