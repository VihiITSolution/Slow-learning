import React from 'react';
import { FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';

const XPProgressBar = ({ currentXP, level }) => {
  // Calculate XP needed for next level
  const xpForCurrentLevel = Math.pow((level - 1), 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const percentage = (xpProgress / xpNeeded) * 100;

  return (
    <div className="xp-progress-container">
      <div className="xp-header">
        <span className="level-badge">Level {level}</span>
        <span className="xp-text">{xpProgress} / {xpNeeded} XP</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default XPProgressBar;
