import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, 
  Sparkles, 
  Search, 
  Play, 
  Clock, 
  ExternalLink,
  Bot,
  User,
  Plus,
  Edit2,
  Trash2,
  Check,
  Send,
  Loader2,
  Link2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Video
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { parseYouTube, askAITutor } from '../services/api';
import { getClient } from '../services/supabaseClient';
import './AITutorPage.css';

const DEFAULT_WELCOME_MSG = {
  role: 'assistant',
  content: `Hello! I am your **AI Video Tutor**.\n\nPaste any YouTube video link above or ask me questions about concepts, code syntax, or specific moments in the lecture. I ground my answers directly in the transcript so you master the material faster!`,
  referenced_timestamps: []
};

const AITutorPage = () => {
  const [user, setUser] = useState(null);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=t_k_k_t');
  const [activeVideoId, setActiveVideoId] = useState('t_k_k_t');
  const [videoTitle, setVideoTitle] = useState('Python Memory Architecture & Variables Demystified');
  const [currentTimestamp, setCurrentTimestamp] = useState('02:15');
  const [showVideoPlayer, setShowVideoPlayer] = useState(false); // Collapsed by default to avoid huge vertical layout!

  // ChatGPT Chat Threads State
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');

  const iframeRef = useRef(null);
  const chatMessagesBoxRef = useRef(null);
  const client = getClient();

  const sampleTutorVideos = [
    { label: "Python Memory Models", id: "t_k_k_t", title: "Python Memory Architecture & Variables Demystified" },
    { label: "React Server Components", id: "rsc_t", title: "React Server Components Deep Dive" },
    { label: "Vector Embeddings & RAG", id: "emb_t", title: "Mathematical Vector Embeddings in LLMs" }
  ];

  // 1. Initial User & Saved Chat Sessions Load
  useEffect(() => {
    let mounted = true;
    const initChats = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        const currentUser = session?.user || null;
        if (mounted) setUser(currentUser);

        if (currentUser) {
          // Load from Supabase DB tutor_chats table
          const { data, error } = await client
            .from('tutor_chats')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false });

          if (!error && data && data.length > 0 && mounted) {
            setChats(data);
            setActiveChatId(data[0].id);
            setMessages(data[0].messages?.length > 0 ? data[0].messages : [DEFAULT_WELCOME_MSG]);
            if (data[0].video_id) setActiveVideoId(data[0].video_id);
            if (data[0].video_title) setVideoTitle(data[0].video_title);
            return;
          }
        }

        // Fallback: load from localStorage
        const cached = localStorage.getItem('skillweave_tutor_chats');
        if (cached && mounted) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) {
              setChats(parsed);
              setActiveChatId(parsed[0].id);
              setMessages(parsed[0].messages?.length > 0 ? parsed[0].messages : [DEFAULT_WELCOME_MSG]);
              return;
            }
          } catch (e) {}
        }

        // Default initial thread
        const defaultChat = {
          id: `chat_${Date.now()}`,
          title: 'Python Memory Architecture',
          video_id: 't_k_k_t',
          video_title: 'Python Memory Architecture & Variables Demystified',
          messages: [DEFAULT_WELCOME_MSG],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (mounted) {
          setChats([defaultChat]);
          setActiveChatId(defaultChat.id);
        }
      } catch (err) {
        console.warn('Init chats notice:', err);
      }
    };

    initChats();
    return () => { mounted = false; };
  }, [client]);

  // 2. Internal Container Scroll (Never scrolls outer window!)
  useEffect(() => {
    if (chatMessagesBoxRef.current) {
      chatMessagesBoxRef.current.scrollTop = chatMessagesBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 3. Start a Brand New Chat
  const handleNewChat = async () => {
    const newChatObj = {
      id: `chat_${Date.now()}`,
      title: 'New Discussion',
      video_id: activeVideoId,
      video_title: videoTitle,
      messages: [{
        role: 'assistant',
        content: `New chat session started for **${videoTitle}**.\n\nWhat would you like to explore? Ask any question or request code explanations!`,
        referenced_timestamps: []
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newChatObj, ...chats];
    setChats(updated);
    setActiveChatId(newChatObj.id);
    setMessages(newChatObj.messages);

    // Persist to Supabase if authenticated
    if (user?.id) {
      try {
        const { data } = await client.from('tutor_chats').insert({
          user_id: user.id,
          video_id: activeVideoId,
          video_title: videoTitle,
          title: newChatObj.title,
          messages: newChatObj.messages
        }).select();
        if (data && data[0]) {
          newChatObj.id = data[0].id;
          setActiveChatId(data[0].id);
        }
      } catch (e) {
        console.warn('Save chat error:', e);
      }
    }

    try {
      localStorage.setItem('skillweave_tutor_chats', JSON.stringify(updated));
    } catch (e) {}
  };

  // 4. Switch Between Chat Sessions
  const handleSelectChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages?.length > 0 ? chat.messages : [DEFAULT_WELCOME_MSG]);
    if (chat.video_id) {
      setActiveVideoId(chat.video_id);
      setVideoUrl(`https://www.youtube.com/watch?v=${chat.video_id}`);
    }
    if (chat.video_title) setVideoTitle(chat.video_title);
  };

  // 5. Rename Chat Thread
  const handleStartRename = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitleText(chat.title);
  };

  const handleSaveRename = async (chatId, e) => {
    if (e) e.stopPropagation();
    if (!editTitleText.trim()) {
      setEditingChatId(null);
      return;
    }

    const updated = chats.map(c => c.id === chatId ? { ...c, title: editTitleText.trim() } : c);
    setChats(updated);
    setEditingChatId(null);

    // Save to Supabase
    if (user?.id) {
      try {
        await client.from('tutor_chats').update({ title: editTitleText.trim(), updated_at: new Date().toISOString() }).eq('id', chatId);
      } catch (e) {}
    }

    try {
      localStorage.setItem('skillweave_tutor_chats', JSON.stringify(updated));
    } catch (e) {}
  };

  // 6. Delete Chat Thread
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    const filtered = chats.filter(c => c.id !== chatId);
    setChats(filtered);

    if (activeChatId === chatId) {
      if (filtered.length > 0) {
        handleSelectChat(filtered[0]);
      } else {
        handleNewChat();
      }
    }

    if (user?.id) {
      try {
        await client.from('tutor_chats').delete().eq('id', chatId);
      } catch (e) {}
    }

    try {
      localStorage.setItem('skillweave_tutor_chats', JSON.stringify(filtered));
    } catch (e) {}
  };

  // 7. Load / Parse Video
  const handleLoadVideo = async () => {
    if (!videoUrl.trim()) return;
    try {
      const parsed = await parseYouTube(videoUrl);
      if (parsed.type === 'video') {
        setActiveVideoId(parsed.data.id);
        setVideoTitle(parsed.data.title);
      } else if (parsed.type === 'playlist' && parsed.data.videos?.length > 0) {
        setActiveVideoId(parsed.data.videos[0].id);
        setVideoTitle(parsed.data.videos[0].title);
      }
    } catch (e) {
      const match = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      if (match) {
        setActiveVideoId(match[1]);
        setVideoTitle("Loaded YouTube Lesson");
      }
    }
  };

  // 8. Send Message
  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await askAITutor(
        activeVideoId,
        textToSend,
        currentTimestamp,
        messages
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.answer || "I reviewed the video transcript and found the following key concept:",
        referenced_timestamps: response.referenced_timestamps || [],
        suggested_followups: response.suggested_followups || []
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Auto-update current active chat in state & DB
      const updatedChats = chats.map(c => {
        if (c.id === activeChatId) {
          const newTitle = c.title === 'New Discussion' ? textToSend.substring(0, 32) + '...' : c.title;
          return {
            ...c,
            title: newTitle,
            messages: finalMessages,
            video_id: activeVideoId,
            video_title: videoTitle,
            updated_at: new Date().toISOString()
          };
        }
        return c;
      });
      setChats(updatedChats);

      if (user?.id && activeChatId) {
        try {
          await client.from('tutor_chats').upsert({
            id: activeChatId,
            user_id: user.id,
            video_id: activeVideoId,
            video_title: videoTitle,
            messages: finalMessages,
            updated_at: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('DB chat save note:', dbErr);
        }
      }

      try {
        localStorage.setItem('skillweave_tutor_chats', JSON.stringify(updatedChats));
      } catch (e) {}

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I encountered an error analyzing the video transcript. Please make sure the backend server is active.",
          referenced_timestamps: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (timeStr) => {
    setCurrentTimestamp(timeStr);
    const parts = timeStr.split(':');
    let secs = 0;
    if (parts.length === 2) secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);

    setShowVideoPlayer(true);
    if (iframeRef.current) {
      iframeRef.current.src = `https://www.youtube.com/embed/${activeVideoId}?start=${secs}&autoplay=1&enablejsapi=1`;
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="chatgpt-studio-page">
      <Navbar />

      <div className="chatgpt-workspace-container">
        {/* MAIN CONVERSATION STAGE (MIDDLE) */}
        <div className="chatgpt-main-stage">
          {/* Top Video & Grounding Bar */}
          <div className="chatgpt-grounding-header">
            <div className="grounding-left">
              <span className="grounding-pill">
                <Sparkles size={13} className="sparkle-anim" /> Grounded Tutor
              </span>
              <div className="grounding-video-meta">
                <h3 className="grounding-video-title" title={videoTitle}>{videoTitle}</h3>
                <span className="grounding-time-pill">
                  <Clock size={11} /> Pointer: {currentTimestamp}
                </span>
              </div>
            </div>

            <div className="grounding-right-controls">
              {/* URL Input */}
              <div className="grounding-url-field">
                <Link2 size={15} className="link-icon-muted" />
                <input
                  type="text"
                  placeholder="Paste YouTube Video URL to Ground..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                />
                <button className="grounding-load-btn" onClick={handleLoadVideo}>
                  Load
                </button>
              </div>

              {/* Show/Hide Video Toggle */}
              <button 
                className={`grounding-toggle-video-btn ${showVideoPlayer ? 'is-active' : ''}`}
                onClick={() => setShowVideoPlayer(!showVideoPlayer)}
                title={showVideoPlayer ? "Hide Cinema Preview" : "Show Cinema Preview"}
              >
                <Video size={14} />
                <span>{showVideoPlayer ? "Hide Video" : "Show Video"}</span>
                {showVideoPlayer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Quick Presets Strip */}
          <div className="grounding-presets-strip">
            <span className="presets-label">Quick Grounding:</span>
            {sampleTutorVideos.map((s, idx) => (
              <button
                key={idx}
                className={`preset-chip ${activeVideoId === s.id ? 'chip-active' : ''}`}
                onClick={() => {
                  setActiveVideoId(s.id);
                  setVideoTitle(s.title);
                  setVideoUrl(`https://www.youtube.com/watch?v=${s.id}`);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Collapsible Cinema Preview Frame */}
          {showVideoPlayer && (
            <div className="chatgpt-cinema-drawer">
              <div className="cinema-aspect-box">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${activeVideoId}?enablejsapi=1`}
                  title={videoTitle}
                  className="cinema-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="chatgpt-messages-container" ref={chatMessagesBoxRef}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`chatgpt-bubble-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                  <div className="chatgpt-bubble-avatar">
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className="chatgpt-bubble-content">
                    <div className="chatgpt-bubble-author">
                      <span>{isUser ? 'You' : 'AI Video Tutor'}</span>
                    </div>

                    <div className="chatgpt-markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Clickable Timestamp Reference Tags */}
                    {msg.referenced_timestamps?.length > 0 && (
                      <div className="chatgpt-timestamp-tags">
                        <span className="jump-lead">Jump to moments in lecture:</span>
                        {msg.referenced_timestamps.map((ts, tIdx) => (
                          <button
                            key={tIdx}
                            className="timestamp-jump-chip"
                            onClick={() => handleSeek(ts)}
                          >
                            <Play size={11} /> {ts}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-ups */}
                    {msg.suggested_followups?.length > 0 && (
                      <div className="chatgpt-followup-suggestions">
                        {msg.suggested_followups.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            className="followup-suggestion-btn"
                            onClick={() => handleSend(q)}
                          >
                            <Sparkles size={12} /> {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="chatgpt-bubble-row assistant-row">
                <div className="chatgpt-bubble-avatar"><Bot size={16} /></div>
                <div className="chatgpt-bubble-content">
                  <div className="chatgpt-typing-pulse">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span>Analyzing video transcript and formulating answer...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floating ChatGPT-Style Prompt Box */}
          <div className="chatgpt-bottom-prompt-wrapper">
            <div className="chatgpt-prompt-card">
              <textarea
                className="chatgpt-prompt-input"
                rows={1}
                placeholder={`Ask anything about "${videoTitle}" (e.g. "Explain the core takeaway" or "What happened at 03:45?")`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button 
                className="chatgpt-send-button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                title="Send message (Enter)"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="chatgpt-quick-prompts-bar">
              <button onClick={() => handleSend(`Summarize the 3 core takeaways from this video.`)}>
                💡 Summarize takeaways
              </button>
              <button onClick={() => handleSend(`Give me a clean practical code example demonstrating this concept.`)}>
                💻 Code example
              </button>
              <button onClick={() => handleSend(`What is the most common beginner mistake when dealing with this topic?`)}>
                ⚠️ Common pitfalls
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: ChatGPT-Style Chat History & Session Manager */}
        <aside className="chatgpt-right-sidebar">
          <div className="sidebar-top-action">
            <button className="chatgpt-new-chat-btn" onClick={handleNewChat}>
              <Plus size={16} /> <span>New Chat</span>
            </button>
          </div>

          <div className="sidebar-section-label">
            <span>Conversations ({chats.length})</span>
          </div>

          <div className="sidebar-threads-scroll">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingChatId === chat.id;

              return (
                <div 
                  key={chat.id} 
                  className={`sidebar-thread-item ${isActive ? 'active-thread' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <MessageSquare size={15} className="thread-msg-icon" />

                  {isEditing ? (
                    <div className="thread-edit-inline" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chat.id, e);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                      />
                      <button className="edit-confirm-btn" onClick={(e) => handleSaveRename(chat.id, e)}>
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="thread-title-meta">
                      <span className="thread-title-text" title={chat.title}>{chat.title}</span>
                      <span className="thread-video-sub" title={chat.video_title}>{chat.video_title || 'Video Lesson'}</span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="thread-actions-hover">
                      <button 
                        className="thread-action-icon"
                        onClick={(e) => handleStartRename(chat, e)}
                        title="Rename Chat"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="thread-action-icon delete-icon"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title="Delete Chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer-note">
            <Sparkles size={13} className="text-blue-500" />
            <span>Saved in Supabase Cloud DB</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AITutorPage;
