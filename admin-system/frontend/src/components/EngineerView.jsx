import React, { useState } from 'react';
import { Activity, AlertTriangle, PenTool, CheckCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function EngineerView() {
  const { admin, logout } = useAdminAuth();
  const [isOnDuty, setIsOnDuty] = useState(localStorage.getItem('onDuty') === 'true');
  const [schedule, setSchedule] = useState(null);
  
  useEffect(() => {
    if (admin?.email) {
      fetchTodaySchedule();
    }
  }, [admin]);

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_URL}/api/staff-schedules?email=${admin.email}&date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // PG uses DATE, we might need to filter manually if endpoint doesn't support 'date' query yet
      const found = res.data.find(s => s.duty_date.startsWith(today));
      setSchedule(found);
    } catch (e) {
      console.error("Scale fetch error", e);
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
            { type, details: 'Mozdonyvezetői észrevétel', trip_id: forda?.trips[0]?.id || 'ISMERETLEN' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setActiveIncident(res.data);
        alert(`ESEMÉNY JELENTVE A GVK FELÉ: ${type}`);
    } catch (err) {
        alert("Hiba a jelentés küldésekor");
    }
  };

  if (!isOnDuty) {
    return (
      <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem', textAlign: 'center' }}>
         <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Activity size={40} color="var(--accent)" />
         </div>
         <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Üdvözöljük, {admin?.name}!</h1>
         <p style={{ color: '#64748b', marginBottom: '2rem' }}>Kérjük, jelentkezzen be szolgálatra a Forda letöltéséhez.</p>
         <button onClick={handleSignOn} className="neon-btn" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
            SZOLGÁLAT MEGKEZDÉSE
         </button>
         <button onClick={handleLogout} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Kijelentkezés</button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '1.5rem', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>Mozdonyvezetői Terminál</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Bejelentkezve: {admin?.name} | Forda: {forda?.id || 'N/A'}</p>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #64748b', color: '#64748b', padding: '5px 10px', borderRadius: '5px', fontSize: '0.7rem' }}>Kijelentkezés</button>
      </header>

      {/* Daily Forda Display */}
      <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>NAPI FELADATOK (ADATBÁZISBÓL)</h3>
        {schedule ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <div>
              <b style={{ color: 'var(--accent)' }}>SZOLGÁLAT: {schedule.shift_start} - {schedule.shift_end}</b> <br/>
              <span style={{ fontSize: '0.85rem' }}>Járatok: {schedule.trip_ids?.join(', ')}</span> <br/>
              <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Megjegyzés: {schedule.notes || 'Nincs'}</span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Nincs mára beosztott feladatod az adatbázisban.</p>
        )}
      </div>

      {/* Tech Status Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '2rem' }}>
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
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Esemény jelentése</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button onClick={() => reportIncident('BIZT.BER. HIBA')} style={incidentBtnStyle('#ef4444')}>
          <ShieldAlert size={20} /> Bizt.ber. hiba
        </button>
        <button onClick={() => reportIncident('JELZŐZAVAR')} style={incidentBtnStyle('#f59e0b')}>
          <AlertTriangle size={20} /> Jelzőzavar
        </button>
      </div>

      {activeIncident && (
        <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <b style={{ color: '#ef4444' }}>AKTÍV ESEMÉNY:</b> {activeIncident.type}
        </div>
      )}
    </div>
  );
}

const incidentBtnStyle = (color) => ({
  padding: '1.5rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${color}40`,
  borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer'
});
