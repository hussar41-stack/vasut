import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const STATIONS = [
  { name: 'Budapest Keleti',  lat: 47.5002, lng: 19.0836, lines: ['IC','EC','RAILJET'] },
  { name: 'Budapest Nyugati', lat: 47.5099, lng: 19.0555, lines: ['IC','FAST'] },
  { name: 'Budapest Déli',    lat: 47.4918, lng: 18.9866, lines: ['IC','LOCAL'] },
  { name: 'Kelenföld',        lat: 47.4636, lng: 19.0118, lines: ['LOCAL','FAST'] },
  { name: 'Tatabánya',        lat: 47.5722, lng: 18.4007, lines: ['FAST','LOCAL'] },
  { name: 'Komárom',          lat: 47.7320, lng: 18.1249, lines: ['FAST','LOCAL'] },
  { name: 'Győr',             lat: 47.6875, lng: 17.6361, lines: ['IC','EC','RAILJET'] },
  { name: 'Sopron',           lat: 47.6853, lng: 16.5902, lines: ['FAST','LOCAL'] },
  { name: 'Szombathely',      lat: 47.2307, lng: 16.6218, lines: ['IC','FAST'] },
  { name: 'Zalaegerszeg',     lat: 46.8389, lng: 16.8433, lines: ['LOCAL','FAST'] },
  { name: 'Veszprém',         lat: 47.0931, lng: 17.9089, lines: ['LOCAL'] },
  { name: 'Székesfehérvár',   lat: 47.1931, lng: 18.4119, lines: ['IC','FAST'] },
  { name: 'Kaposvár',         lat: 46.3590, lng: 17.7962, lines: ['LOCAL','FAST'] },
  { name: 'Pécs',             lat: 46.0786, lng: 18.2267, lines: ['IC','FAST'] },
  { name: 'Szolnok',          lat: 47.1765, lng: 20.1815, lines: ['IC','FAST'] },
  { name: 'Kecskemét',        lat: 46.8964, lng: 19.6897, lines: ['IC','FAST'] },
  { name: 'Szeged',           lat: 46.2530, lng: 20.1414, lines: ['IC','FAST'] },
  { name: 'Debrecen',         lat: 47.5311, lng: 21.6261, lines: ['IC','EC'] },
  { name: 'Nyíregyháza',      lat: 47.9556, lng: 21.7167, lines: ['IC','FAST'] },
  { name: 'Miskolc',          lat: 48.1067, lng: 20.7794, lines: ['IC','FAST'] },
  { name: 'Eger',             lat: 47.9028, lng: 20.3769, lines: ['LOCAL','FAST'] },
];

const RAIL_LINES = [
  ['Budapest Keleti','Tatabánya','Komárom','Győr','Sopron'],
  ['Budapest Keleti','Székesfehérvár','Veszprém','Szombathely','Zalaegerszeg'],
  ['Budapest Déli','Kelenföld','Székesfehérvár','Kaposvár','Pécs'],
  ['Budapest Keleti','Szolnok','Debrecen'],
  ['Budapest Keleti','Miskolc','Nyíregyháza'],
  ['Budapest Keleti','Kecskemét','Szeged'],
  ['Budapest Keleti','Eger'],
];

const BADGE_COLORS = { IC:'#a78bfa', EC:'#fbbf24', RAILJET:'#f87171', FAST:'#38bdf8', LOCAL:'#86efac' };

function coordsFor(route) {
  return route.map(n => STATIONS.find(s => s.name === n)).filter(Boolean).map(s => [s.lat, s.lng]);
}

