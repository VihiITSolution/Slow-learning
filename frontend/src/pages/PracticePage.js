import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Daily check-in answers (same keys as the backend)
export const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'okay', emoji: '🙂', label: 'Okay' },
  { id: 'unsure', emoji: '😕', label: 'Not sure' },
  { id: 'hard', emoji: '😢', label: 'Hard day' },
];

const AREA_COLORS = { math: '#3b82f6', words: '#8b5cf6', world: '#10b981' };
const AREA_BLURB = {
  math: 'Count, add, take away and find the biggest number.',
  words: 'Letters, sounds, rhymes and picture words.',
  world: 'Colours, animals, living things and our senses.',
};

const card = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '1.5rem' };
const bigButton = (color) => ({ background: color, color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem 1.8rem', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer' });

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
function speak(text) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

const stars = (n) => '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

// ── Daily check-in ──────────────────────────────────────────────────────────
function CheckIn({ checkIn, message, onChoose, saving }) {
  const [changing, setChanging] = useState(false);
  if (checkIn && !changing) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.5rem' }} aria-hidden="true">{checkIn.emoji}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>Today you feel: {checkIn.label}</div>
          <div style={{ color: '#64748b' }}>{message || 'Thanks for checking in!'}</div>
        </div>
        <button type="button" onClick={() => setChanging(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>
          Change
        </button>
      </div>
    );
  }
  return (
    <div style={card}>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', color: '#1e293b' }}>How do you feel about learning today?</h2>
      <p style={{ margin: '0 0 1rem', color: '#64748b' }}>Tap a face. There is no wrong answer.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            disabled={saving}
            onClick={async () => { await onChoose(mood.id); setChanging(false); }}
            style={{ background: checkIn?.mood === mood.id ? '#eef2ff' : '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}
          >
            <div style={{ fontSize: '2.4rem' }} aria-hidden="true">{mood.emoji}</div>
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── One practice round ──────────────────────────────────────────────────────
function PracticeRound({ round, onFinish, onQuit }) {
  const color = AREA_COLORS[round.category] || '#f59e0b';
  const [index, setIndex] = useState(0);
  const [wrongPicks, setWrongPicks] = useState([]);
  const [solved, setSolved] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hidden, setHidden] = useState(null);   // option removed by the hint
  const [saving, setSaving] = useState(false);
  const answers = useRef([]);
  const startedAt = useRef(Date.now());

  const question = round.questions[index];
  const last = index === round.questions.length - 1;

  const pick = (option) => {
    if (solved || wrongPicks.includes(option) || option === hidden) return;
    const record = answers.current[index] || { choice: option, tries: 0, hint_used: hintShown, seconds: 0 };
    record.tries += 1;
    if (option === question.answer) {
      record.seconds = Math.round((Date.now() - startedAt.current) / 1000);
      setSolved(true);
    } else {
      setWrongPicks((prev) => [...prev, option]);
    }
    answers.current[index] = record;
  };

  const showHint = () => {
    setHintShown(true);
    if (answers.current[index]) answers.current[index].hint_used = true;
    // Take away one wrong answer the student has not tried yet
    const wrong = question.options.map((_, i) => i).filter((i) => i !== question.answer && !wrongPicks.includes(i));
    if (wrong.length > 1) setHidden(wrong[0]);
  };

  const next = async () => {
    if (!last) {
      setIndex(index + 1);
      setWrongPicks([]);
      setSolved(false);
      setHintShown(false);
      setHidden(null);
      startedAt.current = Date.now();
      return;
    }
    setSaving(true);
    await onFinish(answers.current.map((a) => ({ ...a, hint_used: Boolean(a?.hint_used) })));
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
        <span>{round.emoji} {round.title}</span>
        <span>Question {index + 1} of {round.questions.length}</span>
      </div>
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ width: `${((index + (solved ? 1 : 0)) / round.questions.length) * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>

      <div style={{ ...card, border: `2px solid ${color}30`, textAlign: 'center' }}>
        <div style={{ fontSize: question.visual.length > 12 ? '2rem' : '3.5rem', lineHeight: 1.3, marginBottom: '0.75rem', wordBreak: 'break-word' }} aria-hidden="true">
          {question.visual}
        </div>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: '0 0 1.25rem' }}>{question.prompt}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {question.options.map((option, i) => {
            const isWrong = wrongPicks.includes(i);
            const isRight = solved && i === question.answer;
            const gone = i === hidden && !solved;
            return (
              <button
                key={`${index}-${i}`}
                type="button"
                onClick={() => pick(i)}
                disabled={gone || isWrong || solved}
                aria-label={gone ? `${option} (taken away by the hint)` : option}
                style={{
                  padding: '1rem', fontSize: '1.4rem', fontWeight: 700, borderRadius: 14, cursor: gone || isWrong || solved ? 'default' : 'pointer',
                  background: isRight ? '#dcfce7' : isWrong ? '#fee2e2' : '#f8fafc',
                  border: `3px solid ${isRight ? '#16a34a' : isWrong ? '#fca5a5' : '#e2e8f0'}`,
                  color: isRight ? '#166534' : isWrong ? '#991b1b' : '#1e293b',
                  opacity: gone ? 0.25 : 1,
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div aria-live="polite" style={{ minHeight: '1.6rem', fontWeight: 700, marginBottom: '0.75rem', color: solved ? '#166534' : '#b45309' }}>
          {solved ? '🎉 Yes! Well done!' : wrongPicks.length > 0 ? 'Not quite - try again! 💪' : ''}
        </div>
        {hintShown && !solved && (
          <div style={{ background: '#fef9c3', borderRadius: 10, padding: '0.6rem 0.9rem', marginBottom: '0.75rem', color: '#92400e' }}>
            💡 {question.hint}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {canSpeak() && (
            <button type="button" onClick={() => speak(`${question.prompt} ${question.options.join(', ')}`)} style={{ ...bigButton('#e2e8f0'), color: '#1e293b' }}>
              🔊 Read to me
            </button>
          )}
          {!solved && !hintShown && (
            <button type="button" onClick={showHint} style={{ ...bigButton('#fef3c7'), color: '#92400e' }}>💡 Hint</button>
          )}
          {solved && (
            <button type="button" onClick={next} disabled={saving} style={bigButton(color)}>
              {saving ? '⏳ Saving...' : last ? 'See my stars ⭐' : 'Next →'}
            </button>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button type="button" onClick={onQuit} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          ← Stop and go back
        </button>
      </div>
    </div>
  );
}

// ── Results ─────────────────────────────────────────────────────────────────
function RoundResults({ result, round, onAgain, onHome }) {
  const color = AREA_COLORS[round.category] || '#f59e0b';
  const tricky = (result.review || []).filter((r) => !r.is_correct);
  return (
    <div style={{ ...card, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2.6rem', letterSpacing: 4 }} aria-label={`${result.stars} of 3 stars`}>{stars(result.stars)}</div>
      <h2 style={{ fontSize: '1.7rem', color: '#1e293b', margin: '0.5rem 0' }}>
        {result.stars === 3 ? 'Amazing!' : result.stars === 2 ? 'Great work!' : 'Good practice!'}
      </h2>
      <p style={{ color: '#475569', fontSize: '1.1rem', margin: 0 }}>
        {result.correct} of {result.total} right first time
      </p>
      <div style={{ background: '#fef9c3', borderRadius: 12, padding: '0.8rem', margin: '1rem 0', fontWeight: 700, color: '#92400e' }}>
        {result.xp_earned > 0 ? `⭐ +${result.xp_earned} XP earned!` : '⭐ Daily practice XP reached - practising still helps you learn!'}
      </div>
      {tricky.length > 0 && (
        <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 12, padding: '0.8rem 1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>Let's remember these:</div>
          {tricky.map((r) => (
            <div key={r.prompt} style={{ padding: '0.35rem 0', borderTop: '1px solid #e2e8f0', color: '#374151' }}>
              {r.prompt} <strong style={{ color: '#166534' }}>→ {r.correct_answer}</strong>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={onAgain} style={bigButton(color)}>🔄 Play again</button>
        <button type="button" onClick={onHome} style={{ ...bigButton('#f1f5f9'), color: '#1e293b', border: '2px solid #e2e8f0' }}>Choose another</button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
function PracticePage() {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [areas, setAreas] = useState([]);
  const [today, setToday] = useState(null);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [round, setRound] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHome = useCallback(async () => {
    const [areasRes, todayRes] = await Promise.all([
      api.get('/activities/practice/areas').catch(() => ({ data: { areas: [] } })),
      api.get('/activities/today').catch(() => ({ data: null })),
    ]);
    setAreas(areasRes.data?.areas || []);
    setToday(todayRes.data);
    setLoading(false);
  }, []);

  const startRound = useCallback(async (category) => {
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/activities/practice/${category}`);
      setRound(res.data);
    } catch (_) {
      setError('Could not load a practice round. Please try again.');
    }
  }, []);

  useEffect(() => {
    loadHome();
    const area = searchParams.get('area');
    if (area) startRound(area);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseMood = async (mood) => {
    setSavingCheckIn(true);
    try {
      const res = await api.post('/activities/check-in', { mood });
      setCheckInMessage(res.data.message);
      setToday((prev) => ({ ...(prev || {}), check_in: res.data.check_in }));
    } catch (_) {
      setError('Could not save your check-in. Please try again.');
    } finally {
      setSavingCheckIn(false);
    }
  };

  const finishRound = async (answers) => {
    try {
      const res = await api.post('/activities/practice', { category: round.category, seed: round.seed, answers });
      setResult(res.data);
      refreshUser?.();
    } catch (_) {
      setError('Could not save your answers. Please try again.');
    }
  };

  const goHome = () => {
    setRound(null);
    setResult(null);
    loadHome();
  };

  if (loading && !round) {
    return <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>⏳ Loading practice...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {error && (
        <div role="alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fecaca', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {round && result && (
        <RoundResults result={result} round={round} onAgain={() => startRound(round.category)} onHome={goHome} />
      )}
      {round && !result && (
        <PracticeRound key={round.seed} round={round} onFinish={finishRound} onQuit={goHome} />
      )}

      {!round && (
        <>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem' }}>🎯 Practice Time</h1>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
            Short rounds of 5 questions. Take your time - you can use a hint and try again.
          </p>

          <CheckIn checkIn={today?.check_in} message={checkInMessage} onChoose={chooseMood} saving={savingCheckIn} />

          <h2 style={{ fontSize: '1.3rem', color: '#1e293b', margin: '1.75rem 0 0.75rem' }}>Choose what to practise</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {areas.map((area) => {
              const color = AREA_COLORS[area.id] || '#f59e0b';
              return (
                <div key={area.id} style={{ ...card, borderTop: `6px solid ${color}`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '2.8rem' }} aria-hidden="true">{area.emoji}</div>
                  <h3 style={{ margin: '0.3rem 0', color: '#1e293b' }}>{area.title}</h3>
                  <p style={{ color: '#64748b', margin: '0 0 0.75rem', flex: 1 }}>{AREA_BLURB[area.id]}</p>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                    {typeof area.accuracy_week === 'number'
                      ? `This week: ${Math.round(area.accuracy_week)}% right first time`
                      : 'Not tried this week'}
                  </div>
                  <button type="button" onClick={() => startRound(area.id)} style={bigButton(color)} aria-label={`Start ${area.title}`}>
                    ▶ Start
                  </button>
                </div>
              );
            })}
            <div style={{ ...card, borderTop: '6px solid #f59e0b', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '2.8rem' }} aria-hidden="true">🎮</div>
              <h3 style={{ margin: '0.3rem 0', color: '#1e293b' }}>Learning Games</h3>
              <p style={{ color: '#64748b', margin: '0 0 0.75rem', flex: 1 }}>Maths, colours, memory, stories and drawing.</p>
              <Link to="/student-dashboard" style={{ ...bigButton('#f59e0b'), textAlign: 'center', textDecoration: 'none' }}>▶ Play</Link>
            </div>
          </div>

          {today?.challenges && (
            <div style={{ ...card, marginTop: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 0.75rem' }}>
                ⭐ Today's challenges: {today.done} of {today.total} done
              </h2>
              {today.challenges.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', color: c.done ? '#166534' : '#374151', fontWeight: 600 }}>
                  <span aria-hidden="true">{c.done ? '✅' : '⬜'}</span> {c.label}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PracticePage;
