import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { api } from '../api/client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Client-side fallback vehicles when backend is unreachable
const MOCK_FALLBACK = [
  { id:'m2-1', lat:47.5099, lng:19.0555, label:'M2 Metró',    routeId:'M2', bearing:90,  color:'#e74c3c', type:'metro' },
  { id:'m3-1', lat:47.4872, lng:19.0783, label:'M3 Metró',    routeId:'M3', bearing:180, color:'#3498db', type:'metro' },
  { id:'m4-1', lat:47.4720, lng:19.0620, label:'M4 Metró',    routeId:'M4', bearing:45,  color:'#27ae60', type:'metro' },
  { id:'t4-1', lat:47.5010, lng:19.0450, label:'4-6 Villamos',routeId:'4',  bearing:270, color:'#f39c12', type:'tram'  },
  { id:'t6-1', lat:47.5080, lng:19.0510, label:'4-6 Villamos',routeId:'6',  bearing:90,  color:'#f39c12', type:'tram'  },
  { id:'t2-1', lat:47.4960, lng:19.0700, label:'2 Villamos',  routeId:'2',  bearing:0,   color:'#e74c3c', type:'tram'  },
  { id:'b7-1', lat:47.4880, lng:19.0600, label:'7 Busz',      routeId:'7',  bearing:135, color:'#2980b9', type:'bus'   },
  { id:'b100-1',lat:47.4990,lng:19.0300, label:'100E Airport',routeId:'100E',bearing:225,color:'#2ecc71', type:'bus'   },
  { id:'b15-1', lat:47.5020,lng:19.0650, label:'15 Busz',     routeId:'15', bearing:315, color:'#9b59b6', type:'bus'   },
  { id:'b6a-1', lat:47.4940,lng:19.0550, label:'6A Busz',     routeId:'6A', bearing:60,  color:'#1abc9c', type:'bus'   },
];

// ─── MÁV Stations ────────────────────────────────────────────────────────────
const MAV_STATIONS = [
  { name: 'Budapest Keleti',  lat: 47.5002, lng: 19.0836 },
  { name: 'Budapest Nyugati', lat: 47.5099, lng: 19.0555 },
  { name: 'Budapest Déli',    lat: 47.4918, lng: 18.9866 },
  { name: 'Kelenföld',        lat: 47.4636, lng: 19.0118 },
  { name: 'Győr',             lat: 47.6875, lng: 17.6361 },
  { name: 'Sopron',           lat: 47.6853, lng: 16.5902 },
  { name: 'Szombathely',      lat: 47.2307, lng: 16.6218 },
  { name: 'Pécs',             lat: 46.0786, lng: 18.2267 },
  { name: 'Szolnok',          lat: 47.1765, lng: 20.1815 },
  { name: 'Debrecen',         lat: 47.5311, lng: 21.6261 },
  { name: 'Miskolc',          lat: 48.1067, lng: 20.7794 },
  { name: 'Szeged',           lat: 46.2530, lng: 20.1414 },
  { name: 'Tatabánya',        lat: 47.5722, lng: 18.4007 },
  { name: 'Székesfehérvár',   lat: 47.1931, lng: 18.4119 },
  { name: 'Kecskemét',        lat: 46.8964, lng: 19.6897 },
  { name: 'Nyíregyháza',      lat: 47.9556, lng: 21.7167 },
];

const RAIL_LINES = [
  ['Budapest Keleti','Tatabánya','Győr','Sopron'],
  ['Budapest Keleti','Székesfehérvár','Szombathely'],
  ['Budapest Keleti','Szolnok','Debrecen'],
  ['Budapest Keleti','Miskolc','Nyíregyháza'],
  ['Budapest Keleti','Kecskemét','Szeged'],
  ['Budapest Déli','Székesfehérvár','Pécs'],
];

function coordsFor(route) {
  return route.map(n => MAV_STATIONS.find(s => s.name === n)).filter(Boolean).map(s => [s.lat, s.lng]);
}

