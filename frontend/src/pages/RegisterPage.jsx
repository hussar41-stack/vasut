import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function RegisterPage() {
  const [form, setForm]   = useState({ name: '', email: '', password: '', password2: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password2)
      return setError('A két jelszó nem egyezik meg.');
    if (form.password.length < 6)
      return setError('A jelszó legalább 6 karakter kell legyen.');
    setLoading(true);
    try {
      const { user, token } = await api.register(form);
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
        <h2>Regisztráció</h2>
        <p className="auth-subtitle">Hozz létre egy fiókot a jegyvásárláshoz.</p>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Teljes név</label>
            <input required placeholder="Kiss Péter" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>E-mail cím</label>
            <input type="email" required placeholder="pelda@email.hu" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>Jelszó</label>
            <input type="password" required placeholder="Min. 6 karakter" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="field">
            <label>Jelszó mégegyszer</label>
            <input type="password" required placeholder="••••••••" value={form.password2}
              onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 8 }}>
            {loading ? '⏳ Regisztráció...' : '✅ Regisztráció'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Már van fiókod? Bejelentkezés</Link>
        </div>
      </div>
    </div>
  );
}
