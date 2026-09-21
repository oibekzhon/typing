import { useMemo } from 'react';

export default function LeaderboardPanel({ leaderboard, user, userEntry, loading, onViewAll }) {
  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const currentUserRank = user && userEntry ? Number(userEntry.rank) : null;

  return (
    <div className="leaderboard-panel">
      <div className="panel-header">
        <h3>global records</h3>
      </div>

      <div className="leaderboard-list">
        {!topThree.length ? (
          <p className="empty-leaderboard">
            {loading ? 'loading...' : 'No records yet. Be the first to set a score.'}
          </p>
        ) : null}

        {topThree.map((row, index) => (
          <div key={row.username} className={`leader-row top-${index + 1}`}>
            <span className="rank">{index + 1}</span>
            <span className="user-name">{row.username}</span>
            <span className="score">{Math.round(row.wpm)}</span>
          </div>
        ))}

        {currentUserRank && currentUserRank > 3 ? (
          <>
            <div className="separator" />
            <div className="leader-row current-user">
              <span className="rank">{userEntry.rank}</span>
              <span className="user-name">{user.username}</span>
              <span className="score">{Math.round(userEntry.wpm)}</span>
            </div>
          </>
        ) : null}
      </div>

      <button type="button" className="more-button" onClick={onViewAll}>view all</button>
    </div>
  );
}
