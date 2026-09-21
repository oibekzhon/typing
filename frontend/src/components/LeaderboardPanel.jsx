import { useMemo } from 'react';

export default function LeaderboardPanel({ leaderboard, user, onViewAll }) {
  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const userEntry = useMemo(() => {
    if (!user || !leaderboard.length) return null;
    return leaderboard.find((item) => item.username === user.username) || null;
  }, [leaderboard, user]);

  const currentUserRank = user && userEntry ? userEntry.rank : null;

  return (
    <aside className="leaderboard-panel">
      <div className="panel-header">
        <h3>Global Records</h3>
      </div>

      <div className="leaderboard-list compact">
        {!topThree.length ? <p className="empty-leaderboard">No records yet. Be the first to set a score.</p> : null}
        {topThree.map((row, index) => (
          <div key={row.username} className={`leader-row top-${index + 1}`}>
            <span className="medal">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
            <span className="rank">#{row.rank}</span>
            <span className="user-name">{row.username}</span>
            <span className="score">{Math.round(row.wpm)} WPM</span>
          </div>
        ))}

        {user && currentUserRank && currentUserRank > 3 ? (
          <>
            <div className="separator" />
            <div className="leader-row current-user">
              <span className="rank">#{userEntry.rank}</span>
              <span className="user-name">{user.username}</span>
              <span className="score">{Math.round(userEntry.wpm)} WPM</span>
            </div>
          </>
        ) : null}
      </div>

      <button type="button" className="more-button" onClick={onViewAll}>More</button>
    </aside>
  );
}
