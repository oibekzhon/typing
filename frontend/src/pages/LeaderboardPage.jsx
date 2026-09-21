export default function LeaderboardPage({ leaderboard, user, hasMore, loading, onLoadMore }) {
  return (
    <div className="full-board">
      <h2>leaderboard</h2>

      <div className="leaderboard-table">
        {!leaderboard.length ? (
          <p className="empty-leaderboard">
            {loading ? 'loading...' : 'No records yet. Be the first to set a score.'}
          </p>
        ) : null}

        {leaderboard.map((entry, index) => (
          <div
            key={`${entry.username}-${entry.rank}`}
            className={`leaderboard-row ${user?.username === entry.username ? 'current-user' : ''}`}
          >
            <span className="rank">{entry.rank || index + 1}</span>
            <span className="user-name">{entry.username}</span>
            <span className="score">{Math.round(entry.wpm)} wpm</span>
          </div>
        ))}
      </div>

      {hasMore ? (
        <button type="button" className="more-button" disabled={loading} onClick={onLoadMore}>
          {loading ? 'loading...' : 'more'}
        </button>
      ) : null}
    </div>
  );
}
