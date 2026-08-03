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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import TiltCard from '../components/TiltCard';
import './ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states for manual project addition
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectLevel, setProjectLevel] = useState('Beginner');
  const [projectAccent, setProjectAccent] = useState('Any');
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();
  const client = getClient();

  useEffect(() => {
    const fetchUserDataAndProjects = async () => {
      try {
        const { data: { user: currentUser } } = await client.auth.getUser();
        if (!currentUser) {
          navigate('/auth');
          return;
        }
        setUser(currentUser);

        // Fetch user projects
        const { data: userProjects, error } = await client
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(userProjects || []);
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndProjects();
  }, [navigate]);

  const handleLogout = async () => {
    await client.auth.signOut();
    navigate('/');
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectTitle || !user) return;
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
        roadmap_data: null, // manual projects start without a roadmap
        custom_tasks: [] // empty custom tasks list
      };

      const { data, error } = await client
        .from('projects')
        .insert(newProject);

      if (error) throw error;

      // Refresh project list
      const { data: updatedProjects } = await client
        .from('projects')
        .select('*')
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
    e.stopPropagation(); // Stop expansion toggle
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

  // Toggle tasks inside roadmaps / custom items
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

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="profile-orbital-ring"></div>
        <p>Analyzing profile workspace...</p>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer';
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userName}`;

  return (
    <div className="profile-dashboard">
      {/* Background Mesh */}
      <div className="profile-bg-mesh"></div>

      {/* Top Banner Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo" onClick={() => navigate('/')}>SkillWeave AI</div>
        <div className="nav-actions">
          <button className="nav-btn-secondary" onClick={() => navigate('/create')}>Create Roadmap</button>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={18} /> <span className="btn-text">Logout</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-container">
        {/* Left Sidebar: User Details */}
        <section className="dashboard-sidebar">
          <TiltCard className="user-hologram-card" maxTilt={5}>
            <div className="user-avatar-wrapper">
              <img src={userAvatar} alt={userName} className="user-avatar-img" />
              <div className="avatar-glow"></div>
            </div>
            <h3 className="user-display-name">{userName}</h3>
            <p className="user-email-text">{user?.email}</p>
            <div className="user-meta-info">
              <div className="meta-stat">
                <span className="stat-num">{projects.length}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="meta-stat">
                <span className="stat-num">
                  {projects.filter(p => p.status === 'Completed').length}
                </span>
                <span className="stat-label">Done</span>
              </div>
            </div>
          </TiltCard>
        </section>

        {/* Right Content Area: Projects list */}
        <section className="dashboard-content">
          <header className="content-header">
            <div>
              <h2 className="section-title">My Projects Workspace</h2>
              <p className="section-subtitle">Manage your active learning paths and custom project logs</p>
            </div>
            <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Project
            </button>
          </header>

          {projects.length === 0 ? (
            <div className="empty-projects-state">
              <FolderPlus size={48} className="empty-icon" />
              <h3>No Projects Found</h3>
              <p>You haven't generated or created any projects yet. Start by generating a curriculum roadmap!</p>
              <button className="btn-primary" onClick={() => navigate('/create')}>
                Create First Roadmap
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => {
                const isExpanded = selectedProject?.id === project.id;
                
                return (
                  <div 
                    key={project.id} 
                    className={`project-list-card ${isExpanded ? 'card-expanded' : ''}`}
                    onClick={() => setSelectedProject(isExpanded ? null : project)}
                  >
                    <div className="project-card-summary">
                      <div className="project-main-info">
                        <div className="project-title-row">
                          <h4>{project.title}</h4>
                          <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="project-desc-preview">{project.description || 'No description provided.'}</p>
                        
                        <div className="project-meta-row">
                          <span className="meta-tag"><Calendar size={12} /> {new Date(project.created_at).toLocaleDateString()}</span>
                          <span className="meta-tag">Level: {project.level}</span>
                          <span className="meta-tag">Accent: {project.accent}</span>
                        </div>
                      </div>

                      <div className="project-progress-area">
                        <div className="progress-value-row">
                          <span>Progress</span>
                          <strong>{Math.round(project.progress)}%</strong>
                        </div>
                        <div className="progress-bar-track">
                          <div 
                            className="progress-bar-fill"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="action-buttons-row">
                          <button 
                            className="delete-icon-btn" 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="expand-indicator">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel: Checklist of Syllabus Modules */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="project-expanded-details"
                          onClick={(e) => e.stopPropagation()} // Prevent collapse on detail interaction
                        >
                          {project.roadmap_data ? (
                            <div className="expanded-modules-checklist">
                              <h5 className="roadmap-title-header">
                                <Sparkles size={16} className="sparkle-icon" /> AI-Curated Playlist Modules
                              </h5>
                              <div className="modules-list">
                                {project.roadmap_data.modules.map((mod, index) => (
                                  <div key={index} className={`module-checklist-item ${mod.completed ? 'module-completed' : ''}`}>
                                    <button 
                                      className="checkbox-btn"
                                      onClick={() => handleToggleModule(project, index)}
                                    >
                                      {mod.completed ? (
                                        <CheckSquare size={20} className="check-icon-active" />
                                      ) : (
                                        <Square size={20} className="check-icon-inactive" />
                                      )}
                                    </button>
                                    <div className="module-checklist-info">
                                      <h6>Module {index + 1}: {mod.module_title}</h6>
                                      <p>{mod.description}</p>
                                      {mod.video && (
                                        <a 
                                          href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="module-video-link"
                                        >
                                          Watch Lesson: {mod.video.title} <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="empty-roadmap-attachment">
                              <p>This is a manual custom project. No AI-Curated roadmap is attached.</p>
                              <button 
                                className="btn-secondary" 
                                onClick={() => navigate('/create', { state: { presetTitle: project.title } })}
                              >
                                Generate & Attach Roadmap
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

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="modal-content card"
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
    </div>
  );
};

export default ProfilePage;
