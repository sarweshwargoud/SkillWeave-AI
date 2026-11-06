import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  FileText, 
  Map, 
  HelpCircle, 
  ListOrdered, 
  Clock, 
  Sparkles, 
  Home,
  User,
  BookOpen,
  ArrowLeft,
  Maximize2, 
  Minimize2,
  Search,
  SidebarClose,
  SidebarOpen,
  Layers,
  X,
  Tv,
  Award,
  Folder,
  FolderOpen
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AITutorChat from '../components/AITutorChat';
import HandwrittenNotesViewer from '../components/HandwrittenNotesViewer';
import LessonQuiz from '../components/LessonQuiz';
import { fetchTranscript, generateHandwrittenNotes } from '../services/api';
import { getClient } from '../services/supabaseClient';
import './LearningWorkspacePage.css';

const LearningWorkspacePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = getClient();
  const iframeRef = useRef(null);

  // Active course data
  const [course, setCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  // Folder collapse state for curriculum tree
  const [openFolders, setOpenFolders] = useState({});

  // Layout & Under-Video Tabs
  const [activeTab, setActiveTab] = useState('notes'); // Default to 'notes' under video
  const [playlistCollapsed, setPlaylistCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  // Video-specific assets state
  const [videoNotes, setVideoNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Completed videos tracking
  const [completedVideos, setCompletedVideos] = useState({});

  // Lock window & document scroll while on workspace so the video player stays 100% fixed
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    loadCourseData();
  }, [state]);

  const loadCourseData = async () => {
    let courseToLoad = state?.courseData;

    // Fallback: If no course in state, fetch the most recent course from storage/DB
    if (!courseToLoad) {
      const { data: courses } = await client.from('courses').select('*');
      if (courses && courses.length > 0) {
        courseToLoad = courses[0];
      }
    }

    if (courseToLoad) {
      setCourse(courseToLoad);

      // Extract all flattened videos
      const allVideos = [];
      courseToLoad.modules?.forEach((mod, mIdx) => {
        if (mod.videos && mod.videos.length > 0) {
          mod.videos.forEach((vid, vIdx) => {
            allVideos.push({ ...vid, moduleIdx: mIdx, videoIdx: vIdx, moduleTitle: mod.module_title });
          });
        } else if (mod.video) {
          allVideos.push({ ...mod.video, moduleIdx: mIdx, videoIdx: 0, moduleTitle: mod.module_title });
        }
      });

      if (allVideos.length > 0) {
        let selectedVid = allVideos[0];
        // If an initialVideoId was passed from ProfilePage, activate it directly
        if (state?.initialVideoId) {
          const matched = allVideos.find(v => v.id === state.initialVideoId);
          if (matched) selectedVid = matched;
        }

        setActiveVideo(selectedVid);
        setActiveModuleIdx(selectedVid.moduleIdx);
        setActiveVideoIdx(selectedVid.videoIdx);
      }
    }
  };

  // When active video changes, fetch transcript and reset notes (do not auto-generate notes/quiz until user clicks)
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
      console.warn("Transcript load error:", e);
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
      [mIdx]: prev[mIdx] === false ? true : false
    }));
  };

  const handleSelectVideo = (modIdx, vidIdx, videoObj) => {
    setActiveModuleIdx(modIdx);
    setActiveVideoIdx(vidIdx);
    setActiveVideo(videoObj);
    setMobileDrawerOpen(false);

    // Update iframe source cleanly
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
        const vList = m.videos || (m.video ? [m.video] : []);
        vList.forEach(v => {
          totalVids++;
          if (updated[v.id]) finishedVids++;
        });
      });

      const progressPercent = totalVids > 0 ? Math.round((finishedVids / totalVids) * 100) : 0;
      await client.from('courses').update({
        progress: progressPercent,
        lastWatchedVideoId: vidId,
        lastActivity: new Date().toISOString()
      }).eq('id', course.id || course.title);
    }
  };

  const handleNextVideo = () => {
    if (!course?.modules) return;
    const currentMod = course.modules[activeModuleIdx];
    const vList = currentMod?.videos || (currentMod?.video ? [currentMod.video] : []);

    if (activeVideoIdx < vList.length - 1) {
      const nextVid = vList[activeVideoIdx + 1];
      handleSelectVideo(activeModuleIdx, activeVideoIdx + 1, nextVid);
    } else if (activeModuleIdx < course.modules.length - 1) {
      const nextMod = course.modules[activeModuleIdx + 1];
      const nextVList = nextMod.videos || (nextMod.video ? [nextMod.video] : []);
      if (nextVList.length > 0) {
        handleSelectVideo(activeModuleIdx + 1, 0, nextVList[0]);
      }
    }
  };

  const handlePrevVideo = () => {
    if (!course?.modules) return;
    if (activeVideoIdx > 0) {
      const currentMod = course.modules[activeModuleIdx];
      const vList = currentMod?.videos || (currentMod?.video ? [currentMod.video] : []);
      handleSelectVideo(activeModuleIdx, activeVideoIdx - 1, vList[activeVideoIdx - 1]);
    } else if (activeModuleIdx > 0) {
      const prevMod = course.modules[activeModuleIdx - 1];
      const prevVList = prevMod.videos || (prevMod.video ? [prevMod.video] : []);
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
    const list = m.videos || (m.video ? [m.video] : []);
    list.forEach(v => {
      totalCount++;
      if (completedVideos[v.id] || v.completed) doneCount++;
    });
  });
  const overallPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Curriculum Step-by-Step Navigation List (Rendered as Folder Tree Structure)
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
            <span>Progress</span>
            <strong>{overallPercent}%</strong>
          </div>
          <div className="progress-track-small">
            <div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="sidebar-modules-scroll">
        {course.modules?.map((module, mIdx) => {
          const videoList = module.videos || (module.video ? [module.video] : []);
          const isCurrentModule = mIdx === activeModuleIdx;
          const isFolderOpen = openFolders[mIdx] !== false; // open by default

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
                  <h5 className="folder-name-title">{module.module_title}</h5>
                </div>

                <span className="folder-lesson-count">{videoList.length}</span>
              </div>

              {/* Offset Nested Video Items with Branch Connectors */}
              {isFolderOpen && (
                <div className="folder-contents-tree">
                  {videoList.map((vid, vIdx) => {
                    const isPlaying = activeVideo?.id === vid.id;
                    const isDone = completedVideos[vid.id] || vid.completed;

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
                          <span className="tree-leaf-title">{vid.title}</span>
                          <span className="tree-leaf-meta">
                            <Clock size={10} /> {vid.durationFormatted || 'Lesson'}
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
    <div className="workspace-page-container">
      <Navbar />

      {/* Global Breadcrumbs & Quick Return Navigation Bar */}
      <nav className="workspace-sticky-top-nav">
        <div className="workspace-nav-left-group">
          <button 
            className="workspace-nav-btn return-home"
            onClick={() => navigate('/')}
            title="Return to Home"
          >
            <Home size={15} /> <span>Home</span>
          </button>
          
          <span className="nav-sep">/</span>

          <button 
            className="workspace-nav-btn return-mylearning"
            onClick={() => navigate('/my-learning')}
            title="Return to My Learning"
          >
            <BookOpen size={15} /> <span>My Learning</span>
          </button>

          <span className="nav-sep">/</span>

          <button 
            className="workspace-nav-btn return-profile"
            onClick={() => navigate('/profile')}
            title="Return to Profile & Projects"
          >
            <User size={15} /> <span>Profile & Projects</span>
          </button>
        </div>

        <div className="workspace-nav-center-meta">
          <span className="active-course-label">{course.title}</span>
          <span className="active-progress-pill">{overallPercent}% Done</span>
        </div>

        <div className="workspace-nav-right-actions">
          <button 
            className="workspace-toggle-sidebar-btn"
            onClick={() => setPlaylistCollapsed(!playlistCollapsed)}
            title={playlistCollapsed ? "Show Playlist" : "Hide Playlist"}
          >
            {playlistCollapsed ? <SidebarOpen size={16} /> : <SidebarClose size={16} />}
            <span>{playlistCollapsed ? "Show Playlist" : "Hide Playlist"}</span>
          </button>

          <button 
            className="mobile-playlist-drawer-trigger"
            onClick={() => setMobileDrawerOpen(true)}
            title="Open Playlist"
          >
            <Layers size={16} />
            <span>Playlist ({doneCount}/{totalCount})</span>
          </button>
        </div>
      </nav>

      {/* 2-Column Responsive Viewport: LEFT = Main Video & Under-Video Features, RIGHT = Step-by-Step Curriculum Playlist */}
      <div className={`workspace-theater-stage ${playlistCollapsed ? 'playlist-hidden' : ''} ${theaterMode ? 'theater-expanded' : ''}`}>
        
        {/* COLUMN 1 (LEFT SIDE): Video Player & Under-Video Features */}
        <main className="workspace-video-and-features-main">
          
          {/* PERMANENTLY FIXED VIDEO PLAYER STAGE */}
          {/* Fixed in place: does NOT move or scroll when user scrolls through notes / quiz / tutor below */}
          <section className="fixed-video-player-stage">
            <div className="player-stage-bezel">
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

                  {/* Video Control & Milestone Strip */}
                  <div className="player-meta-control-bar">
                    <div className="player-left-info">
                      <div className="player-left-title-row">
                        <span className="pulsing-red-circle" title="Now Playing"></span>
                        <h2 className="current-video-heading" title={activeVideo.title}>{activeVideo.title}</h2>
                      </div>
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
                        title={theaterMode ? "Exit Full Screen Theater" : "Switch to Full Screen Theater"}
                      >
                        {theaterMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
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
          </section>

          {/* UNDER-VIDEO FEATURE SUITE */}
          {/* Notes generation, AI tutor chat, quizzes, and transcripts displayed in separate interactive divs */}
          <section className="under-video-features-hub">
            
            {/* Feature Tab Selector Strip (Permanently fixed under video) */}
            <div className="under-video-tab-strip">
              <button
                className={`feature-tab-item ${activeTab === 'notes' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={16} />
                <span>✍️ AI Handwritten Notes</span>
              </button>

              <button
                className={`feature-tab-item ${activeTab === 'tutor' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('tutor')}
              >
                <MessageSquare size={16} />
                <span>🤖 AI Video Tutor</span>
              </button>

              <button
                className={`feature-tab-item ${activeTab === 'quiz' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                <HelpCircle size={16} />
                <span>🎯 Lesson Quiz</span>
              </button>

              <button
                className={`feature-tab-item ${activeTab === 'transcript' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                <ListOrdered size={16} />
                <span>📜 Interactive Transcript</span>
              </button>

              <button
                className={`feature-tab-item ${activeTab === 'roadmap' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('roadmap')}
              >
                <Map size={16} />
                <span>🗺️ Module Objectives</span>
              </button>
            </div>

            {/* TAB CONTENTS (Scrollable below without disturbing the sticky video player) */}
            <div className="under-video-tab-content-panel">
              
              {/* SEPARATE DIV 1: AI HANDWRITTEN NOTES */}
              {activeTab === 'notes' && (
                <div className="feature-section-div div-notes">
                  {notesLoading ? (
                    <div className="notes-generating-card">
                      <Sparkles size={28} className="notes-spin-sparkle" />
                      <h4>Synthesizing AI Handwritten Notes for This Video...</h4>
                      <p>Extracting definitions, core formulas, key exam takeaways, and visual diagrams.</p>
                    </div>
                  ) : videoNotes ? (
                    <div className="notes-viewer-fullwidth">
                      <HandwrittenNotesViewer
                        notesData={videoNotes}
                        onSaveNote={() => alert("Note successfully saved to your personal library!")}
                      />
                    </div>
                  ) : (
                    <div className="notes-generate-prompt-box">
                      <FileText size={36} />
                      <h4>Handwritten Notes for: {activeVideo?.title}</h4>
                      <p>Generate clean, readable handwritten-style notes with ruled paper and diagram boxes.</p>
                      <button 
                        className="btn-primary"
                        onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                      >
                        <Sparkles size={16} /> Generate Handwritten Notes
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SEPARATE DIV 2: AI VIDEO TUTOR */}
              {activeTab === 'tutor' && activeVideo && (
                <div className="feature-section-div div-tutor">
                  <div className="tutor-header-intro">
                    <span className="intro-badge">Interactive Video Tutor</span>
                    <h3>Ask Questions About This Lesson</h3>
                    <p>Ask anything about what is covered in this video. The AI tutor uses transcript grounding and timestamp references.</p>
                  </div>
                  <AITutorChat
                    videoId={activeVideo.id}
                    videoTitle={activeVideo.title}
                    currentTimestamp={currentTimestamp}
                    onSeekTimestamp={handleSeekTimestamp}
                  />
                </div>
              )}

              {/* SEPARATE DIV 3: LESSON QUIZ */}
              {activeTab === 'quiz' && activeVideo && (
                <div className="feature-section-div div-quiz">
                  <LessonQuiz
                    videoId={activeVideo.id}
                    videoTitle={activeVideo.title}
                    onQuizComplete={(result) => {
                      if (result.passed) {
                        handleToggleComplete(activeVideo.id);
                      }
                    }}
                  />
                </div>
              )}

              {/* SEPARATE DIV 4: SEARCHABLE INTERACTIVE TRANSCRIPT */}
              {activeTab === 'transcript' && (
                <div className="feature-section-div div-transcript">
                  <div className="transcript-search-strip">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search words and concepts in transcript..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="transcript-search-input"
                    />
                  </div>

                  <div className="transcript-segments-stream">
                    {transcriptLoading ? (
                      <div className="transcript-loading-state">
                        <Sparkles size={20} className="spinner-icon" />
                        <span>Transcribing audio stream...</span>
                      </div>
                    ) : transcriptData?.segments && transcriptData.segments.length > 0 ? (
                      transcriptData.segments
                        .filter(seg => !transcriptSearch || seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                        .map((seg, sIdx) => (
                          <div
                            key={sIdx}
                            className="transcript-segment-card"
                            onClick={() => handleSeekTimestamp(seg.timestamp)}
                            title="Click to jump video to this moment"
                          >
                            <span className="timestamp-badge">{seg.timestamp}</span>
                            <span className="segment-text">{seg.text}</span>
                          </div>
                        ))
                    ) : (
                      <div className="transcript-unavailable-card">
                        <p>Direct captions were not provided by YouTube for this video.</p>
                        <p className="caption-sub">The AI Video Tutor and Notes generator continue to analyze the video speech through audio intelligence.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SEPARATE DIV 5: MODULE OBJECTIVES & ROADMAP */}
              {activeTab === 'roadmap' && (
                <div className="feature-section-div div-roadmap">
                  <div className="current-milestone-card">
                    <div className="milestone-badge-pill">Step {activeModuleIdx + 1} Milestone</div>
                    <h3>{course.modules[activeModuleIdx]?.module_title}</h3>
                    <p className="milestone-desc">
                      {course.modules[activeModuleIdx]?.objective || course.modules[activeModuleIdx]?.description}
                    </p>

                    {course.modules[activeModuleIdx]?.exercise && (
                      <div className="hands-on-exercise-box">
                        <h5>✍️ Hands-On Milestone Exercise</h5>
                        <p>{course.modules[activeModuleIdx].exercise}</p>
                      </div>
                    )}
                  </div>

                  <div className="all-milestones-stepper">
                    <h4>All Curriculum Milestones ({course.modules?.length} Steps)</h4>
                    <div className="milestones-steps-list">
                      {course.modules?.map((mod, idx) => (
                        <div
                          key={idx}
                          className={`milestone-step-item ${idx === activeModuleIdx ? 'is-active-step' : ''}`}
                          onClick={() => {
                            const vList = mod.videos || (mod.video ? [mod.video] : []);
                            if (vList.length > 0) handleSelectVideo(idx, 0, vList[0]);
                          }}
                        >
                          <span className="step-count-pill">{idx + 1}</span>
                          <div className="step-info">
                            <strong>{mod.module_title}</strong>
                            <span className="step-sub">{mod.videos?.length || 1} video lesson(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* COLUMN 2 (RIGHT SIDE): Step-by-Step Curriculum Playlist */}
        <aside className="workspace-curriculum-sidebar">
          {renderCurriculumNavigation()}
        </aside>
      </div>

      {/* Mobile Slide-Out Curriculum Drawer Modal */}
      {mobileDrawerOpen && (
        <div className="workspace-mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="workspace-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h4>Curriculum Explorer</h4>
              <button
                className="close-drawer-btn"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close playlist"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-drawer-body">
              {renderCurriculumNavigation()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningWorkspacePage;
