import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, token } = await api.login(form);
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">🚆</div>
        <h2>Bejelentkezés</h2>
        <p className="auth-subtitle">Üdv vissza! Kérjük, jelentkezz be.</p>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>E-mail cím</label>
            <input type="email" required placeholder="pelda@email.hu"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>Jelszó</label>
            <input type="password" required placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 8 }}>
            {loading ? '⏳ Bejelentkezés...' : '🔑 Bejelentkezés'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Elfelejtett jelszó?</Link>
          <span>·</span>
          <Link to="/register">Regisztráció</Link>
        </div>
      </div>
    </div>
  );
}
