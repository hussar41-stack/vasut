import React, { useState } from 'react';
import { ClipboardCheck, Wrench, AlertCircle, Users, CheckSquare, Square, Activity } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function ConductorView() {
  const { admin, logout } = useAdminAuth();
  const [isOnDuty, setIsOnDuty] = useState(localStorage.getItem('onDuty') === 'true');
  const forda = admin?.forda;

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

  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Kocsi-világítás ellenőrzése', done: true },
    { id: 2, text: 'Utastájékoztatás működik', done: true },
    { id: 3, text: 'Zárfékpróba sikeres', done: false },
    { id: 4, text: 'Személyzet hiánytalan', done: true },
  ]);

  const toggleCheck = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const [issue, setIssue] = useState('');

  const reportDefect = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        await axios.post(`${API_URL}/api/defects`, 
            { car_number: '2. kocsi', issue, trip_id: forda?.trips[0]?.id || 'ISMERETLEN' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`HIBA-JEGY FELVÉVE: ${issue}`);
        setIssue('');
    } catch (err) {
        alert("Hiba a mentéskor");
    }
  };

  if (!isOnDuty) {
    return (
      <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem', textAlign: 'center' }}>
         <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Activity size={40} color="#fbbf24" />
         </div>
         <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Üdvözöljük, {admin?.name}!</h1>
         <p style={{ color: '#64748b', marginBottom: '2rem' }}>Kérjük, jelentkezzen be szolgálatra a kocsi-beosztás letöltéséhez.</p>
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

      {/* Forda Summary for Conductor */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid #fbbf24' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>NAPI JÁRATOK</h3>
        {forda?.trips ? forda.trips.map(trip => (
          <div key={trip.id} style={{ fontSize: '0.9rem', padding: '5px 0' }}>
            <b style={{ color: '#fbbf24' }}>{trip.id}</b> | {trip.from} ➔ {trip.to}
          </div>
        )) : <p style={{ fontSize: '0.8rem' }}>Nincs kiírt járat.</p>}
      </div>

      {/* Preparation Checklist */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={18} color="#fbbf24" /> Indítási előkészítés
        </h3>
        <div style={{ marginTop: '1rem' }}>
          {checklist.map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleCheck(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
            >
              {item.done ? <CheckSquare color="#10b981" size={20} /> : <Square color="#64748b" size={20} />}
              <span style={{ color: item.done ? '#fff' : '#64748b' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hiba-jegy */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <AlertCircle size={18} color="#ef4444" /> Hiba-jegy felvétele
        </h3>
        <textarea 
          placeholder="Hiba leírása..."
          value={issue}
          onChange={e => setIssue(e.target.value)}
          style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', margin: '1rem 0' }}
        />
        <button onClick={reportDefect} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold' }}>
          MENTÉS ÉS KÜLDÉS
        </button>
      </div>
    </div>
  );
}
