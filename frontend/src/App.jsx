import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LeaderboardPanel from './components/LeaderboardPanel';
import TypingTest from './components/TypingTest';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { authApi, leaderboardApi, resultApi } from './services/api';
import './App.css';

const STORAGE_KEY = 'typing_token';

function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setAuthLoading(false));
  }, []);

  const loadLeaderboard = async (nextPage = 1, append = false) => {
    setLeaderboardLoading(true);
    try {
      const data = await leaderboardApi.list(nextPage, 50);
      const rows = data.results || [];
      setLeaderboard((previous) => (append ? [...previous, ...rows] : rows));
      setPage(nextPage);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(1, false);
  }, []);

  const handleLogin = async ({ username, password }) => {
    const data = await authApi.login({ username, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setUser(data.user);
    navigate('/');
  };

  const handleRegister = async ({ username, password, confirmPassword }) => {
    const data = await authApi.register({ username, password, confirmPassword });
    localStorage.setItem(STORAGE_KEY, data.token);
    setUser(data.user);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setResult(null);
    navigate('/login');
  };

  const handleResultSave = async (payload) => {
    if (!user) return;
    try {
      const saved = await resultApi.save(payload);
      setResult(saved);
      await loadLeaderboard(1, false);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const rankSummary = useMemo(() => {
    if (!user || !leaderboard.length) return null;
    return leaderboard.find((entry) => entry.username === user.username) || null;
  }, [leaderboard, user]);

  if (authLoading) {
    return <div className="loading-state">Loading app...</div>;
  }

  return (
    <div
      className="app-shell"
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="topbar">
        <div className="brand-wrap">
          <Link to="/" className="brand">TypeSprint</Link>
        </div>

        <nav className="nav-actions">
          {user ? (
            <>
              <span className="username-pill">{user.username}</span>
              {rankSummary ? <span className="rank-pill">#{rankSummary.rank}</span> : null}
              <button type="button" className="nav-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-button">Login</Link>
              <Link to="/register" className="nav-button">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className="main-layout">
        {user ? (
          <>
            <Routes>
              <Route path="/" element={<TypingTest user={user} onResultSaved={handleResultSave} />} />
              <Route path="/leaderboard" element={<LeaderboardPage leaderboard={leaderboard} user={user} onLoadMore={() => loadLeaderboard(page + 1, true)} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <aside className="side-column">
              <LeaderboardPanel leaderboard={leaderboard} user={user} onViewAll={() => navigate('/leaderboard')} />
            </aside>
          </>
        ) : (
          <section className="auth-page">
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} loading={authLoading} />} />
              <Route path="/register" element={<RegisterPage onRegister={handleRegister} loading={authLoading} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </section>
        )}
      </main>

      {result ? (
        <section className="result-panel">
          <h2>Result</h2>
          <div className="result-grid">
            <div><span>WPM</span><strong>{result.result?.wpm ?? result.best?.wpm ?? 0}</strong></div>
            <div><span>Raw WPM</span><strong>{result.result?.raw_wpm ?? result.best?.raw_wpm ?? 0}</strong></div>
            <div><span>Accuracy</span><strong>{result.result?.accuracy ?? result.best?.accuracy ?? 0}%</strong></div>
            <div><span>Consistency</span><strong>{result.result?.consistency ?? result.best?.consistency ?? 0}%</strong></div>
            <div><span>Errors</span><strong>{result.result?.errors ?? result.best?.errors ?? 0}</strong></div>
            <div><span>Characters</span><strong>{result.result?.correct_chars ?? result.best?.correct_chars ?? 0} / {result.result?.incorrect_chars ?? result.best?.incorrect_chars ?? 0}</strong></div>
            <div><span>Time</span><strong>{result.result?.test_duration ?? result.best?.test_duration ?? 30}s</strong></div>
          </div>
        </section>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}
      {leaderboardLoading ? <div className="loading-state small">Loading leaderboard...</div> : null}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
