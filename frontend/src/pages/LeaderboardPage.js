import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/gamification/leaderboard?timeframe=${timeframe}&limit=20`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard 🌟</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          See who's climbing to the top! 🚀
        </p>
      </div>

      {/* Timeframe Buttons */}
      <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'wrap'}}>
        <button 
          className={timeframe === 'all_time' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTimeframe('all_time')}
          style={{minWidth: '150px'}}
        >
          🌍 ALL TIME
        </button>
        <button 
          className={timeframe === 'monthly' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTimeframe('monthly')}
          style={{minWidth: '150px'}}
        >
          📅 THIS MONTH
        </button>
        <button 
          className={timeframe === 'weekly' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTimeframe('weekly')}
          style={{minWidth: '150px'}}
        >
          📆 THIS WEEK
        </button>
      </div>

      {/* Current Rank Card */}
      {!loading && user && (
        <div className="stat-card" style={{maxWidth: '600px', margin: '0 auto 40px', background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'}}>
          <div className="stat-icon">😊</div>
          <div className="stat-value">Rank #{user.rank || 'N/A'}</div>
          <div className="stat-label">YOUR CURRENT RANK</div>
          <div style={{fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '8px'}}>
            {user.total_xp || 0} XP • Keep going! 💪
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-card" style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '30px', color: '#8b5cf6'}}>
          🌟 TOP LEARNERS 🌟
        </h2>
        
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
            <p style={{fontSize: '18px', fontWeight: '600', color: '#666'}}>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {leaderboard.map((entry, index) => {
              const isCurrentUser = user && entry.user_id === user.id;
              const rankBadge = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐';
              
              return (
                <div 
                  key={entry.user_id || index}
                  className={isCurrentUser ? 'leaderboard-item' : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px',
                    background: isCurrentUser 
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' 
                      : 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
                    borderRadius: '20px',
                    border: isCurrentUser ? '5px solid #f97316' : '4px solid #fbbf24',
                    boxShadow: isCurrentUser ? '0 8px 20px rgba(249, 115, 22, 0.4)' : '0 4px 10px rgba(0,0,0,0.1)',
                    transform: isCurrentUser ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '900',
                    minWidth: '80px',
                    textAlign: 'center',
                    color: isCurrentUser ? '#fff' : '#8b5cf6'
                  }}>
                    {rankBadge}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    fontSize: '52px',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}>
                    {entry.avatar || '👤'}
                  </div>

                  {/* Name */}
                  <div style={{
                    flex: 1,
                    fontSize: '24px',
                    fontWeight: '900',
                    color: isCurrentUser ? '#fff' : '#333',
                    textTransform: 'uppercase'
                  }}>
                    {entry.username || entry.name || 'Anonymous'}
                    {isCurrentUser && <span style={{marginLeft: '10px'}}>🎉</span>}
                  </div>

                  {/* XP */}
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color: isCurrentUser ? '#fff' : '#f97316',
                    minWidth: '120px',
                    textAlign: 'right'
                  }}>
                    {entry.total_xp || 0} XP
                  </div>

                  {/* Rank Number */}
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '900',
                    color: isCurrentUser ? '#fff' : '#ec4899',
                    minWidth: '60px',
                    textAlign: 'center',
                    marginLeft: '15px'
                  }}>
                    #{entry.rank || index + 1}
              </div>
            </div>
          );
        })}
        </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>📊</div>
            <p style={{fontSize: '18px', fontWeight: '600', color: '#666'}}>
              No leaderboard data available yet. Start learning to join! 🚀
            </p>
          </div>
        )}

        {/* Motivational Message */}
        <div style={{
          marginTop: '40px',
          padding: '25px',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          borderRadius: '20px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <p style={{fontSize: '24px', fontWeight: '900', marginBottom: '10px'}}>
            🎯 KEEP LEARNING! 🚀
          </p>
          <p style={{fontSize: '18px', fontWeight: '600'}}>
            Every lesson gets you closer to the top! 💪✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
