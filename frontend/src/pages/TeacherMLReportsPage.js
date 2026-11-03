import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const RISK_COLOR = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#d97706',
  'moderate-low': '#65a30d',
  low: '#16a34a',
};

const RISK_BG = {
  critical: '#fef2f2',
  high: '#fff7ed',
  moderate: '#fffbeb',
  'moderate-low': '#f7fee7',
  low: '#f0fdf4',
};

export default function TeacherMLReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [triggering, setTriggering] = useState(null);
  const [filter, setFilter] = useState('all'); // all | at-risk | engaged
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ml/engagement/class-report');
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load class report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const trainModel = async () => {
    setTraining(true);
    setTrainResult(null);
    try {
      const res = await api.post('/ml/model/train', { use_synthetic_data: false });
      setTrainResult({ success: true, msg: `Model retrained! Data: ${res.data.data_source}. Accuracy: ${(res.data.data?.metrics?.[res.data.data?.metrics?.best_algorithm]?.accuracy * 100 || 0).toFixed(1)}%` });
      fetchReport();
    } catch (e) {
      setTrainResult({ success: false, msg: e.response?.data?.error || 'Training failed' });
    } finally {
      setTraining(false);
    }
  };

  const triggerIntervention = async (userId, username) => {
    setTriggering(userId);
    try {
      const response = await api.post(`/ml/engagement/trigger-actions/${userId}`);
      const notification = response.data?.data?.actions_taken?.find(action => action?.channels);
      const email = notification?.channels?.find(channel => channel.channel === 'email');

      if (email?.status === 'sent') {
        alert(`✅ Intervention triggered for ${username}. The encouragement email was sent to ${email.email}.`);
      } else if (email) {
        alert(`⚠️ Intervention triggered for ${username}, but the email was not sent: ${email.error || email.message || 'unknown error'}.`);
      } else {
        alert(`⚠️ No email notification was triggered for ${username}.`);
      }
    } catch (e) {
      alert('Failed to trigger intervention');
    } finally {
      setTriggering(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ color: '#6b7280', fontSize: 18 }}>Loading class ML report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
        <button onClick={fetchReport} className="btn-primary">Retry</button>
      </div>
    );
  }

  const { students = [], stats = {} } = data || {};
  const filtered = filter === 'at-risk'
    ? students.filter(s => !s.engaged)
    : filter === 'engaged'
      ? students.filter(s => s.engaged)
      : students;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1e293b' }}>
            🧠 ML Class Report
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 15 }}>
            AI-powered engagement analysis for all your students
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={fetchReport}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={trainModel}
            disabled={training}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: training ? '#94a3b8' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: training ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            {training ? '⏳ Training…' : '🤖 Retrain Model with Real Data'}
          </button>
        </div>
      </div>

      {trainResult && (
        <div style={{ padding: '12px 20px', borderRadius: 10, marginBottom: 20, background: trainResult.success ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${trainResult.success ? '#86efac' : '#fca5a5'}`, color: trainResult.success ? '#166534' : '#991b1b', fontWeight: 600 }}>
          {trainResult.success ? '✅' : '❌'} {trainResult.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '👥', label: 'Total Students', value: stats.total_users || 0, color: '#6366f1' },
          { icon: '✅', label: 'Engaged', value: stats.engaged_users || 0, color: '#16a34a' },
          { icon: '⚠️', label: 'At Risk', value: stats.disengaged_users || 0, color: '#dc2626' },
          { icon: '📈', label: 'Engagement Rate', value: `${(stats.engagement_rate || 0).toFixed(0)}%`, color: '#0284c7' },
          { icon: '🎯', label: 'Avg Confidence', value: `${((stats.average_confidence || 0) * 100).toFixed(0)}%`, color: '#7c3aed' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f1f5f9', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Risk Breakdown */}
      {stats.risk_breakdown && Object.keys(stats.risk_breakdown).length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Risk Level Breakdown</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(stats.risk_breakdown).map(([level, count]) => (
              <div key={level} style={{ padding: '6px 16px', borderRadius: 20, background: RISK_BG[level] || '#f8fafc', border: `1.5px solid ${RISK_COLOR[level] || '#94a3b8'}`, color: RISK_COLOR[level] || '#374151', fontWeight: 700, fontSize: 13 }}>
                {level.toUpperCase()}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', '📋 All Students'], ['at-risk', '⚠️ At Risk Only'], ['engaged', '✅ Engaged Only']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{ padding: '7px 18px', borderRadius: 8, border: `2px solid ${filter === val ? '#6366f1' : '#e2e8f0'}`, background: filter === val ? '#eef2ff' : '#fff', color: filter === val ? '#4338ca' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            {label} {val === 'all' ? `(${students.length})` : val === 'at-risk' ? `(${students.filter(s => !s.engaged).length})` : `(${students.filter(s => s.engaged).length})`}
          </button>
        ))}
      </div>

      {/* Students Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 16 }}>
          No students match this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((student, idx) => {
            const info = student.user_info || {};
            const features = student.features || {};
            const recs = student.recommendations || [];
            const riskColor = RISK_COLOR[student.risk_level] || '#64748b';
            const riskBg = RISK_BG[student.risk_level] || '#f8fafc';

            return (
              <div
                key={info.user_id || idx}
                style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: `1.5px solid ${student.engaged ? '#86efac' : '#fca5a5'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>

                  {/* Left: identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: student.engaged ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'linear-gradient(135deg,#f87171,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                      {(info.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{info.username || `User #${info.user_id}`}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Level {info.level} · {info.total_xp} XP</div>
                    </div>
                  </div>

                  {/* Right: status badges */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 20, background: student.engaged ? '#f0fdf4' : '#fef2f2', color: student.engaged ? '#166534' : '#991b1b', fontWeight: 700, fontSize: 13, border: `1.5px solid ${student.engaged ? '#86efac' : '#fca5a5'}` }}>
                      {student.engaged ? '✅ Engaged' : '⚠️ At Risk'}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 20, background: riskBg, color: riskColor, fontWeight: 700, fontSize: 12, border: `1.5px solid ${riskColor}` }}>
                      {(student.risk_level || 'low').toUpperCase()}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, border: '1.5px solid #e2e8f0' }}>
                      {(student.confidence * 100 || 0).toFixed(0)}% confident
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginTop: 16 }}>
                  {[
                    { label: '⏱ Time Today', value: `${features.time_spent_today?.toFixed(0) || 0} min` },
                    { label: '🎯 Quiz Score', value: `${features.avg_quiz_score?.toFixed(0) || 0}%` },
                    { label: '🔥 Streak', value: `${features.login_streak || 0} days` },
                    { label: '📚 Lessons/Week', value: features.lessons_completed_week || 0 },
                    { label: '😴 Days Inactive', value: features.days_inactive || 0 },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 9, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* ML Recommendations for this student */}
                {recs.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', marginBottom: 6 }}>💡 Recommended Next Lessons:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {recs.slice(0, 3).map((rec, i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 20, background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 600, border: '1.5px solid #c7d2fe' }}>
                          {rec.title || rec.lesson_title || rec.name || `Lesson ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement recommendations */}
                {!student.engaged && student.recommendation && student.recommendation.length > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: '#fef9c3', border: '1.5px solid #fde047' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e', marginBottom: 4 }}>📋 Action Items:</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#713f12' }}>
                      {student.recommendation.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {/* Trigger intervention */}
                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link
                    to={`/teacher/support-plans?studentId=${info.user_id}`}
                    style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4338ca', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
                  >
                    🧩 Create Support Plan
                  </Link>
                  {!student.engaged && (
                    <button
                      onClick={() => triggerIntervention(info.user_id, info.username)}
                      disabled={triggering === info.user_id}
                      style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: triggering === info.user_id ? '#94a3b8' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: triggering === info.user_id ? 'not-allowed' : 'pointer' }}
                    >
                      {triggering === info.user_id ? '⏳ Sending…' : '🚨 Send Encouragement & Boost XP'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
