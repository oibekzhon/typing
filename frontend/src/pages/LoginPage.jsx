import { useState } from 'react';

export default function LoginPage({ onLogin, loading }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onLogin(form);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
