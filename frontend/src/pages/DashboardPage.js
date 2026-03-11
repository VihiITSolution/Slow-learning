import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiAward } from 'react-icons/fi';
import { recommendationService } from '../services';

const DashboardPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationService.getRecommendations(5);
      setRecommendations(response.recommendations || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Unable to load personalized recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      'easy': '🌱',
      'medium': '🔥',
      'hard': '💪',
      'beginner': '🌟',
      'intermediate': '⚡',
      'advanced': '🚀'
    };
    return icons[difficulty?.toLowerCase()] || '📚';
  };

  const getConfidenceBadge = (score) => {
    if (score >= 0.8) return { text: '🎯 HIGHLY RECOMMENDED', color: '#10b981' };
    if (score >= 0.6) return { text: '✨ GOOD MATCH', color: '#8b5cf6' };
    return { text: '💡 SUGGESTED', color: '#f59e0b' };
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">🎉 Welcome back, Alex! 🌟</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Let's make today a SUPER learning day! 🚀
        </p>
      </div>
      
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">1,450</div>
                  <div className="stat-label">YOUR XP</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginTop: '8px'}}>
                    +50 XP today! 🎯
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-value">Level 5</div>
                  <div className="stat-label">CURRENT LEVEL</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginTop: '8px'}}>
                    Novice Coder! 💜
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">12 Days</div>
                  <div className="stat-label">DAILY STREAK</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#f97316', marginTop: '8px'}}>
                    On fire! 🚀
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-value">65%</div>
                  <div className="stat-label">PROGRESS</div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#ec4899', marginTop: '8px'}}>
                    Keep going! ✨
                  </div>
                </div>
              </div>
              
              <div className="dashboard-content">
                  {/* Recommended Lessons - ML Powered */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>
                      🤖 AI Recommended For You ✨
                    </h2>
                    
                    {loading ? (
                      <div style={{textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6b7280'}}>
                        <div style={{fontSize: '48px', marginBottom: '15px'}}>🔮</div>
                        Loading personalized recommendations...
                      </div>
                    ) : error ? (
                      <div style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                        <p style={{fontSize: '18px', color: '#ef4444', marginBottom: '15px'}}>{error}</p>
                        <button className="btn-primary" onClick={fetchRecommendations}>
                          🔄 Try Again
                        </button>
                      </div>
                    ) : recommendations.length === 0 ? (
                      <div style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '48px', marginBottom: '15px'}}>🎉</div>
                        <p style={{fontSize: '18px', color: '#6b7280'}}>
                          Great job! You've completed all available lessons.
                        </p>
                      </div>
                    ) : (
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                        {recommendations.map((rec, index) => {
                          const lesson = rec.lesson;
                          const badge = getConfidenceBadge(rec.score);
                          
                          return (
                            <div key={lesson.id} className="lesson-card" style={{
                              border: index === 0 ? '5px solid #ec4899' : '3px solid #e5e7eb',
                              background: index === 0 ? 'linear-gradient(135deg, #fef3c7, #ddd6fe)' : 'white',
                              position: 'relative'
                            }}>
                              {/* ML Confidence Badge */}
                              <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                fontSize: '11px',
                                fontWeight: '900',
                                color: 'white',
                                background: badge.color,
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: `2px solid ${badge.color}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}>
                                {badge.text}
                              </div>

                              <div style={{fontSize: '60px', marginBottom: '15px'}}>
                                {getDifficultyIcon(lesson.difficulty_level)}
                              </div>
                              
                              <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginBottom: '10px'}}>
                                {lesson.title}
                              </h3>
                              
                              {lesson.description && (
                                <p style={{fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', height: '40px', overflow: 'hidden'}}>
                                  {lesson.description.substring(0, 80)}...
                                </p>
                              )}
                              
                              {/* ML Reasoning */}
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#8b5cf6',
                                background: 'rgba(139, 92, 246, 0.1)',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                marginBottom: '12px',
                                border: '2px solid rgba(139, 92, 246, 0.2)'
                              }}>
                                💡 {rec.reason}
                              </div>

                              {/* Lesson Meta Info */}
                              <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
                                <span style={{fontSize: '14px', fontWeight: '700', color: '#10b981', background: '#d1fae5', padding: '4px 10px', borderRadius: '8px'}}>
                                  {lesson.difficulty_level || 'Easy'}
                                </span>
                                <span style={{fontSize: '14px', fontWeight: '700', color: '#f59e0b', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px'}}>
                                  {lesson.category || 'General'}
                                </span>
                              </div>

                              <Link to={`/app/lessons/${lesson.id}`}>
                                <button className="btn-primary" style={{width: '100%'}}>
                                  🚀 START LESSON
                                </button>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Info about ML recommendations */}
                    {!loading && !error && recommendations.length > 0 && (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                        borderRadius: '15px',
                        border: '3px solid #8b5cf6',
                        textAlign: 'center'
                      }}>
                        <p style={{fontSize: '14px', fontWeight: '700', color: '#6b7280'}}>
                          🤖 <strong style={{color: '#8b5cf6'}}>Powered by Machine Learning</strong> - These recommendations are personalized based on your learning history, quiz performance, and preferred difficulty level.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Mini Games */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>🎮 Play & Learn 🌈</h2>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                      <div className="game-card">
                        <span style={{fontSize: '80px'}}>❓</span>
                        <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginTop: '15px'}}>
                          Flashcard Frenzy
                        </h3>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '10px 0'}}>
                          Test your memory and speed!
                        </p>
                        <button className="btn-primary" style={{marginTop: '15px'}}>🎯 PLAY NOW</button>
                      </div>

                      <div className="game-card">
                        <span style={{fontSize: '80px'}}>🔤</span>
                        <h3 style={{fontSize: '24px', fontWeight: '900', color: '#1f2937', marginTop: '15px'}}>
                          Word Weaver
                        </h3>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '10px 0'}}>
                          Solve puzzles, build vocabulary.
                        </p>
                        <button className="btn-primary" style={{marginTop: '15px'}}>🎯 PLAY NOW</button>
                      </div>
                    </div>
                  </div>

                  {/* Daily Challenges */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>⭐ Today's Challenges ⭐</h2>
                    <div className="challenges-card">
                      <div className="challenge-item">
                        <input type="checkbox" defaultChecked style={{width: '24px', height: '24px', cursor: 'pointer'}}/>
                        <label style={{flex: 1, fontSize: '18px', fontWeight: '700', color: '#1f2937'}}>
                          Complete one lesson
                        </label>
                        <span style={{fontSize: '16px', fontWeight: '900', color: '#10b981', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', padding: '6px 16px', borderRadius: '20px', border: '3px solid #10b981'}}>
                          +20 XP
                        </span>
                      </div>

                      <div className="challenge-item">
                        <input type="checkbox" style={{width: '24px', height: '24px', cursor: 'pointer'}}/>
                        <label style={{flex: 1, fontSize: '18px', fontWeight: '700', color: '#1f2937'}}>
                          Score 80% on a quiz
                        </label>
                        <span style={{fontSize: '16px', fontWeight: '900', color: '#f59e0b', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '6px 16px', borderRadius: '20px', border: '3px solid #f59e0b'}}>
                          +30 XP
                        </span>
                      </div>

                      <div className="challenge-item">
                        <input type="checkbox" style={{width: '24px', height: '24px', cursor: 'pointer'}}/>
                        <label style={{flex: 1, fontSize: '18px', fontWeight: '700', color: '#1f2937'}}>
                          Play one mini-game
                        </label>
                        <span style={{fontSize: '16px', fontWeight: '900', color: '#8b5cf6', background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', padding: '6px 16px', borderRadius: '20px', border: '3px solid #8b5cf6'}}>
                          +10 XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div style={{marginTop: '30px'}}>
                    <h2 className="page-title" style={{fontSize: '32px', marginBottom: '20px'}}>🏆 Leaderboard 🥇</h2>
                    <div className="leaderboard-card">
                      <div className="leaderboard-item">
                        <span style={{fontSize: '28px', fontWeight: '900', width: '40px', textAlign: 'center', color: '#fbbf24'}}>1</span>
                        <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '4px solid #fbbf24'}}>
                          👑
                        </div>
                        <p style={{flex: 1, fontSize: '18px', fontWeight: '900', color: '#1f2937'}}>Sarah J.</p>
                        <span style={{fontSize: '20px', fontWeight: '900', color: '#8b5cf6'}}>2,100 XP</span>
                      </div>

                      <div className="leaderboard-item">
                        <span style={{fontSize: '28px', fontWeight: '900', width: '40px', textAlign: 'center', color: '#9ca3af'}}>2</span>
                        <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #9ca3af, #6b7280)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '4px solid #9ca3af'}}>
                          🥈
                        </div>
                        <p style={{flex: 1, fontSize: '18px', fontWeight: '900', color: '#1f2937'}}>Mike L.</p>
                        <span style={{fontSize: '20px', fontWeight: '900', color: '#8b5cf6'}}>1,980 XP</span>
                      </div>

                      <div className="leaderboard-item">
                        <span style={{fontSize: '28px', fontWeight: '900', width: '40px', textAlign: 'center', color: '#d97706'}}>3</span>
                        <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '4px solid #f59e0b'}}>
                          🥉
                        </div>
                        <p style={{flex: 1, fontSize: '18px', fontWeight: '900', color: '#1f2937'}}>Chloe B.</p>
                        <span style={{fontSize: '20px', fontWeight: '900', color: '#8b5cf6'}}>1,650 XP</span>
                      </div>

                      <div className="leaderboard-item" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '5px solid #fbbf24'}}>
                        <span style={{fontSize: '28px', fontWeight: '900', width: '40px', textAlign: 'center', color: '#f97316'}}>5</span>
                        <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '4px solid #ec4899'}}>
                          😊
                        </div>
                        <p style={{flex: 1, fontSize: '18px', fontWeight: '900', color: '#1f2937'}}>You (Alex)</p>
                        <span style={{fontSize: '20px', fontWeight: '900', color: '#f97316'}}>1,450 XP ⭐</span>
                      </div>

                      <Link to="/app/leaderboard">
                        <button className="btn-primary" style={{width: '100%', marginTop: '20px'}}>
                          🏅 VIEW FULL LEADERBOARD
                        </button>
                      </Link>
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
                    <Link to="/app/ml-insights" style={{flex: 1, minWidth: '200px'}}>
                      <button className="btn-primary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'}}>
                        🧠 ML INSIGHTS
                      </button>
                    </Link>
                  </div>
              </div>
    </div>
  );
};

export default DashboardPage;