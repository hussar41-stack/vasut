import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, PenTool, CheckCircle, ShieldAlert, User, ChevronLeft, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import SettingsView from './Settings';
import DriverChat from './DriverChat';
import MyScheduleView from './MyScheduleView';

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
  const [openSection, setOpenSection] = useState('schedule');

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <div className="fade-in" style={{ padding: '0', background: '#0a0a0a', minHeight: '100vh', color: 'white', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Status Bar */}
      <div style={{ 
          background: isOnDuty ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          padding: '10px 1rem', borderBottom: '1px solid #222',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnDuty ? '#22c55e' : '#ef4444', boxShadow: isOnDuty ? '0 0 8px #22c55e' : 'none' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            {isOnDuty ? 'SZOLGÁLATBAN' : 'NEM AKTÍV'}
          </span>
        </div>
        <button 
          onClick={isOnDuty ? handleLogout : handleSignOn} 
          style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: isOnDuty ? '#ef4444' : '#8D2582', color: 'white' }}
        >
          {isOnDuty ? 'LEADÁS' : 'FELVÉTEL'}
        </button>
      </div>

      {/* Header */}
      <div style={{ padding: '1rem 1rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, color: '#8D2582' }}>Járművezetői Terminál</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#8D2582', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>👤</div>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>{admin?.name}</span>
              <button onClick={() => setView('profile')} style={{ background: 'none', border: 'none', color: '#8D2582', fontSize: '0.7rem', cursor: 'pointer' }}>[Profil]</button>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '4px 10px', borderRadius: '5px', fontSize: '0.65rem', cursor: 'pointer' }}>Kijelentkezés</button>
        </div>
      </div>

      {/* ACCORDION SECTIONS */}
      <div style={{ padding: '0 1rem 2rem' }}>

        {/* === BEOSZTÁS === */}
        <AccordionSection
          title="Beosztásom"
          icon="📅"
          isOpen={openSection === 'schedule'}
          onToggle={() => toggleSection('schedule')}
          color="#8D2582"
        >
          <MyScheduleView />
        </AccordionSection>

        {/* === MAI JÁRATOK === */}
        <AccordionSection
          title="Mai járatok"
          icon="🚌"
          isOpen={openSection === 'routes'}
          onToggle={() => toggleSection('routes')}
          color="#009fe3"
        >
          <div style={{ padding: '12px' }}>
            {schedule && schedule.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {schedule.map(trip => (
                  <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#111', borderRadius: '8px', border: '1px solid #222' }}>
                    <div>
                      <b style={{ color: '#009fe3', fontSize: '0.9rem' }}>{trip.train_number}</b>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{trip.departure_station} ➔ {trip.arrival_station}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{new Date(trip.departure_time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: '0.65rem', color: trip.delay > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                        {trip.delay > 0 ? `+${trip.delay} KÉSIK` : 'IDŐBEN'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#444', textAlign: 'center', padding: '1rem' }}>Nincs mára beosztott járat.</p>
            )}
          </div>
        </AccordionSection>

        {/* === TECHNIKAI ÁLLAPOT === */}
        <AccordionSection
          title="Technikai állapot"
          icon="⚙️"
          isOpen={openSection === 'tech'}
          onToggle={() => toggleSection('tech')}
          color="#22c55e"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px', opacity: isOnDuty ? 1 : 0.4 }}>
            {Object.entries(techStatus).map(([key, val]) => (
              <div key={key} style={{ padding: '12px', background: '#111', borderRadius: '8px', border: '1px solid #222', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>{key === 'traction' ? 'Vontatás' : key === 'brakes' ? 'Fék' : 'Bizt.ber.'}</div>
                <div style={{ color: '#22c55e', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem' }}>
                  <CheckCircle size={12} /> {val}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* === ESEMÉNYJELENTÉS === */}
        <AccordionSection
          title="Esemény jelentése"
          icon="⚠️"
          isOpen={openSection === 'incident'}
          onToggle={() => toggleSection('incident')}
          color="#ef4444"
          badge={activeIncident ? '1' : null}
        >
          <div style={{ padding: '12px', opacity: isOnDuty ? 1 : 0.4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button disabled={!isOnDuty} onClick={() => reportIncident('BIZT.BER. HIBA')} style={incidentBtnStyle('#ef4444')}>
                <ShieldAlert size={18} /> Bizt.ber. hiba
              </button>
              <button disabled={!isOnDuty} onClick={() => reportIncident('JELZŐZAVAR')} style={incidentBtnStyle('#f59e0b')}>
                <AlertTriangle size={18} /> Jelzőzavar
              </button>
            </div>
            {activeIncident && (
              <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', fontSize: '0.8rem' }}>
                <b style={{ color: '#ef4444' }}>AKTÍV:</b> {activeIncident.type}
              </div>
            )}
            {!isOnDuty && <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '8px', textAlign: 'center' }}>Csak szolgálatban elérhető</p>}
          </div>
        </AccordionSection>

        {/* === GVK CHAT === */}
        <AccordionSection
          title="GVK Kapcsolat"
          icon="💬"
          isOpen={openSection === 'chat'}
          onToggle={() => toggleSection('chat')}
          color="#8D2582"
        >
          <div style={{ padding: '12px' }}>
            <DriverChat />
          </div>
        </AccordionSection>

      </div>
    </div>
  );
}

/* === ACCORDION COMPONENT === */
function AccordionSection({ title, icon, isOpen, onToggle, color, badge, children }) {
  return (
    <div style={{ marginBottom: '8px', borderRadius: '12px', overflow: 'hidden', border: isOpen ? `1px solid ${color}40` : '1px solid #1a1a1a', transition: 'all 0.2s' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: isOpen ? `${color}12` : '#111',
        border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
          {badge && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>{badge}</span>
          )}
        </div>
        <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#555' }}>
          <Activity size={16} />
        </div>
      </button>
      <div style={{
        display: isOpen ? 'block' : 'none',
        background: '#0a0a0a'
      }}>
        {children}
      </div>
    </div>
  );
}

const incidentBtnStyle = (color) => ({
  padding: '1rem', background: '#0a0a0a', border: `1px solid ${color}30`,
  borderRadius: '10px', color: 'white', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer'
});
