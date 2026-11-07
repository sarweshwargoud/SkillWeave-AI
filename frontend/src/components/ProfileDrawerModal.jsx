import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  X, 
  LogOut, 
  PlaySquare, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import './ProfileDrawerModal.css';

const ProfileDrawerModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'notes' | 'settings'

  const navigate = useNavigate();
  const client = getClient();

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const userId = session.user.id;

          // Fetch user's courses
          const { data: cData } = await client
            .from('courses')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(10);

          // Fetch user's projects
          const { data: pData } = await client
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          // Fetch user's notes
          const { data: nData } = await client
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (mounted) {
            setCourses(cData || []);
            setProjects(pData || []);
            setNotes(nData || []);
          }
        }
      } catch (err) {
        console.warn('Profile drawer data fetch notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserData();
    return () => { mounted = false; };
  }, [isOpen, client]);

  const handleSignOut = async () => {
    try {
      await client.auth.signOut();
      setUser(null);
      onClose();
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleLaunchCourse = (course) => {
    try {
      localStorage.setItem('skillweave_active_course', JSON.stringify(course));
    } catch (e) {}
    onClose();
    navigate('/workspace', { state: { courseData: course } });
  };

  if (!isOpen) return null;

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Learner';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <AnimatePresence>
      <div className="profile-drawer-backdrop" onClick={onClose}>
        <motion.div 
          className="profile-drawer-sheet"
          onClick={(e) => e.stopPropagation()}
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Drawer Header */}
          <div className="drawer-header-strip">
            <div className="drawer-user-meta-left">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="drawer-avatar-img" />
              ) : (
                <div className="drawer-avatar-placeholder">
                  <User size={22} />
                </div>
              )}
              <div className="drawer-name-column">
                <div className="drawer-display-name-row">
                  <h4>{displayName}</h4>
                  <span className="drawer-status-pill">Active</span>
                </div>
                <span className="drawer-user-email">{user?.email}</span>
              </div>
            </div>

            <button className="drawer-close-btn" onClick={onClose} title="Close Profile Overlay">
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="drawer-stats-row">
            <div className="drawer-stat-pill">
              <span className="stat-count">{courses.length}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="drawer-stat-pill">
              <span className="stat-count">{projects.length}</span>
              <span className="stat-label">Roadmaps</span>
            </div>
            <div className="drawer-stat-pill">
              <span className="stat-count">{notes.length}</span>
              <span className="stat-label">Notes</span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="drawer-tabs-bar">
            <button 
              className={`drawer-tab-btn ${activeTab === 'courses' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <PlaySquare size={14} /> <span>Courses & Roadmaps</span>
            </button>
            <button 
              className={`drawer-tab-btn ${activeTab === 'notes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText size={14} /> <span>Saved Notes</span>
            </button>
            <button 
              className={`drawer-tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <ShieldCheck size={14} /> <span>Account</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="drawer-body-scroll">
            {loading ? (
              <div className="drawer-loading-box">
                <span className="drawer-spinner" />
                <p>Loading your profile library...</p>
              </div>
            ) : activeTab === 'courses' ? (
              <div className="drawer-courses-list">
                {courses.length === 0 && projects.length === 0 ? (
                  <div className="drawer-empty-state">
                    <BookOpen size={36} className="empty-icon" />
                    <h5>No Courses Generated Yet</h5>
                    <p>Paste any YouTube playlist or video to create your first structured course.</p>
                    <button className="btn-primary drawer-action-btn" onClick={() => { onClose(); navigate('/create'); }}>
                      Generate Course <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="drawer-subheading-row">
                      <span>Saved Learning Paths ({courses.length})</span>
                      <button className="drawer-mini-link" onClick={() => { onClose(); navigate('/my-learning'); }}>
                        View All
                      </button>
                    </div>

                    {courses.map((c, i) => (
                      <div key={c.id || i} className="drawer-course-card" onClick={() => handleLaunchCourse(c)}>
                        <div className="course-card-top">
                          <h5 className="course-card-title">{c.title}</h5>
                          <span className="course-progress-badge">{c.progress || 0}% Done</span>
                        </div>
                        <p className="course-card-channel">{c.channel || 'YouTube Academy'} • {c.total_duration || '45m'}</p>
                        <div className="course-card-footer">
                          <span className="course-module-count"><Layers size={12} /> {c.modules?.length || 1} Modules</span>
                          <span className="course-open-text">Open in Workspace <ArrowRight size={12} /></span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : activeTab === 'notes' ? (
              <div className="drawer-notes-list">
                {notes.length === 0 ? (
                  <div className="drawer-empty-state">
                    <FileText size={36} className="empty-icon" />
                    <h5>No Handwritten Notes Yet</h5>
                    <p>Open any video in the AI Tutor or Notes Studio to generate authentic handwritten study sheets.</p>
                    <button className="btn-primary drawer-action-btn" onClick={() => { onClose(); navigate('/notes'); }}>
                      Open Notes Studio <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  notes.map((n, i) => (
                    <div key={n.id || i} className="drawer-note-card" onClick={() => { onClose(); navigate('/notes'); }}>
                      <div className="note-card-header">
                        <h5>{n.title || 'Lecture Study Notes'}</h5>
                        <span className="note-date-tag">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="note-encrypted-pill"><ShieldCheck size={11} /> Encrypted at rest</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="drawer-account-pane">
                <div className="account-info-card">
                  <h6>Account Identity</h6>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-val">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Authentication:</span>
                    <span className="info-val">Supabase JWT Verified</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">User ID:</span>
                    <span className="info-val code-font">{user?.id?.substring(0, 16)}...</span>
                  </div>
                </div>

                <div className="account-info-card">
                  <h6>Workspace Quick Launch</h6>
                  <button className="drawer-nav-item" onClick={() => { onClose(); navigate('/workspace'); }}>
                    <PlaySquare size={16} /> <span>Open VS Code Learning Workspace</span>
                  </button>
                  <button className="drawer-nav-item" onClick={() => { onClose(); navigate('/tutor'); }}>
                    <MessageSquare size={16} /> <span>Open AI Video Tutor</span>
                  </button>
                  <button className="drawer-nav-item" onClick={() => { onClose(); navigate('/notes'); }}>
                    <FileText size={16} /> <span>Open Handwritten Notes Studio</span>
                  </button>
                  <button className="drawer-nav-item" onClick={() => { onClose(); navigate('/profile'); }}>
                    <User size={16} /> <span>Open Full Dedicated Profile Page</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="drawer-footer-bar">
            <button className="drawer-logout-btn" onClick={handleSignOut}>
              <LogOut size={16} /> <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileDrawerModal;
