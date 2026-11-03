import { Link } from 'react-router-dom';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services';
import AchievementBadge from '../components/gamification/AchievementBadge';

const AchievementsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: gamificationService.getAchievements,
  });

  const achievements = data?.achievements || [];

  return (
    <div className="achievements-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Your Amazing Achievements! 🌟</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Collect badges and earn rewards! 🎉
        </p>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '40px'}}>
        <div className="stat-card">
          <div className="stat-icon">🏅</div>
          <div className="stat-value">{achievements.length}</div>
          <div className="stat-label">BADGES EARNED</div>
          <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginTop: '8px'}}>
            Keep collecting! ⭐
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-value">{achievements.reduce((sum, a) => sum + (a.xp_bonus || 0), 0)}</div>
          <div className="stat-label">BONUS XP</div>
          <div style={{fontSize: '16px', fontWeight: '700', color: '#fbbf24', marginTop: '8px'}}>
            From badges! 🎯
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{textAlign: 'center', padding: '60px', fontSize: '24px', fontWeight: '900', color: '#8b5cf6'}}>
          Loading achievements... 🔄
        </div>
      ) : achievements.length > 0 ? (
        <div className="achievements-list">
          {achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      ) : (
        <div className="stat-card" style={{padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', flexDirection: 'column'}}>
          <div style={{fontSize: '80px', marginBottom: '20px'}}>🎯</div>
          <h3 style={{fontSize: '32px', fontWeight: '900', color: '#1f2937', marginBottom: '15px'}}>
            No Achievements Yet!
          </h3>
          <p style={{fontSize: '20px', fontWeight: '700', color: '#666', marginBottom: '25px'}}>
            Keep learning to unlock awesome badges! 🚀
          </p>
          <Link to="/app/lessons">
            <button className="btn-primary">🎓 START LEARNING</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
