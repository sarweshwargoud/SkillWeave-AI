import React from 'react';
import { 
  FolderTree, 
  GraduationCap, 
  Map, 
  BookOpen, 
  Video, 
  Clock, 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Lock,
  User
} from 'lucide-react';
import './ActivityBar.css';

const ActivityBar = ({
  activeView,
  setActiveView,
  sidebarCollapsed,
  setSidebarCollapsed,
  theme,
  setTheme,
  user,
  e2eeEnabled,
  onOpenSettings
}) => {
  const topNavItems = [
    { id: 'explorer', label: 'Explorer: Curriculum & Lessons (Ctrl+Shift+E)', icon: FolderTree },
    { id: 'learning', label: 'My Learning & Enrolled Courses', icon: GraduationCap },
    { id: 'roadmaps', label: 'Roadmap Architect & Projects', icon: Map },
    { id: 'courses', label: 'Course Library & Syllabi', icon: BookOpen },
    { id: 'saved', label: 'Saved Videos & Bookmarks', icon: Video },
    { id: 'history', label: 'Learning History & Activity', icon: Clock }
  ];

  const handleItemClick = (id) => {
    if (activeView === id) {
      // Toggle collapse if clicking the currently active tab
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setActiveView(id);
      if (sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
    }
  };

  return (
    <aside className="vscode-activity-bar" aria-label="Activity Bar">
      {/* Top Navigation Strip */}
      <div className="activity-bar-group top-group">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id && !sidebarCollapsed;
          return (
            <button
              key={item.id}
              className={`activity-icon-button ${isActive ? 'is-active' : ''}`}
              onClick={() => handleItemClick(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={22} strokeWidth={1.75} />
              {isActive && <div className="activity-active-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Strip */}
      <div className="activity-bar-group bottom-group">
        {/* E2EE / Privacy Status Indicator */}
        <div 
          className={`activity-icon-button privacy-indicator ${e2eeEnabled ? 'e2ee-active' : ''}`} 
          title={e2eeEnabled ? "Client-Side End-to-End Encryption Active" : "AES-256-GCM Envelope Encryption at Rest"}
        >
          {e2eeEnabled ? <Lock size={18} className="text-emerald-400" /> : <ShieldCheck size={18} className="text-sky-400" />}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          className="activity-icon-button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
        </button>

        {/* Settings View */}
        <button
          className={`activity-icon-button ${activeView === 'settings' && !sidebarCollapsed ? 'is-active' : ''}`}
          onClick={() => handleItemClick('settings')}
          title="Workspace Settings & Preferences (Ctrl+,)"
          aria-label="Workspace Settings"
        >
          <Settings size={20} strokeWidth={1.75} />
          {activeView === 'settings' && !sidebarCollapsed && <div className="activity-active-indicator" />}
        </button>

        {/* User Profile Avatar / Initial */}
        <div 
          className="activity-user-badge" 
          title={user?.email ? `Signed in as ${user.email} (Supabase Authenticated)` : "Guest Explorer Mode"}
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="activity-avatar-img" />
          ) : (
            <div className="activity-avatar-initials">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'GL'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ActivityBar;
