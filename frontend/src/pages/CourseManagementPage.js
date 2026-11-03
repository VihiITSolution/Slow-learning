import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader, Section, LoadState, S, apiError } from '../components/admin/AdminUI';

const CATEGORY_ICON = { math: '🔢', english: '🔤', reading: '📖', science: '🔬' };

/** The lesson catalogue with how much each lesson is used (read-only). */
export default function CourseManagementPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/overview');
      setLessons(res.data.data.lessons || []);
    } catch (e) {
      setError(apiError(e, 'Could not load lessons.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxCompletions = Math.max(1, ...lessons.map((l) => l.completions));

  return (
    <div style={S.page}>
      <PageHeader
        icon="📚"
        title="Course Management"
        subtitle="Every lesson, how many students finished it and how they did on its quiz."
        actions={<button type="button" onClick={load} style={S.secondaryBtn}>🔄 Refresh</button>}
      />

      <LoadState loading={loading} error={error} onRetry={load}>
        <Section title={`${lessons.length} lessons`}>
          {lessons.length === 0 ? (
            <p style={{ ...S.muted, textAlign: 'center', padding: 24 }}>No lessons yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Lessons">
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Lesson</th>
                    <th style={S.th}>Difficulty</th>
                    <th style={S.th}>XP</th>
                    <th style={S.th}>Completed by</th>
                    <th style={S.th}>In progress</th>
                    <th style={S.th}>Quiz attempts</th>
                    <th style={S.th}>Avg quiz score</th>
                    <th style={S.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l, i) => (
                    <tr key={l.id}>
                      <td style={{ ...S.td, color: '#94a3b8' }}>{i + 1}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700 }}>{CATEGORY_ICON[l.category] || '📘'} {l.title}</div>
                        <div style={{ ...S.muted, textTransform: 'capitalize' }}>{l.category}</div>
                      </td>
                      <td style={{ ...S.td, textTransform: 'capitalize' }}>{l.difficulty_level || '—'}</td>
                      <td style={S.td}>{l.xp_reward}</td>
                      <td style={{ ...S.td, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 99 }}>
                            <div style={{ width: `${(l.completions / maxCompletions) * 100}%`, height: '100%', background: '#6366f1', borderRadius: 99 }} />
                          </div>
                          <strong>{l.completions}</strong>
                        </div>
                      </td>
                      <td style={S.td}>{l.in_progress}</td>
                      <td style={S.td}>{l.quiz_attempts}</td>
                      <td style={S.td}>{l.avg_quiz_score == null ? '—' : `${l.avg_quiz_score}%`}</td>
                      <td style={S.td}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          color: l.is_active ? '#166534' : '#64748b', background: l.is_active ? '#f0fdf4' : '#f1f5f9' }}>
                          {l.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ ...S.muted, marginTop: 12 }}>
            Lessons and their quizzes come from <code>backend/seed_lessons.py</code>.
          </p>
        </Section>
      </LoadState>
    </div>
  );
}
