import React from 'react';
import { FaFire } from 'react-icons/fa';

const StreakIndicator = ({ currentStreak, longestStreak }) => {
  return (
    <div className="streak-container">
      <div className="streak-icon">
        <FaFire className={currentStreak > 0 ? 'fire-active' : 'fire-inactive'} />
      </div>
      <div className="streak-info">
        <h3 className="streak-title">Daily Streak</h3>
        <p className="streak-count">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
        <p className="streak-best">Best: {longestStreak} days</p>
      </div>
    </div>
  );
};

export default StreakIndicator;
