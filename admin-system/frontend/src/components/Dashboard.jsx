import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Train, AlertTriangle, Map as MapIcon, LogOut, Settings, Clock, Activity, Users, ShieldAlert, Calendar as CalendarIcon, Menu as MenuIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
// Dashboard.jsx - Fix for rendering crash
import TripManager from './TripManager';
import StaffManager from './StaffManager';
import AlertManager from './AlertManager';
import StaffScheduler from './StaffScheduler';
import SettingsView from './Settings';

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [activeView, setActiveView] = useState('dash');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ activeTrips: 0, delays: 0, systemHealth: '...' });
  const [trips, setTrips] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [opReports, setOpReports] = useState({ tech: [], defects: [] });

  useEffect(() => {
    fetchStats();
    fetchOpsReports();
    setTimeout(() => setMapReady(true), 500);
    
    const interval = setInterval(fetchOpsReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpsReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/ops/all-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpReports(res.data);
    } catch (e) {}
  };

  const fetchStats = async () => {
    setStats({ activeTrips: 42, delays: 5, systemHealth: 'OPERATIONAL' });
  };

  // Vonat ikon létrehozása biztonságosan
  const getTrainIcon = () => {
    if (typeof L === 'undefined') return null;
    return new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/725/725350.png',
        iconSize: [32, 32],
    });
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' }}>
      
      {/* Mobile Header (Only visible on small screens) */}
      <header className="mobile-only-header" style={{
          display: window.innerWidth <= 768 ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem', background: '#111',
          borderBottom: '2px solid #2563eb', zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 30, height: 30, background: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Train size={18} color="white" />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>MÁV<span style={{ color: '#2563eb' }}>GVK</span></span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          {mobileMenuOpen ? <span>✕</span> : <span>☰</span>}
        </button>
      </header>


      {/* Sidebar / Mobile Menu */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ 
          width: 280, background: '#0a0a0a', 
          borderRight: '1px solid #222', padding: '2rem', 
          display: 'flex', flexDirection: 'column',
          transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3rem' }}>
          <div style={{ width: 40, height: 40, background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)' }}>
             <Train color="white" size={24} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>
            MÁV<span style={{ color: '#2563eb' }}>GVK</span>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: 'dash', icon: <LayoutDashboard size={20}/>, label: 'GVK Operatív Ir.' },
            { id: 'trips', icon: <Train size={20}/>, label: 'Vonatforgalom' },
            { id: 'schedule', icon: <CalendarIcon size={20}/>, label: 'Személyzeti Vezénylés' },
            { id: 'staff', icon: <Users size={20}/>, label: 'Vasúti Személyzet' },
            { id: 'settings', icon: <Settings size={20}/>, label: 'Beállítások' },
            { id: 'map', icon: <MapIcon size={20}/>, label: 'Élő Hálózati Térkép' },
            { id: 'alert', icon: <AlertTriangle size={20}/>, label: 'Eseménynapló' },
          ].map(item => (
            <div key={item.id} 
                onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                }}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', 
                    borderRadius: '12px', cursor: 'pointer', marginBottom: '10px',
                    background: activeView === item.id ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: activeView === item.id ? '#60a5fa' : '#666',
                    fontWeight: activeView === item.id ? 600 : 400
                }}
            >
              {item.icon} <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #222' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '15px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ 
                width: 32, height: 32, borderRadius: '50%', background: '#2563eb', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                overflow: 'hidden' 
            }}>
              {admin?.avatar_url ? (
                  <img src={admin.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                  <span>👤</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{admin?.name || 'GVK Operátor'}</div>
              <div style={{ fontSize: '0.7rem', color: '#666' }}>{admin?.role?.toUpperCase() || 'MÁV GVK'}</div>
            </div>
          </div>
          <button onClick={logout} style={{ 
            width: '100%', padding: '10px', background: 'transparent', 
            color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
          }}>
            <LogOut size={16}/> Kilépés
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeView === 'dash' && (
          <>
            <header className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>MÁV Operatív Irányítóközpont</h1>
              <div style={{ color: '#666' }}>{new Date().toLocaleString('hu-HU')}</div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', background: '#111', borderRadius: '12px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>Aktív vonatok</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.activeTrips}</div>
              </div>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', animationDelay: '0.1s', background: '#111', borderRadius: '12px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>Vezényelt mozdonyvezetők</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>112</div>
              </div>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', animationDelay: '0.2s', background: '#111', borderRadius: '12px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>Pályavasút Állapot</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                  MŰKÖDŐKÉPES
                </div>
              </div>
            </div>

            {/* Live Map & Action Table Grid */}
            <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
              {/* Map Column */}
              <div className="glass-panel fade-in" style={{ animationDelay: '0.3s', height: '500px', overflow: 'hidden', padding: '10px', background: '#111', borderRadius: '12px' }}>
                <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <Activity size={16} color="#2563eb" /> Élő Vonatkövetés (GPS)
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>LOGS: {new Date().toLocaleTimeString()}</span>
                </div>
                {mapReady ? (
                  <MapContainer center={[47.4979, 19.0402]} zoom={8} style={{ height: 'calc(100% - 45px)', borderRadius: '12px' }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; MÁV-START Zrt.'
                    />
                    {/* Demo Vonat Marker */}
                    <Marker position={[47.500, 19.030]} icon={getTrainIcon()}>
                      <Popup className="dark-popup">
                        <div style={{ color: 'white' }}>
                          <b style={{ color: '#2563eb' }}>EC 142 (Lehár)</b><br/>
                          <b>Személyzet:</b> Kovács J., Szabó M.<br/>
                          <b>Késés:</b> +5 perc<br/>
                          <button style={{ marginTop: 8, padding: '5px 12px', background: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Műveleti lap</button>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div style={{ height: 'calc(100% - 45px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                    Térkép inicializálása...
                  </div>
                )}
              </div>

              {/* Action Table Column */}
              <div className="glass-panel fade-in" style={{ animationDelay: '0.4s', overflow: 'hidden', background: '#111', borderRadius: '12px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                      <Clock size={18} color="#2563eb" /> Forgalmi Napló (Vonatok)
                  </h3>
                </div>
                <div style={{ height: 'calc(100% - 70px)', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#0a0a0a', textAlign: 'left', fontSize: '0.85rem', color: '#444', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ ...thStyle, color: '#444' }}>VONATSZÁM</th>
                          <th style={{ ...thStyle, color: '#444' }}>STÁTUSZ</th>
                          <th style={{ ...thStyle, color: '#444' }}>RÉSZLETEK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { num: 'EC 142', delay: 5, type: 'EC' },
                          { num: 'IC 501', delay: 0, type: 'IC' },
                          { num: 'S 42', delay: 15, type: 'S' },
                          { num: 'RJ 60', delay: 0, type: 'RJ' },
                          { num: 'IC 202', delay: 2, type: 'IC' },
                          { num: 'G43', delay: 0, type: 'G' }
                        ].map((train, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={tdStyle}><b style={{ color: '#2563eb' }}>{train.num}</b></td>
                            <td style={tdStyle}>
                              <span style={{ color: train.delay > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                 {train.delay > 0 ? `+${train.delay}'` : 'OK'}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <button style={{ color: '#444', border: 'none', background: 'none', cursor: 'pointer' }}>👁️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            </div>

            {/* Operational Reports List (New) */}
            <div className="glass-panel fade-in" style={{ marginTop: '1.5rem', animationDelay: '0.5s', padding: '1.5rem' }}>
               <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <ShieldAlert size={18} color="var(--danger)" /> Operatív Eseménynapló (Személyzeti jelentések)
               </h3>
               <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Tech Reports */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>MOZDONYVEZETŐI JELENTÉSEK</h4>
                    <div style={reportListStyle}>
                      {opReports.tech.length === 0 ? <p style={emptyStyle}>Nincs esemény</p> : 
                        opReports.tech.map(r => (
                          <div key={r.id} style={itemStyle}>
                            <b style={{ color: 'var(--danger)' }}>{r.type}</b> - {r.trip_id} <br/>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Küldte: {r.reporter}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Defect Tickets */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>HIBA-JEGYEK (JEGYVIZSGÁLÓK)</h4>
                    <div style={reportListStyle}>
                      {opReports.defects.length === 0 ? <p style={emptyStyle}>Nincs hiba-jegy</p> : 
                        opReports.defects.map(d => (
                          <div key={d.id} style={itemStyle}>
                            <b style={{ color: 'var(--accent)' }}>{d.car_number}</b> - {d.issue} <br/>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Küldte: {d.reporter}</span>
                          </div>
                        ))}
                    </div>
                  </div>
               </div>
            </div>
          </>
        )}

        {activeView === 'trips' && <TripManager />}
        {activeView === 'schedule' && <StaffScheduler />}
        {activeView === 'staff' && <StaffManager />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'alert' && <AlertManager />}
      </main>
    </div>
  );
}

const cardStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const thStyle = { padding: '12px 24px', fontWeight: 600 };
const tdStyle = { padding: '16px 24px', fontSize: '0.95rem' };

const reportListStyle = { 
  display: 'flex', flexDirection: 'column', gap: '8px', 
  maxHeight: '200px', overflowY: 'auto' 
};
const itemStyle = { 
  padding: '10px', background: 'rgba(255,255,255,0.03)', 
  borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' 
};
const emptyStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' };
