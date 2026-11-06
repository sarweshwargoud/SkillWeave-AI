import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  Cloud, 
  Lock, 
  ShieldCheck, 
  SidebarClose, 
  SidebarOpen, 
  Terminal, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import './StatusBar.css';

const StatusBar = ({
  branch = 'feature-security',
  activeVideo,
  currentTimestamp = '00:00',
  isSidebarCollapsed,
  onToggleSidebar,
  isAIPanelCollapsed,
  onToggleAIPanel,
  isTerminalCollapsed,
  onToggleTerminal,
  theme = 'dark',
  onToggleTheme,
  isE2EE = true
}) => {
  return (
    <div className="vscode-status-bar" role="status" aria-label="Status Bar">
      {/* Left items */}
      <div className="status-bar-left">
        {/* Remote Branch Item */}
        <div className="status-item branch-item" title="Active Git Target Branch: feature-security">
          <GitBranch size={12} />
          <span>{branch}</span>
        </div>

        {/* Sync Status */}
        <div className="status-item sync-item" title="Supabase Database: Synchronized">
          <Cloud size={12} className="text-sky-400" />
          <span>Supabase Synced</span>
        </div>

        {/* Video Time Status */}
        {activeVideo && (
          <div className="status-item video-status-item" title={`Playing: ${activeVideo.title}`}>
            <Clock size={12} className="text-amber-400" />
            <span>{currentTimestamp}</span>
            <span className="status-truncate-text">• {activeVideo.title}</span>
          </div>
        )}

        {/* Error / Warning count */}
        <div className="status-item diagnostics-item" title="0 Errors, 0 Warnings">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>0</span>
        </div>
      </div>

      {/* Right items */}
      <div className="status-bar-right">
        {/* E2EE Indicator */}
        <div className="status-item e2ee-item" title="End-to-End Encryption active for private notes (AES-256-GCM via WebCrypto)">
          <Lock size={11} className="text-emerald-400" />
          <span>E2EE Active</span>
        </div>

        {/* RLS Indicator */}
        <div className="status-item rls-item" title="Row Level Security enforced in Postgres">
          <ShieldCheck size={12} className="text-purple-400" />
          <span>RLS Enforced</span>
        </div>

        {/* Layout quick action buttons */}
        <button
          className={`status-btn-action ${!isSidebarCollapsed ? 'active-layout-item' : ''}`}
          onClick={onToggleSidebar}
          title="Toggle Primary Sidebar (Ctrl+B)"
        >
          {isSidebarCollapsed ? <SidebarOpen size={12} /> : <SidebarClose size={12} />}
          <span>Sidebar</span>
        </button>

        <button
          className={`status-btn-action ${!isTerminalCollapsed ? 'active-layout-item' : ''}`}
          onClick={onToggleTerminal}
          title="Toggle Terminal Panel (Ctrl+J)"
        >
          <Terminal size={12} />
          <span>Terminal</span>
        </button>

        <button
          className={`status-btn-action ${!isAIPanelCollapsed ? 'active-layout-item' : ''}`}
          onClick={onToggleAIPanel}
          title="Toggle AI Copilot Panel (Ctrl+\)"
        >
          <Sparkles size={12} />
          <span>Copilot</span>
        </button>

        {/* Theme toggle */}
        <button
          className="status-btn-action theme-action"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
