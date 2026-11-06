import React from 'react';
import { 
  Play, 
  FileText, 
  HelpCircle, 
  AlignLeft, 
  Map, 
  X, 
  Columns, 
  Maximize2, 
  Minimize2,
  Tv
} from 'lucide-react';
import './WorkspaceTabs.css';

const WorkspaceTabs = ({
  openTabs = [],
  activeTab,
  onSelectTab,
  onCloseTab,
  isSplitView,
  onToggleSplitView,
  isTheaterMode,
  onToggleTheaterMode
}) => {
  const getTabIcon = (tabId) => {
    switch (tabId) {
      case 'video': return <Play size={13} className="tab-icon text-sky-400" />;
      case 'notes': return <FileText size={13} className="tab-icon text-amber-400" />;
      case 'quiz': return <HelpCircle size={13} className="tab-icon text-purple-400" />;
      case 'transcript': return <AlignLeft size={13} className="tab-icon text-emerald-400" />;
      case 'roadmap': return <Map size={13} className="tab-icon text-pink-400" />;
      default: return <FileText size={13} className="tab-icon" />;
    }
  };

  return (
    <div className="vscode-tabs-strip">
      {/* Scrollable Tabs Container */}
      <div className="tabs-list-wrapper">
        {openTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              className={`vscode-tab-item ${isActive ? 'active-tab' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              title={tab.title}
            >
              <span className="tab-icon-wrap">{getTabIcon(tab.id)}</span>
              <span className="tab-title-text">{tab.title}</span>
              {tab.closable !== false && (
                <button
                  className="tab-close-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Close Tab (Ctrl+W)"
                  aria-label="Close Tab"
                >
                  <X size={12} />
                </button>
              )}
              {isActive && <div className="tab-bottom-indicator" />}
            </div>
          );
        })}
      </div>

      {/* Right Tab Bar Actions */}
      <div className="tabs-right-toolbar">
        <button
          className={`tab-action-icon-btn ${isSplitView ? 'active' : ''}`}
          onClick={onToggleSplitView}
          title={isSplitView ? "Switch to Single Editor View" : "Split Editor View (Side-by-Side)"}
          aria-label="Split Editor View"
        >
          <Columns size={14} />
        </button>

        <button
          className={`tab-action-icon-btn ${isTheaterMode ? 'active' : ''}`}
          onClick={onToggleTheaterMode}
          title={isTheaterMode ? "Exit Cinema Mode" : "Expand Cinema Mode"}
          aria-label="Theater Mode"
        >
          <Tv size={14} />
        </button>
      </div>
    </div>
  );
};

export default WorkspaceTabs;
