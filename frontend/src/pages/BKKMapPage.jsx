import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Statikus fallback ha a backend nem elérhető
const MOCK_FALLBACK = [
  { id:'m2-1', lat:47.5099, lng:19.0555, label:'M2 Metró',     routeId:'M2',  bearing:90,  color:'#e74c3c', type:'metro' },
  { id:'m3-1', lat:47.4872, lng:19.0783, label:'M3 Metró',     routeId:'M3',  bearing:180, color:'#3498db', type:'metro' },
  { id:'m4-1', lat:47.4720, lng:19.0620, label:'M4 Metró',     routeId:'M4',  bearing:45,  color:'#27ae60', type:'metro' },
  { id:'t4-1', lat:47.5010, lng:19.0450, label:'4-6 Villamos', routeId:'4',   bearing:270, color:'#f39c12', type:'tram'  },
  { id:'t6-1', lat:47.5080, lng:19.0510, label:'4-6 Villamos', routeId:'6',   bearing:90,  color:'#f39c12', type:'tram'  },
  { id:'t2-1', lat:47.4960, lng:19.0700, label:'2 Villamos',   routeId:'2',   bearing:0,   color:'#e74c3c', type:'tram'  },
  { id:'t56-1',lat:47.4820, lng:19.0410, label:'56 Villamos',  routeId:'56',  bearing:200, color:'#1abc9c', type:'tram'  },
  { id:'b7-1', lat:47.4880, lng:19.0600, label:'7 Busz',       routeId:'7',   bearing:135, color:'#2980b9', type:'bus'   },
  { id:'b7e-1',lat:47.4900, lng:19.0750, label:'7E Busz',      routeId:'7E',  bearing:315, color:'#2980b9', type:'bus'   },
  { id:'b100', lat:47.4990, lng:19.0300, label:'100E Airport', routeId:'100E',bearing:225, color:'#2ecc71', type:'bus'   },
  { id:'b15-1',lat:47.5020, lng:19.0650, label:'15 Busz',      routeId:'15',  bearing:315, color:'#9b59b6', type:'bus'   },
  { id:'b6a-1',lat:47.4940, lng:19.0550, label:'6A Busz',      routeId:'6A',  bearing:60,  color:'#1abc9c', type:'bus'   },
  { id:'b26-1',lat:47.5060, lng:19.0350, label:'26 Busz',      routeId:'26',  bearing:10,  color:'#e67e22', type:'bus'   },
  { id:'b9-1', lat:47.5030, lng:19.0800, label:'9 Busz',       routeId:'9',   bearing:180, color:'#c0392b', type:'bus'   },
];

function vehicleIcon(type, color, textColor, label) {
  const emoji = type === 'metro' ? '🚇' : type === 'tram' ? '🚋' : type === 'trolley' ? '🚎' : '🚌';
  const bg = color || (type === 'metro' ? '#e74c3c' : type === 'tram' ? '#f39c12' : '#3498db');
  const txt = textColor || '#ffffff';
  
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg}; color:${txt}; font-size:10px; font-weight:900;
      border-radius:50%; width:32px; height:32px;
      display:flex; align-items:center; justify-content:center;
      border:2.5px solid rgba(255,255,255,0.9);
      box-shadow:0 0 12px ${bg}aa, 0 3px 10px rgba(0,0,0,0.6);
      cursor:pointer;
      transition: transform 0.3s ease;
      position: relative;
    ">
      <div style="position:absolute; top:-2px; right:-2px; font-size:12px;">${emoji}</div>
      <span style="margin-top:2px;">${label.substring(0, 3)}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function StatPill({ icon, label, count, color }) {
  return (
    <div style={{
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 20, padding: '4px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: '0.8rem'
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 800, color }}>{count}</span>
      <span style={{ color: '#94a3b8' }}>{label}</span>
    </div>
  );
}

