import { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Sparkles, 
  BookOpen, 
  Edit3, 
  Check, 
  Palette, 
  FileCheck, 
  Share2,
  Bookmark,
  Plus,
  FileText,
  Trash2,
  PanelLeft,
  PanelLeftClose,
  SquarePen,
  X
} from 'lucide-react';
import './HandwrittenNotesViewer.css';

const HandwrittenNotesViewer = ({ notesData, onSaveNote }) => {
  const [theme, setTheme] = useState('ruled'); // 'ruled' | 'grid' | 'parchment' | 'clean'
  const [fontMode, setFontMode] = useState('hand'); // 'hand' | 'cursive' | 'sans'
  const [isEditing, setIsEditing] = useState(false);
  const defaultFallbackNotes = {
    title: 'Docker Container Engineering Study Sheet',
    subject: 'DevOps & Architecture',
    overview: 'Comprehensive handwritten study notes covering container engines, Linux namespaces, cgroups, image layer caching, and multi-stage builds.',
    definitions: [
      { term: 'Container Engine', tag: 'Architecture', definition: 'The core daemon responsible for managing container lifecycles, images, storage, and networking.' },
      { term: 'Linux Namespaces', tag: 'Isolation', definition: 'Kernel primitives (pid, net, ipc, mnt, uts, user) partitioning system resources.' },
      { term: 'Layer Caching', tag: 'Optimization', definition: 'Reusing intermediate cached image layers during builds when files have not changed.' }
    ],
    sections: [
      {
        heading: 'Container vs Virtual Machine Isolation',
        points: [
          'Containers share the host Linux kernel; VMs require a hypervisor and full guest OS.',
          'Start-up time: milliseconds for containers vs minutes for VMs.',
          'Resource footprint: containers utilize host memory directly without fixed allocation overhead.'
        ],
        highlight_box: 'Order Dockerfile instructions from least frequently changed to most frequently changed to maximize layer cache hits.'
      }
    ],
    summary: 'Docker enables immutable, repeatable application packaging by combining Linux namespaces, cgroups, and layered UnionFS storage drivers.'
  };

  const [notes, setNotes] = useState(notesData || defaultFallbackNotes);

  useEffect(() => {
    if (notesData) {
      setNotes(notesData);
    }
  }, [notesData]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Notes Sheets / Sessions (Left Sidebar, ChatGPT style!)
  const [activeSheetId, setActiveSheetId] = useState('full-notes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Available Note Sheets / Topics
  const [noteSheets, setNoteSheets] = useState([
    { id: 'full-notes', title: '1. Full Lecture Study Sheet', count: 'All Sections' },
    { id: 'definitions', title: '2. Key Definitions & Terms', count: 'Glossary' },
    { id: 'architecture', title: '3. Architecture & Code Blocks', count: 'Deep Dive' },
    { id: 'summary', title: '4. Summary & Review Notes', count: 'Takeaways' }
  ]);

  if (!notes) {
    return (
      <div className="notes-empty-prompt">
        <FileText size={36} className="text-zinc-400" />
        <p>No study notes generated yet for this lesson.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textRep = [
      '# ' + (notes.title || ''),
      'Subject: ' + (notes.subject || ''),
      '',
      '## Overview',
      notes.overview || '',
      '',
      '## Key Definitions',
      ...(notes.definitions || []).map(d => `- **${d.term}** (${d.tag}): ${d.definition}`),
      '',
      '## Summary',
      notes.summary || ''
    ].join('\n');

    navigator.clipboard.writeText(textRep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToLibrary = () => {
    if (onSaveNote) {
      onSaveNote(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleNewNote = () => {
    const newId = `custom-note-${Date.now()}`;
    const newSheet = {
      id: newId,
      title: `Custom Study Note ${noteSheets.length + 1}`,
      count: 'User Note'
    };
    setNoteSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newId);
    setIsMobileDrawerOpen(false);
  };

  const handleDeleteSheet = (e, targetId) => {
    e.stopPropagation();
    if (noteSheets.length <= 1) return;
    const remaining = noteSheets.filter(s => s.id !== targetId);
    setNoteSheets(remaining);
    if (activeSheetId === targetId) {
      setActiveSheetId(remaining[0].id);
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'grid': return 'notebook-grid';
      case 'parchment': return 'notebook-parchment';
      case 'clean': return 'notebook-clean';
      default: return 'notebook-ruled';
    }
  };

  const getFontClass = () => {
    switch (fontMode) {
      case 'cursive': return 'handwritten-cursive';
      case 'sans': return '';
      default: return 'handwritten-font';
    }
  };

  const activeSheet = noteSheets.find(s => s.id === activeSheetId) || noteSheets[0];

  return (
    <div className="shadcn-notes-wrapper">
      {/* =====================================================================
          CHATGPT-STYLE MOBILE OPENING BAR (Header to open/close drawer on mobile)
          ===================================================================== */}
      <div className="chatgpt-mobile-top-bar">
        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-menu"
          onClick={() => setIsMobileDrawerOpen(true)}
          title="Open notes sheets sidebar"
          aria-label="Open notes sheets sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="chatgpt-bar-title-group" onClick={() => setIsMobileDrawerOpen(true)}>
          <span className="chatgpt-bar-active-title" title={activeSheet.title}>
            {activeSheet.title}
          </span>
          <span className="chatgpt-bar-status-dot" title="Active Note Sheet" />
        </div>

        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-new"
          onClick={handleNewNote}
          title="Create New Note Sheet"
          aria-label="Create New Note Sheet"
        >
          <SquarePen size={16} />
        </button>
      </div>

      {/* Main Two-Column Master / Detail Layout */}
      <div className="shadcn-notes-layout">

        {/* =====================================================================
            LEFT SIDEBAR: "+ New Note" and Notes Names (ChatGPT style!)
            ===================================================================== */}
        <aside className={`shadcn-notes-sidebar ${isSidebarOpen ? 'is-expanded' : 'is-collapsed'}`}>
          <div className="notes-sidebar-top-strip">
            <button
              type="button"
              className="shadcn-btn-new-chat"
              onClick={handleNewNote}
              title="Add a new custom study note"
            >
              <div className="new-chat-left-label">
                <Plus size={15} />
                <span>New Note</span>
              </div>
              <SquarePen size={13} className="text-zinc-400" />
            </button>

            <button
              type="button"
              className="chat-sidebar-collapse-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className="notes-sidebar-scroll-list">
            <div className="chat-sidebar-section-header">
              <span>Study Sheets</span>
              <span className="chat-count-pill">{noteSheets.length}</span>
            </div>

            <div className="chat-sessions-column">
              {noteSheets.map(sheet => {
                const isActive = sheet.id === activeSheetId;
                return (
                  <div
                    key={sheet.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveSheetId(sheet.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    title={sheet.title}
                  >
                    <FileText size={14} className="session-icon" />
                    <span className="session-title-text">{sheet.title}</span>

                    {noteSheets.length > 1 && (
                      <button
                        type="button"
                        className="session-delete-btn"
                        onClick={(e) => handleDeleteSheet(e, sheet.id)}
                        title="Delete note sheet"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chat-sidebar-footer">
            <div className="grounded-badge">
              <span className="status-indicator-dot" />
              <span>Ruled Handwriting Engine</span>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            RIGHT STAGE: Notes Content, Paper & Ink Controls
            ===================================================================== */}
        <div className="shadcn-notes-main-stage">
          {/* Top Uncollapse Bar on desktop if sidebar is collapsed */}
          {!isSidebarOpen && (
            <div className="chat-desktop-uncollapse-bar">
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Open notes sidebar"
              >
                <PanelLeft size={16} />
              </button>
              <span className="collapsed-bar-title">{activeSheet.title}</span>
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={handleNewNote}
                title="New Note"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {/* Notebook Paper & Style Controls */}
          <div className="notebook-toolbar">
            <div className="toolbar-left-group">
              <div className="theme-pill-selector">
                <span className="selector-label"><Palette size={12} /> Paper:</span>
                <button
                  className={`pill-btn ${theme === 'ruled' ? 'active' : ''}`}
                  onClick={() => setTheme('ruled')}
                >
                  Ruled
                </button>
                <button
                  className={`pill-btn ${theme === 'grid' ? 'active' : ''}`}
                  onClick={() => setTheme('grid')}
                >
                  Grid
                </button>
                <button
                  className={`pill-btn ${theme === 'parchment' ? 'active' : ''}`}
                  onClick={() => setTheme('parchment')}
                >
                  Parchment
                </button>
                <button
                  className={`pill-btn ${theme === 'clean' ? 'active' : ''}`}
                  onClick={() => setTheme('clean')}
                >
                  Clean
                </button>
              </div>

              <div className="font-pill-selector">
                <span className="selector-label">Ink:</span>
                <button
                  className={`pill-btn ${fontMode === 'hand' ? 'active' : ''}`}
                  onClick={() => setFontMode('hand')}
                >
                  Script
                </button>
                <button
                  className={`pill-btn ${fontMode === 'cursive' ? 'active' : ''}`}
                  onClick={() => setFontMode('cursive')}
                >
                  Cursive
                </button>
                <button
                  className={`pill-btn ${fontMode === 'sans' ? 'active' : ''}`}
                  onClick={() => setFontMode('sans')}
                >
                  Print
                </button>
              </div>
            </div>

            <div className="toolbar-right-actions">
              <button 
                className={`tool-action-btn ${isEditing ? 'active-edit' : ''}`} 
                onClick={() => setIsEditing(!isEditing)}
                title="Edit notes"
              >
                <Edit3 size={13} />
                <span>{isEditing ? 'Done' : 'Edit'}</span>
              </button>

              <button className="tool-action-btn" onClick={handleCopy} title="Copy markdown notes">
                {copied ? <Check size={13} className="text-green-600" /> : <Share2 size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button className="tool-action-btn" onClick={handlePrint} title="Print or Save as PDF">
                <Printer size={13} />
                <span>Print</span>
              </button>

              {onSaveNote && (
                <button className={`tool-action-btn ${saved ? 'saved' : ''}`} onClick={handleSaveToLibrary}>
                  {saved ? <FileCheck size={13} className="text-green-600" /> : <Bookmark size={13} />}
                  <span>{saved ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Active Note Sheet Body */}
          <div className="notes-paper-scroll-canvas">
            <div className={`notebook-paper-container ${getThemeClass()} ${getFontClass()}`}>
              {/* Binder Holes */}
              <div className="binder-margin">
                <div className="binder-hole"></div>
                <div className="binder-hole"></div>
                <div className="binder-hole"></div>
              </div>

              <div className="notebook-content-body">
                {/* Note Header */}
                <div className="paper-header-strip">
                  <div className="header-meta-group">
                    <span className="meta-subject-tag">{notes.subject || 'Computer Science'}</span>
                    <span className="meta-date-stamp">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h2 className="paper-main-title">{notes.title}</h2>
                  <div className="paper-red-margin-line"></div>
                </div>

                {/* Section Filter based on activeSheetId */}
                {(activeSheetId === 'full-notes' || activeSheetId === 'definitions') && notes.definitions && notes.definitions.length > 0 && (
                  <div className="paper-definitions-section">
                    <h4 className="section-script-title">1. Key Terms & Definitions</h4>
                    <div className="definitions-stack">
                      {notes.definitions.map((item, idx) => (
                        <div key={idx} className="def-entry-row">
                          <span className="def-term-label">{item.term}</span>
                          <span className="def-tag-badge">[{item.tag}]</span>
                          <span className="def-text-body">{item.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(activeSheetId === 'full-notes' || activeSheetId === 'architecture') && notes.sections && notes.sections.length > 0 && (
                  <div className="paper-sections-flow">
                    {notes.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="notebook-section-block">
                        <h4 className="section-script-title">{sIdx + 2}. {sec.heading}</h4>
                        {sec.points && (
                          <ul className="script-bullet-list">
                            {sec.points.map((pt, pIdx) => (
                              <li key={pIdx} className="script-bullet-item">{pt}</li>
                            ))}
                          </ul>
                        )}
                        {sec.highlight_box && (
                          <div className="handwritten-callout-box">
                            <span className="callout-star">★ Key Rule:</span> {sec.highlight_box}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(activeSheetId === 'full-notes' || activeSheetId === 'summary') && notes.summary && (
                  <div className="paper-summary-card">
                    <h4 className="section-script-title">Lecture Summary</h4>
                    <p className="summary-paragraph">{notes.summary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CHATGPT-STYLE MOBILE SLIDE-IN SHEET (Drawer on mobile)
          ===================================================================== */}
      {isMobileDrawerOpen && (
        <div className="chatgpt-sheet-backdrop" onClick={() => setIsMobileDrawerOpen(false)}>
          <div className="chatgpt-mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="chatgpt-sheet-header">
              <div className="sheet-header-title">
                <FileText size={16} />
                <span>Study Sheets</span>
              </div>
              <button 
                type="button" 
                className="chatgpt-sheet-close-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="chatgpt-sheet-actions">
              <button
                type="button"
                className="shadcn-btn-new-chat"
                onClick={handleNewNote}
              >
                <div className="new-chat-left-label">
                  <Plus size={15} />
                  <span>New Note</span>
                </div>
                <SquarePen size={13} className="text-zinc-400" />
              </button>
            </div>

            <div className="chatgpt-sheet-list">
              {noteSheets.map(sheet => {
                const isActive = sheet.id === activeSheetId;
                return (
                  <div
                    key={sheet.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveSheetId(sheet.id);
                      setIsMobileDrawerOpen(false);
                    }}
                  >
                    <FileText size={14} className="session-icon" />
                    <span className="session-title-text">{sheet.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandwrittenNotesViewer;
