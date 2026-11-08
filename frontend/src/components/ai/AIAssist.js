import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Shared pieces for the AI assistant (Google Gemini, with built-in fallbacks).
// The teacher always decides: nothing here saves a plan, an outcome or a
// message until the teacher presses a button to use it.

const AI_PURPLE = '#7c3aed';
const panel = { background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '14px 18px', margin: '12px 0' };
const smallButton = (primary) => ({
  padding: '8px 16px', borderRadius: 8, border: primary ? 'none' : '1.5px solid #ddd6fe', cursor: 'pointer',
  background: primary ? AI_PURPLE : '#fff', color: primary ? '#fff' : AI_PURPLE, fontWeight: 700, fontSize: 13,
});

export const aiButtonStyle = smallButton(true);
export const aiSecondaryButtonStyle = smallButton(false);

let statusPromise = null;
export function resetAIStatusCache() { statusPromise = null; }

/** { enabled, model, privacy_note } - fetched once per page load. */
export function useAIStatus() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!statusPromise) {
      statusPromise = api.get('/ai/status').then(res => res.data.data).catch(() => ({ enabled: false }));
    }
    statusPromise.then(value => { if (alive) setStatus(value); });
    return () => { alive = false; };
  }, []);
  return status;
}

/** Where a suggestion came from, any problem, and what was shared. */
export function AISource({ result }) {
  if (!result) return null;
  return (
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 700, color: result.source === 'gemini' ? AI_PURPLE : '#475569' }}>
        {result.source === 'gemini' ? `✨ Written by Google Gemini (${result.model})` : '⚙️ Basic built-in suggestion'}
      </span>
      {result.note && <div style={{ color: '#b45309' }}>{result.note}</div>}
      {result.privacy_note && <div>{result.privacy_note}</div>}
    </div>
  );
}

export const aiErrorText = (error) => error?.response?.data?.error || 'The AI assistant could not answer. Please try again.';

// ── Support plan suggestion ────────────────────────────────────────────────
export function PlanSuggestion({ result, labelFor, onUse, onDismiss }) {
  const s = result.suggestion;
  return (
    <div style={panel} role="region" aria-label="AI plan suggestion">
      <div style={{ fontWeight: 800, color: '#4c1d95', marginBottom: 6 }}>✨ Suggested plan</div>
      <div><strong>Support:</strong> {labelFor(s.intervention_type)}{s.custom_intervention ? `: ${s.custom_intervention}` : ''}</div>
      <div style={{ marginTop: 4 }}><strong>Goal:</strong> {s.goal}</div>
      <div style={{ marginTop: 4 }}><strong>Strategies:</strong></div>
      <ul style={{ margin: '2px 0 4px 18px', padding: 0 }}>{s.strategies.map(item => <li key={item}>{item}</li>)}</ul>
      <div><strong>Review in:</strong> {s.review_in_days} days</div>
      <div style={{ marginTop: 4, color: '#475569' }}><strong>Why:</strong> {s.why}</div>
      <AISource result={result} />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" style={smallButton(true)} onClick={onUse}>Use this suggestion</button>
        <button type="button" style={smallButton(false)} onClick={onDismiss}>Dismiss</button>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>You can change anything before saving the plan.</div>
    </div>
  );
}

// ── Review summary ─────────────────────────────────────────────────────────
export function ReviewSummary({ result, outcomeLabel, onAddToNotes, added }) {
  const s = result.suggestion;
  return (
    <div style={panel} role="region" aria-label="AI progress summary">
      <div style={{ fontWeight: 800, color: '#4c1d95', marginBottom: 6 }}>✨ Progress summary</div>
      <p style={{ margin: '0 0 6px' }}>{s.summary}</p>
      {s.improved.length > 0 && <div><strong>Went up:</strong><ul style={{ margin: '2px 0 4px 18px', padding: 0 }}>{s.improved.map(i => <li key={i}>{i}</li>)}</ul></div>}
      {s.watch.length > 0 && <div><strong>Keep watching:</strong><ul style={{ margin: '2px 0 4px 18px', padding: 0 }}>{s.watch.map(i => <li key={i}>{i}</li>)}</ul></div>}
      <div><strong>Suggested outcome:</strong> {outcomeLabel(s.suggested_outcome)} <span style={{ color: '#6b7280', fontSize: 12 }}>(you choose the outcome below)</span></div>
      <div style={{ marginTop: 4 }}><strong>Next step:</strong> {s.next_step}</div>
      <AISource result={result} />
      <button type="button" style={{ ...smallButton(false), marginTop: 10 }} onClick={onAddToNotes} disabled={added}>
        {added ? '✓ Added to review notes' : 'Add to review notes'}
      </button>
    </div>
  );
}

