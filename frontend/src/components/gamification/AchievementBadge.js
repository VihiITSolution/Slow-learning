import React from 'react';

const AchievementBadge = ({ achievement }) => {
  return (
    <div className="achievement-badge">
      <div className="badge-icon">
        {achievement.badge_icon ? (
          <img src={achievement.badge_icon} alt={achievement.title} />
        ) : (
          <span className="default-badge">🏆</span>
        )}
      </div>
      <div className="badge-details">
        <h4 className="badge-title">{achievement.title}</h4>
        <p className="badge-description">{achievement.description}</p>
        {achievement.xp_bonus > 0 && (
          <span className="xp-bonus">+{achievement.xp_bonus} XP</span>
        )}
      </div>
      <p className="badge-date">
        {new Date(achievement.earned_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export default AchievementBadge;