// ─── Custom icons ─────────────────────────────────────────────────────────────
function vehicleIcon(type, color, bearing) {
  const emoji = type === 'metro' ? '🚇' : type === 'tram' ? '🚋' : '🚌';
  const bg = color || (type === 'metro' ? '#e74c3c' : type === 'tram' ? '#f39c12' : '#3498db');
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg}; color:#fff; font-size:13px; font-weight:800;
      border-radius:50%; width:28px; height:28px;
      display:flex; align-items:center; justify-content:center;
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 8px ${bg}88, 0 2px 6px rgba(0,0,0,0.5);
      transform: rotate(${bearing}deg);
      transition: transform 0.5s;
    ">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function stationIcon(selected) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:12px; height:12px;
      background:${selected ? '#3b82f6' : '#1e3a5f'};
      border:2px solid ${selected ? '#60a5fa' : '#3b82f6'};
      border-radius:50%;
      box-shadow:0 0 ${selected ? '10px #3b82f6' : '4px rgba(59,130,246,0.5)'};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// ─── Fly to Budapest helper ───────────────────────────────────────────────────
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { duration: 1.2 }); }, [center, zoom, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MapPage() {
  const [mode, setMode]             = useState('bkk'); // 'bkk' | 'mav'
  const [vehicles, setVehicles]     = useState([]);
  const [isMock, setIsMock]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [stats, setStats]           = useState({ bus: 0, tram: 0, metro: 0 });
  const [flyto, setFlyto]           = useState(null);
  const intervalRef = useRef(null);

  const fetchVehicles = useCallback(async () => {
    try {
      // Use the same base URL pattern as the rest of the app
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim().replace(/\/$/, '');
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const resp = await fetch(`${apiBase}/bkk-vehicles`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setVehicles(data.vehicles || []);
      setIsMock(data.mock === true);
      setLastUpdate(new Date().toLocaleTimeString('hu-HU'));
      const bus   = (data.vehicles || []).filter(v => v.type === 'bus').length;
      const tram  = (data.vehicles || []).filter(v => v.type === 'tram').length;
      const metro = (data.vehicles || []).filter(v => v.type === 'metro').length;
      setStats({ bus, tram, metro });
    } catch(e) {
      console.warn('Vehicles fetch error:', e);
      // Local fallback mock
      setVehicles(MOCK_FALLBACK);
      setIsMock(true);
      setLastUpdate(new Date().toLocaleTimeString('hu-HU'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'bkk') {
      fetchVehicles();
      intervalRef.current = setInterval(fetchVehicles, 15000); // refresh every 15s
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, fetchVehicles]);

  const bkk_center = [47.4979, 19.0402];
  const mav_center = [47.3, 19.2];

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Top Toolbar ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.97), rgba(20,30,55,0.97))',
        borderBottom: '1px solid rgba(59,130,246,0.2)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 16, zIndex: 1000,
        backdropFilter: 'blur(10px)', flexShrink: 0, flexWrap: 'wrap'
      }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { setMode('bkk'); setFlyto({ center: bkk_center, zoom: 13 }); }}
            style={{
              background: mode === 'bkk' ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${mode === 'bkk' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              color: '#fff', padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s'
            }}>
            🚌 BKK Élő Járatok
          </button>
          <button
            onClick={() => { setMode('mav'); setFlyto({ center: mav_center, zoom: 7 }); }}
            style={{
              background: mode === 'mav' ? 'linear-gradient(135deg,#a78bfa,#ec4899)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${mode === 'mav' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
              color: '#fff', padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s'
            }}>
            🚆 MÁV Hálózat
          </button>
        </div>

        {/* Stats (BKK mode) */}
        {mode === 'bkk' && !loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <StatChip icon="🚌" label="Busz" count={stats.bus} color="#3498db" />
            <StatChip icon="🚋" label="Villamos" count={stats.tram} color="#f39c12" />
            <StatChip icon="🚇" label="Metró" count={stats.metro} color="#e74c3c" />
            {isMock && (
              <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontStyle:'italic' }}>
                (Szimulált adatok – BKK API kulcs nélkül)
              </span>
            )}
          </div>
        )}

        {/* Live indicator */}
        {mode === 'bkk' && lastUpdate && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
            ÉLŐBEN · {lastUpdate}
          </div>
        )}

        {mode === 'mav' && (
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {MAV_STATIONS.length} MÁV állomás · {RAIL_LINES.length} vasútvonal
          </span>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && mode === 'bkk' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 999,
            background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
          }}>
            <div style={{ fontSize: 40, animation: 'spin 1.5s linear infinite' }}>🚌</div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>BKK FUTÁR adatok betöltése...</div>
          </div>
        )}

        <MapContainer
          center={bkk_center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {flyto && <FlyTo center={flyto.center} zoom={flyto.zoom} />}

          {/* BKK Vehicles */}
          {mode === 'bkk' && vehicles.map(v => (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={vehicleIcon(v.type, v.color, v.bearing)}
              eventHandlers={{ click: () => setSelectedVehicle(v) }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>
                    {v.type === 'metro' ? '🚇' : v.type === 'tram' ? '🚋' : '🚌'} {v.label}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    <div>Viszonylat: <strong>{v.routeId}</strong></div>
                    <div>Irány: {v.bearing}°</div>
                    {v.mock && <div style={{ marginTop: 4, color: '#f59e0b' }}>⚠️ Szimulált adat</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* MÁV Railway lines */}
          {mode === 'mav' && RAIL_LINES.map((line, i) => (
            <Polyline key={i} positions={coordsFor(line)}
              color="#3b82f6" weight={2.5} opacity={0.5} dashArray="8 5" />
          ))}

          {/* MÁV Stations */}
          {mode === 'mav' && MAV_STATIONS.map(st => (
            <Marker
              key={st.name}
              position={[st.lat, st.lng]}
              icon={stationIcon(selectedStation?.name === st.name)}
              eventHandlers={{ click: () => { setSelectedStation(st); setFlyto({ center: [st.lat, st.lng], zoom: 12 }); } }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 140 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>🚉 {st.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>MÁV vasútállomás</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── Legend ── */}
      {mode === 'bkk' && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
          background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '10px 16px',
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            Jelmagyarázat
          </div>
          {[
            { icon: '🚇', label: 'Metró', color: '#e74c3c' },
            { icon: '🚋', label: 'Villamos', color: '#f39c12' },
            { icon: '🚌', label: 'Autóbusz', color: '#3498db' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#cbd5e1' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.icon} {l.label}
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
            🔄 15 másodpercenként frissül
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

function StatChip({ icon, label, count, color }) {
  return (
    <div style={{
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 20, padding: '3px 12px',
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.78rem', color: '#e2e8f0'
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 700, color }}>{count}</span>
      <span style={{ color: '#94a3b8' }}>{label}</span>
    </div>
  );
}
