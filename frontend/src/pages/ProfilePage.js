import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, gamificationService } from '../services';
import { toast } from 'react-toastify';
import { FiEdit2, FiSave, FiMail, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import '../styles/Profile.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: gamificationService.getStreak,
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: gamificationService.getAchievements,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.user);
      queryClient.invalidateQueries(['profile']);
      toast.success('Profile updated successfully!');
      setEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      avatar_url: avatarUrl
    });
  };

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
  ];

  // Calculate XP for next level
  const currentLevel = user?.level || 1;
  const currentXP = user?.total_xp || 0;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpInCurrentLevel / xpNeededForLevel) * 100;

  return (
    <div className="profile-page">
      <h1 className="page-title">🎓 My Profile</h1>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header-section">
          <div className="avatar-section">
            <img 
              src={avatarUrl || user?.avatar_url || '/default-avatar.png'} 
              alt="Profile Avatar" 
              className="profile-avatar"
            />
            {editing && (
              <button 
                onClick={() => setEditing(true)} 
                className="edit-avatar-btn"
              >
                <FiEdit2 /> Change Avatar
              </button>
            )}
          </div>

          <div className="profile-info">
            <h2>{user?.username}</h2>
            <div className="profile-details">
              <div className="detail-item">
                <FiMail />
                <span>{user?.email}</span>
              </div>
              <div className="detail-item">
                <FiCalendar />
                <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <FiTrendingUp />
                <span>Level {user?.level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection */}
        {editing && (
          <div className="avatar-selection-section">
            <h3>Choose Your Avatar</h3>
            <div className="avatar-grid">
              {avatarOptions.map((avatar, index) => (
                <div
                  key={index}
                  className={`avatar-option ${avatarUrl === avatar ? 'selected' : ''}`}
                  onClick={() => setAvatarUrl(avatar)}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} />
                </div>
              ))}
            </div>
            <div className="avatar-actions">
              <button onClick={handleSave} className="btn-primary">
                <FiSave /> Save Changes
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary">
            <FiEdit2 /> Edit Profile
          </button>
        )}

        {/* XP Progress */}
        <div className="profile-section">
          <h3>⭐ Progress</h3>
          <div className="xp-progress-custom">
            <div className="xp-stats">
              <span className="xp-current">{Math.floor(xpInCurrentLevel)} XP</span>
              <span className="xp-target">{xpNeededForLevel} XP</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
            </div>
            <p className="level-text">Level {currentLevel} • {Math.floor(progressPercent)}% to Level {currentLevel + 1}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="profile-section">
          <h3>🔥 Learning Streak</h3>
          <div className="streak-display">
            <div className="streak-stat">
              <div className="streak-icon">🔥</div>
              <div className="streak-value">{streakData?.current_streak || user?.current_streak || 0}</div>
              <div className="streak-label">Current Streak</div>
            </div>
            <div className="streak-stat">
              <div className="streak-icon">🏆</div>
              <div className="streak-value">{streakData?.longest_streak || user?.longest_streak || 0}</div>
              <div className="streak-label">Longest Streak</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-section">
          <h3>Statistics</h3>
          <div className="stats-grid-small">
            <div className="stat-box">
              <div className="stat-value">{user?.total_xp || 0}</div>
              <div className="stat-label">Total XP</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user?.lessons_completed || 0}</div>
              <div className="stat-label">Lessons Completed</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user?.quizzes_taken || 0}</div>
              <div className="stat-label">Quizzes Taken</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{achievements?.achievements?.length || 0}</div>
              <div className="stat-label">Achievements</div>
            </div>
          </div>
        </div>

        {/* Learning Assessment Results */}
        {user?.learning_style && (
          <div className="profile-section assessment-section">
            <h3>📚 Learning Assessment</h3>
            <div className="assessment-results-box">
              <div className="learning-style-badge">
                <div className="badge-icon">🎯</div>
                <div className="badge-content">
                  <div className="badge-label">Learning Style</div>
                  <div className="badge-value">{user.learning_style}</div>
                </div>
              </div>
              {user.assessment_score && (
                <div className="assessment-details">
                  <div className="assessment-stat">
                    <span className="label">Score:</span>
                    <span className="value">{user.assessment_score}</span>
                  </div>
                  {user.assessment_date && (
                    <div className="assessment-stat">
                      <span className="label">Assessed:</span>
                      <span className="value">
                        {new Date(user.assessment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {achievements && achievements.achievements?.length > 0 && (
          <div className="profile-section">
            <h3>Recent Achievements</h3>
            <div className="recent-achievements">
              {achievements.achievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="mini-achievement">
                  <span className="achievement-icon">{achievement.badge_icon || '🏆'}</span>
                  <div className="achievement-info">
                    <div className="achievement-title">{achievement.title}</div>
                    <div className="achievement-date">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