export default function BKKMapPage() {
  const [vehicles, setVehicles]     = useState([]);
  const [mapMode, setMapMode]       = useState('loading'); // 'real' | 'ai_simulated' | 'mock'
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter, setFilter]         = useState('all'); 
  const intervalRef = useRef(null);

  const fetchVehicles = useCallback(async () => {
    try {
      const base = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim().replace(/\/$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const resp = await fetch(`${apiBase}/bkk-vehicles`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setVehicles(data.vehicles || []);
      setMapMode(data.mode || 'real');
      setLastUpdate(new Date().toLocaleTimeString('hu-HU'));
    } catch (e) {
      console.warn('BKK fetch hiba:', e.message);
      setVehicles(MOCK_FALLBACK);
      setMapMode('mock');
      setLastUpdate(new Date().toLocaleTimeString('hu-HU'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    intervalRef.current = setInterval(fetchVehicles, 15000);
    return () => clearInterval(intervalRef.current);
  }, [fetchVehicles]);

  const filtered = filter === 'all' ? vehicles : vehicles.filter(v => v.type === filter);
  const counts = {
    metro: vehicles.filter(v => v.type === 'metro').length,
    tram:  vehicles.filter(v => v.type === 'tram').length,
    trolley: vehicles.filter(v => v.type === 'trolley').length,
    bus:   vehicles.filter(v => v.type === 'bus').length,
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,15,30,0.98), rgba(15,25,45,0.98))',
        borderBottom: '1px solid rgba(59,130,246,0.15)',
        padding: '10px 20px', zIndex: 1000, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        backdropFilter: 'blur(12px)'
      }}>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>🚌</span>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>BKK Élő Járatok</span>
          {mapMode === 'real' && (
            <span style={{
              fontSize: '0.68rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '1px 8px',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              ÉLŐBEN
            </span>
          )}
          {mapMode === 'ai_simulated' && (
            <span style={{
              fontSize: '0.68rem', background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '1px 8px',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 1.8s infinite' }}></span>
              AI SZIMULÁCIÓ
            </span>
          )}
          {mapMode === 'mock' && (
            <span style={{
              fontSize: '0.68rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '1px 8px'
            }}>
              DEMÓ MÓD
            </span>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

        {/* Stats */}
        {!loading && (
          <>
            <StatPill icon="🚇" label="Metró"    count={counts.metro} color="#e74c3c" />
            <StatPill icon="🚋" label="Villamos" count={counts.tram}  color="#f39c12" />
            <StatPill icon="🚎" label="Troli"    count={counts.trolley} color="#e53e3e" />
            <StatPill icon="🚌" label="Busz"     count={counts.bus}   color="#3498db" />
          </>
        )}

        {/* Filter */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[
            { key: 'all',     label: 'Összes',    color: '#64748b' },
            { key: 'metro',   label: '🚇 Metró',  color: '#e74c3c' },
            { key: 'tram',    label: '🚋 Villamos',color: '#f39c12' },
            { key: 'trolley', label: '🚎 Troli',   color: '#e53e3e' },
            { key: 'bus',     label: '🚌 Busz',    color: '#3498db' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? `${f.color}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === f.key ? f.color : 'rgba(255,255,255,0.08)'}`,
              color: filter === f.key ? f.color : '#94a3b8',
              padding: '4px 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: filter === f.key ? 700 : 400,
              transition: 'all 0.2s'
            }}>{f.label}</button>
          ))}
        </div>

        {/* Last update */}
        {lastUpdate && (
          <span style={{ fontSize: '0.72rem', color: '#475569', flexShrink: 0 }}>
            🕒 {lastUpdate}
          </span>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 999,
            background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
          }}>
            <div style={{ fontSize: 48, animation: 'spin 1.2s linear infinite' }}>🚌</div>
            <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem' }}>
              BKK FUTÁR adatok betöltése...
            </div>
          </div>
        )}

        <MapContainer
          center={[47.4979, 19.0402]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {filtered.map(v => (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={vehicleIcon(v.type, v.color, v.textColor, v.label)}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>
                    {v.type === 'metro' ? '🚇' : v.type === 'tram' ? '🚋' : v.type === 'trolley' ? '🚎' : '🚌'} {v.label}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <tbody>
                      <tr><td style={{ color: '#64748b', paddingRight: 8 }}>Vonal</td><td style={{ fontWeight: 700 }}>{v.routeId?.replace('BKK_', '') || 'N/A'}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Típus</td><td style={{ fontWeight: 700 }}>{v.type.toUpperCase()}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Megálló</td><td style={{ fontWeight: 700, color: '#3b82f6' }}>{v.stopName || 'Úton...'}</td></tr>
                    </tbody>
                  </table>
                  {mapMode === 'ai_simulated' && <div style={{ marginTop: 8, color: '#a78bfa', fontSize: '0.72rem', fontWeight:600 }}>🧠 AI-becsült pozíció</div>}
                  {mapMode === 'mock' && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: '0.72rem' }}>⚠️ Demo adat (Szerver offline)</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ── Legend ── */}
        <div style={{
          position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
          background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
            Jelmagyarázat
          </div>
          {[
            { icon: '🚇', label: 'Metró',     color: '#e74c3c' },
            { icon: '🚋', label: 'Villamos',   color: '#f39c12' },
            { icon: '🚌', label: 'Autóbusz',   color: '#3498db' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.icon} {l.label}
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
            🔄 Frissítés: 15 másodperc
          </div>
          {mapMode === 'ai_simulated' && (
            <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#a78bfa', fontWeight: 600 }}>
              🧠 AI-val becsült élőkép
            </div>
          )}
          {mapMode === 'mock' && (
            <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#f59e0b' }}>
              ⚠️ Szimulált demo adatok
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
        @keyframes spin  { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      `}</style>
    </div>
  );
}
