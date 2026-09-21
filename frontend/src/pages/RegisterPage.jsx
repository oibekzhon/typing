import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage({ onRegister }) {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
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
      await onRegister(form);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">join typesprint</p>
        <h1>Create account</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            username
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" />
          </label>
          <label>
            password
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
          </label>
          <label>
            confirm password
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
