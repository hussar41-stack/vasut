import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, PenTool, CheckCircle, ShieldAlert, User, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import SettingsView from './Settings';

export default function EngineerView() {
  const { admin, logout } = useAdminAuth();
  const [isOnDuty, setIsOnDuty] = useState(localStorage.getItem('onDuty') === 'true');
  const [schedule, setSchedule] = useState(null);
  const [view, setView] = useState('dash'); // 'dash' or 'profile'
  
  useEffect(() => {
    if (admin?.email) {
      fetchTodaySchedule();
    }
  }, [admin]);

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/driver/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(res.data);
    } catch (e) {
      console.error("Schedule fetch error", e);
    }
  };

  const handleSignOn = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        await axios.post(`${API_URL}/api/ops/sign-on`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setIsOnDuty(true);
        localStorage.setItem('onDuty', 'true');
    } catch (e) {
        alert("Sikertelen szolgálatba lépés!");
    }
  };

  const handleLogout = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        if (isOnDuty) {
            await axios.post(`${API_URL}/api/ops/sign-off`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    } catch (e) {}
    localStorage.removeItem('onDuty');
    logout();
  };

  const [techStatus, setTechStatus] = useState({
    traction: 'OK',
    brakes: 'OK',
    safety: 'OK'
  });

  const [activeIncident, setActiveIncident] = useState(null);

  const reportIncident = async (type) => {
    try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.post(`${API_URL}/api/tech-reports`, 
            { type, details: 'Járművezetői észrevétel', trip_id: schedule?.[0]?.id || 'ISMERETLEN' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setActiveIncident(res.data);
        alert(`ESEMÉNY JELENTVE A GVK FELÉ: ${type}`);
    } catch (err) {
        alert("Hiba a jelentés küldésekor");
    }
  };

  if (view === 'profile') {
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <button onClick={() => setView('dash')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
             <ChevronLeft size={24} />
           </button>
           <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Saját Profil</h2>
        </div>
        <SettingsView />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '0', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* Status Bar */}
      <div style={{ 
          background: isOnDuty ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
          padding: '12px 1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOnDuty ? 'var(--success)' : 'var(--danger)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            {isOnDuty ? 'SZOLGÁLATBAN' : 'NINCS SZOLGÁLATBAN'}
          </span>
        </div>
        <button 
          onClick={isOnDuty ? handleLogout : handleSignOn} 
          className="neon-btn" 
          style={{ padding: '6px 15px', fontSize: '0.75rem', background: isOnDuty ? '#ef4444' : '#8D2582' }}
        >
          {isOnDuty ? 'SZOLGÁLAT LEADÁSA' : 'SZOLGÁLAT FELVÉTELE'}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#8D2582' }}>Járművezetői Terminál</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#8D2582', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                {admin?.avatar_url ? <img src={admin.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{admin?.name}</span>
              <button onClick={() => setView('profile')} style={{ background: 'none', border: 'none', color: '#8D2582', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '5px' }}>[Profil]</button>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #64748b', color: '#64748b', padding: '5px 10px', borderRadius: '5px', fontSize: '0.7rem' }}>Kijelentkezés</button>
        </header>

        {/* Smart Route Assignment Display */}
        <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', borderLeft: '4px solid #8D2582' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>RELEVÁNS MAI JÁRATOK ({admin?.location || 'Minden telephely'})</h3>
          {schedule && schedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {schedule.map(trip => (
                <div key={trip.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' 
                }}>
                  <div>
                    <b style={{ color: '#8D2582', fontSize: '1rem' }}>{trip.train_number} járat</b> <br/>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {trip.departure_station} ➔ {trip.arrival_station}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {new Date(trip.departure_time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ 
                        fontSize: '0.75rem', 
                        color: trip.delay > 0 ? 'var(--danger)' : 'var(--success)',
                        fontWeight: 600
                    }}>
                      {trip.delay > 0 ? `+${trip.delay} KÉSIK` : 'IDŐBEN'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Nincs mára beosztott vagy érintett járatod a telephelyeden.</p>
          )}
        </div>

        {/* Tech Status Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '2rem', opacity: isOnDuty ? 1 : 0.5 }}>
          {Object.entries(techStatus).map(([key, val]) => (
            <div key={key} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>{key === 'traction' ? 'Vontatás' : key === 'brakes' ? 'Fék' : 'Bizt.ber.'}</div>
              <div style={{ color: 'var(--success)', fontWeight: 'bold', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <CheckCircle size={14} /> {val}
              </div>
            </div>
          ))}
        </div>

        {/* Incident Reporting */}
        <div style={{ opacity: isOnDuty ? 1 : 0.5 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Esemény jelentése {!isOnDuty && '(Csak szolgálatban!)'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button disabled={!isOnDuty} onClick={() => reportIncident('BIZT.BER. HIBA')} style={incidentBtnStyle('#ef4444', !isOnDuty)}>
              <ShieldAlert size={20} /> Bizt.ber. hiba
            </button>
            <button disabled={!isOnDuty} onClick={() => reportIncident('JELZŐZAVAR')} style={incidentBtnStyle('#f59e0b', !isOnDuty)}>
              <AlertTriangle size={20} /> Jelzőzavar
            </button>
          </div>
        </div>

        {activeIncident && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <b style={{ color: '#ef4444' }}>AKTÍV ESEMÉNY:</b> {activeIncident.type}
          </div>
        )}
      </div>
    </div>
  );
}

const incidentBtnStyle = (color) => ({
  padding: '1.5rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${color}40`,
  borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer'
});
