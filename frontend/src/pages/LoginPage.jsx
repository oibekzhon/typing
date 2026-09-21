import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(form);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">welcome back</p>
        <h1>Log in</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            username
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" />
          </label>
          <label>
            password
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Log in'}</button>
        </form>
        <p className="auth-switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
