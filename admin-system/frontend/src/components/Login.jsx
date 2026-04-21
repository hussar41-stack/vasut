import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) navigate('/dashboard');
    } catch (err) {
      alert('Hibás belépési adatok!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div className="glass-panel fade-in" style={formWrapperStyle}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={logoWrapperStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <rect x="4" y="3" width="16" height="16" rx="2" />
              <path d="M4 11h16" />
              <path d="M12 3v8" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: '15px 0 5px' }}>GVK Központ</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Országos Operatív Irányító Rendszer</p>
        </header>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>E-mail cím</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="pl. admin@transporthu.hu"
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Jelszó</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            className="neon-btn" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Azonosítás...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle = {
  height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)', color: 'white'
};

const formWrapperStyle = {
  width: '100%', maxWidth: '420px', padding: '3rem 2.5rem'
};

const logoWrapperStyle = {
  width: '70px', height: '70px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)',
  margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 };

const inputStyle = {
  width: '100%', padding: '12px 15px', background: 'rgba(15, 23, 42, 0.5)', 
  border: '1px solid var(--border)', borderRadius: '8px', color: 'white', outline: 'none', transition: 'all 0.3s'
};
