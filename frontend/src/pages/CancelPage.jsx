import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CancelPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>A fizetés sikertelen</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        A tranzakció megszakadt vagy visszautasításra került. A kártyádat nem terheltük meg.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/')} style={{ fontSize: '1.2rem', padding: '12px 24px' }}>
        Vissza a kezdőlapra
      </button>
    </div>
  );
}