function trainIcon(type, color, label) {
  const emoji = type === 'IC' || type === 'RAILJET' || type === 'EC' ? '🚅' : '🚆';
  const bg = color || '#3b82f6';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg}; color:#fff; font-size:9px; font-weight:900;
      border-radius:6px; width:34px; height:24px;
      display:flex; align-items:center; justify-content:center;
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 0 10px ${bg}aa, 0 3px 8px rgba(0,0,0,0.5);
      cursor:pointer;
      transition: all 5s linear;
      position: relative;
    ">
      <div style="position:absolute; top:-8px; left:50%; transform:translateX(-50%); font-size:12px;">${emoji}</div>
      <span>${label.substring(0, 5)}</span>
    </div>`,
    iconSize: [34, 24],
    iconAnchor: [17, 12],
  });
}

function stationDot(selected) {
  const size = selected ? 18 : 12;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${selected ? '#3b82f6' : '#1e2a40'};
      border:2px solid ${selected ? '#60a5fa' : '#3b82f6'};
      border-radius:50%;
      box-shadow:0 0 ${selected ? '12px #3b82f6' : '4px rgba(59,130,246,0.5)'};
      transition: all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [lineFilter, setLineFilter] = useState('all');
  const [trains, setTrains] = useState([]);
  const [mapMode, setMapMode] = useState('loading');
  const intervalRef = useRef(null);

  const fetchTrains = useCallback(async () => {
    try {
      const base = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim().replace(/\/$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const resp = await fetch(`${apiBase}/mav-trains`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setTrains(data.trains || []);
      setMapMode(data.mode || 'real');
    } catch (e) {
      console.warn('MÁV fetch hiba:', e.message);
      setMapMode('error');
    }
  }, []);

  useEffect(() => {
    fetchTrains();
    intervalRef.current = setInterval(fetchTrains, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchTrains]);

  const lineTypes = ['IC', 'EC', 'RAILJET', 'FAST', 'LOCAL'];
  const filteredStations = lineFilter === 'all'
    ? STATIONS
    : STATIONS.filter(s => s.lines.includes(lineFilter));

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,15,30,0.98), rgba(15,25,45,0.98))',
        borderBottom: '1px solid rgba(167,139,250,0.2)',
        padding: '10px 20px', zIndex: 1000, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>🚆</span>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>MÁV Hálózati Térkép</span>
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
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
            · {filteredStations.length} állomás · {trains.length} vonat
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

        {/* Line type filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Szűrő:</span>
          {['all', ...lineTypes].map(f => (
            <button key={f} onClick={() => setLineFilter(f)} style={{
              background: lineFilter === f ? `${BADGE_COLORS[f] || '#3b82f6'}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lineFilter === f ? (BADGE_COLORS[f] || '#3b82f6') : 'rgba(255,255,255,0.08)'}`,
              color: lineFilter === f ? (BADGE_COLORS[f] || '#60a5fa') : '#94a3b8',
              padding: '3px 10px', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: lineFilter === f ? 700 : 400,
              transition: 'all 0.2s'
            }}>
              {f === 'all' ? 'Összes' : f}
            </button>
          ))}
        </div>

        {/* Selected station badge */}
        {selected && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', color: '#60a5fa',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              📍 {selected.name}
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem'
            }}>✕</button>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[47.4979, 19.0402]} zoom={7}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {/* Trains */}
          {trains.map(t => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={trainIcon(t.type, t.color, t.label)}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: t.color || '#3b82f6', marginBottom: 4 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 2 }}>
                    Vonal: <strong>{t.route || 'MÁV Vonat'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' }}>
                    Jármű: {t.model || 'Ismeretlen'}
                  </div>
                  <div style={{ fontSize: '0.82rem', padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                    Következő: <strong style={{ color: '#1e293b' }}>{t.stopName || 'Úton...'}</strong>
                  </div>
                  {t.isAI && (
                    <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600 }}>
                      🧠 AI-becsült pozíció
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Rail lines */}
          {RAIL_LINES.map((line, i) => (
            <Polyline key={i} positions={coordsFor(line)}
              color="#3b82f6" weight={2.5} opacity={0.5} dashArray="8 5" />
          ))}

          {/* Stations */}
          {filteredStations.map(st => (
            <Marker
              key={st.name}
              position={[st.lat, st.lng]}
              icon={stationDot(selected?.name === st.name)}
              eventHandlers={{ click: () => setSelected(st) }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 8 }}>
                    🚉 {st.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {st.lines.map(l => (
                      <span key={l} style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 10,
                        background: `${BADGE_COLORS[l] || '#fff'}22`,
                        border: `1px solid ${BADGE_COLORS[l] || '#fff'}55`,
                        color: BADGE_COLORS[l] || '#fff'
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
        background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '12px 16px',
      }}>
        <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Vonat Típusok
        </div>
        {Object.entries(BADGE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            {type === 'IC' ? 'InterCity' : type === 'EC' ? 'EuroCity' : type === 'RAILJET' ? 'RailJet' : type === 'FAST' ? 'Gyors' : 'Személyi'}
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          🔄 Valós idejű frissítés: 5 mp ⚡
        </div>
        {mapMode === 'ai_simulated' && (
          <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#a78bfa', fontWeight: 600 }}>
             🧠 AI-val becsült élőkép
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
