import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../styles/Gamification.css';

export default function GamificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      
      // Load achievements
      const achievementsRes = await api.get('/gamification/achievements');
      setAchievements(achievementsRes.data.achievements || []);
      
      // Load streak
      const streakRes = await api.get('/gamification/streak');
      setStreak(streakRes.data);
      
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLevel = user?.level || 1;
  const currentXP = user?.total_xp || 0;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const progressPercent = ((currentXP % xpForNextLevel) / xpForNextLevel) * 100;

  if (loading) {
    return (
      <div className="gamification-page">
        <div className="loading-message">Loading your adventure... 🎮</div>
      </div>
    );
  }

  return (
    <div className="gamification-page">
      <div className="page-header">
        <h1 className="page-title">🎮 Your Adventure 🌟</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Check out your amazing progress!
        </p>
      </div>

      <div className="gamification-content">
        {/* Level Progress Card */}
        <div className="progress-card">
          <h2 className="section-title">🏆 Level Progression</h2>
          <div className="level-info">
            <div className="level-badge">
              <span className="level-number">{currentLevel}</span>
              <span className="level-label">Level</span>
            </div>
            <div className="xp-info">
              <div className="xp-stats">
                <span className="current-xp">{currentXP} XP</span>
                <span className="xp-remaining">{xpForNextLevel - (currentXP % xpForNextLevel)} XP to Level {currentLevel + 1}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="progress-percent">{Math.round(progressPercent)}%</div>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="streak-card">
          <h2 className="section-title">🔥 Streak Calendar</h2>
          <div className="streak-stats">
            <div className="stat-item">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{streak.current_streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏅</div>
              <div className="stat-value">{streak.longest_streak}</div>
              <div className="stat-label">Longest Streak</div>
            </div>
          </div>
          {streak.current_streak >= 7 && (
            <div className="streak-message">
              🎉 Amazing! You're on a {streak.current_streak}-day streak!
            </div>
          )}
        </div>

        {/* Achievements/Badges */}
        <div className="achievements-section">
          <h2 className="section-title">🎖️ Badge Collection</h2>
          {achievements.length > 0 ? (
            <div className="badges-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="badge-card">
                  <div className="badge-icon">{achievement.badge_icon || '🏆'}</div>
                  <h3 className="badge-title">{achievement.title}</h3>
                  <p className="badge-description">{achievement.description}</p>
                  <div className="badge-xp">+{achievement.xp_bonus} XP</div>
                  <div className="badge-date">
                    {new Date(achievement.earned_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-achievements">
              <div className="empty-icon">🎯</div>
              <p>Start earning badges by completing lessons and challenges!</p>
            </div>
          )}
        </div>

        {/* Available Badges to Earn */}
        <div className="available-badges-section">
          <h2 className="section-title">✨ Badges to Earn</h2>
          <div className="badges-grid">
            <div className="badge-card locked">
              <div className="badge-icon">🔥</div>
              <h3 className="badge-title">Daily Learner</h3>
              <p className="badge-description">Maintain a 7-day streak</p>
              <div className="badge-requirement">
                {streak.current_streak < 7 ? `${7 - streak.current_streak} more days!` : 'Unlocked! 🎉'}
              </div>
            </div>

            <div className="badge-card locked">
              <div className="badge-icon">📚</div>
              <h3 className="badge-title">Lesson Master</h3>
              <p className="badge-description">Complete 10 lessons</p>
              <div className="badge-requirement">
                {user?.lessons_completed || 0}/10
              </div>
            </div>

            <div className="badge-card locked">
              <div className="badge-icon">🎯</div>
              <h3 className="badge-title">Quiz Expert</h3>
              <p className="badge-description">Take 5 quizzes</p>
              <div className="badge-requirement">
                {user?.quizzes_taken || 0}/5
              </div>
            </div>

            <div className="badge-card locked">
              <div className="badge-icon">⭐</div>
              <h3 className="badge-title">XP Hunter</h3>
              <p className="badge-description">Earn 1000 XP</p>
              <div className="badge-requirement">
                {currentXP}/1000
              </div>
            </div>

            <div className="badge-card locked">
              <div className="badge-icon">🚀</div>
              <h3 className="badge-title">Level 10 Hero</h3>
              <p className="badge-description">Reach Level 10</p>
              <div className="badge-requirement">
                Level {currentLevel}/10
              </div>
            </div>

            <div className="badge-card locked">
              <div className="badge-icon">💯</div>
              <h3 className="badge-title">Perfect Score</h3>
              <p className="badge-description">Score 100% on a quiz</p>
              <div className="badge-requirement">
                Keep trying!
              </div>
            </div>
          </div>
        </div>

        {/* User Stats Summary */}
        <div className="stats-summary">
          <h2 className="section-title">📊 Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-large">📖</div>
              <div className="stat-value-large">{user?.lessons_completed || 0}</div>
              <div className="stat-label">Lessons Completed</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-large">📝</div>
              <div className="stat-value-large">{user?.quizzes_taken || 0}</div>
              <div className="stat-label">Quizzes Taken</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-large">⏱️</div>
              <div className="stat-value-large">{user?.total_time_spent || 0}</div>
              <div className="stat-label">Minutes Spent</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-large">🎖️</div>
              <div className="stat-value-large">{achievements.length}</div>
              <div className="stat-label">Badges Earned</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate('/app/lessons')}
          >
            📚 Continue Learning
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/app/achievements')}
          >
            🏆 View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
}
