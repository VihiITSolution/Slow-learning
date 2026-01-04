import React from 'react';

const LeaderboardTable = ({ leaderboard, currentUserId }) => {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Level</th>
            <th>XP</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <tr 
              key={entry.user_id} 
              className={entry.user_id === currentUserId ? 'current-user' : ''}
            >
              <td className="rank-cell">{getMedalEmoji(entry.rank)}</td>
              <td className="player-cell">
                <img 
                  src={entry.avatar_url || '/default-avatar.png'} 
                  alt={entry.username} 
                  className="avatar-tiny"
                />
                <span>{entry.username}</span>
              </td>
              <td>Level {entry.level}</td>
              <td>{entry.score.toLocaleString()} XP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
