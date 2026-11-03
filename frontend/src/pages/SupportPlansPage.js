import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../styles/SupportPlans.css';

const INTERVENTIONS = [
  ['visual_support', 'Visual support'],
  ['shorter_sessions', 'Shorter learning sessions'],
  ['interactive_game', 'Interactive game'],
  ['one_to_one_support', 'One-to-one support'],
  ['peer_support', 'Peer support'],
  ['extra_practice', 'Extra practice'],
  ['other', 'Other / custom strategy'],
];

const OUTCOMES = [
  ['improved', 'Improved'],
  ['unchanged', 'Unchanged'],
  ['needs_support', 'Needs more support'],
];

// Local calendar dates (toISOString() is UTC, which is a day behind in
// Sri Lanka between midnight and 05:30).
const localISODate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');
export const defaultReviewDate = (from = new Date()) => localISODate(
  new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
);
const todayISODate = () => localISODate(new Date());
const emptyForm = (studentId = '') => ({
  student_id: studentId,
  intervention_type: 'visual_support',
  custom_intervention: '',
  goal: '',
  notes: '',
  review_date: defaultReviewDate(),
});

const labelFor = (value, options) => options.find(([key]) => key === value)?.[1] || value;
const signed = (value) => `${value > 0 ? '+' : ''}${value || 0}`;
const engagementLabel = (engaged) => (engaged === true ? 'Engaged' : engaged === false ? 'At risk' : 'Unknown');

function MetricComparison({ comparison }) {
  if (!comparison) return null;
  const metrics = [
    ['total_xp', '⚡ XP'],
    ['lessons_completed', '📚 Lessons'],
    ['quizzes_taken', '📝 Quizzes'],
    ['total_time_spent', '⏱ Learning minutes'],
    ['current_streak', '🔥 Streak'],
  ];
  return (
    <div className="comparison-section">
      <h4>Baseline vs review</h4>
      <div className="comparison-grid">
        {metrics.map(([key, label]) => {
          const metric = comparison[key] || {};
          return (
            <div className="comparison-item" key={key}>
              <span>{label}</span>
              <strong>{metric.baseline ?? 0} → {metric.review ?? 0}</strong>
              <small className={(metric.change || 0) >= 0 ? 'positive' : 'negative'}>{signed(metric.change)}</small>
            </div>
          );
        })}
      </div>
      <div className="comparison-statuses">
        <span>Engagement: <strong>{engagementLabel(comparison.engagement?.baseline)} → {engagementLabel(comparison.engagement?.review)}</strong></span>
        <span>ML risk: <strong>{comparison.risk_level?.baseline || '—'} → {comparison.risk_level?.review || '—'}</strong></span>
      </div>
    </div>
  );
}

