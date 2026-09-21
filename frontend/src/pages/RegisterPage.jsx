import { useState } from 'react';

export default function RegisterPage({ onRegister, loading }) {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onRegister(form);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Create your account</p>
        <h1>Register</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
          </label>
          <label>
            Confirm Password
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        </form>
      </div>
    </div>
  );
}
