import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Wrench, AlertCircle, Users, CheckSquare, Square, Activity, ChevronLeft, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import SettingsView from './Settings';
import DriverChat from './DriverChat';
import MyScheduleView from './MyScheduleView';

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

  const [openSection, setOpenSection] = useState('schedule');
  const toggleSection = (s) => setOpenSection(prev => prev === s ? null : s);

  return (
    <div className="fade-in" style={{ padding: '0', background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <div style={{ background: isOnDuty ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '10px 1rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnDuty ? '#22c55e' : '#ef4444', boxShadow: isOnDuty ? '0 0 8px #22c55e' : 'none' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{isOnDuty ? 'SZOLGÁLATBAN' : 'NEM AKTÍV'}</span>
        </div>
        <button onClick={isOnDuty ? handleLogout : handleSignOn} style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: isOnDuty ? '#ef4444' : '#8D2582', color: 'white' }}>
          {isOnDuty ? 'LEADÁS' : 'FELVÉTEL'}
        </button>
      </div>

      <div style={{ padding: '1rem 1rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, color: '#8D2582' }}>Jegyvizsgálói Terminál</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#8D2582', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>👤</div>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>{admin?.name}</span>
              <button onClick={() => setView('profile')} style={{ background: 'none', border: 'none', color: '#8D2582', fontSize: '0.7rem', cursor: 'pointer' }}>[Profil]</button>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '4px 10px', borderRadius: '5px', fontSize: '0.65rem', cursor: 'pointer' }}>Kijelentkezés</button>
        </div>
      </div>

      <div style={{ padding: '0 1rem 2rem' }}>

        {/* BEOSZTÁS */}
        <AccordionPanel title="Beosztásom" icon="📅" isOpen={openSection === 'schedule'} onToggle={() => toggleSection('schedule')} color="#8D2582">
          <MyScheduleView />
        </AccordionPanel>

        {/* NAPI JÁRATOK */}
        <AccordionPanel title="Napi járatok" icon="🚌" isOpen={openSection === 'routes'} onToggle={() => toggleSection('routes')} color="#009fe3">
          <div style={{ padding: '12px' }}>
            {schedule && schedule.length > 0 ? schedule.map(trip => (
              <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111', borderRadius: '8px', border: '1px solid #222', marginBottom: '6px' }}>
                <div>
                  <b style={{ color: '#009fe3', fontSize: '0.9rem' }}>{trip.train_number}</b>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>{trip.departure_station} ➔ {trip.arrival_station}</div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{new Date(trip.departure_time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )) : <p style={{ fontSize: '0.8rem', color: '#444', textAlign: 'center', padding: '1rem' }}>Nincs mára járat.</p>}
          </div>
        </AccordionPanel>

        {/* ELLENŐRZÉSI LISTA */}
        <AccordionPanel title="Indítási ellenőrzés" icon="✅" isOpen={openSection === 'check'} onToggle={() => toggleSection('check')} color="#10b981">
          <div style={{ padding: '12px', opacity: isOnDuty ? 1 : 0.4 }}>
            {checklist.map(item => (
              <div key={item.id} onClick={() => isOnDuty && toggleCheck(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #1a1a1a', cursor: isOnDuty ? 'pointer' : 'default' }}>
                {item.done ? <CheckSquare color="#10b981" size={18} /> : <CheckSquare color="#333" size={18} />}
                <span style={{ color: item.done ? '#fff' : '#555', fontSize: '0.85rem' }}>{item.text}</span>
              </div>
            ))}
            {!isOnDuty && <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '8px', textAlign: 'center' }}>Csak szolgálatban elérhető</p>}
          </div>
        </AccordionPanel>

        {/* HIBA-JEGY */}
        <AccordionPanel title="Hiba-jegy felvétele" icon="🔧" isOpen={openSection === 'defect'} onToggle={() => toggleSection('defect')} color="#ef4444">
          <div style={{ padding: '12px', opacity: isOnDuty ? 1 : 0.4 }}>
            <textarea disabled={!isOnDuty} placeholder="Hiba leírása..." value={issue} onChange={e => setIssue(e.target.value)}
              style={{ width: '100%', height: '70px', background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.85rem', resize: 'none' }} />
            <button disabled={!isOnDuty} onClick={reportDefect} style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: isOnDuty ? 'pointer' : 'default', opacity: isOnDuty ? 1 : 0.5, fontSize: '0.8rem' }}>
              KÜLDÉS
            </button>
          </div>
        </AccordionPanel>

        {/* GVK CHAT */}
        <AccordionPanel title="GVK Kapcsolat" icon="💬" isOpen={openSection === 'chat'} onToggle={() => toggleSection('chat')} color="#8D2582">
          <div style={{ padding: '12px' }}><DriverChat /></div>
        </AccordionPanel>
      </div>
    </div>
  );
}

function AccordionPanel({ title, icon, isOpen, onToggle, color, children }) {
  return (
    <div style={{ marginBottom: '8px', borderRadius: '12px', overflow: 'hidden', border: isOpen ? `1px solid ${color}40` : '1px solid #1a1a1a', transition: 'all 0.2s' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isOpen ? `${color}12` : '#111', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
        </div>
        <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#555' }}><Activity size={16} /></div>
      </button>
      <div style={{ maxHeight: isOpen ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease', background: '#0a0a0a' }}>{children}</div>
    </div>
  );
}
