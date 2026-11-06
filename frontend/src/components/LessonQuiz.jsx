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
  Loader2
} from 'lucide-react';
import { generateQuiz } from '../services/api';
import './LessonQuiz.css';

const LessonQuiz = ({ videoId, videoTitle, onQuizComplete }) => {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Reset quiz state when video changes - do not auto-generate until user clicks
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

  if (loading) {
    return (
      <div className="quiz-loading-state">
        <Loader2 size={32} className="quiz-spinner" />
        <h4>Generating Lesson Assessment...</h4>
        <p>Synthesizing questions from the video transcript & objectives.</p>
      </div>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="quiz-empty-state">
        <div className="quiz-empty-icon-wrap">
          <HelpCircle size={36} className="quiz-empty-icon" />
        </div>
        <h4>Interactive Lesson Quiz</h4>
        <p>Test your comprehension of the key concepts and code patterns covered in this lesson.</p>
        <button className="quiz-generate-btn" onClick={loadQuiz}>
          <Sparkles size={16} />
          <span>Generate & Start Quiz</span>
        </button>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQIndex];
  const allAnswered = quizData.questions.every(q => selectedAnswers[q.id] !== undefined);

  return (
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
        /* Quiz Taking View */
        <div className="quiz-question-card">
          <div className="question-meta-bar">
            <span className="difficulty-tag">{currentQ.difficulty || 'Intermediate'}</span>
            {currentQ.timestamp && (
              <span className="timestamp-tag">
                <Clock size={11} /> Around {currentQ.timestamp}
              </span>
            )}
          </div>

          <h3 className="question-text">{currentQ.question}</h3>

          <div className="options-stack">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              return (
                <div
                  key={idx}
                  className={`quiz-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
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
              <ArrowLeft size={16} /> Previous
            </button>

            {currentQIndex < quizData.questions.length - 1 ? (
              <button
                className="btn-primary quiz-next-btn"
                onClick={() => setCurrentQIndex(prev => prev + 1)}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn-primary quiz-submit-btn"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Results & Detailed Review View */
        <div className="quiz-results-card">
          <div className="score-summary-banner">
            <div className="score-circle">
              <span className="score-number">{score}%</span>
            </div>
            <div>
              <h3>{score >= 70 ? 'Excellent Mastery! 🎉' : 'Keep Practicing! 💪'}</h3>
              <p>
                {score >= 70
                  ? 'You demonstrated a solid understanding of the concepts in this lesson.'
                  : 'Review the explanations below to solidify the key takeaways.'}
              </p>
            </div>
            <button className="btn-secondary retake-btn" onClick={handleRetake}>
              <RotateCcw size={15} /> Retake
            </button>
          </div>

          <div className="answers-review-stack">
            <h4 className="review-title">Detailed Question Explanations:</h4>
            {quizData.questions.map((q, idx) => {
              const userChoice = selectedAnswers[q.id];
              const isCorrect = userChoice === q.correct_index;

              return (
                <div key={idx} className={`review-item-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-q-header">
                    <span className="review-q-num">Q{idx + 1}</span>
                    <h5>{q.question}</h5>
                    {isCorrect ? (
                      <CheckCircle2 size={20} className="icon-correct" />
                    ) : (
                      <XCircle size={20} className="icon-incorrect" />
                    )}
                  </div>

                  <div className="review-options-list">
                    {q.options.map((opt, oIdx) => {
                      const isUser = userChoice === oIdx;
                      const isActualCorrect = q.correct_index === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`review-option-pill ${isActualCorrect ? 'is-correct' : ''} ${isUser && !isActualCorrect ? 'is-wrong-pick' : ''}`}
                        >
                          <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                          <span>{opt}</span>
                          {isActualCorrect && <span className="correct-label">✓ Correct</span>}
                          {isUser && !isActualCorrect && <span className="wrong-label">✗ Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="review-explanation-box">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonQuiz;
