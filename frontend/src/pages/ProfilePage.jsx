import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Profil</h2>
      
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem'
          }}>
            👤
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{user.name}</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
                Jegyeim megtekintése
             </button>
             <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>
                Kijelentkezés
             </button>
        </div>
      </div>
    </div>
  );
}
