import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPasswordPage() {
  const [step, setStep]             = useState('request'); // request | sent | reset | done
  const [email, setEmail]           = useState('');
  const [token, setToken]           = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [message, setMessage]       = useState(null);

  async function handleRequest(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.resetToken) setToken(res.resetToken); // dev mode only
      setStep('sent');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">🔐</div>

        {step === 'request' && (
          <>
            <h2>Elfelejtett jelszó</h2>
            <p className="auth-subtitle">Add meg az e-mail cím és küldünk egy reset tokent.</p>
            {error && <div className="error-banner">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleRequest}>
              <div className="field">
                <label>E-mail cím</label>
                <input type="email" required placeholder="pelda@email.hu"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', marginTop: 8 }}>
                {loading ? '⏳ Küldés...' : '📧 Reset kérése'}
              </button>
            </form>
          </>
        )}

        {step === 'sent' && (
          <>
            <h2>Kérés elküldve!</h2>
            <p className="auth-subtitle">{message}</p>
            {token && (
              <div className="reset-token-demo">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  🧪 Dev mód – Token (éles rendszerben emailben érkezne):
                </p>
                <code style={{ fontSize: '0.72rem', wordBreak: 'break-all', color: 'var(--accent)' }}>
                  {token}
                </code>
              </div>
            )}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}
              onClick={() => setStep('reset')}>
              Megvan a token → Új jelszó beállítása
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2>Új jelszó beállítása</h2>
            {error && <div className="error-banner">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleReset}>
              <div className="field">
                <label>Reset token</label>
                <input required placeholder="Illeszd be a tokent"
                  value={token} onChange={e => setToken(e.target.value)} />
              </div>
              <div className="field">
                <label>Új jelszó</label>
                <input type="password" required placeholder="Min. 6 karakter"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', marginTop: 8 }}>
                {loading ? '⏳ Mentés...' : '✅ Jelszó mentése'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <h2>✅ Jelszó megváltozott!</h2>
            <p className="auth-subtitle">Most már bejelentkezhetsz az új jelszavaddal.</p>
            <Link className="btn btn-primary"
              to="/login" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
              Bejelentkezés
            </Link>
          </>
        )}

        <div className="auth-links">
          <Link to="/login">← Vissza a bejelentkezéshez</Link>
        </div>
      </div>
    </div>
  );
}
