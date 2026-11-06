import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Clock, 
  RotateCcw, 
  X, 
  Bot, 
  User, 
  ChevronRight,
  ExternalLink,
  Loader2,
  Code2,
  HelpCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { askAITutor } from '../../services/api';
import './RightAIPanel.css';

const RightAIPanel = ({
  activeVideo,
  course,
  currentTimestamp = '00:00',
  onSeekTimestamp,
  isCollapsed,
  onToggleCollapse,
  width = 380
}) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 SkillWeave AI Copilot\n\nI am synchronized with **${activeVideo?.title || 'your current lesson'}**.\n\nAsk me anything about this lecture, request code explanations, or click any timestamp to jump the video directly.`,
      referenced_timestamps: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // When active video changes, announce new context
  useEffect(() => {
    if (activeVideo?.id) {
      setMessages([
        {
          role: 'assistant',
          content: `### 🎬 Now Learning: **${activeVideo.title}**\n\nContext loaded from module: *${activeVideo.moduleTitle || 'Active Lesson'}*.\nAsk questions, request code breakdowns, or explore specific topics covered in this video.`,
          referenced_timestamps: []
        }
      ]);
    }
  }, [activeVideo?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading || !activeVideo?.id) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await askAITutor(
        activeVideo.id,
        textToSend,
        currentTimestamp,
        messages
      );

      const tutorMessage = {
        role: 'assistant',
        content: response.answer,
        referenced_timestamps: response.referenced_timestamps || [],
        suggested_followups: response.suggested_followups || []
      };

      setMessages(prev => [...prev, tutorMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "⚠️ I encountered an error communicating with the AI service. Please verify your connection or try again.",
          referenced_timestamps: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const preprocessMarkdown = (rawText) => {
    if (!rawText) return '';
    let cleaned = rawText;
    cleaned = cleaned.replace(/([^\n])\s*\*\s+\*\*/g, '$1\n- **');
    cleaned = cleaned.replace(/([^\n])\s*\*\s+([A-Z0-9])/g, '$1\n- $2');
    cleaned = cleaned.replace(/\*{3,}/g, '**');
    cleaned = cleaned.replace(/#{3,}\s*/g, '#### ');
    // Convert timestamp brackets like [04:15] to markdown links
    cleaned = cleaned.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, '[$1](#seek-$1)');
    return cleaned;
  };

  const quickPrompts = [
    `Explain moment at [${currentTimestamp}]`,
    "Summarize this lesson in 3 key takeaways",
    "Show code snippet for this concept",
    "Generate 2 quick practice questions"
  ];

  if (isCollapsed) return null;

  return (
    <aside 
      className="vscode-ai-panel"
      style={{ width: `${width}px` }}
      aria-label="AI Copilot Panel"
    >
      {/* Panel Top Title Bar */}
      <div className="ai-panel-header">
        <div className="ai-panel-title-group">
          <Sparkles size={14} className="ai-brand-sparkle" />
          <span className="ai-panel-title">COPILOT</span>
          <span className="ai-model-tag">Gemini 2.5</span>
        </div>

        <div className="ai-panel-actions">
          <button 
            className="ai-icon-btn"
            onClick={() => setMessages([{
              role: 'assistant',
              content: `Chat history reset. How can I help you with **${activeVideo?.title || 'this lesson'}**?`,
              referenced_timestamps: []
            }])}
            title="Clear Chat History"
          >
            <RotateCcw size={13} />
          </button>
          <button 
            className="ai-icon-btn close-btn"
            onClick={onToggleCollapse}
            title="Hide AI Panel (Ctrl+\)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Synchronized Context Bar */}
      <div className="ai-context-indicator">
        <span className="context-pulse-dot" />
        <span className="context-text" title={activeVideo?.title || 'No active video'}>
          {activeVideo ? activeVideo.title : 'No lesson selected'}
        </span>
        <span className="context-ts-pill">
          <Clock size={11} /> {currentTimestamp}
        </span>
      </div>

      {/* Quick Prompts Strip */}
      <div className="ai-quick-prompts-bar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="ai-quick-prompt-chip"
            onClick={() => handleSend(prompt)}
            disabled={loading || !activeVideo?.id}
          >
            <Zap size={11} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="ai-messages-container">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`ai-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
              <div className="ai-avatar-wrapper">
                {isUser ? (
                  <div className="user-avatar-badge"><User size={12} /></div>
                ) : (
                  <div className="bot-avatar-badge"><Sparkles size={12} /></div>
                )}
              </div>

              <div className="ai-message-bubble">
                <div className="ai-message-meta">
                  <span className="author-name">{isUser ? 'You' : 'SkillWeave Copilot'}</span>
                </div>

                <div className="ai-message-content">
                  <ReactMarkdown
                    components={{
                      a: ({ node, href, children, ...props }) => {
                        if (href && href.startsWith('#seek-')) {
                          const timeStr = href.replace('#seek-', '');
                          return (
                            <button
                              type="button"
                              className="inline-timestamp-btn"
                              onClick={() => onSeekTimestamp && onSeekTimestamp(timeStr)}
                              title={`Jump video to ${timeStr}`}
                            >
                              <Clock size={11} /> {children}
                            </button>
                          );
                        }
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="ai-chat-link" {...props}>
                            {children} <ExternalLink size={10} />
                          </a>
                        );
                      },
                      code: ({ node, inline, className, children, ...props }) => {
                        return (
                          <code className={`vscode-inline-code ${className || ''}`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ node, children, ...props }) => {
                        return (
                          <div className="vscode-code-block-wrapper">
                            <div className="code-block-header">
                              <Code2 size={12} />
                              <span>Code Snippet</span>
                            </div>
                            <pre className="vscode-pre" {...props}>{children}</pre>
                          </div>
                        );
                      }
                    }}
                  >
                    {preprocessMarkdown(msg.content)}
                  </ReactMarkdown>
                </div>

                {/* Suggested follow-ups */}
                {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                  <div className="ai-followup-suggestions">
                    <span className="followup-heading">Suggested follow-ups:</span>
                    <div className="followup-buttons">
                      {msg.suggested_followups.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          className="followup-btn"
                          onClick={() => handleSend(fu)}
                          disabled={loading}
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="ai-message-row assistant-row">
            <div className="ai-avatar-wrapper">
              <div className="bot-avatar-badge pulsing"><Sparkles size={12} /></div>
            </div>
            <div className="ai-message-bubble loading-bubble">
              <div className="typing-indicator-strip">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="typing-text">Analyzing transcript & generating response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="ai-input-composer">
        <div className="composer-box">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeVideo ? `Ask about "${activeVideo.title.slice(0, 30)}..."` : "Select a video to chat..."}
            rows={2}
            className="ai-textarea"
            disabled={loading || !activeVideo?.id}
          />
          <div className="composer-footer">
            <span className="composer-hint">Enter ↵ to send • Shift+Enter for newline</span>
            <button
              className="ai-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || !activeVideo?.id}
              title="Send Message"
            >
              {loading ? <Loader2 size={14} className="spinning" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightAIPanel;
