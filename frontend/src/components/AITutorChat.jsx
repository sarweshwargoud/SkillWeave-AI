import { useState, useRef, useEffect } from 'react';
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
      content: `Hello! I am your AI Video Tutor for **${videoTitle || 'this lesson'}**. Ask me any question, request simpler explanations, or ask about specific moments like *"What does the instructor explain at 04:15?"*`,
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

  // Helper to parse text and turn [MM:SS] or [HH:MM:SS] into clickable seek buttons
  const renderMessageContent = (content) => {
    const parts = content.split(/(\[\d{1,2}:\d{2}(?::\d{2})?\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
      if (match) {
        const timeStr = match[1];
        return (
          <button
            key={index}
            className="clickable-timestamp-pill"
            onClick={() => onSeekTimestamp && onSeekTimestamp(timeStr)}
            title={`Seek player to ${timeStr}`}
          >
            <Clock size={11} /> {timeStr}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
              {renderMessageContent(msg.content)}
            </div>

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
            <Loader2 size={16} className="tutor-spinner" />
            <span>Analyzing video transcript & synthesizing answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="tutor-quick-prompts-bar">
        {quickPrompts.map((p, pIdx) => (
          <button
            key={pIdx}
            className="quick-prompt-btn"
            onClick={() => handleSend(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        className="tutor-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="tutor-text-input"
          placeholder="Ask a question or cite a timestamp (e.g. 'explain 04:30')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="tutor-send-btn"
          disabled={loading || !input.trim()}
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AITutorChat;
