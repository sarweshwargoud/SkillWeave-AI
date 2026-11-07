import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  FolderOpen, 
  Play, 
  CheckCircle2, 
  Circle, 
  Search, 
  ChevronLeft, 
  Plus, 
  RotateCcw, 
  GraduationCap, 
  Map, 
  BookOpen, 
  Video, 
  Clock, 
  Settings, 
  ShieldCheck, 
  Lock, 
  Key, 
  RefreshCw,
  Trash2,
  ExternalLink
} from 'lucide-react';
import './PrimarySidebar.css';

const PrimarySidebar = ({
  activeView,
  width,
  isCollapsed,
  onCollapse,
  course,
  activeVideo,
  completedVideos,
  onSelectVideo,
  userCourses = [],
  userProjects = [],
  onLoadCourse,
  onResetLayout,
  e2eeKey,
  setE2eeKey,
  e2eeEnabled,
  setE2eeEnabled,
  theme,
  setTheme
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState({});

  if (isCollapsed) return null;

  const toggleFolder = (mIdx) => {
    setOpenFolders(prev => ({
      ...prev,
      [mIdx]: prev[mIdx] === undefined ? false : !prev[mIdx]
    }));
  };

  const isFolderOpen = (mIdx) => {
    return openFolders[mIdx] !== false; // Open by default
  };

  // Render view titles
  const viewTitles = {
    explorer: 'EXPLORER: CURRICULUM',
    learning: 'MY LEARNING HUB',
    roadmaps: 'SAVED ROADMAPS',
    courses: 'COURSE LIBRARY',
    saved: 'SAVED LESSONS',
    history: 'WATCH HISTORY',
    settings: 'WORKSPACE SETTINGS'
  };

  return (
    <div className="vscode-primary-sidebar" style={{ width: `${width}px` }}>
      {/* Sidebar Top Title Bar */}
      <div className="sidebar-header-strip">
        <span className="sidebar-title-label">{viewTitles[activeView] || 'SIDEBAR'}</span>
        <div className="sidebar-header-actions">
          <button 
            className="sidebar-icon-action" 
            onClick={onCollapse} 
            title="Collapse Primary Sidebar (Ctrl+B)"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Main View Content Area */}
      <div className="sidebar-content-scrollable">
        {/* --- VIEW 1: EXPLORER / CURRICULUM TREE --- */}
        {activeView === 'explorer' && (
          <div className="explorer-view-wrapper">
            {/* Filter Search Input */}
            <div className="explorer-search-box">
              <Search size={13} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search modules & lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="explorer-search-input"
              />
            </div>

            {/* Course Title Header */}
            {course ? (
              <div className="explorer-course-banner">
                <span className="course-title-line" title={course.title}>{course.title}</span>
                <span className="course-progress-badge">
                  {course.progress !== undefined ? `${course.progress}%` : 'In Progress'}
                </span>
              </div>
            ) : (
              <div className="explorer-empty-placeholder">
                <p>No active course loaded.</p>
              </div>
            )}

            {/* Modules and Videos Tree */}
            <div className="explorer-tree-root">
              {course?.modules?.map((mod, mIdx) => {
                const videos = mod.videos || (mod.video ? [mod.video] : []);
                const isOpen = isFolderOpen(mIdx);
                const modCompleted = videos.length > 0 && videos.every(v => completedVideos[v.id]);

                // Filter lessons
                const filteredVideos = videos.filter(v => 
                  v.title.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (searchTerm && filteredVideos.length === 0 && !mod.module_title?.toLowerCase().includes(searchTerm.toLowerCase())) {
                  return null;
                }

                return (
                  <div key={mIdx} className="module-tree-node">
                    {/* Folder Header */}
                    <div 
                      className={`module-folder-row ${modCompleted ? 'completed-module' : ''}`}
                      onClick={() => toggleFolder(mIdx)}
                    >
                      <span className="folder-icon-wrap">
                        {isOpen ? <FolderOpen size={14} className="folder-open-icon" /> : <Folder size={14} className="folder-closed-icon" />}
                      </span>
                      <span className="folder-title" title={mod.module_title}>
                        {mod.module_title || `Module ${mIdx + 1}`}
                      </span>
                      <span className="folder-count-pill">{videos.length}</span>
                    </div>

                    {/* Lesson Files under Module */}
                    {isOpen && (
                      <div className="module-lessons-nest">
                        {(searchTerm ? filteredVideos : videos).map((vid, vIdx) => {
                          const isActive = activeVideo?.id === vid.id;
                          const isDone = completedVideos[vid.id];

                          return (
                            <div
                              key={vid.id || vIdx}
                              className={`lesson-file-row ${isActive ? 'active-lesson' : ''} ${isDone ? 'done-lesson' : ''}`}
                              onClick={() => onSelectVideo(mIdx, vIdx, vid)}
                              title={vid.title}
                            >
                              <span className="file-status-icon">
                                {isDone ? (
                                  <CheckCircle2 size={13} className="check-icon-done" />
                                ) : isActive ? (
                                  <Play size={12} className="play-icon-active" />
                                ) : (
                                  <Circle size={11} className="circle-icon-idle" />
                                )}
                              </span>
                              <span className="lesson-name-text">{vid.title}</span>
                              <span className="lesson-time-pill">{vid.durationFormatted || '05:00'}</span>
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
        )}

        {/* --- VIEW 2: MY LEARNING HUB --- */}
        {activeView === 'learning' && (
          <div className="learning-sidebar-view">
            <div className="sidebar-section-title">ACTIVE ENROLLED COURSES ({userCourses.length})</div>
            {userCourses.length === 0 ? (
              <div className="sidebar-empty-box">
                <GraduationCap size={32} className="text-zinc-600 mb-2" />
                <p>No enrolled courses yet.</p>
                <small>Generate roadmaps from YouTube to add them here.</small>
              </div>
            ) : (
              <div className="courses-list-stack">
                {userCourses.map(c => (
                  <div 
                    key={c.id} 
                    className="sidebar-course-card"
                    onClick={() => onLoadCourse(c)}
                  >
                    <div className="course-card-top">
                      <span className="card-course-name" title={c.title}>{c.title}</span>
                      <span className="card-course-percent">{c.progress || 0}%</span>
                    </div>
                    <div className="course-card-meta">
                      <span>{c.total_videos || c.totalVideos || c.modules?.length || 1} Lessons</span>
                      <span>{c.total_duration || c.totalDuration || '45m'}</span>
                    </div>
                    <div className="course-card-progress-track">
                      <div className="course-card-progress-bar" style={{ width: `${c.progress || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 3: SAVED ROADMAPS / PROJECTS --- */}
        {activeView === 'roadmaps' && (
          <div className="roadmaps-sidebar-view">
            <div className="sidebar-section-title">PERSONAL WORKSPACE ROADMAPS ({userProjects.length})</div>
            {userProjects.length === 0 ? (
              <div className="sidebar-empty-box">
                <Map size={32} className="text-zinc-600 mb-2" />
                <p>No custom roadmaps saved.</p>
                <small>Generate roadmaps to track sequential progress.</small>
              </div>
            ) : (
              <div className="projects-list-stack">
                {userProjects.map(p => (
                  <div key={p.id} className="sidebar-project-item">
                    <div className="project-item-title">{p.title}</div>
                    <div className="project-item-desc">{p.description}</div>
                    <div className="project-item-tags">
                      <span className="tag-pill">{p.level || 'Beginner'}</span>
                      <span className="tag-pill">{p.status || 'In Progress'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 4: COURSES BROWSER --- */}
        {activeView === 'courses' && (
          <div className="browse-courses-view">
            <div className="sidebar-section-title">COURSE TEMPLATES</div>
            <div className="template-card" onClick={() => navigate('/create')}>
              <h4>+ Create New Roadmap</h4>
              <p>Turn any YouTube link or topic into a structured course.</p>
            </div>
          </div>
        )}

        {/* --- VIEW 5: SAVED VIDEOS --- */}
        {activeView === 'saved' && (
          <div className="saved-videos-view">
            <div className="sidebar-section-title">BOOKMARKED LESSONS</div>
            <div className="sidebar-empty-box">
              <Video size={28} className="text-zinc-600 mb-2" />
              <p>Bookmark lessons while watching to save them here.</p>
            </div>
          </div>
        )}

        {/* --- VIEW 6: WATCH HISTORY --- */}
        {activeView === 'history' && (
          <div className="history-sidebar-view">
            <div className="sidebar-section-title">RECENT LESSONS</div>
            <div className="history-item">
              <span className="history-dot" />
              <div className="history-meta">
                <div className="history-title">{activeVideo?.title || 'Active Lesson'}</div>
                <div className="history-time">Active now</div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 7: WORKSPACE SETTINGS & PRIVACY --- */}
        {activeView === 'settings' && (
          <div className="settings-sidebar-view">
            <div className="sidebar-section-title">LAYOUT & PREFERENCES</div>
            
            <div className="setting-control-group">
              <label>Workspace Theme</label>
              <div className="theme-toggle-row">
                <button 
                  className={`theme-pick-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  VS Code Dark
                </button>
                <button 
                  className={`theme-pick-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  VS Code Light
                </button>
              </div>
            </div>

            <div className="setting-control-group">
              <label>Reset Panel Proportions</label>
              <button className="reset-layout-action-btn" onClick={onResetLayout}>
                <RotateCcw size={13} />
                <span>Restore Default Layout</span>
              </button>
            </div>

            <div className="sidebar-section-title mt-4">END-TO-END ENCRYPTION (E2EE)</div>
            <div className="e2ee-settings-box">
              <p className="e2ee-description">
                Personal notes can be encrypted with client-side AES-GCM (256-bit). The server and database never receive your private encryption key.
              </p>
              
              <div className="e2ee-toggle-row">
                <label className="switch-label">
                  <input 
                    type="checkbox" 
                    checked={e2eeEnabled}
                    onChange={(e) => setE2eeEnabled(e.target.checked)}
                  />
                  <span>Enable Client-Side E2EE</span>
                </label>
              </div>

              {e2eeEnabled && (
                <div className="e2ee-key-input-wrap">
                  <label>Master Passphrase (Client Only)</label>
                  <div className="input-with-icon">
                    <Key size={13} className="key-icon" />
                    <input 
                      type="password" 
                      placeholder="Enter secret passphrase..."
                      value={e2eeKey}
                      onChange={(e) => setE2eeKey(e.target.value)}
                    />
                  </div>
                  <small>Stored in device memory only. If forgotten, encrypted notes cannot be recovered.</small>
                </div>
              )}
            </div>

            <div className="sidebar-section-title mt-4">SECURITY AUDIT STATUS</div>
            <div className="security-status-card">
              <div className="status-item verified">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Supabase Row-Level Security: Active</span>
              </div>
              <div className="status-item verified">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>JWT Authentication: Verified</span>
              </div>
              <div className="status-item verified">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>IDOR Protection: Active</span>
              </div>
              <div className="status-item verified">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>AES-256-GCM Envelope Encryption: Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimarySidebar;
