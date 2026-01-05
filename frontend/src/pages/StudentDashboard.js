import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    // Check if student name exists in localStorage
    const savedName = localStorage.getItem('studentName');
    if (savedName) {
      setStudentName(savedName);
      loadStudentSessions(savedName);
    } else {
      setShowNameModal(true);
      setLoading(false);
    }
  }, []);

  const loadStudentSessions = async (name) => {
    try {
      setLoading(true);
      const response = await api.get(`/assessment/sessions/student/${name}`);
      setRecentSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewGame = async () => {
    if (!studentName) {
      setShowNameModal(true);
      return;
    }

    try {
      // Create new session
      const response = await api.post('/assessment/sessions/create', {
        student_name: studentName
      });
      
      const sessionId = response.data.session_id;
      localStorage.setItem('currentSessionId', sessionId);
      
      // Navigate to games page
      navigate('/interactive-games');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to start game session. Please try again.');
    }
  };

  const handleSaveName = () => {
    if (studentName.trim()) {
      localStorage.setItem('studentName', studentName.trim());
      setShowNameModal(false);
      loadStudentSessions(studentName.trim());
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceLevel = (stars, gamesCompleted) => {
    if (gamesCompleted === 0) return { emoji: '🎮', text: 'Not Started', class: 'not-started' };
    const percentage = (stars / gamesCompleted) * 100;
    if (percentage >= 80) return { emoji: '🌟', text: 'Excellent!', class: 'excellent' };
    if (percentage >= 60) return { emoji: '😊', text: 'Great Job!', class: 'great' };
    if (percentage >= 40) return { emoji: '👍', text: 'Good Try!', class: 'good' };
    return { emoji: '💪', text: 'Keep Practicing!', class: 'practice' };
  };

  return (
    <div className="student-dashboard-page">
      <button className="back-to-home-btn" onClick={() => navigate('/learning-helper')}>
        ← Back to Home
      </button>

      <div className="dashboard-header">
        <h1>🌟 Welcome, {studentName || 'Student'}! 🌟</h1>
        <p>Ready to have fun and learn?</p>
      </div>

      <div className="dashboard-content">
        {/* Start New Game Section */}
        <div className="new-game-section">
          <div className="new-game-card">
            <div className="game-icon">🎮</div>
            <h2>Start New Adventure!</h2>
            <p>Play fun games and earn stars!</p>
            <button className="start-new-game-btn" onClick={handleStartNewGame}>
              Start Playing! 🚀
            </button>
          </div>
        </div>

        {/* Student Stats */}
        {recentSessions.length > 0 && (
          <div className="student-stats">
            <h3>📊 Your Amazing Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-number">{recentSessions.length}</div>
                <div className="stat-label">Games Played</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-number">
                  {recentSessions.reduce((sum, s) => sum + s.total_stars, 0)}
                </div>
                <div className="stat-label">Total Stars</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-number">
                  {recentSessions.filter(s => s.games_completed === 5).length}
                </div>
                <div className="stat-label">Perfect Games</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {loading ? (
          <div className="loading-message">Loading your games... 🎮</div>
        ) : recentSessions.length > 0 ? (
          <div className="recent-sessions">
            <h3>📜 Your Recent Adventures</h3>
            <div className="sessions-list">
              {recentSessions.slice(0, 5).map((session) => {
                const performance = getPerformanceLevel(session.total_stars, session.games_completed);
                return (
                  <div key={session.id} className="session-card">
                    <div className="session-header">
                      <span className="session-date">{formatDate(session.started_at)}</span>
                      <span className={`performance-badge ${performance.class}`}>
                        {performance.emoji} {performance.text}
                      </span>
                    </div>
                    <div className="session-details">
                      <div className="detail-item">
                        <span className="detail-icon">🎮</span>
                        <span>{session.games_completed} games completed</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⭐</span>
                        <span>{session.total_stars} stars earned</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏱️</span>
                        <span>{formatTime(session.total_time)}</span>
                      </div>
                      {session.total_errors > 0 && (
                        <div className="detail-item">
                          <span className="detail-icon">❌</span>
                          <span>{session.total_errors} mistakes</span>
                        </div>
                      )}
                    </div>
                    {session.primary_learning_style && (
                      <div className="learning-style-badge">
                        <span>🎯 You are a {session.primary_learning_style}!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-sessions">
            <div className="no-sessions-icon">🎮</div>
            <h3>No Games Yet!</h3>
            <p>Start your first adventure by clicking the button above!</p>
          </div>
        )}

        {/* Change Name Button */}
        <div className="settings-section">
          <button className="change-name-btn" onClick={() => setShowNameModal(true)}>
            ✏️ Change Name
          </button>
        </div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="modal-overlay" onClick={() => !studentName && setShowNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>What's Your Name? 😊</h2>
            <input
              type="text"
              className="name-input"
              placeholder="Enter your name..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="save-name-btn" onClick={handleSaveName}>
                Save & Continue
              </button>
              {localStorage.getItem('studentName') && (
                <button className="cancel-btn" onClick={() => setShowNameModal(false)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
