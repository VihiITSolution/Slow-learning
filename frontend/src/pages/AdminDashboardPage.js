import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader, StatCard, StatGrid, Section, RoleBadge, LoadState, S, apiError, timeAgo } from '../components/admin/AdminUI';

/** Admin home: real platform numbers and shortcuts to the admin tools. */
export default function AdminDashboardPage() {
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
      setError(apiError(e, 'Could not load the admin dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const users = overview?.users;
  const learning = overview?.learning;
  const plans = overview?.support_plans;

  return (
    <div style={S.page}>
      <PageHeader
        icon="⚙️"
        title="Admin Dashboard"
        subtitle="An overview of everyone using LearnQuest and how learning is going."
        actions={<button type="button" onClick={load} style={S.secondaryBtn}>🔄 Refresh</button>}
      />

      <LoadState loading={loading} error={error} onRetry={load}>
        {overview && (
          <>
            <StatGrid>
              <StatCard icon="👥" label="Users" value={users.total} to="/admin/users"
                hint={`${users.by_role.student} students · ${users.by_role.teacher} teachers · ${users.by_role.admin} admins`} />
              <StatCard icon="🟢" label="Students active (7 days)" value={users.students_active_week} color="#16a34a"
                hint={`${users.students_active_today} today`} />
              <StatCard icon="📚" label="Lessons completed" value={learning.lessons_completed} color="#0284c7" to="/admin/courses"
                hint={`${learning.active_lessons} active lessons`} />
              <StatCard icon="🎯" label="Average quiz score" color="#7c3aed"
                value={learning.avg_quiz_score == null ? '—' : `${learning.avg_quiz_score}%`}
                hint={`${learning.quiz_attempts} quiz attempts`} />
              <StatCard icon="🧩" label="Support plans" value={plans.active + plans.reviewed} color="#ea580c" to="/teacher/support-plans"
                hint={`${plans.active} active · ${plans.reviewed} reviewed`} />
            </StatGrid>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              <Section
                title="🧠 Student engagement (ML)"
                actions={<Link to="/teacher/ml-reports" style={S.secondaryBtn}>Open class report</Link>}
              >
                {engagement ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center' }}>
                    {[
                      ['Engaged', engagement.engaged_users, '#16a34a'],
                      ['At risk', engagement.disengaged_users, '#dc2626'],
                      ['New', engagement.new_students ?? 0, '#2563eb'],
                      ['Rate', `${Math.round(engagement.engagement_rate || 0)}%`, '#0284c7'],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 6px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                        <div style={S.muted}>{label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={S.muted}>Engagement data is not available right now.</p>
                )}
              </Section>

              <Section title="🆕 Newest accounts" actions={<Link to="/admin/users" style={S.secondaryBtn}>All users</Link>}>
                {overview.recent_users.length === 0 ? (
                  <p style={S.muted}>No accounts yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {overview.recent_users.map((u) => (
                      <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.username} <RoleBadge role={u.role} /></span>
                        <span style={S.muted}>{timeAgo(u.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <Section title="Quick actions">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/admin/users" style={S.secondaryBtn}>👥 Manage users</Link>
                <Link to="/admin/courses" style={S.secondaryBtn}>📚 Lessons &amp; quizzes</Link>
                <Link to="/admin/analytics" style={S.secondaryBtn}>📊 Analytics</Link>
                <Link to="/teacher/support-plans" style={S.secondaryBtn}>🧩 Support plans</Link>
                <Link to="/teacher/ml-insights" style={S.secondaryBtn}>🤖 ML model</Link>
              </div>
            </Section>
          </>
        )}
      </LoadState>
    </div>
  );
}
