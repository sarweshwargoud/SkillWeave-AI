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
  Check, 
  Bookmark, 
  Maximize2, 
  Minimize2,
  ExternalLink,
  Search,
  BookOpen,
  SidebarClose,
  SidebarOpen,
  Menu,
  X,
  Layers
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

  // Active course data (passed from state, loaded from library, or seeded default)
  const [course, setCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  // Workspace panels & tabs
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' | 'notes' | 'roadmap' | 'transcript' | 'quiz'
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  // Video-specific assets state
  const [videoNotes, setVideoNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Completed videos tracking (persisted)
  const [completedVideos, setCompletedVideos] = useState({});

  useEffect(() => {
    loadCourseData();
  }, [state]);

  const loadCourseData = async () => {
    let courseToLoad = state?.courseData;

    // If no course in state, try to fetch the most recent course from local storage / db
    if (!courseToLoad) {
      const { data: courses } = await client.from('courses').select('*');
      if (courses && courses.length > 0) {
        courseToLoad = courses[0];
      }
    }

    if (courseToLoad) {
      setCourse(courseToLoad);

      // Extract all flat videos
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
        // Select either last watched or first video
        const initialVid = allVideos[0];
        setActiveVideo(initialVid);
        setActiveModuleIdx(initialVid.moduleIdx);
        setActiveVideoIdx(initialVid.videoIdx);
      }
    }
  };

  // When active video changes, fetch its transcript & prepare its notes
  useEffect(() => {
    if (activeVideo?.id) {
      loadTranscript(activeVideo.id);
      setVideoNotes(null); // Reset or load cache
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

  const loadNotesForActiveVideo = async () => {
    if (!activeVideo?.id) return;
    setNotesLoading(true);
    try {
      const notes = await generateHandwrittenNotes(activeVideo.id, 'detailed');
      setVideoNotes(notes);
    } catch (e) {
      console.error("Notes generation error:", e);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSelectVideo = (modIdx, vidIdx, videoObj) => {
    setActiveModuleIdx(modIdx);
    setActiveVideoIdx(vidIdx);
    setActiveVideo(videoObj);
    setMobileDrawerOpen(false); // Close mobile drawer on selection
  };

  const handleToggleComplete = async (vidId) => {
    const newStatus = !completedVideos[vidId];
    const updated = { ...completedVideos, [vidId]: newStatus };
    setCompletedVideos(updated);

    // Calculate updated progress percentage
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
      // Next video in same module
      const nextVid = vList[activeVideoIdx + 1];
      handleSelectVideo(activeModuleIdx, activeVideoIdx + 1, nextVid);
    } else if (activeModuleIdx < course.modules.length - 1) {
      // First video of next module
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
          <p>Generate a new syllabus or select a saved course from My Learning.</p>
          <div className="empty-actions-row">
            <button className="btn-primary" onClick={() => navigate('/create')}>
              Generate New Roadmap
            </button>
            <button className="btn-secondary" onClick={() => navigate('/my-learning')}>
              Open My Learning
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

  // Shared Curriculum Navigation Renderer (Used in desktop sidebar and mobile drawer)
  const renderCurriculumNavigation = () => (
    <>
      <div className="sidebar-course-header">
        <div className="header-meta-row">
          <span className="course-type-tag">Active Curriculum</span>
          <span className="course-done-badge">{doneCount}/{totalCount} Finished</span>
        </div>
        <h3 className="sidebar-course-title">{course.title}</h3>
        
        <div className="course-progress-indicator">
          <div className="progress-text-row">
            <span>Course Progress</span>
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

          return (
            <div key={mIdx} className={`module-nav-section ${isCurrentModule ? 'current-module' : ''}`}>
              <div className="module-nav-header">
                <span className="module-idx-pill">M{mIdx + 1}</span>
                <h5 className="module-nav-heading">{module.module_title}</h5>
              </div>

              <div className="module-lessons-list">
                {videoList.map((vid, vIdx) => {
                  const isPlaying = activeVideo?.id === vid.id;
                  const isDone = completedVideos[vid.id] || vid.completed;

                  return (
                    <div
                      key={vIdx}
                      className={`lesson-nav-row ${isPlaying ? 'active-lesson' : ''} ${isDone ? 'completed-lesson' : ''}`}
                      onClick={() => handleSelectVideo(mIdx, vIdx, vid)}
                    >
                      <button
                        className="lesson-check-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(vid.id);
                        }}
                        title={isDone ? "Mark incomplete" : "Mark completed"}
                        aria-label="Toggle completed"
                      >
                        {isDone ? (
                          <CheckCircle2 size={18} className="icon-check-done" />
                        ) : (
                          <Circle size={18} className="icon-check-pending" />
                        )}
                      </button>

                      <div className="lesson-nav-text">
                        <span className="lesson-nav-title">{vid.title}</span>
                        <span className="lesson-nav-duration">
                          <Clock size={11} /> {vid.durationFormatted || 'Lesson'}
                        </span>
                      </div>

                      {isPlaying && <div className="now-playing-dot" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="workspace-page-container">
      <Navbar />

      {/* Mobile Top Curriculum Quick Bar (Visible only on mobile/tablet screens) */}
      <div className="workspace-mobile-subbar">
        <button
          className="mobile-curriculum-btn"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open course playlist"
        >
          <Layers size={16} />
          <span>Curriculum Playlist ({overallPercent}%)</span>
        </button>

        <div className="mobile-lesson-counter">
          <span>Module {activeModuleIdx + 1}</span>
        </div>
      </div>

      {/* Main Full-Screen Responsive 3-Column Studio Layout */}
      <div className={`workspace-studio-stage ${rightPanelCollapsed ? 'right-collapsed' : ''}`}>
        
        {/* COLUMN A: Left Sidebar Course & Lesson Navigation (Desktop) */}
        <aside className="workspace-nav-sidebar">
          {renderCurriculumNavigation()}
        </aside>

        {/* COLUMN B: Center Video Player & Lesson Learning Area */}
        <section className="workspace-player-center">
          {activeVideo ? (
            <div className="player-stage-card">
              {/* YouTube Responsive Embed */}
              <div className="video-player-aspect">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${activeVideo.id}?enablejsapi=1`}
                  title={activeVideo.title}
                  className="yt-workspace-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Lesson Controls & Information */}
              <div className="video-control-banner">
                <div className="video-title-area">
                  <span className="current-milestone-tag">
                    {course.modules[activeModuleIdx]?.module_title || 'Current Milestone'}
                  </span>
                  <h2 className="current-video-title">{activeVideo.title}</h2>
                  <span className="video-channel-subtitle">{activeVideo.channelTitle}</span>
                </div>

                <div className="video-actions-strip">
                  <button
                    className={`btn-complete-lesson ${completedVideos[activeVideo.id] ? 'is-completed' : ''}`}
                    onClick={() => handleToggleComplete(activeVideo.id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>{completedVideos[activeVideo.id] ? 'Lesson Completed' : 'Mark as Completed'}</span>
                  </button>

                  <div className="prev-next-nav-group">
                    <button
                      className="nav-arrow-btn"
                      onClick={handlePrevVideo}
                      title="Previous lesson"
                    >
                      <ChevronLeft size={18} /> Prev
                    </button>
                    <button
                      className="nav-arrow-btn"
                      onClick={handleNextVideo}
                      title="Next lesson"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-video-selected-card">
              <Play size={48} />
              <h3>Select a video from the sidebar</h3>
            </div>
          )}
        </section>

        {/* COLUMN C: Right Panel AI Assistant Tabs */}
        <aside className={`workspace-ai-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          {/* Panel Top Tabs */}
          <div className="ai-tabs-header">
            <div className="tabs-scroller">
              <button
                className={`tab-btn ${activeTab === 'tutor' ? 'active' : ''}`}
                onClick={() => setActiveTab('tutor')}
              >
                <MessageSquare size={14} /> AI Tutor
              </button>
              <button
                className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('notes');
                  if (!videoNotes) loadNotesForActiveVideo();
                }}
              >
                <FileText size={14} /> Notes
              </button>
              <button
                className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
                onClick={() => setActiveTab('roadmap')}
              >
                <Map size={14} /> Syllabus
              </button>
              <button
                className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                <ListOrdered size={14} /> Transcript
              </button>
              <button
                className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                <HelpCircle size={14} /> Quiz
              </button>
            </div>

            <button
              className="collapse-panel-btn desktop-only"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              title={rightPanelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {rightPanelCollapsed ? <SidebarOpen size={16} /> : <SidebarClose size={16} />}
            </button>
          </div>

          {/* Tab Content Panes (Persistent, state preserving) */}
          <div className="ai-tab-body">
            {/* TAB 1: AI TUTOR */}
            {activeTab === 'tutor' && activeVideo && (
              <AITutorChat
                videoId={activeVideo.id}
                videoTitle={activeVideo.title}
                currentTimestamp={currentTimestamp}
                onSeekTimestamp={handleSeekTimestamp}
              />
            )}

            {/* TAB 2: HANDWRITTEN NOTES */}
            {activeTab === 'notes' && (
              <div className="tab-notes-wrapper">
                {notesLoading ? (
                  <div className="tab-loading-state">
                    <Sparkles size={24} className="tab-spinner" />
                    <h4>Synthesizing Handwritten Notes...</h4>
                    <p>Extracting formulas, definitions, and high-yield concepts from this video.</p>
                  </div>
                ) : videoNotes ? (
                  <HandwrittenNotesViewer
                    notesData={videoNotes}
                    onSaveNote={() => alert("Note saved to your personal library!")}
                  />
                ) : (
                  <div className="tab-empty-state">
                    <FileText size={32} />
                    <h4>Generate Notes for This Lesson</h4>
                    <button className="btn-primary" onClick={loadNotesForActiveVideo}>
                      Generate Handwritten Notes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ROADMAP & MODULE MILESTONES */}
            {activeTab === 'roadmap' && (
              <div className="tab-roadmap-view">
                <div className="current-milestone-overview">
                  <span className="milestone-badge">Current Module</span>
                  <h4>{course.modules[activeModuleIdx]?.module_title}</h4>
                  <p>{course.modules[activeModuleIdx]?.objective || course.modules[activeModuleIdx]?.description}</p>
                </div>

                {course.modules[activeModuleIdx]?.exercise && (
                  <div className="milestone-exercise-card">
                    <h5>✍ Practical Milestone Exercise:</h5>
                    <p>{course.modules[activeModuleIdx].exercise}</p>
                  </div>
                )}

                <div className="syllabus-mini-stack">
                  <h5>All Course Milestones:</h5>
                  {course.modules?.map((mod, idx) => (
                    <div
                      key={idx}
                      className={`mini-milestone-row ${idx === activeModuleIdx ? 'active-row' : ''}`}
                      onClick={() => {
                        const vList = mod.videos || (mod.video ? [mod.video] : []);
                        if (vList.length > 0) handleSelectVideo(idx, 0, vList[0]);
                      }}
                    >
                      <span className="milestone-step-pill">{idx + 1}</span>
                      <span className="milestone-row-title">{mod.module_title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: INTERACTIVE SEARCHABLE TRANSCRIPT */}
            {activeTab === 'transcript' && (
              <div className="tab-transcript-view">
                <div className="transcript-search-bar">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search keywords in transcript..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                  />
                </div>

                <div className="transcript-segments-scroll">
                  {transcriptLoading ? (
                    <p className="loading-transcript-text">Loading transcript...</p>
                  ) : transcriptData?.segments && transcriptData.segments.length > 0 ? (
                    transcriptData.segments
                      .filter(seg => !transcriptSearch || seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                      .map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          className="transcript-line-item"
                          onClick={() => handleSeekTimestamp(seg.timestamp)}
                        >
                          <span className="ts-pill">{seg.timestamp}</span>
                          <span className="ts-text">{seg.text}</span>
                        </div>
                      ))
                  ) : (
                    <div className="no-transcript-box">
                      <p>Subtitles are not publicly provided for this video.</p>
                      <p className="sub-hint">The AI Tutor and Notes engines still function using audio transcription parsing.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: VIDEO QUIZ */}
            {activeTab === 'quiz' && activeVideo && (
              <div className="tab-quiz-view">
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
          </div>
        </aside>
      </div>

      {/* Mobile Slide-Out Curriculum Drawer Modal */}
      {mobileDrawerOpen && (
        <div className="workspace-mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="workspace-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h4>Course Syllabus & Videos</h4>
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
