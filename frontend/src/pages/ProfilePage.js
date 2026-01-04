import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, gamificationService } from '../services';
import { toast } from 'react-toastify';
import { FiEdit2, FiSave, FiUser, FiMail, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import XPProgressBar from '../components/gamification/XPProgressBar';
import StreakIndicator from '../components/gamification/StreakIndicator';

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
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
    '/avatars/avatar6.png'
  ];

  return (
    <div className="profile-page">
      <h1 className="page-title">My Profile</h1>

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
          <h3>Progress</h3>
          <XPProgressBar currentXP={user?.total_xp || 0} level={user?.level || 1} />
        </div>

        {/* Streak */}
        <div className="profile-section">
          <h3>Learning Streak</h3>
          <StreakIndicator 
            currentStreak={streakData?.current_streak || user?.current_streak || 0}
            longestStreak={streakData?.longest_streak || user?.longest_streak || 0}
          />
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
