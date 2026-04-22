import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Activity, AlertTriangle, Map as MapIcon, LogOut, Settings, Clock, Users, ShieldAlert, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import TripManager from './TripManager';
import StaffManager from './StaffManager';
import AlertManager from './AlertManager';
import StaffScheduler from './StaffScheduler';
import SettingsView from './Settings';
import ChatManager from './ChatManager';

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [activeView, setActiveView] = useState('dash');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ activeTrips: 0, delays: 0, systemHealth: '...' });
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
    setStats({ activeTrips: 1542, delays: 12, systemHealth: 'OPERATIONAL' });
  };

  const getVehicleIcon = (type) => {
    if (typeof L === 'undefined') return null;
    let url = 'https://cdn-icons-png.flaticon.com/512/725/725350.png'; // bus
    if (type === 'tram') url = 'https://cdn-icons-png.flaticon.com/512/3220/3220084.png';
    if (type === 'metro') url = 'https://cdn-icons-png.flaticon.com/512/3220/3220098.png';
    
    return new L.Icon({
        iconUrl: url,
        iconSize: [32, 32],
    });
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', height: '100vh', background: '#111', color: 'white', flexDirection: 'row' }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: '#1a1a1a', borderRight: '1px solid #333', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' }}>
          <div style={{ width: 35, height: 35, background: '#8D2582', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Activity color="white" size={20} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
            BKK<span style={{ color: '#8D2582' }}>FUTÁR</span> GVK
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: 'dash', icon: <LayoutDashboard size={20}/>, label: 'Forgalmi Központ' },
            { id: 'trips', icon: <Activity size={20}/>, label: 'FUTÁR Járatok' },
            { id: 'chat', icon: <MessageSquare size={20}/>, label: 'Diszpécser Chat' },
            { id: 'schedule', icon: <CalendarIcon size={20}/>, label: 'Vezénylés' },
            { id: 'staff', icon: <Users size={20}/>, label: 'Személyzet' },
            { id: 'settings', icon: <Settings size={20}/>, label: 'Beállítások' },
            { id: 'alert', icon: <AlertTriangle size={20}/>, label: 'Napló' },
          ].map(item => (
            <div key={item.id} 
                onClick={() => setActiveView(item.id)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                    borderRadius: '10px', cursor: 'pointer', marginBottom: '8px',
                    background: activeView === item.id ? 'rgba(141, 37, 130, 0.2)' : 'transparent',
                    color: activeView === item.id ? '#c13db4' : '#666',
                    fontWeight: activeView === item.id ? 600 : 400
                }}
            >
              {item.icon} <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer' }}>Kijelentkezés</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeView === 'dash' && (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>GVK | Operatív Irányítás</h1>
              <div style={{ color: '#666' }}>Budapest, {new Date().toLocaleTimeString()}</div>
            </header>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
               <div className="glass-panel" style={{ padding: '1.5rem', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>AKTÍV JÁRMŰVEK</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8D2582' }}>{stats.activeTrips}</div>
               </div>
               <div className="glass-panel" style={{ padding: '1.5rem', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>KÉSÉSBEN LÉVŐK</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.delays}</div>
               </div>
               <div className="glass-panel" style={{ padding: '1.5rem', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>RENDSZER</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> FUTÁR ONLINE
                  </div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ height: '550px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                {mapReady ? (
                  <MapContainer center={[47.4979, 19.0402]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    
                    <Marker position={[47.4979, 19.0402]} icon={getVehicleIcon('bus')}>
                      <Popup>
                        <div style={{ background: '#111', color: 'white', padding: '10px' }}>
                          <b style={{ color: '#8D2582' }}>7-es Busz (#BPI-007)</b><br/>
                          Járművezető: Kovács János<br/>
                          Telefon: <span style={{ color: '#8D2582' }}>+36 20 123 4567</span><br/>
                          <button style={{ marginTop: 10, width: '100%', padding: '8px', background: '#8D2582', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setActiveView('chat')}>Diszpécser Chat megnyitása</button>
                        </div>
                      </Popup>
                    </Marker>

                    <Marker position={[47.5029, 19.0602]} icon={getVehicleIcon('tram')}>
                      <Popup>
                        <div style={{ background: '#111', color: 'white', padding: '10px' }}>
                          <b style={{ color: '#fbbf24' }}>4-6 Villamos (#2014)</b><br/>
                          Járművezető: Szabó Mária<br/>
                          Telefon: <span style={{ color: '#fbbf24' }}>+36 30 987 6543</span><br/>
                          <button style={{ marginTop: 10, width: '100%', padding: '8px', background: '#fbbf24', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setActiveView('chat')}>Diszpécser Chat megnyitása</button>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : <div style={{ padding: '2rem', color: '#666' }}>Térkép betöltése...</div>}
              </div>

              <div className="glass-panel" style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                 <div style={{ padding: '1.5rem', background: 'rgba(141, 37, 130, 0.1)', borderBottom: '1px solid #333' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={18} color="#8D2582" /> ÉLŐ FORGALMI ADATOK
                    </h3>
                 </div>
                 <div style={{ padding: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>
                        <tr>
                          <th style={{ padding: '10px' }}>JÁRAT</th>
                          <th style={{ padding: '10px' }}>IRÁNY</th>
                          <th style={{ padding: '10px' }}>ÁLLAPOT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { line: '4-6', to: 'Széll Kálmán tér', status: 'OK' },
                          { line: '7', to: 'Újpalota', status: '+3 min' },
                          { line: 'M3', to: 'Kőbánya-Kispest', status: 'OK' }
                        ].map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>{item.line}</td>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>{item.to}</td>
                            <td style={{ padding: '10px', fontSize: '0.9rem', color: item.status === 'OK' ? '#10b981' : '#ef4444' }}>{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'chat' && <ChatManager />}
        {activeView === 'trips' && <TripManager />}
        {activeView === 'schedule' && <StaffScheduler />}
        {activeView === 'staff' && <StaffManager />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'alert' && <AlertManager />}
      </main>
    </div>
  );
}
