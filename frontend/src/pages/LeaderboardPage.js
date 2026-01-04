import React, { useState } from 'react';

const LeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState('allTime');

  // Sample leaderboard data
  const leaderboardData = {
    allTime: [
      { rank: 1, name: 'Sarah J.', xp: 5200, avatar: '👧', badge: '🏆' },
      { rank: 2, name: 'Mike L.', xp: 4980, avatar: '👦', badge: '🥈' },
      { rank: 3, name: 'Chloe B.', xp: 4650, avatar: '👧', badge: '🥉' },
      { rank: 4, name: 'Emma W.', xp: 4200, avatar: '👧', badge: '⭐' },
      { rank: 5, name: 'You', xp: 1450, avatar: '😊', badge: '🌟', isCurrentUser: true },
      { rank: 6, name: 'Lucas M.', xp: 1300, avatar: '👦', badge: '✨' },
      { rank: 7, name: 'Olivia K.', xp: 1150, avatar: '👧', badge: '💫' },
      { rank: 8, name: 'Noah P.', xp: 980, avatar: '👦', badge: '🎯' },
      { rank: 9, name: 'Ava T.', xp: 850, avatar: '👧', badge: '🎪' },
      { rank: 10, name: 'Liam R.', xp: 720, avatar: '👦', badge: '🎨' }
    ],
    monthly: [
      { rank: 1, name: 'You', xp: 450, avatar: '😊', badge: '🏆', isCurrentUser: true },
      { rank: 2, name: 'Sarah J.', xp: 420, avatar: '👧', badge: '🥈' },
      { rank: 3, name: 'Mike L.', xp: 380, avatar: '👦', badge: '🥉' }
    ],
    weekly: [
      { rank: 1, name: 'You', xp: 150, avatar: '😊', badge: '🏆', isCurrentUser: true },
      { rank: 2, name: 'Chloe B.', xp: 120, avatar: '👧', badge: '🥈' },
      { rank: 3, name: 'Emma W.', xp: 95, avatar: '👧', badge: '🥉' }
    ]
  };

  const currentData = leaderboardData[timeframe];

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
          className={timeframe === 'allTime' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTimeframe('allTime')}
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
      {currentData.find(entry => entry.isCurrentUser) && (
        <div className="stat-card" style={{maxWidth: '600px', margin: '0 auto 40px', background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'}}>
          <div className="stat-icon">😊</div>
          <div className="stat-value">Rank #{currentData.find(entry => entry.isCurrentUser).rank}</div>
          <div className="stat-label">YOUR CURRENT RANK</div>
          <div style={{fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '8px'}}>
            {currentData.find(entry => entry.isCurrentUser).xp} XP • Keep going! 💪
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-card" style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '30px', color: '#8b5cf6'}}>
          🌟 TOP LEARNERS 🌟
        </h2>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {currentData.map((entry) => (
            <div 
              key={entry.rank}
              className={entry.isCurrentUser ? 'leaderboard-item' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px',
                background: entry.isCurrentUser 
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' 
                  : 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
                borderRadius: '20px',
                border: entry.isCurrentUser ? '5px solid #f97316' : '4px solid #fbbf24',
                boxShadow: entry.isCurrentUser ? '0 8px 20px rgba(249, 115, 22, 0.4)' : '0 4px 10px rgba(0,0,0,0.1)',
                transform: entry.isCurrentUser ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Rank Badge */}
              <div style={{
                fontSize: '48px',
                fontWeight: '900',
                minWidth: '80px',
                textAlign: 'center',
                color: entry.isCurrentUser ? '#fff' : '#8b5cf6'
              }}>
                {entry.badge}
              </div>

              {/* Avatar */}
              <div style={{
                fontSize: '52px',
                minWidth: '70px',
                textAlign: 'center'
              }}>
                {entry.avatar}
              </div>

              {/* Name */}
              <div style={{
                flex: 1,
                fontSize: '24px',
                fontWeight: '900',
                color: entry.isCurrentUser ? '#fff' : '#333',
                textTransform: 'uppercase'
              }}>
                {entry.name}
                {entry.isCurrentUser && <span style={{marginLeft: '10px'}}>🎉</span>}
              </div>

              {/* XP */}
              <div style={{
                fontSize: '28px',
                fontWeight: '900',
                color: entry.isCurrentUser ? '#fff' : '#f97316',
                minWidth: '120px',
                textAlign: 'right'
              }}>
                {entry.xp} XP
              </div>

              {/* Rank Number */}
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                color: entry.isCurrentUser ? '#fff' : '#ec4899',
                minWidth: '60px',
                textAlign: 'center',
                marginLeft: '15px'
              }}>
                #{entry.rank}
              </div>
            </div>
          ))}
        </div>

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
