import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon broken by Webpack
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

function stationDot(selected) {
  const size = selected ? 16 : 12;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${selected?'#3b82f6':'#1e2a40'};border:2px solid ${selected?'#60a5fa':'#3b82f6'};border-radius:50%;box-shadow:0 0 ${selected?'10px #3b82f6':'4px rgba(59,130,246,0.5)'}"></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2],
  });
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)',
        padding:'10px 24px', display:'flex', alignItems:'center', gap:16, zIndex:10, flexShrink:0 }}>
        <span style={{ fontWeight:700, fontSize:'0.95rem' }}>🗺️ MÁV Állomástérkép</span>
        <span style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>
          {STATIONS.length} állomás · Kattints egy állomásra
        </span>
        {selected && (
          <span style={{ background:'var(--accent-light)', border:'1px solid rgba(59,130,246,0.3)',
            borderRadius:20, padding:'3px 12px', fontSize:'0.82rem', color:'var(--accent)' }}>
            📍 {selected.name}
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[47.4979, 19.0402]} zoom={7}
          style={{ height:'100%', width:'100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {/* Railway lines */}
          {RAIL_LINES.map((line, i) => (
            <Polyline key={i} positions={coordsFor(line)}
              color="#3b82f6" weight={2} opacity={0.45} dashArray="6 4" />
          ))}

          {/* Station markers */}
          {STATIONS.map(st => (
            <Marker key={st.name} position={[st.lat, st.lng]}
              icon={stationDot(selected?.name === st.name)}
              eventHandlers={{ click: () => setSelected(st) }}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong style={{ fontSize:'0.9rem' }}>{st.name}</strong>
                  <div style={{ marginTop:6, display:'flex', gap:4, flexWrap:'wrap' }}>
                    {st.lines.map(l => (
                      <span key={l} style={{ fontSize:'0.65rem', fontWeight:700,
                        padding:'1px 6px', borderRadius:10,
                        background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
                        color: BADGE_COLORS[l] || '#fff' }}>{l}</span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
