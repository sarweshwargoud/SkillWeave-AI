import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  FolderPlus, 
  Calendar, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  BookOpen,
  Home,
  Play,
  ArrowRight,
  Maximize2,
  X,
  Clock,
  Layers,
  Award,
  Video,
  Camera,
  Edit3,
  ShieldCheck,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { getClient, defaultGoogleLearner } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import './ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Quick In-App Cinema Preview Modal state
  const [previewVideo, setPreviewVideo] = useState(null);

  // Form states for manual project addition
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectLevel, setProjectLevel] = useState('Beginner');
  const [projectAccent, setProjectAccent] = useState('Any');
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();
  const client = getClient();

  useEffect(() => {
    fetchUserDataAndProjects();
  }, []);

  const fetchUserDataAndProjects = async () => {
    try {
      const { data } = await client.auth.getUser();
      const currentUser = data?.user;

      if (currentUser) {
        setUser(currentUser);

        // Fetch user profile from public.profiles
        try {
          const { data: profileRow } = await client
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (profileRow) {
            setProfile(profileRow);
            setEditFullName(profileRow.full_name || '');
          } else {
            // Profile row missing - insert defaults
            const defaultName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email.split('@')[0];
            const { data: newProfile } = await client
              .from('profiles')
              .insert({
                id: currentUser.id,
                email: currentUser.email,
                full_name: defaultName,
                avatar_url: currentUser.user_metadata?.avatar_url || ''
              })
              .select()
              .maybeSingle();
            if (newProfile) {
              setProfile(newProfile);
              setEditFullName(newProfile.full_name || '');
            }
          }
        } catch (profileErr) {
          console.warn('Profile sync note:', profileErr);
        }

        // Fetch user projects from public.projects
        const { data: userProjects, error } = await client
          .from('projects')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(userProjects || []);
        
        // Auto-expand first project if available
        if (userProjects && userProjects.length > 0) {
          setSelectedProject(userProjects[0]);
        }
      } else {
        // Guest user
        setUser(null);
        setProfile(null);
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await client.auth.signOut();
    navigate('/');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await client.storage
        .from('user-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = client.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update public.profiles
      await client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);

      // Update user metadata in Supabase Auth
      await client.auth.updateUser({ data: { avatar_url: avatarUrl } });

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      alert('Avatar updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Failed to upload avatar: ' + (err.message || 'Please try again.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveFullName = async (e) => {
    e.preventDefault();
    if (!user || !editFullName.trim()) return;
    setFormLoading(true);

    try {
      const trimmed = editFullName.trim();
      await client.from('profiles').update({ full_name: trimmed }).eq('id', user.id);
      await client.auth.updateUser({ data: { full_name: trimmed, name: trimmed } });
      setProfile(prev => ({ ...prev, full_name: trimmed }));
      setShowEditNameModal(false);
      alert('Display name updated successfully!');
    } catch (err) {
      alert('Failed to update name: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectTitle) return;
    if (!user) {
      alert('Please sign in to save custom projects to your Supabase cloud account.');
      navigate('/auth');
      return;
    }
    setFormLoading(true);

    try {
      const newProject = {
        user_id: user.id,
        title: projectTitle,
        description: projectDesc,
        level: projectLevel,
        accent: projectAccent,
        status: 'In Progress',
        progress: 0,
        roadmap_data: null,
        custom_tasks: []
      };

      const { error } = await client
        .from('projects')
        .insert(newProject);

      if (error) throw error;

      // Refresh project list
      const { data: updatedProjects } = await client
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProjects(updatedProjects || []);
      setShowAddModal(false);
      
      // Reset form
      setProjectTitle('');
      setProjectDesc('');
      setProjectLevel('Beginner');
      setProjectAccent('Any');
    } catch (err) {
      alert('Failed to add project: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await client
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleToggleModule = async (project, moduleIndex) => {
    try {
      const updatedModules = [...project.roadmap_data.modules];
      const mod = updatedModules[moduleIndex];
      mod.completed = !mod.completed;

      // Calculate progress
      const completedCount = updatedModules.filter(m => m.completed).length;
      const progressPercent = Math.round((completedCount / updatedModules.length) * 100);
      const status = progressPercent === 100 ? 'Completed' : 'In Progress';

      const updatedRoadmapData = {
        ...project.roadmap_data,
        modules: updatedModules
      };

      const { error } = await client
        .from('projects')
        .update({ 
          roadmap_data: updatedRoadmapData,
          progress: progressPercent,
          status: status
        })
        .eq('id', project.id);

      if (error) throw error;

      // Update state locally
      setProjects(prev => prev.map(p => {
        if (p.id === project.id) {
          const updated = { ...p, roadmap_data: updatedRoadmapData, progress: progressPercent, status: status };
          if (selectedProject?.id === project.id) {
            setSelectedProject(updated);
          }
          return updated;
        }
        return p;
      }));
    } catch (err) {
      alert('Failed to update progress: ' + err.message);
    }
  };

  // Convert project to full course format for LearningWorkspacePage
  const projectToCourse = (project) => {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      level: project.level,
      accent: project.accent,
      progress: project.progress,
      modules: project.roadmap_data?.modules || []
    };
  };

  // Navigate to LearningWorkspace with in-app video player active
  const handleOpenInWorkspace = (project, videoId = null) => {
    const courseData = projectToCourse(project);
    navigate('/workspace', {
      state: {
        courseData,
        initialVideoId: videoId
      }
    });
  };

  if (loading) {
    return (
      <div className="profile-studio-page center-state">
        <div className="profile-loading-box">
          <div className="studio-spinner"></div>
          <p>Analyzing profile workspace...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'GL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || (user ? 'Developer' : 'Google Learner');
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || '';
  const userEmail = profile?.email || user?.email || 'learner.google@example.com';

  return (
    <div className="profile-studio-page">
      <Navbar />

      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="profile-nav-breadcrumb-strip">
        <div className="profile-breadcrumb-container">
          <div className="profile-breadcrumb-links">
            <button 
              className="breadcrumb-nav-link" 
              onClick={() => navigate('/')}
              title="Return to Homepage"
            >
              <Home size={15} /> <span>Home</span>
            </button>
            <span className="breadcrumb-divider">/</span>
            <button 
              className="breadcrumb-nav-link" 
              onClick={() => navigate('/my-learning')}
              title="Open My Learning Hub"
            >
              <BookOpen size={15} /> <span>My Learning</span>
            </button>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">Personal Workspace</span>
          </div>

          <div className="profile-top-actions">
            <button 
              className="action-nav-pill workspace-pill"
              onClick={() => navigate('/workspace')}
              title="Launch In-App Workspace Player"
            >
              <Play size={14} className="fill-current" />
              <span>Open Learning Workspace</span>
            </button>
            <button 
              className="action-nav-pill add-project-pill"
              onClick={() => setShowAddModal(true)}
              title="Create Custom Project"
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      </div>

      <main className="profile-studio-grid">
        {/* Left Sidebar: User Details */}
        <section className="user-studio-card">
          <div className="user-avatar-frame-wrapper">
            <div className="user-avatar-frame">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="user-avatar-element" />
              ) : (
                <div className="user-avatar-initials">{getInitials(userName)}</div>
              )}
              {user && (
                <label className="avatar-upload-trigger" title="Upload avatar photo">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    style={{ display: 'none' }}
                  />
                  <Camera size={13} />
                </label>
              )}
            </div>
            {uploadingAvatar && <span className="avatar-uploading-tag">Uploading...</span>}
          </div>

          <div className="user-name-title-container">
            <h3 className="user-name-title">{userName}</h3>
            {user && (
              <button 
                className="name-edit-pencil-btn"
                onClick={() => { setEditFullName(userName); setShowEditNameModal(true); }}
                title="Edit display name"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>
          <p className="user-email-subtitle">{userEmail}</p>

          <div className={`user-sync-pill ${user ? 'synced' : 'guest'}`}>
            {user ? (
              <>
                <ShieldCheck size={13} className="sync-icon" />
                <span>Supabase Cloud Synced</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} className="sync-icon" />
                <span>Guest Mode</span>
              </>
            )}
          </div>
          
          <div className="user-stats-bar">
            <div className="stat-unit">
              <span className="unit-number">{projects.length}</span>
              <span className="unit-title">Projects</span>
            </div>
            <div className="stat-unit">
              <span className="unit-number">
                {projects.filter(p => p.status === 'Completed').length}
              </span>
              <span className="unit-title">Done</span>
            </div>
            <div className="stat-unit">
              <span className="unit-number">
                {projects.reduce((acc, p) => acc + (p.roadmap_data?.modules?.length || 0), 0)}
              </span>
              <span className="unit-title">Lessons</span>
            </div>
          </div>

          <div className="user-card-navigation-links">
            <button 
              className="side-nav-action-btn"
              onClick={() => navigate('/my-learning')}
            >
              <BookOpen size={15} /> <span>My Curriculums</span>
            </button>
            <button 
              className="side-nav-action-btn"
              onClick={() => navigate('/workspace')}
            >
              <Layers size={15} /> <span>Active Workspace</span>
            </button>
          </div>

          {user ? (
            <button className="logout-action-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} /> <span>Sign Out</span>
            </button>
          ) : (
            <button className="login-action-btn" onClick={() => navigate('/auth')} title="Sign in with Supabase">
              <LogIn size={16} /> <span>Sign In / Register</span>
            </button>
          )}
        </section>

        {/* Right Content Area: Projects list */}
        <section className="profile-content-col">
          <header className="content-headline-bar">
            <div>
              <div className="headline-meta-badge">
                <Award size={14} /> In-App Learning Studio
              </div>
              <h2 className="workspace-title">Personal Workspace</h2>
              <p className="workspace-sub">
                Watch curated lessons inside the platform with notes, AI tutor, and interactive quizzes below every video.
              </p>
            </div>
            <button className="btn-primary add-custom-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> New Project
            </button>
          </header>

          {projects.length === 0 ? (
            <div className="empty-workspace-state">
              <FolderPlus size={48} className="empty-folder-icon" />
              <h3>No Learning Projects Yet</h3>
              <p>You haven't generated or saved any projects yet. Turn any YouTube video or playlist into a structured curriculum!</p>
              <div className="empty-actions-row">
                <button className="btn-primary" onClick={() => navigate('/create')}>
                  Generate Curriculum Roadmap
                </button>
                <button className="btn-secondary" onClick={() => navigate('/my-learning')}>
                  Browse Saved Courses
                </button>
              </div>
            </div>
          ) : (
            <div className="projects-list-stack">
              {projects.map((project) => {
                const isExpanded = selectedProject?.id === project.id;
                const modules = project.roadmap_data?.modules || [];
                const completedCount = modules.filter(m => m.completed).length;
                
                return (
                  <div 
                    key={project.id} 
                    className={`project-studio-item ${isExpanded ? 'is-expanded' : ''}`}
                  >
                    <div 
                      className="project-item-summary"
                      onClick={() => setSelectedProject(isExpanded ? null : project)}
                    >
                      <div className="project-main-info">
                        <div className="project-header-line">
                          <h4>{project.title}</h4>
                          <span className={`status-pill ${project.status === 'Completed' ? 'pill-completed' : 'pill-in-progress'}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="project-description-text">{project.description || 'No description provided.'}</p>
                        
                        <div className="project-tags-row">
                          <span className="tag-date">
                            <Calendar size={12} /> {new Date(project.created_at).toLocaleDateString()}
                          </span>
                          <span className="tag-pill">Level: {project.level}</span>
                          <span className="tag-pill">Style: {project.accent}</span>
                          <span className="tag-pill lessons-count">
                            <Video size={12} /> {modules.length} Lessons ({completedCount} completed)
                          </span>
                        </div>
                      </div>

                      <div className="project-progress-col">
                        <div className="progress-labels">
                          <span>Progress</span>
                          <strong>{Math.round(project.progress)}%</strong>
                        </div>
                        <div className="progress-track">
                          <div 
                            className="progress-fill"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="project-actions-row">
                          {modules.length > 0 && (
                            <button
                              className="btn-resume-workspace"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInWorkspace(project);
                              }}
                              title="Play lessons in the integrated workspace"
                            >
                              <Play size={13} className="fill-current" />
                              <span>Play in Workspace</span>
                            </button>
                          )}
                          <button 
                            className="delete-ghost-btn" 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="expand-indicator-icon">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel: Visual Video Step Cards */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="project-expanded-panel"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {modules.length > 0 ? (
                            <div className="expanded-modules-checklist">
                              <div className="roadmap-title-header-bar">
                                <h5 className="roadmap-title-header">
                                  <Sparkles size={16} className="sparkle-icon" /> 
                                  Step-by-Step Curriculum Playlist ({modules.length} Lessons)
                                </h5>
                                <button 
                                  className="btn-launch-full-workspace"
                                  onClick={() => handleOpenInWorkspace(project)}
                                >
                                  <span>Launch Learning Theater</span>
                                  <ArrowRight size={14} />
                                </button>
                              </div>

                              <p className="curriculum-helper-hint">
                                All lessons play directly inside the website without external redirects. Notes and AI tutor appear beneath each video.
                              </p>

                              <div className="modules-cards-grid">
                                {modules.map((mod, index) => {
                                  const videoObj = mod.video || {
                                    id: 'dQw4w9WgXcQ',
                                    title: mod.module_title,
                                    durationFormatted: '10:00'
                                  };
                                  const thumbnailUrl = `https://img.youtube.com/vi/${videoObj.id}/mqdefault.jpg`;

                                  return (
                                    <div 
                                      key={index} 
                                      className={`module-video-card ${mod.completed ? 'module-completed' : ''}`}
                                    >
                                      {/* Left: Video Thumbnail with YouTube-like In-App Play Overlay */}
                                      <div 
                                        className="video-thumb-container"
                                        onClick={() => handleOpenInWorkspace(project, videoObj.id)}
                                        title="Click to play in Learning Workspace"
                                      >
                                        <img 
                                          src={thumbnailUrl} 
                                          alt={videoObj.title} 
                                          className="video-thumb-img"
                                          onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80';
                                          }}
                                        />
                                        <div className="thumb-duration-badge">
                                          <Clock size={11} /> {videoObj.durationFormatted || 'Lesson'}
                                        </div>
                                        <div className="thumb-play-overlay">
                                          <div className="yt-play-icon-box">
                                            <Play size={20} className="yt-play-symbol" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Center: Module Information */}
                                      <div className="module-card-body">
                                        <div className="module-card-top">
                                          <span className="step-number-tag">
                                            Step {String(index + 1).padStart(2, '0')}
                                          </span>
                                          <button 
                                            className="module-completion-btn"
                                            onClick={() => handleToggleModule(project, index)}
                                            title={mod.completed ? "Mark incomplete" : "Mark as completed"}
                                          >
                                            {mod.completed ? (
                                              <span className="badge-done"><CheckSquare size={16} /> Completed</span>
                                            ) : (
                                              <span className="badge-pending"><Square size={16} /> Mark Done</span>
                                            )}
                                          </button>
                                        </div>

                                        <h6 className="module-card-title">{mod.module_title}</h6>
                                        <p className="module-card-description">{mod.description}</p>
                                        
                                        <div className="lesson-video-title-bar">
                                          <span className="lesson-video-name">
                                            <Video size={13} /> {videoObj.title}
                                          </span>
                                        </div>

                                        {/* Actions: Open in Workspace or Quick In-App Preview */}
                                        <div className="module-card-actions">
                                          <button 
                                            className="btn-play-in-app"
                                            onClick={() => handleOpenInWorkspace(project, videoObj.id)}
                                          >
                                            <Play size={14} className="fill-current" />
                                            <span>Play in Workspace</span>
                                          </button>
                                          
                                          <button 
                                            className="btn-quick-preview"
                                            onClick={() => setPreviewVideo({
                                              ...videoObj,
                                              moduleTitle: mod.module_title,
                                              project
                                            })}
                                            title="Quick view player without leaving page"
                                          >
                                            <Maximize2 size={13} />
                                            <span>Quick View</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="empty-roadmap-attachment">
                              <p>This is a manual custom project. No AI-Curated roadmap is attached.</p>
                              <button 
                                className="btn-secondary" 
                                onClick={() => navigate('/create', { state: { presetTitle: project.title } })}
                              >
                                Generate & Attach Curriculum
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Quick Cinema In-App Video Preview Modal (Zero Redirects to YouTube) */}
      <AnimatePresence>
        {previewVideo && (
          <div className="cinema-modal-backdrop" onClick={() => setPreviewVideo(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="cinema-modal-window"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cinema-modal-header">
                <div className="cinema-header-info">
                  <span className="cinema-badge">In-App YouTube Cinema</span>
                  <h4>{previewVideo.title}</h4>
                </div>
                <button 
                  className="cinema-close-btn" 
                  onClick={() => setPreviewVideo(null)}
                  aria-label="Close Preview"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="cinema-player-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideo.id}?autoplay=1&enablejsapi=1`}
                  title={previewVideo.title}
                  className="cinema-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="cinema-modal-footer">
                <p className="cinema-hint">
                  Need AI Handwritten Notes, interactive transcripts, or tutor Q&A for this lesson?
                </p>
                <div className="cinema-footer-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setPreviewVideo(null)}
                  >
                    Close
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      const proj = previewVideo.project;
                      const vidId = previewVideo.id;
                      setPreviewVideo(null);
                      handleOpenInWorkspace(proj, vidId);
                    }}
                  >
                    <Play size={15} className="fill-current" />
                    <span>Open in Full Workspace (Notes & Tutor)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create Custom Learning Project</h3>
              <form onSubmit={handleAddProject} className="modal-form">
                <div className="form-group">
                  <label>Project / Topic Title</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Next.js SaaS Application"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Short Description / Goal</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                    placeholder="Describe your learning project goals..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  ></textarea>
                </div>

                <div className="modal-options-grid">
                  <div className="form-group">
                    <label>Skill Level</label>
                    <select 
                      className="input-field select-field" 
                      value={projectLevel} 
                      onChange={(e) => setProjectLevel(e.target.value)}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Teacher Style</label>
                    <select 
                      className="input-field select-field" 
                      value={projectAccent} 
                      onChange={(e) => setProjectAccent(e.target.value)}
                    >
                      <option value="Any">Any Style</option>
                      <option value="Indian English">Indian English</option>
                      <option value="US English">US English</option>
                      <option value="British English">British English</option>
                    </select>
                  </div>
                </div>

                <div className="modal-buttons-row">
                  <button 
                    type="button" 
                    className="modal-btn-cancel" 
                    onClick={() => setShowAddModal(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={formLoading || !projectTitle}
                  >
                    {formLoading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Full Name Modal */}
      <AnimatePresence>
        {showEditNameModal && (
          <div className="modal-backdrop" onClick={() => setShowEditNameModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Display Name</h3>
              <p className="modal-sub">Update your full name saved in your Supabase profile.</p>
              <form onSubmit={handleSaveFullName} className="modal-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Sarweshwar Goud"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>
                <div className="modal-buttons-row">
                  <button 
                    type="button" 
                    className="modal-btn-cancel" 
                    onClick={() => setShowEditNameModal(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={formLoading || !editFullName.trim()}
                  >
                    {formLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
