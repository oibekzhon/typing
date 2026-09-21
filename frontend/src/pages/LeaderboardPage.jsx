export default function LeaderboardPage({ leaderboard, user, onLoadMore }) {
  return (
    <div className="full-board">
      <h2>Leaderboard</h2>
      <div className="leaderboard-table">
        {!leaderboard.length ? <p className="empty-leaderboard">No records yet. Be the first to set a score.</p> : null}
        {leaderboard.map((entry, index) => (
          <div key={`${entry.username}-${entry.rank}`} className={`leaderboard-row ${user?.username === entry.username ? 'current-user' : ''}`}>
            <span>#{entry.rank || index + 1}</span>
            <span>{entry.username}</span>
            <strong>{Math.round(entry.wpm)} WPM</strong>
          </div>
        ))}
      </div>
      <button type="button" className="more-button" onClick={onLoadMore}>More</button>
    </div>
  );
}
