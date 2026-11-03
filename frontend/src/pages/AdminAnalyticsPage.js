import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader, StatCard, StatGrid, Section, LoadState, S, apiError } from '../components/admin/AdminUI';

const RISK = [
  ['critical', 'Critical', '#dc2626'],
  ['high', 'High', '#ea580c'],
  ['moderate', 'Moderate', '#d97706'],
  ['moderate-low', 'Moderate-low', '#65a30d'],
  ['low', 'Low', '#16a34a'],
  ['new', 'New (no data yet)', '#2563eb'],
];
const OUTCOMES = [
  ['improved', 'Improved', '#16a34a'],
  ['unchanged', 'Unchanged', '#d97706'],
  ['needs_support', 'Needs more support', '#dc2626'],
];

/** Horizontal bars; `rows` = [{ label, value, color }]. */
export function Bars({ rows, emptyText = 'No data yet.', unit = '' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => !r.value)) return <p style={S.muted}>{emptyText}</p>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 200px) 1fr 48px', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{r.label}</span>
          <div style={{ height: 12, background: '#f1f5f9', borderRadius: 99 }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: r.color || '#6366f1', borderRadius: 99 }} />
          </div>
          <strong style={{ fontSize: 13, textAlign: 'right' }}>{r.value}{unit}</strong>
        </div>
      ))}
    </div>
  );
}

/** Engagement, learning and support-plan outcomes across the platform. */
export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, engagementRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/ml/engagement/statistics').catch(() => null),
      ]);
      setOverview(overviewRes.data.data);
      setEngagement(engagementRes?.data?.data || null);
    } catch (e) {
      setError(apiError(e, 'Could not load analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const risk = engagement?.risk_breakdown || {};
  const outcomes = overview?.support_plans?.outcomes || {};

  return (
    <div style={S.page}>
      <PageHeader
        icon="📊"
        title="Analytics"
        subtitle="How engaged students are, which lessons are used and whether support plans help."
        actions={<button type="button" onClick={load} style={S.secondaryBtn}>🔄 Refresh</button>}
      />

      <LoadState loading={loading} error={error} onRetry={load}>
        {overview && (
          <>
            <StatGrid>
              <StatCard icon="📈" label="Engagement rate" color="#0284c7"
                value={engagement ? `${Math.round(engagement.engagement_rate || 0)}%` : '—'}
                hint="of students the model could assess" />
              <StatCard icon="⚠️" label="At risk" value={engagement?.disengaged_users ?? '—'} color="#dc2626" to="/teacher/ml-reports" />
              <StatCard icon="📚" label="Lessons completed" value={overview.learning.lessons_completed} color="#16a34a" />
              <StatCard icon="🎯" label="Average quiz score" color="#7c3aed"
                value={overview.learning.avg_quiz_score == null ? '—' : `${overview.learning.avg_quiz_score}%`} />
            </StatGrid>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              <Section title="🧠 Students by ML risk level" actions={<Link to="/teacher/ml-insights" style={S.secondaryBtn}>About the model</Link>}>
                {engagement ? (
                  <Bars rows={RISK.map(([key, label, color]) => ({ label, value: risk[key] || 0, color }))} emptyText="No students yet." />
                ) : (
                  <p style={S.muted}>Engagement data is not available right now.</p>
                )}
              </Section>

              <Section title="🧩 Support plan outcomes" actions={<Link to="/teacher/support-plans" style={S.secondaryBtn}>Open plans</Link>}>
                <Bars rows={OUTCOMES.map(([key, label, color]) => ({ label, value: outcomes[key] || 0, color }))}
                  emptyText="No plans have been reviewed yet." />
                <p style={{ ...S.muted, marginTop: 10 }}>
                  {overview.support_plans.active} active plan(s) waiting for review.
                </p>
              </Section>
            </div>

            <Section title="📚 Lesson completion">
              <Bars rows={overview.lessons.map((l) => ({ label: l.title, value: l.completions }))} emptyText="No lessons completed yet." />
            </Section>
          </>
        )}
      </LoadState>
    </div>
  );
}
