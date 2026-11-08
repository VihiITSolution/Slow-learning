import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiAward } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { TeacherMessageCard } from '../components/ai/AIAssist';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError('');
      setLoading(true);
      // Fetch multiple endpoints in parallel; one failing request should not
      // blank the whole page, but if all fail the student needs to know
      let failures = 0;
      const fallback = (data) => () => { failures += 1; return { data }; };
      const [analyticsRes, recommendationsRes, leaderboardRes, todayRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(fallback(null)),
        api.get('/recommendations/personalized').catch(fallback({ recommendations: [] })),
        api.get('/gamification/leaderboard?limit=5').catch(fallback({ leaderboard: [] })),
        // Today's challenges are extra: a failure here only hides that card
        api.get('/activities/today').catch(() => ({ data: null }))
      ]);
      if (failures === 3) {
        setError('Failed to load dashboard. Please check your connection and try again.');
        setLoading(false);
        return;
      }

      setAnalytics(analyticsRes.data);
      setRecommendations(recommendationsRes.data?.recommendations || []);
      setLeaderboard(leaderboardRes.data?.leaderboard || []);
      setToday(todayRes?.data?.challenges ? todayRes.data : null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error">{error}</div>
        <button className="btn-primary" onClick={fetchDashboardData} style={{ marginTop: 16 }}>Retry</button>
      </div>
    );
  }
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">🎉 Welcome back, {user?.username || 'Student'}! 🌟</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Let's make today a SUPER learning day! 🚀
        </p>
      </div>
      
              {/* Stats Cards */}
              <div className="stats-grid dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{user?.total_xp || 0}</div>
                  <div className="stat-label">YOUR XP</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginTop: '8px'}}>
                    Earn XP by finishing lessons 🎯
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-value">Level {user?.level || 1}</div>
                  <div className="stat-label">CURRENT LEVEL</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginTop: '8px'}}>
                    Keep learning! 💜
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{user?.current_streak || 0} Days</div>
                  <div className="stat-label">DAILY STREAK</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#f97316', marginTop: '8px'}}>
                    {user?.current_streak >= 7 ? 'On fire! 🚀' : 'Keep it up! 🔥'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-value">{analytics?.user_stats?.completion_percentage ?? 0}%</div>
                  <div className="stat-label">PROGRESS</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#ec4899', marginTop: '8px'}}>
                    {analytics?.user_stats
                      ? `${analytics.user_stats.lessons_completed} of ${analytics.user_stats.total_lessons} lessons ✨`
                      : 'Keep going! ✨'}
                  </div>
                </div>
              </div>
              
              <div className="dashboard-content">
                  {/* Recommended Lessons */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>📚 Recommended For You ✨</h2>
                    {recommendations.length > 0 ? (
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                        {recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="lesson-card">
                            <div style={{fontSize: '60px', marginBottom: '15px'}}>
                              {rec.lesson?.category === 'math' ? '📐' : '📝'}
                            </div>
                            <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginBottom: '10px'}}>
                              {rec.lesson?.title || `Lesson ${rec.lesson?.id ?? rec.lesson_id}`}
                            </h3>
                            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', marginBottom: '15px'}}>
                              ⏱️ {rec.lesson?.estimated_time || 15} minutes
                            </p>
                            <Link to={`/app/lessons/${rec.lesson?.id ?? rec.lesson_id}`}>
                              <button className="btn-primary">🚀 START LESSON</button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="lesson-card">
                        <p style={{fontSize: '18px', textAlign: 'center', color: '#666'}}>
                          Complete some lessons to get personalized recommendations! 📚
                        </p>
                        <Link to="/app/lessons">
                          <button className="btn-primary" style={{marginTop: '15px'}}>Browse All Lessons</button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Message from the teacher (often drafted with AI, always sent by the teacher) */}
                  <TeacherMessageCard />

                  {/* Practice and games */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>🎮 Play & Learn 🌈</h2>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                      <div className="game-card">
                        <span style={{fontSize: '80px'}}>🎯</span>
                        <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginTop: '15px'}}>
                          Quick Practice
                        </h3>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '10px 0'}}>
                          5 short questions in numbers, words or my world.
                        </p>
                        <Link to="/app/practice">
                          <button className="btn-primary" style={{marginTop: '15px'}}>🎯 PRACTISE NOW</button>
                        </Link>
                      </div>

                      <div className="game-card">
                        <span style={{fontSize: '80px'}}>🧩</span>
                        <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginTop: '15px'}}>
                          Learning Games
                        </h3>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '10px 0'}}>
                          Maths, colours, memory, stories and drawing.
                        </p>
                        <Link to="/student-dashboard">
                          <button className="btn-primary" style={{marginTop: '15px'}}>🎮 PLAY NOW</button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Daily Challenges - worked out from what the student really did today */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>⭐ Today's Challenges ⭐</h2>
                    <div className="challenges-card">
                      {today?.challenges?.length ? (
                        <>
                          <p style={{fontSize: '16px', fontWeight: '700', color: '#6b7280', margin: '0 0 10px'}}>
                            {today.done} of {today.total} done {today.done === today.total ? '- brilliant! 🎉' : ''}
                          </p>
                          {today.challenges.map((challenge) => (
                            <div className="challenge-item" key={challenge.id}>
                              <span aria-hidden="true" style={{fontSize: '24px'}}>{challenge.done ? '✅' : '⬜'}</span>
                              <span style={{flex: 1, fontSize: '18px', fontWeight: '700', color: challenge.done ? '#166534' : '#1f2937'}}>
                                {challenge.label}
                              </span>
                              {challenge.done ? (
                                <span style={{fontSize: '16px', fontWeight: '900', color: '#10b981'}}>Done!</span>
                              ) : (
                                <Link to={challenge.link}>
                                  <span style={{fontSize: '16px', fontWeight: '900', color: '#8b5cf6', background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', padding: '6px 16px', borderRadius: '20px', border: '3px solid #8b5cf6'}}>
                                    Go →
                                  </span>
                                </Link>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                          Finish a lesson or a practice round to start today's challenges! ⭐
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>🏆 Leaderboard 🥇</h2>
                    <div className="leaderboard-card">
                      {leaderboard.length > 0 ? (
                        <>
                          {leaderboard.map((entry, index) => {
                            const isCurrentUser = entry.user_id === user?.id;
                            const rankEmoji = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '😊';
                            const rankColor = index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : '#f97316';
                            
                            return (
                              <div 
                                key={entry.user_id} 
                                className="leaderboard-item"
                                style={isCurrentUser ? {background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '5px solid #fbbf24'} : {}}
                              >
                                <span style={{fontSize: '28px', fontWeight: '900', width: '40px', textAlign: 'center', color: rankColor}}>
                                  {entry.rank}
                                </span>
                                <div style={{
                                  width: '50px', 
                                  height: '50px', 
                                  borderRadius: '50%', 
                                  background: `linear-gradient(135deg, ${rankColor}, ${rankColor})`, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '24px', 
                                  border: `4px solid ${rankColor}`
                                }}>
                                  {rankEmoji}
                                </div>
                                <p style={{flex: 1, fontSize: '18px', fontWeight: '900', color: '#1f2937'}}>
                                  {isCurrentUser ? `You (${entry.username})` : entry.username}
                                </p>
                                <span style={{fontSize: '20px', fontWeight: '900', color: isCurrentUser ? '#f97316' : '#8b5cf6'}}>
                                  {entry.total_xp} XP {isCurrentUser ? '⭐' : ''}
                                </span>
                              </div>
                            );
                          })}
                          <Link to="/app/leaderboard">
                            <button className="btn-primary" style={{width: '100%', marginTop: '20px'}}>
                              🏅 VIEW FULL LEADERBOARD
                            </button>
                          </Link>
                        </>
                      ) : (
                        <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                          Leaderboard will appear once you start earning XP! 🏆
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div style={{marginTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                    <Link to="/app/lessons" style={{flex: 1, minWidth: '200px'}}>
                      <button className="btn-primary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                        <FiBook size={24} /> ALL LESSONS
                      </button>
                    </Link>
                    <Link to="/app/achievements" style={{flex: 1, minWidth: '200px'}}>
                      <button className="btn-secondary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                        <FiAward size={24} /> MY ACHIEVEMENTS
                      </button>
                    </Link>
                    <Link to="/app/practice" style={{flex: 1, minWidth: '200px'}}>
                      <button className="btn-primary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'}}>
                        🎯 PRACTICE
                      </button>
                    </Link>
                    <Link to="/app/progress-summary" style={{flex: 1, minWidth: '200px'}}>
                      <button className="btn-primary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}>
                        📊 MY PROGRESS
                      </button>
                    </Link>
                  </div>
              </div>
    </div>
  );
};

export default DashboardPage;