import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Wrench, AlertCircle, Users, CheckSquare, Square, Activity, ChevronLeft, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import SettingsView from './Settings';
import DriverChat from './DriverChat';

export default function ConductorView() {
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
            { car_number: '2. kocsi', issue, trip_id: schedule?.[0]?.id || 'ISMERETLEN' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`HIBA-JEGY FELVÉVE: ${issue}`);
        setIssue('');
    } catch (err) {
        alert("Hiba a mentéskor");
    }
  };

  const statusBtnStyle = (color) => ({
    padding: '6px 15px', fontSize: '0.75rem', background: color, border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer'
  });

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
          style={statusBtnStyle(isOnDuty ? '#ef4444' : '#8D2582')}
        >
          {isOnDuty ? 'SZOLGÁLAT LEADÁSA' : 'SZOLGÁLAT FELVÉTELE'}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#8D2582' }}>Jegyvizsgálói Terminál</h1>
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
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>NAPI JÁRATOK ({admin?.location || 'Minden telephely'})</h3>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Nincs mára beosztott vagy érintett járatod a telephelyeden.</p>
          )}
        </div>

        {/* Preparation Checklist */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', opacity: isOnDuty ? 1 : 0.5 }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={18} color="#8D2582" /> Indítási előkészítés {!isOnDuty && '(Csak szolgálatban!)'}
          </h3>
          <div style={{ marginTop: '1rem' }}>
            {checklist.map(item => (
              <div 
                key={item.id} 
                onClick={() => isOnDuty && toggleCheck(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: isOnDuty ? 'pointer' : 'default' }}
              >
                {item.done ? <CheckSquare color="#10b981" size={20} /> : <CheckSquare color="#64748b" size={20} opacity={0.3} />}
                <span style={{ color: item.done ? '#fff' : '#64748b' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiba-jegy */}
        <div className="glass-panel" style={{ padding: '1.5rem', opacity: isOnDuty ? 1 : 0.5 }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <AlertCircle size={18} color="#ef4444" /> Hiba-jegy felvétele {!isOnDuty && '(Csak szolgálatban!)'}
          </h3>
          <textarea 
            disabled={!isOnDuty}
            placeholder="Hiba leírása..."
            value={issue}
            onChange={e => setIssue(e.target.value)}
            style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', margin: '1rem 0' }}
          />
          <button disabled={!isOnDuty} onClick={reportDefect} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: isOnDuty ? 'pointer' : 'default', opacity: isOnDuty ? 1 : 0.5 }}>
            MENTÉS ÉS KÜLDÉS
          </button>
        </div>

        {/* GVK Diszpécser Chat - csak saját jármű szála */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#8D2582" /> GVK Kapcsolat
          </h3>
          <DriverChat
            vehicleId={admin?.vehicle_id || `DRV-${admin?.name?.split(' ')[1]?.toUpperCase() || 'KOND'}`}
            driverName={admin?.name || 'Ismeretlen Kalauz'}
            channel="bus"
          />
        </div>
      </div>
    </div>
  );
}
