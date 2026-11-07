import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Loader2,
  Plus,
  Trash2,
  PanelLeft,
  PanelLeftClose,
  SquarePen,
  X,
  Check
} from 'lucide-react';
import { generateQuiz } from '../services/api';
import './LessonQuiz.css';

const LessonQuiz = ({ videoId, videoTitle, onQuizComplete }) => {
  const [quizSets, setQuizSets] = useState([
    {
      id: 'quiz-set-1',
      title: 'Quiz 1: Core Concepts & Syntax',
      score: null,
      passed: null
    },
    {
      id: 'quiz-set-2',
      title: 'Quiz 2: Scenario Analysis & Debugging',
      score: null,
      passed: null
    },
    {
      id: 'quiz-set-3',
      title: 'Quiz 3: Architecture & Performance',
      score: null,
      passed: null
    }
  ]);

  const [activeQuizId, setActiveQuizId] = useState('quiz-set-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Reset state when video changes
    setQuizData(null);
    setLoading(false);
    setSubmitted(false);
    setSelectedAnswers({});
    setCurrentQIndex(0);
  }, [videoId]);

  const loadQuiz = async () => {
    if (!videoId) return;
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    setCurrentQIndex(0);

    try {
      const data = await generateQuiz(videoId);
      setQuizData(data);
    } catch (e) {
      console.error("Quiz load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmit = () => {
    if (!quizData?.questions) return;
    let correctCount = 0;
    quizData.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_index) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / quizData.questions.length) * 100);
    setScore(calculatedScore);
    setSubmitted(true);

    // Update active quiz set score
    setQuizSets(prev => prev.map(qs => {
      if (qs.id === activeQuizId) {
        return {
          ...qs,
          score: calculatedScore,
          passed: calculatedScore >= 70
        };
      }
      return qs;
    }));

    if (onQuizComplete) {
      onQuizComplete({
        videoId,
        score: calculatedScore,
        passed: calculatedScore >= 70
      });
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setCurrentQIndex(0);
  };

  const handleNewQuiz = () => {
    const newId = `quiz-set-${Date.now()}`;
    const newSet = {
      id: newId,
      title: `Quiz ${quizSets.length + 1}: Custom Milestone Test`,
      score: null,
      passed: null
    };
    setQuizSets(prev => [...prev, newSet]);
    setActiveQuizId(newId);
    setIsMobileDrawerOpen(false);
    loadQuiz();
  };

  const activeQuiz = quizSets.find(q => q.id === activeQuizId) || quizSets[0];

  return (
    <div className="shadcn-quiz-wrapper">
      {/* =====================================================================
          CHATGPT-STYLE MOBILE OPENING BAR (Header to open/close drawer on mobile)
          ===================================================================== */}
      <div className="chatgpt-mobile-top-bar">
        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-menu"
          onClick={() => setIsMobileDrawerOpen(true)}
          title="Open quiz sets sidebar"
          aria-label="Open quiz sets sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="chatgpt-bar-title-group" onClick={() => setIsMobileDrawerOpen(true)}>
          <span className="chatgpt-bar-active-title" title={activeQuiz.title}>
            {activeQuiz.title}
          </span>
          <span className="chatgpt-bar-status-dot" title="Active Quiz Set" />
        </div>

        <button 
          type="button" 
          className="chatgpt-bar-btn chatgpt-bar-new"
          onClick={handleNewQuiz}
          title="Create New Quiz"
          aria-label="Create New Quiz"
        >
          <SquarePen size={16} />
        </button>
      </div>

      {/* Main Two-Column Master / Detail Layout */}
      <div className="shadcn-quiz-layout">

        {/* =====================================================================
            LEFT SIDEBAR: "+ New Quiz" and Quiz Names (ChatGPT style!)
            ===================================================================== */}
        <aside className={`shadcn-quiz-sidebar ${isSidebarOpen ? 'is-expanded' : 'is-collapsed'}`}>
          <div className="quiz-sidebar-top-strip">
            <button
              type="button"
              className="shadcn-btn-new-chat"
              onClick={handleNewQuiz}
              title="Generate new quiz assessment"
            >
              <div className="new-chat-left-label">
                <Plus size={15} />
                <span>New Quiz</span>
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

          <div className="quiz-sidebar-scroll-list">
            <div className="chat-sidebar-section-header">
              <span>Quiz Assessments</span>
              <span className="chat-count-pill">{quizSets.length}</span>
            </div>

            <div className="chat-sessions-column">
              {quizSets.map(qs => {
                const isActive = qs.id === activeQuizId;
                return (
                  <div
                    key={qs.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveQuizId(qs.id);
                      setIsMobileDrawerOpen(false);
                      if (!quizData) loadQuiz();
                    }}
                    title={qs.title}
                  >
                    <HelpCircle size={14} className="session-icon" />
                    <span className="session-title-text">{qs.title}</span>

                    {qs.score !== null ? (
                      <span className={`quiz-score-badge ${qs.passed ? 'passed' : 'failed'}`}>
                        {qs.score}%
                      </span>
                    ) : (
                      <span className="quiz-pending-dot" title="Pending Assessment" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chat-sidebar-footer">
            <div className="grounded-badge">
              <span className="status-indicator-dot" />
              <span>Transcript-Grounded Scoring</span>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            RIGHT STAGE: Quiz Questions & Taking View
            ===================================================================== */}
        <div className="shadcn-quiz-main-stage">
          {/* Top Desktop Uncollapse Bar */}
          {!isSidebarOpen && (
            <div className="chat-desktop-uncollapse-bar">
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Open quiz sidebar"
              >
                <PanelLeft size={16} />
              </button>
              <span className="collapsed-bar-title">{activeQuiz.title}</span>
              <button
                type="button"
                className="shadcn-ghost-icon-btn"
                onClick={handleNewQuiz}
                title="New Quiz"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="quiz-loading-state">
              <Loader2 size={28} className="quiz-spinner text-emerald-600" />
              <h4>Generating Assessment Questions...</h4>
              <p>Extracting key concepts & testing points from lecture transcript.</p>
            </div>
          ) : !quizData || !quizData.questions || quizData.questions.length === 0 ? (
            <div className="quiz-empty-state">
              <div className="quiz-empty-icon-wrap">
                <HelpCircle size={32} className="quiz-empty-icon text-zinc-400" />
              </div>
              <h4>{activeQuiz.title}</h4>
              <p>Test your comprehension of the key concepts and code patterns covered in this lesson.</p>
              <button className="quiz-generate-btn" onClick={loadQuiz}>
                <Sparkles size={15} />
                <span>Start Quiz Assessment</span>
              </button>
            </div>
          ) : (
            <div className="lesson-quiz-container">
              {/* Quiz Header */}
              <div className="quiz-header-row">
                <div>
                  <span className="quiz-tag">
                    <Sparkles size={12} /> Knowledge Check
                  </span>
                  <h4 className="quiz-main-title">{quizData.quiz_title}</h4>
                </div>

                <div className="quiz-progress-pill">
                  Question {currentQIndex + 1} of {quizData.questions.length}
                </div>
              </div>

              {!submitted ? (
                /* Question Card View */
                <div className="quiz-question-card">
                  <div className="question-meta-bar">
                    <span className="difficulty-tag">{quizData.questions[currentQIndex]?.difficulty || 'Intermediate'}</span>
                    {quizData.questions[currentQIndex]?.timestamp && (
                      <span className="timestamp-tag">
                        <Clock size={11} /> Around {quizData.questions[currentQIndex].timestamp}
                      </span>
                    )}
                  </div>

                  <h3 className="question-text">{quizData.questions[currentQIndex]?.question}</h3>

                  <div className="options-stack">
                    {quizData.questions[currentQIndex]?.options.map((option, idx) => {
                      const isSelected = selectedAnswers[quizData.questions[currentQIndex]?.id] === idx;
                      return (
                        <div
                          key={idx}
                          className={`quiz-option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(quizData.questions[currentQIndex]?.id, idx)}
                        >
                          <span className="option-indicator">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="option-text">{option}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="quiz-nav-footer">
                    <button
                      className="btn-secondary quiz-prev-btn"
                      onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQIndex === 0}
                    >
                      <ArrowLeft size={15} /> Previous
                    </button>

                    {currentQIndex < quizData.questions.length - 1 ? (
                      <button
                        className="btn-primary quiz-next-btn"
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                      >
                        Next <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        className="btn-primary quiz-submit-btn"
                        onClick={handleSubmit}
                        disabled={!quizData.questions.every(q => selectedAnswers[q.id] !== undefined)}
                      >
                        Submit Answers
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Score & Results View */
                <div className="quiz-results-card">
                  <div className={`score-badge-circle ${score >= 70 ? 'passed' : 'failed'}`}>
                    <Award size={36} />
                    <span className="score-percent">{score}%</span>
                  </div>

                  <h3 className="results-heading">
                    {score >= 70 ? 'Milestone Passed!' : 'Review Recommended'}
                  </h3>
                  <p className="results-subtext">
                    You answered {quizData.questions.filter(q => selectedAnswers[q.id] === q.correct_index).length} of {quizData.questions.length} questions correctly.
                  </p>

                  <div className="results-actions-row">
                    <button className="btn-secondary" onClick={handleRetake}>
                      <RotateCcw size={14} /> Retake Quiz
                    </button>
                    <button className="btn-primary" onClick={handleNewQuiz}>
                      <Plus size={14} /> New Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                <HelpCircle size={16} />
                <span>Quiz Assessments</span>
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
                onClick={handleNewQuiz}
              >
                <div className="new-chat-left-label">
                  <Plus size={15} />
                  <span>New Quiz</span>
                </div>
                <SquarePen size={13} className="text-zinc-400" />
              </button>
            </div>

            <div className="chatgpt-sheet-list">
              {quizSets.map(qs => {
                const isActive = qs.id === activeQuizId;
                return (
                  <div
                    key={qs.id}
                    className={`chat-session-row ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveQuizId(qs.id);
                      setIsMobileDrawerOpen(false);
                      if (!quizData) loadQuiz();
                    }}
                  >
                    <HelpCircle size={14} className="session-icon" />
                    <span className="session-title-text">{qs.title}</span>
                    {qs.score !== null && (
                      <span className={`quiz-score-badge ${qs.passed ? 'passed' : 'failed'}`}>
                        {qs.score}%
                      </span>
                    )}
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

export default LessonQuiz;
