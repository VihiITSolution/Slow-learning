import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import DOMPurify from 'dompurify';
import '../styles/App.css';

// ── helpers ──────────────────────────────────────────────────────────────────
function parseContent(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.type === 'interactive' && Array.isArray(parsed.steps)) {
      return parsed;
    }
  } catch (_) {}
  return null; // treat as plain HTML
}

// ── component ─────────────────────────────────────────────────────────────────
function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // lesson data
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // interactive engine state
  // phase: 'loading' | 'intro' | 'steps' | 'quiz' | 'results'
  const [phase, setPhase] = useState('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);

  // quiz state
  const [quizData, setQuizData] = useState(null);  // from /quiz GET
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [results, setResults] = useState(null);

  // timer (seconds elapsed since start)
  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  // first answer to each activity step (step index -> option index)
  const stepAnswersRef = useRef({});

  const startTimer = useCallback(() => {
    secondsRef.current = 0;
    timerRef.current = setInterval(() => { secondsRef.current += 1; }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer(); // cleanup on unmount
  }, [stopTimer]);

  useEffect(() => {
    fetchLesson();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLesson = async () => {
    try {
      const response = await api.get(`/lessons/${id}`);
      setLesson(response.data);
      // The quiz is stored separately; a lesson without one is just completed
      try {
        const quizRes = await api.get(`/lessons/${id}/quiz`);
        setQuizData(quizRes.data);
      } catch (_) {
        setQuizData(null);
      }
      setPhase('intro');
      setLoading(false);
    } catch (err) {
      setError('Failed to load lesson details');
      setLoading(false);
    }
  };

  // ── Phase handlers ──────────────────────────────────────────────────────────

  const handleStartLesson = async () => {
    try {
      await api.post(`/lessons/${id}/start`);
    } catch (_) {}
    startTimer();
    stepAnswersRef.current = {};
    setStepIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setPhase('steps');
  };

  const handleOptionSelect = (optionIndex) => {
    if (answered) return;
    if (stepAnswersRef.current[stepIndex] === undefined) {
      stepAnswersRef.current[stepIndex] = optionIndex;
    }
    setSelectedOption(optionIndex);
    setAnswered(true);
  };

  // Save how the student did on the lesson's practice questions (feeds the
  // engagement model's practice accuracy). Saving must never block the lesson.
  const saveLessonActivities = (steps) => {
    const activitySteps = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.type === 'activity' && step.correct !== undefined);
    if (activitySteps.length === 0) return;
    const answers = activitySteps.map(({ index }) => stepAnswersRef.current[index] ?? -1);
    api.post('/activities/lesson-steps', {
      lesson_id: Number(id),
      answers,
      time_spent: secondsRef.current,
    }).catch(() => {});
  };

  const handleNextStep = () => {
    const content = parseContent(lesson.content);
    const steps = content?.steps || [];
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      // All steps done — save the activity answers, then move to quiz
      saveLessonActivities(steps);
      setPhase('quiz');
    }
  };

  const handleQuizAnswerChange = (qIndex, optionIndex) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    setQuizError('');
  };

  const handleSubmitQuiz = async () => {
    const content = parseContent(lesson.content);
    const questions = content?.quiz?.questions || quizData?.questions || [];
    const totalQ = questions.length;
    if (totalQ === 0) {
      // No quiz — just complete lesson
      await completeLessonOnly();
      return;
    }

    // Build ordered answers array
    const answersArr = Array.from({ length: totalQ }, (_, i) =>
      quizAnswers[i] !== undefined ? quizAnswers[i] : -1
    );

    const unanswered = answersArr.filter(a => a === -1).length;
    if (unanswered > 0) {
      setQuizError(`Please answer all questions first (${unanswered} left).`);
      return;
    }
    setQuizError('');

    setQuizSubmitting(true);
    stopTimer();
    const elapsedSeconds = secondsRef.current;

    try {
      // Submit quiz attempt (records QuizAttempt for ML)
      const quizRes = await api.post(`/lessons/${id}/quiz`, {
        answers: answersArr,
        time_taken: elapsedSeconds
      });

      // Also mark lesson complete with time spent
      const completeRes = await api.post(`/lessons/${id}/complete`, { time_spent: elapsedSeconds });
      const lessonXp = completeRes.data?.xp_earned || 0;

      setResults({
        ...quizRes.data,
        xp_earned: (quizRes.data.xp_earned || 0) + lessonXp,
        leveled_up: quizRes.data.leveled_up || completeRes.data?.leveled_up,
        level: completeRes.data?.level ?? quizRes.data.level,
        already_completed: completeRes.data?.already_completed,
        time_spent: elapsedSeconds,
      });
      setPhase('results');
      refreshUser();
    } catch (err) {
      // If quiz route doesn't exist yet, fall back to lesson complete only
      try {
        const res = await api.post(`/lessons/${id}/complete`, { time_spent: elapsedSeconds });
        setResults({ score: null, passed: true, xp_earned: res.data?.xp_earned ?? 0, already_completed: res.data?.already_completed });
        setPhase('results');
        refreshUser();
      } catch (_) {
        setError('Could not save progress. Please try again.');
      }
    } finally {
      setQuizSubmitting(false);
    }
  };

  const completeLessonOnly = async () => {
    stopTimer();
    const elapsedSeconds = secondsRef.current;
    try {
      const res = await api.post(`/lessons/${id}/complete`, { time_spent: elapsedSeconds });
      setResults({ xp_earned: res.data.xp_earned ?? 0, leveled_up: res.data.leveled_up, already_completed: res.data.already_completed });
      setPhase('results');
      refreshUser();
    } catch (_) {
      setPhase('results');
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container">
        <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
          ⏳ Loading lesson...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="error" style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => navigate('/app/lessons')} className="primary-button">Back to Lessons</button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="error">Lesson not found</div>
        <button onClick={() => navigate('/app/lessons')} className="primary-button">Back to Lessons</button>
      </div>
    );
  }

  const interactiveContent = parseContent(lesson.content);

  // ── PHASE: INTRO ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const emoji = interactiveContent?.emoji || '📚';
    const categoryColors = {
      math: '#3b82f6',
      english: '#8b5cf6',
      science: '#10b981',
      default: '#f59e0b'
    };
    const color = categoryColors[lesson.category] || categoryColors.default;
    const stepCount = interactiveContent?.steps?.length || 0;

    return (
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
        <button
          onClick={() => navigate('/app/lessons')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          ← Back to Lessons
        </button>

        <div style={{ textAlign: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '2.5rem 2rem', border: `3px solid ${color}20` }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{emoji}</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{lesson.title}</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '1.5rem' }}>{lesson.description}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <span style={{ background: `${color}15`, color, padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
              📚 {lesson.category}
            </span>
            <span style={{ background: '#fef9c3', color: '#92400e', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
              ⭐ {lesson.xp_reward} XP
            </span>
            {stepCount > 0 && (
              <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                🪜 {stepCount} steps
              </span>
            )}
          </div>

          <button
            onClick={handleStartLesson}
            style={{ background: color, color: '#fff', border: 'none', borderRadius: '12px', padding: '0.9rem 2.5rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseOver={e => (e.target.style.opacity = '0.85')}
            onMouseOut={e => (e.target.style.opacity = '1')}>
            🚀 Start Learning!
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: STEPS ─────────────────────────────────────────────────────────────
  if (phase === 'steps' && interactiveContent) {
    const steps = interactiveContent.steps || [];
    const step = steps[stepIndex];
    const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
    const color = { math: '#3b82f6', english: '#8b5cf6', science: '#10b981' }[lesson.category] || '#f59e0b';

    return (
      <div className="container" style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>{lesson.title}</span>
            <span>Step {stepIndex + 1} of {steps.length}</span>
          </div>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '2rem', border: `2px solid ${color}30` }}>
          <h2 style={{ color: '#1e293b', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>{step?.title}</h2>

          {step?.type === 'learn' && (
            <>
              <div
                style={{ lineHeight: '1.8', color: '#374151', fontSize: '1.05rem' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.content || '') }}
              />
              <button
                onClick={handleNextStep}
                style={{ marginTop: '1.5rem', background: color, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                {stepIndex + 1 < steps.length ? 'Next →' : 'Go to Quiz 🎯'}
              </button>
            </>
          )}

          {step?.type === 'activity' && (
            <>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1.2rem', fontWeight: 500 }}>{step.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {(step.options || []).map((opt, i) => {
                  let bg = '#f8fafc';
                  let border = '2px solid #e2e8f0';
                  let textColor = '#1e293b';
                  if (answered) {
                    if (i === step.correct) { bg = '#dcfce7'; border = '2px solid #16a34a'; textColor = '#166534'; }
                    else if (i === selectedOption && i !== step.correct) { bg = '#fee2e2'; border = '2px solid #dc2626'; textColor = '#991b1b'; }
                  } else if (i === selectedOption) {
                    bg = `${color}15`; border = `2px solid ${color}`;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      style={{ background: bg, border, color: textColor, borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '1rem', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', fontWeight: i === step.correct && answered ? 600 : 400 }}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div style={{ background: selectedOption === step.correct ? '#f0fdf4' : '#fef9c3', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', borderLeft: `4px solid ${selectedOption === step.correct ? '#16a34a' : '#d97706'}` }}>
                  <strong>{selectedOption === step.correct ? '✅ Correct!' : '💡 Not quite!'}</strong>
                  <p style={{ margin: '0.4rem 0 0', color: '#374151' }}>{step.explanation}</p>
                </div>
              )}

              {answered && (
                <button
                  onClick={handleNextStep}
                  style={{ background: color, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                  {stepIndex + 1 < steps.length ? 'Next →' : 'Go to Quiz 🎯'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: QUIZ ──────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const color = { math: '#3b82f6', english: '#8b5cf6', science: '#10b981' }[lesson.category] || '#f59e0b';

    // Try to get questions from lesson content (static) or previously fetched quiz
    const contentQuestions = interactiveContent?.quiz?.questions || null;
    const questions = contentQuestions || quizData?.questions || [];
    const passingScore = quizData?.passing_score ?? 60;

    return (
      <div className="container" style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '2rem', border: `2px solid ${color}30` }}>
          <h2 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>🎯 Quick Quiz</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Answer to earn extra XP! You need {passingScore}% to pass.</p>

          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#64748b' }}>No quiz for this lesson.</p>
              <button onClick={completeLessonOnly} style={{ background: color, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
                Complete Lesson ✅
              </button>
            </div>
          ) : (
            <>
              {questions.map((q, qi) => (
                <div key={qi} style={{ marginBottom: '1.5rem', background: '#f8fafc', borderRadius: '12px', padding: '1.2rem' }}>
                  <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.8rem' }}>{qi + 1}. {q.q}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(q.options || []).map((opt, oi) => (
                      <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: quizAnswers[qi] === oi ? `${color}15` : '#fff', border: `1.5px solid ${quizAnswers[qi] === oi ? color : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          value={oi}
                          checked={quizAnswers[qi] === oi}
                          onChange={() => handleQuizAnswerChange(qi, oi)}
                          style={{ accentColor: color }}
                        />
                        <span style={{ color: '#374151' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {quizError && (
                <div role="alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '0.7rem 1rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {quizError}
                </div>
              )}

              <button
                onClick={handleSubmitQuiz}
                disabled={quizSubmitting}
                style={{ background: quizSubmitting ? '#94a3b8' : color, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: quizSubmitting ? 'not-allowed' : 'pointer', width: '100%' }}>
                {quizSubmitting ? '⏳ Submitting...' : 'Submit Answers 🚀'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: RESULTS ───────────────────────────────────────────────────────────
  if (phase === 'results' && results !== null) {
    const color = { math: '#3b82f6', english: '#8b5cf6', science: '#10b981' }[lesson.category] || '#f59e0b';
    const passed = results.passed !== false;
    const score = results.score;
    const passingScore = quizData?.passing_score ?? 60;
    const quizQuestions = interactiveContent?.quiz?.questions || quizData?.questions || [];
    const mistakes = (results.review || [])
      .map((r, i) => ({ ...r, index: i, question: quizQuestions[i] }))
      .filter(r => !r.is_correct && r.question);

    return (
      <div className="container" style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '2.5rem 2rem', border: `3px solid ${passed ? '#16a34a' : '#f59e0b'}40` }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{results.leveled_up ? '🎊' : passed ? '🏆' : '💪'}</div>

          {results.leveled_up && (
            <div style={{ background: '#fef9c3', border: '2px solid #fbbf24', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem', fontWeight: 700, color: '#92400e', fontSize: '1.1rem' }}>
              ⬆️ Level Up! You reached Level {results.level}!
            </div>
          )}

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: passed ? '#166534' : '#b45309', marginBottom: '0.5rem' }}>
            {passed ? 'Well Done!' : 'Keep Practising!'}
          </h2>

          {score !== null && score !== undefined && (
            <div style={{ margin: '1.2rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color }}>
                {results.correct}/{results.total}
              </div>
              <div style={{ color: '#64748b', fontSize: '1rem' }}>{score}% — {passed ? '✅ Passed!' : `❌ Not passed (need ${passingScore}%)`}</div>
            </div>
          )}

          {mistakes.length > 0 && (
            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.2rem', margin: '1rem 0' }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Let's look at the tricky ones:</div>
              {mistakes.map(m => (
                <div key={m.index} style={{ padding: '0.5rem 0', borderTop: '1px solid #e2e8f0', color: '#374151' }}>
                  <div style={{ fontWeight: 600 }}>{m.index + 1}. {m.question.q}</div>
                  <div style={{ color: '#b91c1c' }}>You chose: {m.question.options?.[m.your_answer] ?? '—'}</div>
                  <div style={{ color: '#166534' }}>Right answer: {m.question.options?.[m.correct_answer] ?? '—'}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#fef9c3', borderRadius: '12px', padding: '0.9rem', margin: '1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#92400e' }}>
            {results.xp_earned > 0
              ? `⭐ +${results.xp_earned} XP earned!`
              : results.already_completed
                ? '📖 Lesson reviewed - XP is earned the first time you finish a lesson'
                : '⭐ No XP this time - try again to pass the quiz!'}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/app/lessons')}
              style={{ background: color, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 1.8rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              📚 More Lessons
            </button>
            <button
              onClick={() => { setPhase('intro'); setQuizAnswers({}); setQuizError(''); setResults(null); setStepIndex(0); }}
              style={{ background: '#f1f5f9', color: '#1e293b', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1.8rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FALLBACK: non-interactive / plain HTML content ──────────────────────────
  return (
    <div className="container">
      <div className="lesson-detail-page">
        <button onClick={() => navigate('/app/lessons')} className="back-button">
          ← Back to Lessons
        </button>

        <div className="lesson-header">
          <h1>{lesson.title}</h1>
          <div className="lesson-meta">
            <span className="lesson-difficulty">Difficulty: {lesson.difficulty_level || 'Beginner'}</span>
            <span className="lesson-xp">XP: {lesson.xp_reward || 0}</span>
          </div>
        </div>

        <div className="lesson-content">
          <h2>Description</h2>
          <p>{lesson.description || 'No description available.'}</p>

          {lesson.content && (
            <div className="lesson-materials">
              <h3>Lesson Content</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }} />
            </div>
          )}

          <div className="lesson-actions">
            <button onClick={handleStartLesson} className="primary-button">
              Start Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonDetailPage;

