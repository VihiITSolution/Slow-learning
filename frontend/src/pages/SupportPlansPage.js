import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { PlanSuggestion, ReviewSummary, aiButtonStyle, aiErrorText, useAIStatus } from '../components/ai/AIAssist';
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
const daysFromToday = (days) => {
  const d = new Date();
  return localISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
};
const emptyForm = (studentId = '') => ({
  student_id: studentId,
  // No default strategy/outcome: teachers must choose one explicitly so a
  // forgotten default is never recorded as research data.
  intervention_type: '',
  custom_intervention: '',
  goal: '',
  notes: '',
  review_date: defaultReviewDate(),
});
const emptyReviewForm = () => ({ outcome: '', outcome_notes: '' });

const planDate = (plan) => (plan.review_date || '').slice(0, 10);
const reviewDue = (plan) => {
  if (plan.status !== 'active' || !plan.review_date) return null;
  const date = planDate(plan);
  const today = todayISODate();
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return null;
};
const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
};

const labelFor = (value, options) => options.find(([key]) => key === value)?.[1] || value;
const signed = (value) => `${value > 0 ? '+' : ''}${value || 0}`;
const percent = (value) => (typeof value === 'number' ? `${Math.round(value)}%` : 'none yet');
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
        {comparison.practice_accuracy && (
          <div className="comparison-item" key="practice_accuracy">
            <span>🎯 Practice accuracy</span>
            <strong>{percent(comparison.practice_accuracy.baseline)} → {percent(comparison.practice_accuracy.review)}</strong>
            {comparison.practice_accuracy.change === null || comparison.practice_accuracy.change === undefined
              ? <small>—</small>
              : <small className={comparison.practice_accuracy.change >= 0 ? 'positive' : 'negative'}>{signed(comparison.practice_accuracy.change)} pts</small>}
          </div>
        )}
      </div>
      <div className="comparison-statuses">
        <span>Engagement: <strong>{engagementLabel(comparison.engagement?.baseline)} → {engagementLabel(comparison.engagement?.review)}</strong></span>
        <span>ML risk: <strong>{comparison.risk_level?.baseline || '—'} → {comparison.risk_level?.review || '—'}</strong></span>
      </div>
    </div>
  );
}

