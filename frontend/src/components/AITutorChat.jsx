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
  Loader2
} from 'lucide-react';
import { askAITutor } from '../services/api';
import './AITutorChat.css';

const AITutorChat = ({ videoId, videoTitle, currentTimestamp, onSeekTimestamp }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your AI Video Tutor for **${videoTitle || 'this lesson'}**.\n\nAsk me any question about the concepts covered in this video, request simpler explanations, or ask about specific moments like *"What does the instructor explain at [04:15]?"*`,
      referenced_timestamps: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await askAITutor(
        videoId,
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
          content: "Sorry, I encountered an error communicating with the AI service. Please ensure the backend is connected.",
          referenced_timestamps: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Preprocess markdown to remove raw asterisks, convert cramped bullets to clean lines, and encode timestamps as links
  const preprocessMarkdown = (rawText) => {
    if (!rawText) return '';
    let cleaned = rawText;

    // Convert cramped inline bullets: "topics: * **What Python is**:" into clean markdown lists with linebreaks
    cleaned = cleaned.replace(/([^\n])\s*\*\s+\*\*/g, '$1\n- **');
    cleaned = cleaned.replace(/([^\n])\s*\*\s+([A-Z0-9])/g, '$1\n- $2');
    
    // Normalize triple asterisks or more to clean bold
    cleaned = cleaned.replace(/\*{3,}/g, '**');

    // Clean up excessive heading hashes
    cleaned = cleaned.replace(/#{3,}\s*/g, '#### ');

    // Convert timestamp brackets like [04:15] or [1:23:45] into clickable markdown links
    cleaned = cleaned.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, '[$1](#seek-$1)');

    return cleaned;
  };

  const quickPrompts = [
    `Explain the concept at current video time (${currentTimestamp || '00:00'})`,
    "Summarize the main takeaway of this video",
    "Give me a real-world code example of this topic",
    "What are the common pitfalls mentioned?"
  ];

  return (
    <div className="ai-tutor-container">
      {/* Header Bar */}
      <div className="tutor-header-bar">
        <div className="tutor-title-group">
          <div className="tutor-avatar-icon">
            <Bot size={18} />
          </div>
          <div>
            <h4 className="tutor-title">AI Video Tutor</h4>
            <span className="tutor-status-text">
              <span className="green-ping"></span> Grounded in transcript
            </span>
          </div>
        </div>

        {currentTimestamp && (
          <div className="current-player-time-badge">
            <Clock size={12} />
            <span>Active: {currentTimestamp}</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="tutor-messages-scroll">
        {messages.map((msg, idx) => (
          <div key={idx} className={`tutor-message-bubble ${msg.role}`}>
            <div className="bubble-sender">
              {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              <span>{msg.role === 'assistant' ? 'AI Tutor' : 'You'}</span>
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
              <Bot size={14} />
              <span>AI Tutor</span>
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

        <div ref={messagesEndRef} />
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

      {/* Input Box */}
      <form
        className="tutor-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          placeholder="Ask a question or cite a timestamp (e.g. 'explain 04:30')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="tutor-text-input"
        />
        <button
          type="submit"
          className="tutor-send-btn"
          disabled={loading || !input.trim()}
          title="Send Question"
        >
          {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

export default AITutorChat;
