import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RISK_LABEL = { critical: 'Needs urgent help', high: 'Needs attention', moderate: 'Doing okay', 'moderate-low': 'Doing well', low: 'Excellent!', new: 'Welcome aboard' };
const RISK_COLOR = { critical: '#dc2626', high: '#ea580c', moderate: '#d97706', 'moderate-low': '#65a30d', low: '#16a34a', new: '#2563eb' };
const RISK_BG   = { critical: '#fef2f2', high: '#fff7ed', moderate: '#fffbeb', 'moderate-low': '#f7fee7', low: '#f0fdf4', new: '#eff6ff' };

function ProgressBar({ value, max = 100, color = '#6366f1' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

export default function StudentProgressSummaryPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ml/engagement/my-report');
      setReport(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load your progress report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
        <p style={{ color: '#6b7280', fontSize: 18 }}>Loading your progress report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>
        <button onClick={fetchReport} className="btn-primary">Try Again</button>
      </div>
    );
  }

  const features = report?.features || {};
  const info = report?.user_info || {};
  const recs = report?.recommendations || [];
  const engaged = report?.engaged;
  const isNew = Boolean(report?.insufficient_data);
  const riskLevel = report?.risk_level || 'low';
  const confidence = report?.confidence || 0;
  const actionItems = report?.recommendation || [];

  // Friendly headline based on engagement status
  const headline = isNew
    ? 'Welcome! Let\'s start your first lesson 🌱'
    : engaged
    ? ['You\'re crushing it! 🚀', 'Amazing work, keep it up! 🌟', 'Super star learner! ⭐'][Math.floor(Math.random() * 3)]
    : ['Let\'s get back on track! 💪', 'Every expert was once a beginner 📚', 'Your next lesson is waiting! 🎯'][Math.floor(Math.random() * 3)];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header banner */}
      <div style={{ background: isNew ? 'linear-gradient(135deg,#60a5fa,#3b82f6)' : engaged ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{isNew ? '🌱' : engaged ? '🎉' : '📖'}</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{headline}</h1>
        <p style={{ margin: '6px 0 0', fontSize: 16, opacity: .9 }}>
          Hi <strong>{user?.username}</strong>! Here's your personal learning summary.
        </p>
      </div>

      {/* Engagement Status Card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '22px 26px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: `2px solid ${RISK_COLOR[riskLevel] || '#e2e8f0'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>📊 Your Learning Status</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Based on your recent activity</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ padding: '6px 18px', borderRadius: 20, background: RISK_BG[riskLevel], color: RISK_COLOR[riskLevel], fontWeight: 800, fontSize: 15, border: `2px solid ${RISK_COLOR[riskLevel]}` }}>
              {isNew ? '🌱 Just getting started' : engaged ? '✅ Engaged Learner' : '⚠️ Needs Attention'}
            </span>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{isNew ? 'Complete a lesson so we can track your progress' : `${RISK_LABEL[riskLevel]} · ${(confidence * 100).toFixed(0)}% confidence`}</div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '⏱', label: 'Time Today', value: `${(features.time_spent_today || 0).toFixed(0)} min`, color: '#6366f1', max: 60, raw: features.time_spent_today || 0 },
          { icon: '🎯', label: 'Avg Quiz Score', value: typeof features.avg_quiz_score === 'number' ? `${features.avg_quiz_score.toFixed(0)}%` : 'No quiz yet', color: '#0284c7', max: 100, raw: features.avg_quiz_score || 0 },
          { icon: '🔥', label: 'Login Streak', value: `${features.login_streak || 0} days`, color: '#f59e0b', max: 30, raw: features.login_streak || 0 },
          { icon: '📚', label: 'Lessons This Week', value: features.lessons_completed_week || 0, color: '#16a34a', max: 7, raw: features.lessons_completed_week || 0 },
          { icon: '😴', label: 'Days Inactive', value: `${features.days_inactive || 0} days`, color: features.days_inactive > 3 ? '#dc2626' : '#16a34a', max: 7, raw: Math.min(features.days_inactive || 0, 7), invert: true },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{stat.label}</div>
            <ProgressBar value={stat.invert ? stat.max - stat.raw : stat.raw} max={stat.max} color={stat.color} />
          </div>
        ))}
      </div>

      {/* XP & Level Progress */}
      <div style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', borderRadius: 14, padding: '22px 26px', marginBottom: 24, border: '1.5px solid #c7d2fe' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#4338ca' }}>⚡ XP & Level Progress</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#4338ca' }}>{info.level || user?.level || 1}</div>
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>LEVEL</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4338ca' }}>
              <span>{info.total_xp || user?.total_xp || 0} XP total</span>
              <span>Next level: {((Math.floor(Math.sqrt((info.total_xp || user?.total_xp || 0) / 100)) + 1) ** 2) * 100} XP</span>
            </div>
            <ProgressBar
              value={(info.total_xp || user?.total_xp || 0) % 100}
              max={100}
              color="#6366f1"
            />
          </div>
        </div>
      </div>

      {/* Personalized Lesson Recommendations */}
      {recs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px 26px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1.5px solid #bfdbfe' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#1e40af' }}>💡 Recommended Lessons For You</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recs.slice(0, 5).map((rec, i) => (
              <Link
                key={i}
                to={`/app/lessons/${rec.id || rec.lesson_id || ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe', textDecoration: 'none', color: '#1e40af', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
              >
                <span style={{ fontSize: 22 }}>{rec.emoji || '📖'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{rec.title || rec.lesson_title || rec.name || `Lesson ${i + 1}`}</div>
                  {rec.category && <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>{rec.category}</div>}
                </div>
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action Items / Tips */}
      {actionItems.length > 0 && (
        <div style={{ background: '#fffbeb', borderRadius: 14, padding: '20px 24px', marginBottom: 24, border: '1.5px solid #fde047' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#854d0e' }}>🎓 Tips to Improve</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {actionItems.map((item, i) => (
              <li key={i} style={{ fontSize: 14, color: '#78350f', marginBottom: 6, lineHeight: 1.5 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Guardian share hint */}
      <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '18px 24px', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 32 }}>👨‍👩‍👧</span>
        <div>
          <div style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>Share with your guardian</div>
          <div style={{ color: '#15803d', fontSize: 13, marginTop: 2 }}>Show this page to a parent or guardian so they can see how you're doing in school! 📱</div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/app/lessons"><button className="btn-primary">📚 Go to Lessons</button></Link>
        <Link to="/app/dashboard"><button className="btn-secondary">🏠 Dashboard</button></Link>
        <Link to="/app/achievements"><button className="btn-secondary">🏆 My Achievements</button></Link>
      </div>

    </div>
  );
}
