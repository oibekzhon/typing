import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LeaderboardPanel from './components/LeaderboardPanel';
import TypingTest from './components/TypingTest';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { authApi, leaderboardApi, resultApi, STORAGE_KEY } from './services/api';
import './App.css';

// The live region has to be in the DOM before the message is, or a screen
// reader has nothing to watch and announces nothing.
function ErrorBanner({ message, onDismiss }) {
  return (
    <div role="alert" aria-live="assertive">
      {message ? (
        <button type="button" className="error-banner" onClick={onDismiss} aria-label={`Dismiss error: ${message}`}>
          {message} <span aria-hidden="true">✕</span>
        </button>
      ) : null}
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [myRank, setMyRank] = useState(null);

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

  // api.js drops the dead token; the header still has to stop showing a user
  // who is no longer logged in, and say why the screen changed under them.
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
      setResult(null);
      setMyRank(null);
      setError('Your session has expired. Please log in again.');
      navigate('/login');
    };

    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, [navigate]);

  // Asking the server keeps the rank right for users outside the loaded page.
  const loadMyRank = async () => {
    try {
      const data = await leaderboardApi.current();
      setMyRank(data.entry);
    } catch {
      setMyRank(null);
    }
  };

  useEffect(() => {
    if (user) loadMyRank();
  }, [user]);

  const loadLeaderboard = async (nextPage = 1, append = false) => {
    setLeaderboardLoading(true);
    setError('');
    try {
      const data = await leaderboardApi.list(nextPage, 50);
      const rows = data.results || [];
      setLeaderboard((previous) => (append ? [...previous, ...rows] : rows));
      setTotal(data.total ?? rows.length);
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
    setMyRank(null);
    setError('');
    navigate('/login');
  };

  const handleResultSave = async (payload) => {
    // Dropping a finished run in silence is the worst outcome here - the user
    // typed for a full minute and has no idea why nothing happened.
    if (!user) {
      setError('Log in to save your result to the leaderboard.');
      return;
    }

    setError('');
    try {
      const saved = await resultApi.save(payload);
      setResult(saved);
      await loadLeaderboard(1, false);
      await loadMyRank();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  // postgres hands numeric columns back as strings, so every one of these needs
  // coercing before it is rounded or formatted.
  const resultValue = (key) => Number(result?.result?.[key] ?? result?.best?.[key] ?? 0);

  if (authLoading) {
    return <div className="loading-state">loading...</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">typesprint</Link>

        <nav className="nav-actions">
          {user ? (
            <>
              {myRank ? <span className="rank-pill">#{myRank.rank}</span> : null}
              <span className="username-pill">{user.username}</span>
              <button type="button" className="nav-button" onClick={handleLogout}>logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-button">login</Link>
              <Link to="/register" className="nav-button primary">register</Link>
            </>
          )}
        </nav>
      </header>

      <main className={user ? 'main-layout with-side' : 'main-layout'}>
        {user ? (
          <>
            <div className="main-column">
              <Routes>
                <Route path="/" element={<TypingTest onResultSaved={handleResultSave} />} />
                <Route
                  path="/leaderboard"
                  element={(
                    <LeaderboardPage
                      leaderboard={leaderboard}
                      user={user}
                      hasMore={leaderboard.length < total}
                      loading={leaderboardLoading}
                      onLoadMore={() => loadLeaderboard(page + 1, true)}
                    />
                  )}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {result ? (
                <section className="result-panel">
                  <div className="result-headline">
                    <span>wpm</span>
                    <strong>{Math.round(resultValue('wpm'))}</strong>
                  </div>
                  <div className="result-grid">
                    <div><span>raw</span><strong>{resultValue('raw_wpm').toFixed(1)}</strong></div>
                    <div><span>accuracy</span><strong>{resultValue('accuracy').toFixed(1)}%</strong></div>
                    <div><span>consistency</span><strong>{resultValue('consistency').toFixed(1)}%</strong></div>
                    <div><span>errors</span><strong>{resultValue('errors')}</strong></div>
                    <div><span>characters</span><strong>{resultValue('correct_chars')}/{resultValue('incorrect_chars')}</strong></div>
                    <div><span>time</span><strong>{resultValue('test_duration')}s</strong></div>
                  </div>
                </section>
              ) : null}

              <ErrorBanner message={error} onDismiss={() => setError('')} />
            </div>

            <aside className="side-column">
              <LeaderboardPanel
                leaderboard={leaderboard}
                user={user}
                userEntry={myRank}
                loading={leaderboardLoading}
                onViewAll={() => navigate('/leaderboard')}
              />
            </aside>
          </>
        ) : (
          <section className="auth-page">
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            <ErrorBanner message={error} onDismiss={() => setError('')} />
          </section>
        )}
      </main>
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
