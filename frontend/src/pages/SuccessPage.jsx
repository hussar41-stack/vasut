import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      api.confirmPayment(sessionId)
        .then(() => setStatus('success'))
        .catch(err => {
          console.error('Confirmation Error:', err);
          setStatus('error');
          setErrorMsg(err.message);
        });
    } else {
      // Fallback if no session_id (e.g. direct access)
      setStatus('success');
    }
  }, [location]);

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
      {status === 'loading' && (
        <>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: 40, height: 40 }}></div>
          <h2>Fizetés ellenőrzése...</h2>
          <p>Kérlek várj, amíg rögzítjük a jegyedet.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sikeres fizetés!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            A tranzakció sikeresen befejeződött. A megvásárolt jegyeket megtalálod a "Jegyeim" menüpont alatt.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')} style={{ fontSize: '1.2rem', padding: '12px 24px' }}>
            Tovább a Jegyeimhez
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Hoppá! Valami hiba történt.</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
            Tovább a Jegyeimhez
          </button>
        </>
      )}
    </div>
  );
}