function BaselineSummary({ snapshot }) {
  if (!snapshot || Object.keys(snapshot).length === 0) return null;
  return (
    <p className="plan-baseline">
      <strong>Baseline:</strong> ⚡ {snapshot.total_xp ?? 0} XP · 📚 {snapshot.lessons_completed ?? 0} lessons ·
      {' '}📝 {snapshot.quizzes_taken ?? 0} quizzes · ⏱ {snapshot.total_time_spent ?? 0} min ·
      {' '}🔥 {snapshot.current_streak ?? 0}-day streak · ML: {engagementLabel(snapshot.engaged)}
      {snapshot.risk_level ? ` (${snapshot.risk_level} risk)` : ''}
    </p>
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
  const [editingPlan, setEditingPlan] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const aiStatus = useAIStatus();
  const [planAI, setPlanAI] = useState(null);        // AI plan suggestion being shown
  const [usedPlanAI, setUsedPlanAI] = useState(null); // suggestion id the form was filled from
  const [reviewAI, setReviewAI] = useState(null);
  const [reviewAIAdded, setReviewAIAdded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const reviewFormRef = useRef(null);
  const planFormRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Load students separately so a failure there never hides the plan list.
      api.get('/auth/students')
        .then(response => setStudents(response.data?.students || []))
        .catch(() => setStudents([]));
      const plansResponse = await api.get('/support-plans', { params: { status: filter } });
      setPlans(plansResponse.data.data || []);
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
  useEffect(() => {
    if (editingPlan) planFormRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [editingPlan]);

  const closePlanForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setForm(emptyForm());
    setPlanAI(null);
    setUsedPlanAI(null);
    if (searchParams.get('studentId')) setSearchParams({});
  };

  const openCreateForm = () => {
    setMessage(null);
    setEditingPlan(null);
    setReviewingPlan(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (plan) => {
    setMessage(null);
    setReviewingPlan(null);
    setEditingPlan(plan);
    setForm({
      student_id: String(plan.student_id),
      intervention_type: plan.intervention_type,
      custom_intervention: plan.custom_intervention || '',
      goal: plan.goal || '',
      notes: plan.notes || '',
      review_date: planDate(plan),
    });
    setShowForm(true);
  };

  const openReviewForm = (plan) => {
    setMessage(null);
    closePlanForm();
    setReviewingPlan(plan);
    setReviewForm(emptyReviewForm());
    setReviewAI(null);
    setReviewAIAdded(false);
  };

  const suggestPlan = async () => {
    if (!form.student_id) {
      setMessage({ type: 'error', text: 'Choose a student first, then ask for a suggestion.' });
      return;
    }
    setAiLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/ai/support-plan/suggest', { student_id: Number(form.student_id) });
      setPlanAI(res.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: aiErrorText(error) });
    } finally {
      setAiLoading(false);
    }
  };

  const usePlanSuggestion = () => {
    const s = planAI.suggestion;
    const strategies = s.strategies.map(item => `- ${item}`).join('\n');
    setForm(current => ({
      ...current,
      intervention_type: s.intervention_type,
      custom_intervention: s.custom_intervention || '',
      goal: s.goal,
      review_date: daysFromToday(s.review_in_days),
      notes: [current.notes.trim(), `Strategies:\n${strategies}`].filter(Boolean).join('\n\n'),
    }));
    setUsedPlanAI(planAI.suggestion_id);
    setPlanAI(null);
  };

  const summariseReview = async () => {
    setAiLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/ai/support-plans/${reviewingPlan.id}/review-summary`);
      setReviewAI(res.data.data);
      setReviewAIAdded(false);
    } catch (error) {
      setMessage({ type: 'error', text: aiErrorText(error) });
    } finally {
      setAiLoading(false);
    }
  };

  const addReviewSummaryToNotes = () => {
    const s = reviewAI.suggestion;
    setReviewForm(current => ({
      ...current,
      outcome_notes: [current.outcome_notes.trim(), `${s.summary} Next step: ${s.next_step}`].filter(Boolean).join('\n\n'),
    }));
    setReviewAIAdded(true);
    api.post(`/ai/suggestions/${reviewAI.suggestion_id}/used`).catch(() => {});
  };

  const studentOptions = useMemo(() => students.map(student => ({ id: String(student.id), name: student.username })), [students]);

  const handleSavePlan = async (event) => {
    event.preventDefault();
    const problem = !form.student_id ? 'Please choose a student.'
      : !form.intervention_type ? 'Please choose a support strategy.'
        : form.intervention_type === 'other' && !form.custom_intervention.trim() ? 'Please describe the custom strategy.'
          : !form.goal.trim() ? 'Please enter a learning goal.'
            : !form.review_date ? 'Please choose a review date.' : null;
    if (problem) {
      setMessage({ type: 'error', text: problem });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (editingPlan) {
        const { student_id, ...changes } = form;
        await api.put(`/support-plans/${editingPlan.id}`, changes);
        setMessage({ type: 'success', text: 'Support plan updated.' });
      } else {
        await api.post('/support-plans', { ...form, student_id: Number(form.student_id), ai_suggestion_id: usedPlanAI || undefined });
        setMessage({ type: 'success', text: 'Support plan created and baseline metrics captured.' });
        if (filter === 'reviewed') setFilter('active');
      }
      closePlanForm();
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || (editingPlan ? 'Could not update the support plan.' : 'Could not create the support plan.') });
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();
    if (!reviewingPlan) return;
    if (!reviewForm.outcome) {
      setMessage({ type: 'error', text: 'Please choose an outcome before recording the review.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.post(`/support-plans/${reviewingPlan.id}/review`, reviewForm);
      setMessage({ type: 'success', text: 'Outcome recorded and review metrics captured.' });
      setReviewingPlan(null);
      setReviewForm(emptyReviewForm());
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
          <button className="primary-button" onClick={() => (showForm ? closePlanForm() : openCreateForm())}>{showForm ? 'Close form' : '+ New support plan'}</button>
        </div>
      </header>

      {message && <div className={`plan-message ${message.type}`}>{message.text}</div>}

      {showForm && (
        <form className="plan-form" onSubmit={handleSavePlan} ref={planFormRef} noValidate>
          <h2>{editingPlan ? `Edit support plan for ${editingPlan.student_name}` : 'Create a support plan'}</h2>
          <div className="form-grid">
            <label>Student
              <select value={form.student_id} onChange={e => { setForm({ ...form, student_id: e.target.value }); setPlanAI(null); setUsedPlanAI(null); }} required disabled={Boolean(editingPlan)}>
                <option value="">Select a student</option>
                {studentOptions.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
            </label>
            <label>Support strategy
              <select value={form.intervention_type} onChange={e => setForm({ ...form, intervention_type: e.target.value })} required>
                <option value="">Select a strategy</option>
                {INTERVENTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {form.intervention_type === 'other' && <label>Custom strategy
              <input value={form.custom_intervention} onChange={e => setForm({ ...form, custom_intervention: e.target.value })} required placeholder="Describe the strategy" />
            </label>}
            <label>Review date
              <input type="date" value={form.review_date} min={editingPlan && planDate(editingPlan) < todayISODate() ? planDate(editingPlan) : todayISODate()} onChange={e => setForm({ ...form, review_date: e.target.value })} required />
            </label>
          </div>
          {!editingPlan && (
            <div className="ai-row">
              <button type="button" style={aiButtonStyle} onClick={suggestPlan} disabled={aiLoading || !form.student_id}>
                {aiLoading ? '⏳ Thinking…' : '✨ Suggest a plan with AI'}
              </button>
              <span className="ai-hint">
                {!form.student_id ? 'Choose a student first.' : aiStatus && !aiStatus.enabled ? 'AI key not set - you will get a basic suggestion.' : 'Uses this student\'s numbers only - no names are shared.'}
              </span>
              {usedPlanAI && <span className="ai-used">✨ Filled from the AI suggestion - check and edit before saving.</span>}
            </div>
          )}
          {planAI && <PlanSuggestion result={planAI} labelFor={value => labelFor(value, INTERVENTIONS)} onUse={usePlanSuggestion} onDismiss={() => setPlanAI(null)} />}
          <label>Learning goal
            <textarea value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} required placeholder="What improvement do you expect to see?" />
          </label>
          <label>Teacher notes <span>(optional)</span>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Context, materials, or instructions for the strategy" />
          </label>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={closePlanForm}>Cancel</button>
            <button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingPlan ? 'Save changes' : 'Create plan & capture baseline'}</button>
          </div>
        </form>
      )}

      {reviewingPlan && (
        <form className="review-form" onSubmit={handleReview} ref={reviewFormRef} noValidate>
          <div><h2>Review plan for {reviewingPlan.student_name}</h2><p>{reviewingPlan.goal}</p></div>
          <div className="ai-row">
            <button type="button" style={aiButtonStyle} onClick={summariseReview} disabled={aiLoading}>
              {aiLoading ? '⏳ Thinking…' : '✨ Summarise progress with AI'}
            </button>
            <span className="ai-hint">Explains the before and after numbers. You still choose the outcome.</span>
          </div>
          {reviewAI && <ReviewSummary result={reviewAI} outcomeLabel={value => labelFor(value, OUTCOMES)} onAddToNotes={addReviewSummaryToNotes} added={reviewAIAdded} />}
          <label>Outcome
            <select value={reviewForm.outcome} onChange={e => setReviewForm({ ...reviewForm, outcome: e.target.value })} required>
              <option value="">Select an outcome</option>
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
                <div><h3>{plan.student_name || `Student #${plan.student_id}`}</h3><p>Created by {plan.teacher_name} · Review {formatDate(plan.review_date)}</p></div>
                <div className="plan-badges">
                  {reviewDue(plan) === 'overdue' && <span className="due-badge overdue">Review overdue</span>}
                  {reviewDue(plan) === 'today' && <span className="due-badge today">Review due today</span>}
                  {plan.ai_assisted && <span className="ai-badge" title="Built from an AI suggestion, then checked by the teacher">✨ AI-assisted</span>}
                  <span className={`status-badge ${plan.status}`}>{plan.status}</span>{plan.outcome && <span className={`outcome-badge ${plan.outcome}`}>{labelFor(plan.outcome, OUTCOMES)}</span>}</div>
              </div>
              <div className="strategy">{labelFor(plan.intervention_type, INTERVENTIONS)}{plan.custom_intervention ? `: ${plan.custom_intervention}` : ''}</div>
              <p className="plan-goal"><strong>Goal:</strong> {plan.goal}</p>
              {plan.notes && <p className="plan-notes"><strong>Notes:</strong> {plan.notes}</p>}
              {plan.outcome_notes && <p className="plan-notes"><strong>Outcome notes:</strong> {plan.outcome_notes}</p>}
              {plan.status === 'reviewed' && <MetricComparison comparison={plan.metric_comparison} />}
              {plan.status === 'active' && <BaselineSummary snapshot={plan.baseline_snapshot} />}
              {plan.status === 'active' && canManage(plan) && (
                <div className="plan-actions">
                  <button className="review-button" onClick={() => openReviewForm(plan)}>Review outcome</button>
                  <button className="secondary-button" onClick={() => openEditForm(plan)} aria-label={`Edit plan for ${plan.student_name}`}>Edit plan</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