// ── Class summary (ML Class Report) ───────────────────────────────────────
export function AIClassSummary() {
  const status = useAIStatus();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/class-summary');
      setResult(res.data.data);
    } catch (e) {
      setError(aiErrorText(e));
    } finally {
      setLoading(false);
    }
  };

  const s = result?.suggestion;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 24, border: '1.5px solid #ddd6fe', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: '#4c1d95', fontSize: 17 }}>✨ AI Class Summary</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Who to help first, patterns across the class, and who to celebrate.
            {status && !status.enabled && ' (AI key not set - you will get a basic summary.)'}
          </p>
        </div>
        <button type="button" style={smallButton(true)} onClick={run} disabled={loading}>
          {loading ? '⏳ Thinking…' : result ? '🔄 Summarise again' : '✨ Summarise my class'}
        </button>
      </div>
      {error && <div role="alert" style={{ color: '#b91c1c', marginTop: 10 }}>{error}</div>}
      {s && (
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 10px', color: '#1e293b' }}>{s.overview}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>Help first</div>
              {s.priorities.length === 0 ? <div style={{ color: '#64748b', fontSize: 13 }}>No one needs urgent help.</div> : s.priorities.map(p => (
                <div key={p.ref} style={{ fontSize: 13, marginBottom: 8 }}>
                  <strong>{p.username}</strong>: {p.reason}. <span style={{ color: '#475569' }}>{p.action}.</span>
                  {p.student_id && <> <Link to={`/teacher/support-plans?studentId=${p.student_id}`} style={{ color: AI_PURPLE, fontWeight: 600 }}>Create plan</Link></>}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>Patterns</div>
              {s.patterns.length === 0 ? <div style={{ color: '#64748b', fontSize: 13 }}>No clear patterns yet.</div>
                : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{s.patterns.map(p => <li key={p}>{p}</li>)}</ul>}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>Celebrate</div>
              {s.celebrate.length === 0 ? <div style={{ color: '#64748b', fontSize: 13 }}>Keep going - stars are coming!</div> : s.celebrate.map(c => (
                <div key={c.ref} style={{ fontSize: 13, marginBottom: 6 }}><strong>{c.username}</strong>: {c.reason}</div>
              ))}
            </div>
          </div>
          <AISource result={result} />
        </div>
      )}
    </div>
  );
}

// ── Encouragement message (teacher → student) ──────────────────────────────
export function EncouragementComposer({ student, onClose, onSent }) {
  const [draft, setDraft] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    api.post('/ai/encouragement/draft', { student_id: student.user_id })
      .then(res => { if (alive) { setDraft(res.data.data); setText(res.data.data.suggestion.message); } })
      .catch(e => { if (alive) setError(aiErrorText(e)); });
    return () => { alive = false; };
  }, [student.user_id]);

  const send = async () => {
    if (!text.trim()) { setError('Please write a message first.'); return; }
    setSending(true);
    setError('');
    try {
      await api.post('/ai/messages', { student_id: student.user_id, body: text, ai_suggestion_id: draft?.suggestion_id });
      onSent?.();
    } catch (e) {
      setError(aiErrorText(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={panel} role="region" aria-label={`Encouragement for ${student.username}`}>
      <div style={{ fontWeight: 800, color: '#4c1d95', marginBottom: 6 }}>💌 Message to {student.username}</div>
      {!draft && !error && <div style={{ color: '#64748b' }}>⏳ Writing a draft…</div>}
      {draft && (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} rows={3}
            aria-label="Message text"
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1.5px solid #ddd6fe', padding: 10, fontSize: 14, fontFamily: 'inherit' }} />
          <AISource result={draft} />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>The student sees this on their dashboard. Edit it as you like.</div>
        </>
      )}
      {error && <div role="alert" style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" style={smallButton(true)} onClick={send} disabled={!draft || sending}>{sending ? 'Sending…' : 'Send to student'}</button>
        <button type="button" style={smallButton(false)} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── Student dashboard: message from the teacher ────────────────────────────
export function TeacherMessageCard() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/ai/messages/mine')
      .then(res => { if (alive) setMessage(res.data?.data?.messages?.[0] || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!message) return null;
  const markRead = async () => {
    try {
      const res = await api.post(`/ai/messages/${message.id}/read`);
      setMessage(res.data.data);
    } catch (_) { /* keep showing it */ }
  };
  return (
    // A still card (no floating animation) so the button is easy to tap
    <div className="teacher-message-card" style={{
      marginTop: 30, background: '#fff', borderRadius: 25, padding: 30, boxShadow: '0 10px 30px rgba(139, 92, 246, 0.25)',
      border: `5px solid ${message.read ? '#ddd6fe' : '#8b5cf6'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span aria-hidden="true" style={{ fontSize: 34 }}>💌</span>
        <h2 className="page-title" style={{ fontSize: 28, margin: 0 }}>Message from your teacher</h2>
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', margin: '0 0 8px', lineHeight: 1.5 }}>{message.body}</p>
      <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>From {message.teacher_name || 'your teacher'}</p>
      {!message.read && (
        <button type="button" className="btn-primary" style={{ marginTop: 14 }} onClick={markRead}>Got it! 👍</button>
      )}
    </div>
  );
}
