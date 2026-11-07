import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  RotateCcw, 
  Bot, 
  User, 
  ExternalLink,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeft,
  PanelLeftClose,
  SquarePen,
  X,
  Menu
} from 'lucide-react';
import { askAITutor } from '../services/api';
import './AITutorChat.css';

const AITutorChat = ({ videoId, videoTitle, currentTimestamp, onSeekTimestamp }) => {
  // Persistence key based on videoId
  const storageKey = `skillweave_tutor_sessions_${videoId || 'default'}`;

  // Initial default sessions generator
  const createInitialSessions = () => [
    {
      id: `session-core-${videoId || '1'}`,
      title: 'Lecture Q&A & Core Concepts',
      createdAt: new Date().toISOString(),
      messages: [
        {
          role: 'assistant',
          content: `Hello! I am your AI Video Tutor for **${videoTitle || 'this lesson'}**.

Ask me any question about the concepts covered in this video, request simpler explanations, or ask about specific moments like *"What does the instructor explain at [04:15]?"*`,
          referenced_timestamps: []
        }
      ]
    },
    {
      id: `session-code-${videoId || '2'}`,
      title: 'Code Implementation & Walkthrough',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      messages: [
        {
          role: 'assistant',
          content: `Welcome! Here you can ask for runnable code examples, architecture breakdowns, and debugging tips related to **${videoTitle || 'this lesson'}**.`,
          referenced_timestamps: []
        }
      ]
    }
  ];

  // Load saved sessions or defaults
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return createInitialSessions();
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return sessions[0]?.id || `session-core-${videoId || '1'}`;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef(null);

  // Sync sessions when videoId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`skillweave_tutor_sessions_${videoId || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {}
    const initial = createInitialSessions();
    setSessions(initial);
    setActiveSessionId(initial[0].id);
  }, [videoId]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      if (sessions.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
      }
    } catch (e) {}
  }, [sessions, storageKey]);

  // Current active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'fallback',
    title: 'New Chat',
    messages: []
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeSession.messages.length > 1 || loading) {
      scrollToBottom();
    }
  }, [activeSession.messages, loading]);

  // Create a brand new chat
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [
        {
          role: 'assistant',
          content: `Started a new chat session for **${videoTitle || 'this lesson'}**.

Ask me anything about the video concepts, code examples, or timestamps!`,
          referenced_timestamps: []
        }
      ]
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsMobileDrawerOpen(false);
    setInput('');
  };

  // Delete a chat session
  const handleDeleteSession = (e, targetId) => {
    e.stopPropagation();
    const remaining = sessions.filter(s => s.id !== targetId);
    if (remaining.length === 0) {
      const fresh = createInitialSessions();
      setSessions(fresh);
      setActiveSessionId(fresh[0].id);
    } else {
      setSessions(remaining);
      if (activeSessionId === targetId) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Select a chat session
  const handleSelectSession = (targetId) => {
    setActiveSessionId(targetId);
    setIsMobileDrawerOpen(false);
  };

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };

    // Auto-rename session if it is titled 'New Chat'
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const updatedTitle = s.title === 'New Chat' 
          ? (textToSend.length > 32 ? textToSend.slice(0, 30) + '...' : textToSend)
          : s.title;
        return {
          ...s,
          title: updatedTitle,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await askAITutor(
        videoId,
        textToSend,
        currentTimestamp,
        activeSession.messages
      );

      const tutorMessage = {
        role: 'assistant',
        content: response.answer,
        referenced_timestamps: response.referenced_timestamps || [],
        suggested_followups: response.suggested_followups || []
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, tutorMessage]
          };
        }
        return s;
      }));
    } catch (error) {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [
              ...s.messages,
              {
                role: 'assistant',
                content: "Sorry, I encountered an error communicating with the AI service. Please ensure the backend is connected.",
                referenced_timestamps: []
              }
            ]
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  // Preprocess markdown
  const preprocessMarkdown = (rawText) => {
    if (!rawText) return '';
    let cleaned = rawText;
    cleaned = cleaned.replace(/([^\n])\s*\*\s+\*\*/g, '\n- **');
    cleaned = cleaned.replace(/([^\n])\s*\*\s+([A-Z0-9])/g, '\n- ');
    cleaned = cleaned.replace(/\*{3,}/g, '**');
    cleaned = cleaned.replace(/#{3,}\s*/g, '#### ');
    cleaned = cleaned.replace(/\[(\d{1,2}:\d{2}(?:::?\d{2})?)\]/g, '[](#seek-)');
    return cleaned;
  };

  const quickPrompts = [
    `Explain current concept (${currentTimestamp || '00:00'})`,
    "Summarize the main takeaway",
    "Give a real-world code example",
    "Common pitfalls mentioned?"
  ];

  return (
    <div className="shadcn-tutor-container">
      {/* =====================================================================
          CHATGPT-STYLE MOBILE OPENING BAR (Header to open/close drawer on mobile)
          ===================================================================== */}
      <div className="chatgpt-mobile-top-bar">
        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-menu"
          onClick={() => setIsMobileDrawerOpen(true)}
          title="Open chat history sidebar"
          aria-label="Open chat history sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="chatgpt-bar-title-group" onClick={() => setIsMobileDrawerOpen(true)}>
          <span className="chatgpt-bar-active-title" title={activeSession.title}>
            {activeSession.title}
          </span>
          <span className="chatgpt-bar-status-dot" title="Grounded in transcript" />
        </div>

        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-new"
          onClick={handleNewChat}
          title="Start New Chat"
          aria-label="Start New Chat"
        >
          <SquarePen size={16} />
        </button>
      </div>

      {/* Main Two-Column Master / Detail Layout */}
      <div className="shadcn-tutor-layout">

        {/* =====================================================================
            LEFT SIDEBAR: "+ New Chat" and Chat Names (ChatGPT style!)
            ===================================================================== */}
        <aside className={`shadcn-chat-sidebar ${isSidebarOpen ? 'is-expanded' : 'is-collapsed'}`}>
          {/* Top Action: + New Chat Button (shadcn button outline variant) */}
          <div className="chat-sidebar-top-strip">
            <button
              type="button"
              className="shadcn-btn-new-chat"
              onClick={handleNewChat}
              title="Start a new chat thread"
            >
              <div className="new-chat-left-label">
                <Plus size={15} />
                <span>New Chat</span>
              </div>
              <SquarePen size={13} className="text-zinc-400" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              className="chat-sidebar-collapse-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          {/* Chat Names List (History Sessions) */}
          <div className="chat-sidebar-scroll-list">
            <div className="chat-sidebar-section-header">
              <span>Chat History</span>
              <span className="chat-count-pill">{sessions.length}</span>
            </div>

            <div className="chat-sessions-column">
              {sessions.map(s => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                    title={s.title}
                  >
                    <MessageSquare size={14} className="session-icon" />
                    
                    <span className="session-title-text">{s.title}</span>

                    {/* Delete session button on hover */}
                    <button
                      type="button"
                      className="session-delete-btn"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title="Delete chat thread"
                      aria-label="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="chat-sidebar-footer">
            <div className="grounded-badge">
              <span className="status-indicator-dot" />
              <span>Grounded in Video</span>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            RIGHT COLUMN: Chat Messages, Suggestions & Input Canvas
            ===================================================================== */}
        <div className="shadcn-chat-main-stage">
          {/* Top Desktop Bar (Shown when desktop sidebar is collapsed) */}
          {!isSidebarOpen && (
            <div className="chat-desktop-uncollapse-bar">
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Open sidebar"
              >
                <PanelLeft size={16} />
              </button>
              <span className="collapsed-bar-title">{activeSession.title}</span>
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="tutor-messages-scroll" ref={scrollAreaRef}>
            {activeSession.messages.map((msg, idx) => (
              <div key={idx} className={`tutor-message-bubble ${msg.role}`}>
                <div className="bubble-sender">
                  {msg.role === 'assistant' ? (
                    <div className="assistant-avatar-pill">
                      <Bot size={13} />
                    </div>
                  ) : (
                    <div className="user-avatar-pill">
                      <User size={13} />
                    </div>
                  )}
                  <span className="sender-name">{msg.role === 'assistant' ? 'AI Video Tutor' : 'You'}</span>
                </div>
                
                <div className="bubble-text">
                  {msg.role === 'user' ? (
                    <p className="user-plain-text">{msg.content}</p>
                  ) : (
                    <div className="tutor-prose-container">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="tutor-prose-p">{children}</p>,
                          ul: ({ children }) => <ul className="tutor-prose-ul">{children}</ul>,
                          ol: ({ children }) => <ol className="tutor-prose-ol">{children}</ol>,
                          li: ({ children }) => <li className="tutor-prose-li">{children}</li>,
                          strong: ({ children }) => <strong className="tutor-prose-bold">{children}</strong>,
                          h1: ({ children }) => <h4 className="tutor-prose-heading">{children}</h4>,
                          h2: ({ children }) => <h4 className="tutor-prose-heading">{children}</h4>,
                          h3: ({ children }) => <h5 className="tutor-prose-subheading">{children}</h5>,
                          h4: ({ children }) => <h5 className="tutor-prose-subheading">{children}</h5>,
                          code: ({ children }) => <code className="tutor-code-pill">{children}</code>,
                          a: ({ href, children }) => {
                            if (href && href.startsWith('#seek-')) {
                              const timeStr = href.replace('#seek-', '');
                              return (
                                <button
                                  type="button"
                                  className="clickable-timestamp-pill"
                                  onClick={() => onSeekTimestamp && onSeekTimestamp(timeStr)}
                                  title={`Seek video to ${timeStr}`}
                                >
                                  <Clock size={11} /> {timeStr}
                                </button>
                              );
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                          }
                        }}
                      >
                        {preprocessMarkdown(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Referenced Timestamps Bar */}
                {msg.referenced_timestamps && msg.referenced_timestamps.length > 0 && (
                  <div className="referenced-ts-row">
                    <span className="ts-row-label">Referenced in video:</span>
                    <div className="ts-chips-list">
                      {msg.referenced_timestamps.map((ts, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          className="clickable-timestamp-pill"
                          onClick={() => onSeekTimestamp && onSeekTimestamp(ts)}
                          title={`Jump to ${ts}`}
                        >
                          <Clock size={11} /> {ts}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                  <div className="bubble-followups">
                    <span className="followup-label">Suggested follow-ups:</span>
                    <div className="followup-buttons">
                      {msg.suggested_followups.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          className="followup-chip"
                          onClick={() => handleSend(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="tutor-message-bubble assistant loading-bubble">
                <div className="bubble-sender">
                  <div className="assistant-avatar-pill">
                    <Bot size={13} />
                  </div>
                  <span className="sender-name">AI Video Tutor</span>
                </div>
                <div className="bubble-text">
                  <div className="loading-dots-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="tutor-quick-prompts">
            {quickPrompts.map((prompt, qIdx) => (
              <button
                key={qIdx}
                className="quick-prompt-btn"
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Shadcn-Style Input Box */}
          <form
            className="tutor-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask a question or cite timestamp (e.g. 'explain 04:30')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="tutor-text-input"
            />
            <button
              type="submit"
              className="tutor-send-btn"
              disabled={loading || !input.trim()}
              title="Send Message"
            >
              {loading ? <Loader2 size={15} className="spin-icon" /> : <Send size={15} />}
            </button>
          </form>
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
                <Bot size={16} />
                <span>Chat History</span>
              </div>
              <button 
                type="button" 
                className="chatgpt-sheet-close-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
                title="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="chatgpt-sheet-actions">
              <button
                type="button"
                className="shadcn-btn-new-chat"
                onClick={handleNewChat}
              >
                <div className="new-chat-left-label">
                  <Plus size={15} />
                  <span>New Chat</span>
                </div>
                <SquarePen size={13} className="text-zinc-400" />
              </button>
            </div>

            <div className="chatgpt-sheet-list">
              {sessions.map(s => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                  >
                    <MessageSquare size={14} className="session-icon" />
                    <span className="session-title-text">{s.title}</span>
                    <button
                      type="button"
                      className="session-delete-btn"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
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

export default AITutorChat;
