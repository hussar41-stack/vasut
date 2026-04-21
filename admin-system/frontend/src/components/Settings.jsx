import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Camera, Save, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { API_URL } from '../config';

export default function Settings() {
  const { admin, updateAdmin } = useAdminAuth();
  const [profileData, setProfileData] = useState({
    name: admin?.name || '',
    avatar_url: admin?.avatar_url || ''
  });
  const [passwordData, setPasswordData] = useState({
    old: '',
    new: '',
    confirm: ''
  });
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/api/auth/update-profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
          setStatus({ type: 'success', msg: 'Profil sikeresen frissítve!' });
          updateAdmin(res.data.user);
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Hiba a profil frissítésekor.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
        return setStatus({ type: 'error', msg: 'Az új jelszavak nem egyeznek!' });
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/api/auth/change-password`, {
          old_password: passwordData.old,
          new_password: passwordData.new
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
          setStatus({ type: 'success', msg: 'Jelszó sikeresen megváltoztatva!' });
          setPasswordData({ old: '', new: '', confirm: '' });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: e.response?.data?.error || 'Hiba a jelszó módosításakor.' });
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Fiók Beállítások</h1>
        <p style={{ color: 'var(--text-muted)' }}>Profil adatok és biztonság kezelése</p>
      </header>

      {status.msg && (
        <div style={{ 
            padding: '10px 15px', borderRadius: '10px', marginBottom: '1.5rem',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <Lock size={18} />}
          {status.msg}
        </div>
      )}

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Profile Card */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--accent)" /> Profil adatok
          </h3>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
             <div style={{ 
                 width: 100, height: 100, borderRadius: '50%', margin: '0 auto 10px',
                 background: 'rgba(56, 189, 248, 0.1)', border: '2px solid var(--accent)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
             }}>
                {profileData.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <User size={50} color="var(--accent)" />
                )}
             </div>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{admin?.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={formGroup}>
              <label style={labelStyle}>Megjelenítési név</label>
              <input 
                type="text" 
                value={profileData.name} 
                onChange={e => setProfileData({...profileData, name: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}><Camera size={14} /> Profilkép URL</label>
              <input 
                type="text" 
                placeholder="https://example.com/photo.jpg"
                value={profileData.avatar_url} 
                onChange={e => setProfileData({...profileData, avatar_url: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <button className="neon-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={16} /> ADATOK MENTÉSE
            </button>
          </form>
        </section>

        {/* Security Card */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="var(--danger)" /> Biztonság
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Jelszó módosítása az adatok védelme érdekében.</p>

          <form onSubmit={handleChangePassword}>
            <div style={formGroup}>
              <label style={labelStyle}>Régi jelszó</label>
              <input 
                type="password" 
                value={passwordData.old} 
                onChange={e => setPasswordData({...passwordData, old: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>Új jelszó</label>
              <input 
                type="password" 
                value={passwordData.new} 
                onChange={e => setPasswordData({...passwordData, new: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>Új jelszó megerősítése</label>
              <input 
                type="password" 
                value={passwordData.confirm} 
                onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <button className="neon-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Lock size={16} /> JELSZÓ MÓDOSÍTÁSA
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}

const formGroup = { marginBottom: '1.2rem' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' };
const inputStyle = {
  width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px', color: 'white', outline: 'none', fontSize: '0.9rem'
};
