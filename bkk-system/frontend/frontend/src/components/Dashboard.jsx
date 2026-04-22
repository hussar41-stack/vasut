import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Activity, AlertTriangle, Map as MapIcon, LogOut, Settings, Clock, Users, ShieldAlert, Calendar as CalendarIcon } from 'lucide-react';
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
  const getActivityIcon = () => {
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
          padding: '1rem', background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border)', zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 30, height: 30, background: '#8D2582', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>BKK<span style={{ color: '#8D2582' }}>GVK</span></span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          {mobileMenuOpen ? <span style={{ fontSize: '24px' }}>✕</span> : <span style={{ fontSize: '24px' }}>☰</span>}
        </button>
      </header>

      {/* Sidebar / Mobile Menu */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ 
          width: 280, background: 'rgba(15, 23, 42, 0.95)', 
          borderRight: '1px solid var(--border)', padding: '2rem', 
          display: 'flex', flexDirection: 'column',
          transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3rem' }}>
          <div style={{ width: 40, height: 40, background: '#8D2582', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--accent-glow)' }}>
             <Activity color="white" size={24} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>
            BKK<span style={{ color: '#8D2582' }}>GVK</span>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: 'dash', icon: <LayoutDashboard size={20}/>, label: 'FUTÁR Központ' },
            { id: 'trips', icon: <Activity size={20}/>, label: 'Járatkezelés' },
            { id: 'schedule', icon: <CalendarIcon size={20}/>, label: 'Vezénylés' },
            { id: 'staff', icon: <Users size={20}/>, label: 'Személyzet' },
            { id: 'settings', icon: <Settings size={20}/>, label: 'Beállítások' },
            { id: 'map', icon: <MapIcon size={20}/>, label: 'Élő Forgalom' },
            { id: 'alert', icon: <AlertTriangle size={20}/>, label: 'Napló' },
          ].map(item => (
            <div key={item.id} 
                onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                }}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', 
                    borderRadius: '12px', cursor: 'pointer', marginBottom: '10px',
                    background: activeView === item.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    color: activeView === item.id ? '#8D2582' : 'var(--text-muted)',
                    fontWeight: activeView === item.id ? 600 : 400
                }}
            >
              {item.icon} <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '15px' }}>
            <div style={{ 
                width: 32, height: 32, borderRadius: '50%', background: '#8D2582', 
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
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{admin?.name || 'Operátor'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{admin?.role?.toUpperCase() || 'GVK'}</div>
            </div>
          </div>
          <button onClick={logout} className="neon-btn" style={{ 
            width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)', border: '1px solid var(--danger)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', gap: '8px' 
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
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>FUTÁR Központ Áttekintés</h1>
              <div style={{ color: '#4a5568' }}>{new Date().toLocaleString('hu-HU')}</div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Aktív vonatok</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8D2582', textShadow: '0 0 10px var(--accent-glow)' }}>{stats.activeTrips}</div>
              </div>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', animationDelay: '0.1s' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Személyzet szolg.</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>24 <span style={{fontSize: '1rem', color: 'var(--text-muted)' }}>fő</span></div>
              </div>
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', animationDelay: '0.2s' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Rendszer Állapot</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
                  {stats.systemHealth}
                </div>
              </div>
            </div>

            {/* Live Map & Action Table Grid */}
            <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
              {/* Map Column */}
              <div className="glass-panel fade-in" style={{ animationDelay: '0.3s', height: '500px', overflow: 'hidden', padding: '10px' }}>
                <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color="#8D2582" /> Élő Forgalmi Helyzet
                    </h3>
                    <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)', color: '#8D2582', padding: '2px 8px', borderRadius: '10px' }}>LOGS: {new Date().toLocaleTimeString()}</span>
                </div>
                {mapReady ? (
                  <MapContainer center={[47.4979, 19.0402]} zoom={11} style={{ height: 'calc(100% - 45px)', borderRadius: '12px' }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    />
                    {/* Demo Vonat Marker */}
                    <Marker position={[47.500, 19.030]} icon={getActivityIcon()}>
                      <Popup className="dark-popup">
                        <div style={{ color: 'white' }}>
                          <b style={{ color: '#8D2582' }}>EC 142 (Lehár)</b><br/>
                          <b>Személyzet:</b> Kovács J., Szabó M.<br/>
                          <b>Késés:</b> +5 perc<br/>
                          <button style={{ marginTop: 8, padding: '5px 12px', background: '#8D2582', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Módosítás</button>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div style={{ height: 'calc(100% - 45px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Térkép inicializálása...
                  </div>
                )}
              </div>

              {/* Action Table Column - FUTÁR LIVE BOARD */}
              <div className="glass-panel fade-in" style={{ animationDelay: '0.4s', overflow: 'hidden', borderTop: '4px solid #8D2582' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(141, 37, 130, 0.05)' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                      <Activity size={18} color="#8D2582" /> FUTÁR ÉLŐ TÁBLA
                  </h3>
                  <div style={{ display: 'flex', gap: '5px' }}>
                     <div className="badge" style={{ background: '#8D2582', color: 'white', fontSize: '0.6rem' }}>ÉLŐ</div>
                     <div className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.6rem' }}>BKK</div>
                  </div>
                </div>
                <div style={{ height: 'calc(100% - 70px)', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(15, 23, 42, 0.6)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ ...thStyle, paddingLeft: '15px' }}>JÁRAT / RENDZSAM</th>
                          <th style={thStyle}>IRÁNY</th>
                          <th style={thStyle}>KÉSÉS</th>
                          <th style={{ ...thStyle, textAlign: 'right', paddingRight: '15px' }}>INFO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { line: '4-6', id: '2014', to: 'Széll Kálmán tér', delay: 0 },
                          { line: '7', id: 'BPI-007', to: 'Újpalota', delay: 3 },
                          { line: 'M3', id: '312', to: 'Kőbánya-Kispest', delay: -1 },
                          { line: '105', id: 'NCZ-560', to: 'Apor Vilmos tér', delay: 8 },
                          { line: 'M4', id: '405', to: 'Kelenföld vasútállomás', delay: 0 },
                          { line: '9', id: 'BPO-123', to: 'Kőbánya alsó', delay: 2 },
                          { line: '72', id: '702', to: 'Orczy tér', delay: 0 }
                        ].map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ ...tdStyle, paddingLeft: '15px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ 
                                      minWidth: '35px', height: '24px', background: item.line.startsWith('M') ? '#ef4444' : '#8D2582', 
                                      borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      fontWeight: 'bold', fontSize: '0.8rem', color: 'white' 
                                  }}>
                                    {item.line}
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{item.id}</span>
                               </div>
                            </td>
                            <td style={tdStyle}>
                               <span style={{ fontSize: '0.8rem' }}>{item.to}</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ 
                                  color: item.delay > 0 ? '#ef4444' : item.delay < 0 ? '#10b981' : 'var(--text-muted)', 
                                  fontSize: '0.8rem', fontWeight: 'bold' 
                               }}>
                                 {item.delay > 0 ? `+${item.delay}'` : item.delay < 0 ? 'Siet' : 'OK'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '15px' }}>
                              <button style={{ color: '#8D2582', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Esemény</button>
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
                            <b style={{ color: '#8D2582' }}>{d.car_number}</b> - {d.issue} <br/>
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