export default function SupportPlansPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStudentId = searchParams.get('studentId') || '';
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState(() => emptyForm(selectedStudentId));
  const [showForm, setShowForm] = useState(Boolean(selectedStudentId));
  const [reviewingPlan, setReviewingPlan] = useState(null);
  const [reviewForm, setReviewForm] = useState({ outcome: 'improved', outcome_notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const reviewFormRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansResponse, studentsResponse] = await Promise.all([
        api.get('/support-plans', { params: { status: filter } }),
        api.get('/auth/students'),
      ]);
      setPlans(plansResponse.data.data || []);
      setStudents(studentsResponse.data.students || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Could not load support plans.' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (selectedStudentId) {
      setForm(current => ({ ...current, student_id: selectedStudentId }));
      setShowForm(true);
    }
  }, [selectedStudentId]);

  // The review form renders above the list, so bring it into view when a
  // teacher clicks "Review outcome" further down the page.
  useEffect(() => {
    if (reviewingPlan) reviewFormRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [reviewingPlan]);

  const studentOptions = useMemo(() => students.map(student => ({ id: String(student.id), name: student.username })), [students]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/support-plans', { ...form, student_id: Number(form.student_id) });
      setMessage({ type: 'success', text: 'Support plan created and baseline metrics captured.' });
      setForm(emptyForm());
      setShowForm(false);
      setSearchParams({});
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Could not create the support plan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();
    if (!reviewingPlan) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post(`/support-plans/${reviewingPlan.id}/review`, reviewForm);
      setMessage({ type: 'success', text: 'Outcome recorded and review metrics captured.' });
      setReviewingPlan(null);
      setReviewForm({ outcome: 'improved', outcome_notes: '' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Could not record the outcome.' });
    } finally {
      setSaving(false);
    }
  };

  const exportReviewedPlans = async () => {
    try {
      const response = await api.get('/support-plans/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'reviewed-support-plans.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Could not download the research export.' });
    }
  };

  const canManage = (plan) => user?.role === 'admin' || Number(plan.teacher_id) === Number(user?.id);

  return (
    <div className="support-plans-page">
      <header className="support-plans-header">
        <div>
          <h1>🧩 Teacher Support Plans</h1>
          <p>Plan personalized support, then measure what changed.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={exportReviewedPlans}>⬇ Export reviewed CSV</button>
          <button className="primary-button" onClick={() => setShowForm(value => !value)}>{showForm ? 'Close form' : '+ New support plan'}</button>
        </div>
      </header>

      {message && <div className={`plan-message ${message.type}`}>{message.text}</div>}

      {showForm && (
        <form className="plan-form" onSubmit={handleCreate}>
          <h2>Create a support plan</h2>
          <div className="form-grid">
            <label>Student
              <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required>
                <option value="">Select a student</option>
                {studentOptions.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
            </label>
            <label>Support strategy
              <select value={form.intervention_type} onChange={e => setForm({ ...form, intervention_type: e.target.value })}>
                {INTERVENTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {form.intervention_type === 'other' && <label>Custom strategy
              <input value={form.custom_intervention} onChange={e => setForm({ ...form, custom_intervention: e.target.value })} required placeholder="Describe the strategy" />
            </label>}
            <label>Review date
              <input type="date" value={form.review_date} min={todayISODate()} onChange={e => setForm({ ...form, review_date: e.target.value })} required />
            </label>
          </div>
          <label>Learning goal
            <textarea value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} required placeholder="What improvement do you expect to see?" />
          </label>
          <label>Teacher notes <span>(optional)</span>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Context, materials, or instructions for the strategy" />
          </label>
          <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Create plan & capture baseline'}</button></div>
        </form>
      )}

      {reviewingPlan && (
        <form className="review-form" onSubmit={handleReview} ref={reviewFormRef}>
          <div><h2>Review plan for {reviewingPlan.student_name}</h2><p>{reviewingPlan.goal}</p></div>
          <label>Outcome
            <select value={reviewForm.outcome} onChange={e => setReviewForm({ ...reviewForm, outcome: e.target.value })}>
              {OUTCOMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Outcome notes
            <textarea value={reviewForm.outcome_notes} onChange={e => setReviewForm({ ...reviewForm, outcome_notes: e.target.value })} placeholder="What did you observe?" />
          </label>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setReviewingPlan(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Recording…' : 'Record outcome'}</button></div>
        </form>
      )}

      <div className="plans-toolbar">
        <div className="filter-tabs">
          {[['active', 'Active'], ['reviewed', 'Reviewed'], ['all', 'All']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'selected' : ''}>{label}</button>)}
        </div>
        <button className="secondary-button" onClick={fetchData}>↻ Refresh</button>
      </div>

      {loading ? <div className="plans-empty">Loading support plans…</div> : plans.length === 0 ? (
        <div className="plans-empty"><div>🧩</div>No {filter === 'all' ? '' : filter} support plans yet.</div>
      ) : (
        <div className="plans-list">
          {plans.map(plan => (
            <article className="support-plan-card" key={plan.id}>
              <div className="plan-card-top">
                <div><h3>{plan.student_name}</h3><p>Created by {plan.teacher_name} · Review {new Date(plan.review_date).toLocaleDateString()}</p></div>
                <div className="plan-badges"><span className={`status-badge ${plan.status}`}>{plan.status}</span>{plan.outcome && <span className={`outcome-badge ${plan.outcome}`}>{labelFor(plan.outcome, OUTCOMES)}</span>}</div>
              </div>
              <div className="strategy">{labelFor(plan.intervention_type, INTERVENTIONS)}{plan.custom_intervention ? `: ${plan.custom_intervention}` : ''}</div>
              <p className="plan-goal"><strong>Goal:</strong> {plan.goal}</p>
              {plan.notes && <p className="plan-notes"><strong>Notes:</strong> {plan.notes}</p>}
              {plan.outcome_notes && <p className="plan-notes"><strong>Outcome notes:</strong> {plan.outcome_notes}</p>}
              {plan.status === 'reviewed' && <MetricComparison comparison={plan.metric_comparison} />}
              {plan.status === 'active' && canManage(plan) && <button className="review-button" onClick={() => { setReviewingPlan(plan); setReviewForm({ outcome: 'improved', outcome_notes: '' }); }}>Review outcome</button>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
