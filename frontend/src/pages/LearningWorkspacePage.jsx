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
  Columns, 
  Maximize2, 
  Minimize2, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  ArrowLeft,
  Tv
} from 'lucide-react';

import Navbar from '../components/Navbar';
import ActivityBar from '../components/workspace/ActivityBar';
import PrimarySidebar from '../components/workspace/PrimarySidebar';
import Splitter from '../components/workspace/Splitter';
import WorkspaceTabs from '../components/workspace/WorkspaceTabs';
import RightAIPanel from '../components/workspace/RightAIPanel';
import BottomTerminalPanel from '../components/workspace/BottomTerminalPanel';
import StatusBar from '../components/workspace/StatusBar';

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
import { encryptData, decryptData, isEncryptedPayload } from '../services/crypto';
import './LearningWorkspacePage.css';

const DEFAULT_TABS = [
  { id: 'video', title: 'Lesson Player', closable: false },
  { id: 'notes', title: 'Handwritten Notes' },
  { id: 'quiz', title: 'Lesson Quiz' },
  { id: 'transcript', title: 'Transcript' },
  { id: 'roadmap', title: 'Roadmap Tree' }
];

const LearningWorkspacePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = getClient();
  const iframeRef = useRef(null);

  // Authentication & User State
  const [user, setUser] = useState(null);

  // Active course data
  const [course, setCourse] = useState(null);
  const [userCourses, setUserCourses] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  // Video-specific assets state
  const [videoNotes, setVideoNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [completedVideos, setCompletedVideos] = useState({});
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  // VS Code Layout Dimensions & Collapse States
  const [theme, setTheme] = useState(() => localStorage.getItem('skillweave_theme') || 'dark');
  const [activeSidebarView, setActiveSidebarView] = useState('explorer');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(360);
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // Editor Tabs & Split View
  const [openTabs, setOpenTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState('video');
  const [isSplitView, setIsSplitView] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Client-Side E2EE State
  const [e2eeKey, setE2eeKey] = useState(() => localStorage.getItem('skillweave_e2ee_pass') || 'my-secure-vault-key-2026');
  const [e2eeEnabled, setE2eeEnabled] = useState(true);

  // Load User & Layout Settings from Supabase on mount
  useEffect(() => {
    const initUserAndSettings = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }

        // Load Remote Workspace Settings
        const remoteSettings = await getWorkspaceSettings();
        if (remoteSettings) {
          if (remoteSettings.theme) setTheme(remoteSettings.theme);
          if (remoteSettings.sidebar_width) setSidebarWidth(remoteSettings.sidebar_width);
          if (remoteSettings.ai_panel_width) setAiPanelWidth(remoteSettings.ai_panel_width);
          if (remoteSettings.terminal_height) setTerminalHeight(remoteSettings.terminal_height);
          if (typeof remoteSettings.sidebar_collapsed === 'boolean') setIsSidebarCollapsed(remoteSettings.sidebar_collapsed);
          if (typeof remoteSettings.ai_panel_collapsed === 'boolean') setIsAIPanelCollapsed(remoteSettings.ai_panel_collapsed);
          if (typeof remoteSettings.terminal_collapsed === 'boolean') setIsTerminalCollapsed(remoteSettings.terminal_collapsed);
          if (remoteSettings.active_sidebar_view) setActiveSidebarView(remoteSettings.active_sidebar_view);
        }

        // Fetch User's courses and projects for sidebar
        const [courses, projects] = await Promise.all([
          getUserCourses().catch(() => []),
          getUserProjects().catch(() => [])
        ]);
        if (courses) setUserCourses(courses);
        if (projects) setUserProjects(projects);
      } catch (err) {
        console.warn('Workspace initial settings note:', err);
      }
    };

    initUserAndSettings();
  }, []);

  // Save Settings when changed (debounced)
  const saveTimeoutRef = useRef(null);
  const persistSettings = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const payload = {
        theme,
        sidebar_width: sidebarWidth,
        ai_panel_width: aiPanelWidth,
        terminal_height: terminalHeight,
        sidebar_collapsed: isSidebarCollapsed,
        ai_panel_collapsed: isAIPanelCollapsed,
        terminal_collapsed: isTerminalCollapsed,
        active_tab: activeTab,
        active_sidebar_view: activeSidebarView
      };
      try {
        localStorage.setItem('skillweave_theme', theme);
        await updateWorkspaceSettings(payload);
      } catch (e) {
        // Fallback already in localStorage
      }
    }, 1000);
  }, [theme, sidebarWidth, aiPanelWidth, terminalHeight, isSidebarCollapsed, isAIPanelCollapsed, isTerminalCollapsed, activeTab, activeSidebarView]);

  useEffect(() => {
    persistSettings();
  }, [sidebarWidth, aiPanelWidth, terminalHeight, isSidebarCollapsed, isAIPanelCollapsed, isTerminalCollapsed, activeSidebarView, theme, persistSettings]);

  // Handle global keyboard shortcuts: Ctrl+B (sidebar), Ctrl+J (terminal), Ctrl+\ (AI panel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl or Meta (Cmd on Mac)
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      } else if (ctrlOrCmd && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsTerminalCollapsed(prev => !prev);
      } else if (ctrlOrCmd && e.key === '\\') {
        e.preventDefault();
        setIsAIPanelCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

    // Fallback 2: Fetch the user's latest course
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
      
      // Auto-save to user notes in Supabase with optional client E2EE
      if (notes && user) {
        let contentToStore = notes.content || JSON.stringify(notes);
        let isEncrypted = false;
        let encMetadata = null;

        if (e2eeEnabled && e2eeKey) {
          const encryptedResult = await encryptData(contentToStore, e2eeKey);
          contentToStore = encryptedResult.ciphertext;
          isEncrypted = true;
          encMetadata = {
            iv: encryptedResult.iv,
            salt: encryptedResult.salt,
            algorithm: 'AES-GCM-256'
          };
        }

        await saveUserNote({
          course_id: course?.id || null,
          video_id: vidId,
          title: `Notes: ${activeVideo?.title || 'Lesson'}`,
          content: contentToStore,
          is_encrypted: isEncrypted,
          encryption_metadata: encMetadata
        }).catch(err => console.warn('Note save note:', err));
      }
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
        const vList = m.videos || (m.video ? [m.video] : []);
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

  const handleCloseTab = (tabId) => {
    if (tabId === 'video') return; // Cannot close primary video tab
    setOpenTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('video');
    }
  };

  const handleResetLayout = () => {
    setSidebarWidth(280);
    setAiPanelWidth(360);
    setTerminalHeight(180);
    setIsSidebarCollapsed(false);
    setIsAIPanelCollapsed(false);
    setIsTerminalCollapsed(false);
    setOpenTabs(DEFAULT_TABS);
    setActiveTab('video');
    setIsSplitView(false);
    setIsTheaterMode(false);
  };

  if (!course) {
    return (
      <div className={`vscode-workspace-page theme-${theme}`}>
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

  // Filtered transcript search
  const filteredTranscript = transcriptData?.transcript?.filter(item => 
    !transcriptSearch || item.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  return (
    <div className={`vscode-workspace-page theme-${theme}`}>
      {/* Top Main Navigation */}
      <Navbar />

      {/* Main VS Code Workspace Grid */}
      <div className="vscode-ide-viewport">
        {/* 1. FAR LEFT: Activity Bar */}
        <ActivityBar
          activeView={activeSidebarView}
          setActiveView={setActiveSidebarView}
          sidebarCollapsed={isSidebarCollapsed}
          setSidebarCollapsed={setIsSidebarCollapsed}
          theme={theme}
          setTheme={setTheme}
          user={user}
          e2eeEnabled={e2eeEnabled}
          onOpenSettings={() => {
            setActiveSidebarView('settings');
            setIsSidebarCollapsed(false);
          }}
        />

        {/* 2. PRIMARY SIDEBAR */}
        <PrimarySidebar
          activeView={activeSidebarView}
          width={sidebarWidth}
          isCollapsed={isSidebarCollapsed}
          onCollapse={() => setIsSidebarCollapsed(true)}
          course={course}
          activeVideo={activeVideo}
          completedVideos={completedVideos}
          onSelectVideo={handleSelectVideo}
          userCourses={userCourses}
          userProjects={userProjects}
          onLoadCourse={(c) => {
            setCourse(c);
            loadCourseData();
          }}
          onResetLayout={handleResetLayout}
          e2eeKey={e2eeKey}
          setE2eeKey={setE2eeKey}
          e2eeEnabled={e2eeEnabled}
          setE2eeEnabled={setE2eeEnabled}
          theme={theme}
          setTheme={setTheme}
        />

        {/* 3. SPLITTER: Primary Sidebar Resize Handle */}
        {!isSidebarCollapsed && (
          <Splitter
            direction="horizontal"
            onResize={(delta) => {
              setSidebarWidth(prev => Math.min(550, Math.max(200, prev + delta)));
            }}
          />
        )}

        {/* 4. CENTRAL WORKING AREA (Editor + Terminal) */}
        <div className="vscode-central-canvas">
          {/* Top Multi-Tab Bar */}
          <WorkspaceTabs
            openTabs={openTabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onCloseTab={handleCloseTab}
            isSplitView={isSplitView}
            onToggleSplitView={() => setIsSplitView(!isSplitView)}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
          />

          {/* Editor Canvas Content Area */}
          <div className={`vscode-editor-body ${isSplitView ? 'split-active' : ''} ${isTheaterMode ? 'theater-expanded' : ''}`}>
            
            {/* MAIN PANE: Video Player */}
            <div className={`editor-pane pane-primary ${(isSplitView || activeTab === 'video') ? 'visible-pane' : 'hidden-pane'}`}>
              <div className="cinema-player-wrapper">
                {activeVideo ? (
                  <>
                    <div className="cinema-iframe-bezel">
                      <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&enablejsapi=1`}
                        title={activeVideo.title}
                        className="vscode-theater-iframe"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    {/* Integrated Lesson Controls Bar */}
                    <div className="player-meta-control-bar">
                      <div className="player-left-info">
                        <span className="live-playing-badge" />
                        <div className="player-title-box">
                          <span className="player-module-sub">{activeVideo.moduleTitle || `Module ${activeModuleIdx + 1}`}</span>
                          <h2 className="current-video-heading" title={activeVideo.title}>{activeVideo.title}</h2>
                        </div>
                      </div>

                      <div className="player-right-actions">
                        <button
                          className={`btn-complete-toggle ${completedVideos[activeVideo.id] ? 'is-completed' : ''}`}
                          onClick={() => handleToggleComplete(activeVideo.id)}
                          title={completedVideos[activeVideo.id] ? 'Completed' : 'Mark Completed'}
                        >
                          <CheckCircle2 size={13} />
                          <span>{completedVideos[activeVideo.id] ? 'Done' : 'Mark Complete'}</span>
                        </button>

                        <div className="prev-next-arrows-box">
                          <button
                            className="step-arrow-btn"
                            onClick={handlePrevVideo}
                            title="Previous Lesson"
                          >
                            <ChevronLeft size={15} /> Prev
                          </button>
                          <button
                            className="step-arrow-btn"
                            onClick={handleNextVideo}
                            title="Next Lesson"
                          >
                            Next <ChevronRight size={15} />
                          </button>
                        </div>

                        <button
                          className="theater-expand-btn"
                          onClick={() => setIsTheaterMode(!isTheaterMode)}
                          title={isTheaterMode ? "Exit Theater Mode" : "Expand Theater Mode"}
                        >
                          {isTheaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-video-placeholder">
                    <Play size={40} />
                    <h3>Select a lesson from the curriculum explorer to begin</h3>
                  </div>
                )}
              </div>
            </div>

            {/* SECONDARY PANE: Notes, Quiz, Transcript, or Roadmap Tree */}
            <div className={`editor-pane pane-secondary ${(!isSplitView && activeTab === 'video') ? 'hidden-pane' : 'visible-pane'}`}>
              
              {/* TAB: NOTES */}
              {activeTab === 'notes' && (
                <div className="tab-pane-scroll notes-tab-pane">
                  <div className="notes-hero-controls">
                    <div className="notes-heading-group">
                      <FileText size={18} className="text-amber-400" />
                      <div>
                        <h3>AI Handwritten Study Notes</h3>
                        <p>Detailed handwritten summary with ruled paper background & LaTeX math</p>
                      </div>
                    </div>

                    <div className="notes-action-buttons">
                      {!videoNotes && (
                        <button
                          className="btn-generate-notes-action"
                          onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                          disabled={notesLoading || !activeVideo?.id}
                        >
                          <Sparkles size={14} />
                          <span>{notesLoading ? 'Synthesizing Notes...' : 'Generate Notes for This Lesson'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {notesLoading ? (
                    <div className="notes-loading-state">
                      <Sparkles size={24} className="spinning text-amber-400" />
                      <h4>Analyzing Lecture Audio & Video Transcripts...</h4>
                      <p>Drafting handwritten-style key takeaways, code examples, and review flashcards.</p>
                    </div>
                  ) : videoNotes ? (
                    <HandwrittenNotesViewer notesData={videoNotes} />
                  ) : (
                    <div className="notes-empty-card">
                      <FileText size={36} className="text-gray-500" />
                      <h4>No notes generated yet for this lesson</h4>
                      <p>Click "Generate Notes" above to create clean, structured notes.</p>
                      <button
                        className="btn-primary"
                        onClick={() => activeVideo?.id && loadNotesForVideo(activeVideo.id)}
                      >
                        Generate Notes
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: QUIZ */}
              {activeTab === 'quiz' && (
                <div className="tab-pane-scroll quiz-tab-pane">
                  <LessonQuiz
                    videoId={activeVideo?.id}
                    videoTitle={activeVideo?.title}
                    onQuizComplete={(sc) => console.log('Quiz completed with score:', sc)}
                  />
                </div>
              )}

              {/* TAB: TRANSCRIPT */}
              {activeTab === 'transcript' && (
                <div className="tab-pane-scroll transcript-tab-pane">
                  <div className="transcript-search-bar">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Filter transcript lines..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="transcript-search-input"
                    />
                    <span className="transcript-count-pill">{filteredTranscript.length} lines</span>
                  </div>

                  {transcriptLoading ? (
                    <div className="transcript-loading-box">
                      <AlignLeft size={20} className="spinning text-sky-400" />
                      <span>Fetching synchronized captions...</span>
                    </div>
                  ) : filteredTranscript.length > 0 ? (
                    <div className="transcript-lines-list">
                      {filteredTranscript.map((line, idx) => (
                        <div
                          key={idx}
                          className="transcript-line-row"
                          onClick={() => handleSeekTimestamp(line.timestamp || '00:00')}
                          title={`Jump video to ${line.timestamp}`}
                        >
                          <span className="ts-badge"><Clock size={10} /> {line.timestamp}</span>
                          <span className="ts-text">{line.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="transcript-empty-state">
                      <AlignLeft size={32} className="text-gray-500" />
                      <p>No transcript available or matches found for this lesson.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ROADMAP TREE */}
              {activeTab === 'roadmap' && (
                <div className="tab-pane-scroll roadmap-tab-pane">
                  <div className="roadmap-overview-header">
                    <h3>Curriculum Architecture</h3>
                    <span className="roadmap-stats-pill">{doneCount} of {totalCount} Completed ({overallPercent}%)</span>
                  </div>
                  <div className="roadmap-modules-grid">
                    {course.modules?.map((mod, mIdx) => (
                      <div key={mIdx} className="roadmap-module-card">
                        <div className="roadmap-module-header">
                          <span className="roadmap-step-pill">Step {String(mIdx + 1).padStart(2, '0')}</span>
                          <h4>{mod.module_title}</h4>
                        </div>
                        <div className="roadmap-module-lessons">
                          {(mod.videos || (mod.video ? [mod.video] : [])).map((v, vIdx) => {
                            const isDone = completedVideos[v.id] || v.completed;
                            const isCurrent = activeVideo?.id === v.id;
                            return (
                              <div
                                key={vIdx}
                                className={`roadmap-lesson-item ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
                                onClick={() => {
                                  handleSelectVideo(mIdx, vIdx, v);
                                  setActiveTab('video');
                                }}
                              >
                                {isDone ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Circle size={13} />}
                                <span className="lesson-name">{v.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. SPLITTER: Bottom Terminal Resize Handle */}
          {!isTerminalCollapsed && (
            <Splitter
              direction="vertical"
              onResize={(delta) => {
                setTerminalHeight(prev => Math.min(450, Math.max(120, prev - delta)));
              }}
            />
          )}

          {/* 6. BOTTOM TERMINAL / CONSOLE PANEL */}
          <BottomTerminalPanel
            height={terminalHeight}
            isCollapsed={isTerminalCollapsed}
            onToggleCollapse={() => setIsTerminalCollapsed(true)}
            activeVideo={activeVideo}
            course={course}
            user={user}
          />
        </div>

        {/* 7. SPLITTER: Right AI Panel Resize Handle */}
        {!isAIPanelCollapsed && (
          <Splitter
            direction="horizontal"
            onResize={(delta) => {
              setAiPanelWidth(prev => Math.min(650, Math.max(260, prev - delta)));
            }}
          />
        )}

        {/* 8. RIGHT AI COPILOT PANEL */}
        <RightAIPanel
          activeVideo={activeVideo}
          course={course}
          currentTimestamp={currentTimestamp}
          onSeekTimestamp={handleSeekTimestamp}
          isCollapsed={isAIPanelCollapsed}
          onToggleCollapse={() => setIsAIPanelCollapsed(true)}
          width={aiPanelWidth}
        />
      </div>

      {/* 9. BOTTOM STATUS BAR */}
      <StatusBar
        branch="feature-security"
        activeVideo={activeVideo}
        currentTimestamp={currentTimestamp}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        isAIPanelCollapsed={isAIPanelCollapsed}
        onToggleAIPanel={() => setIsAIPanelCollapsed(prev => !prev)}
        isTerminalCollapsed={isTerminalCollapsed}
        onToggleTerminal={() => setIsTerminalCollapsed(prev => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        isE2EE={e2eeEnabled}
      />
    </div>
  );
};

export default LearningWorkspacePage;
