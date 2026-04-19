import React, { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PurchaseModal from '../components/PurchaseModal';
import DelayModal from '../components/DelayModal';
import { ALL_STATIONS } from '../data/stations';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
}
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' });
  } catch { return ''; }
}
function getDuration(dep, arr) {
  try {
    const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
    if (mins <= 0) return '–';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}ó ${m}p` : `${m}p`;
  } catch { return '–'; }
}

const TODAY = new Date().toISOString().split('T')[0];

// ─── Component ───────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { ws } = useAuth();

  const [form, setForm]             = useState({ network: 'mav', from: '', to: '', date: TODAY, sortBy: 'departure' });
  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [searched, setSearched]     = useState(false);
  const [purchaseTrip, setPurchaseTrip] = useState(null);
  const [delayTrip, setDelayTrip]   = useState(null);
  const [activeFeatures, setActiveFeatures] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [discountType, setDiscountType] = useState('full');

  const DISCOUNTS = {
    full: { label: 'Teljes ár (100%)', multiplier: 1 },
    discount50: { label: '50% Kedvezmény', multiplier: 0.5 },
    discount90: { label: '90% Kedvezmény (Diák)', multiplier: 0.1 },
    free: { label: 'Díjmentes (0 Ft)', multiplier: 0 }
  };

  const fetchResults = useCallback(async (searchParams) => {
    setError(null);
    setLoading(true);
    setSearched(true);
    setAiAnalysis(null);

    try {
      const response = await api.search(searchParams);

      if (!response || !Array.isArray(response.results)) {
        throw new Error('A szerver érvénytelen adatot küldött vissza.');
      }

      setTrips(response.results);
      
      // Kérjük be az AI Utazástervező elemzését a találatokra, ha vannak!
      if (response.results.length > 0) {
        setAiLoading(true);
        api.aiAnalyze({ from: searchParams.from, to: searchParams.to, network: searchParams.network, results: response.results })
          .then(res => setAiAnalysis(res.analysis))
          .catch(err => {
             console.error('AI hiba:', err);
             setAiAnalysis('💡 Hiba történt az AI asszisztens elérésekor.');
          })
          .finally(() => setAiLoading(false));
      }

    } catch (err) {
      console.error('[SchedulePage] search hiba:', err);

      if (err.message.includes('Nem sikerült csatlakozni')) {
        setError('⚡ Nem sikerült elérni a szervert. Futtasd: node server.js (backend mappa, port 5000).');
      } else {
        setError(`Hiba a menetrend betöltésekor: ${err.message}`);
      }

      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderTrainBadge = (trip) => {
    let color = '#fff'; 
    let bg = '#005bac'; // Default blue (Személy)
    
    if (trip.type === 'LOCAL') { bg = '#005bac'; }
    if (trip.type === 'FAST')  { bg = '#00a3e0'; }
    if (trip.type === 'IC')    { bg = '#7b1fa2'; } // Purple (IC)
    if (trip.type === 'EC' || trip.type === 'RAILJET') { bg = '#c62828'; } // Red (RJ/EC)

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span 
          onClick={(e) => {
            e.stopPropagation();
            setActiveFeatures(activeFeatures === trip.id ? null : trip.id);
          }}
          style={{
            backgroundColor: bg,
            color: color,
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: '900',
            fontSize: '0.85rem',
            display: 'inline-block',
            minWidth: '45px',
            textAlign: 'center',
            marginRight: 8,
            letterSpacing: '0.5px',
            cursor: 'help',
            boxShadow: activeFeatures === trip.id ? '0 0 0 2px var(--accent)' : 'none'
          }}
          title="Kattints a részletekért"
        >
          {trip.routeName}
        </span>
        
        {activeFeatures === trip.id && trip.features && (
          <div className="features-popover" style={{
            position: 'absolute',
            top: '0',
            left: 'calc(100% + 10px)',
            zIndex: 9999,
            background: '#1a1a1a', // Dark theme support explicit
            color: '#fff',
            border: '1px solid #444',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '220px',
            animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa' }}>Felszereltség</h5>
                <button 
                    onClick={(e) => { e.stopPropagation(); setActiveFeatures(null); }}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 5px' }}>
                    ×
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: trip.features.wifi ? '#fff' : '#666' }}>
                <span style={{ fontSize: '1.2rem' }}>{trip.features.wifi ? '📶' : '🚫'}</span>
                <span>{trip.features.wifi ? 'Ingyen WiFi' : 'Nincs WiFi'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: trip.features.climate ? '#fff' : '#666' }}>
                <span style={{ fontSize: '1.2rem' }}>{trip.features.climate ? '❄️' : '🚫'}</span>
                <span>{trip.features.climate ? 'Klímatizált' : 'Nincs klíma'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: trip.features.wc ? '#fff' : '#666' }}>
                <span style={{ fontSize: '1.2rem' }}>{trip.features.wc ? '🚽' : '🚫'}</span>
                <span>{trip.features.wc ? 'Mosdó (WC)' : 'Nincs WC'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: trip.features.bicycle ? '#fff' : '#666' }}>
                <span style={{ fontSize: '1.2rem' }}>{trip.features.bicycle ? '🚲' : '🚫'}</span>
                <span>{trip.features.bicycle ? 'Kerékpárszállítás' : 'Bicikli nem vihető'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: trip.features.accessible ? '#fff' : '#666' }}>
                <span style={{ fontSize: '1.2rem' }}>{trip.features.accessible ? '♿' : '🚫'}</span>
                <span>{trip.features.accessible ? 'Akadálymentes' : 'Nem akadálymentes'}</span>
              </div>
            </div>

            {trip.stops && trip.stops.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa' }}>Útvonal / Megállók</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {trip.stops.map((stop, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: (idx === 0 || idx === trip.stops.length -1) ? '#fff' : '#bbb' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (idx === 0 || idx === trip.stops.length -1) ? 'var(--accent)' : '#555' }}></span>
                        {stop.station}
                      </span>
                      <span style={{ fontWeight: 600 }}>{stop.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #333', fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                {trip.routeName} vonat adatai
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Állomás validáció MÁV esetén
    if (form.network === 'mav') {
      const fromValid = ALL_STATIONS.includes(form.from);
      const toValid   = ALL_STATIONS.includes(form.to);
      
      if (!fromValid || !toValid) {
        setError(`Kérjük válasszon a listában szereplő érvényes vasútállomások közül! (${!fromValid ? form.from : form.to} nem található)`);
        return;
      }
    }

    fetchResults(form);
  };
  
  // Refetch results when sortBy changes if already searched
  useEffect(() => {
     if(searched) fetchResults(form);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sortBy]);

  // WebSocket Listener
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'delay_update') {
          const { id, delayMinutes, status } = message.data;
          setTrips(prev => prev.map(t => 
             t.id === id ? { ...t, delayMinutes, delay: delayMinutes, status } : t
          ));
        }
      } catch (err) {
        console.error('WS MSG Parse Error', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  function handleDelayUpdated(updated) {
    setTrips(prev =>
      prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
    );
  }

  return (
    <div>
      {/* ── Search card ──────────────────────────────────────────────────── */}
      <div className="search-card">
        <h2>🔍 Menetrend keresés</h2>
        <form onSubmit={handleSearch}>
            <div className="network-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                type="button" 
                className={`btn btn-sm ${form.network === 'mav' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm(f => ({ ...f, network: 'mav', from: '', to: '' }))}
              >
                🚆 MÁV (Helyközi)
              </button>
              <button 
                type="button" 
                className={`btn btn-sm ${form.network === 'bkk' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm(f => ({ ...f, network: 'bkk', from: '', to: '' }))}
              >
                🚌 BKK (Budapest)
              </button>
            </div>
            
            <div className="search-grid">
              <div className="field">
                <label>Indulás</label>
                <input
                  id="search-from"
                  list="stations-list"
                  required
                  placeholder={form.network === 'mav' ? "pl. Budapest Keleti" : "pl. Széll Kálmán tér"}
                  value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div className="field" style={{ position: 'relative' }}>
                <label>Érkezés</label>
                <input
                  id="search-to"
                  list="stations-list"
                  required
                  placeholder={form.network === 'mav' ? "pl. Győr" : "pl. Deák Ferenc tér"}
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                />
                <datalist id="stations-list">
                  {ALL_STATIONS.map(s => <option key={s} value={s} />)}
                </datalist>
                <button type="button" onClick={() => setForm(f => ({ ...f, from: f.to, to: f.from }))}
                  style={{
                    position: 'absolute', top: 31, left: -22, zIndex: 5,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }} title="Felcserél">
                  ⇄
                </button>
              </div>
              <div className="field">
                <label>Dátum</label>
                <input
                  id="search-date"
                  type="date"
                  required
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Rendezés</label>
              <select value={form.sortBy} onChange={e => setForm(f => ({ ...f, sortBy: e.target.value }))}
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', padding: '0 12px' }}>
                  <option value="departure">Legkorábbi indulás</option>
                  <option value="duration">Leggyorsabb út</option>
                  <option value="price">Legolcsóbb ár</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" id="search-submit" type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Keresés...' : '🔍 Keresés indítása'}
          </button>
        </form>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── Results / Skeleton ───────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
           {[1, 2, 3].map(i => (
               <div key={i} style={{
                   height: 120, borderRadius: 16, border: '1px solid var(--border)',
                   background: 'linear-gradient(90deg, var(--bg-card) 0%, var(--bg-secondary) 50%, var(--bg-card) 100%)',
                   backgroundSize: '200% 100%',
                   animation: 'skeletonPulse 1.5s infinite'
               }}></div>
           ))}
        </div>
      ) : searched ? (
        <div style={{ marginTop: '2rem' }}>
          <div className="trips-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2>Találatok</h2>
              <span className="result-count">{trips.length} járat</span>
            </div>
            
            <div className="discount-selector-container" style={{
              background: 'var(--bg-secondary)',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kedvezmény:</span>
              <select 
                value={discountType} 
                onChange={e => setDiscountType(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Object.entries(DISCOUNTS).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          {trips.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🚆</div>
              <h3>Nem találtunk járatot</h3>
              <p>Próbálj más indulási / érkezési állomást vagy dátumot.</p>
            </div>
          ) : (
            <div className="trips-list">
              
              {/* ── AI Utazástervező Doboz ───────────────────────────────── */}
              {(aiLoading || aiAnalysis) && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '15px'
                }}>
                  <div style={{ fontSize: '24px', animation: aiLoading ? 'pulse 1.5s infinite' : 'none' }}>
                    {aiLoading ? '✨' : '🤖'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#a78bfa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      TransportHU AI Utazástervező
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {aiLoading ? 'A mesterséges intelligencia elemzi a járatokat és a késéseket...' : aiAnalysis}
                    </p>
                  </div>
                </div>
              )}

              {trips.map(trip => (
                <div
                  key={trip.id}
                  className={`trip-card ${trip.status === 'DELAYED' ? 'delayed' : 'on-time'}`}
                  style={{ position: 'relative' }}
                >
                  {/* AI Recommendation Badges */}
                  <div style={{ position: 'absolute', top: -12, left: 16, display: 'flex', gap: 6 }}>
                    {trip.isRecommendedFastest && (
                        <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, boxShadow: '0 2px 8px rgba(59,130,246,0.4)', textTransform: 'uppercase' }}>
                            🚀 Leggyorsabb
                        </span>
                    )}
                    {trip.isRecommendedDirect && (
                        <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, boxShadow: '0 2px 8px rgba(16,185,129,0.4)', textTransform: 'uppercase' }}>
                            🎯 Közvetlen
                        </span>
                    )}
                  </div>
                
                  <div className="trip-main" style={{ paddingTop: (trip.isRecommendedFastest || trip.isRecommendedDirect) ? 4 : 0 }}>
                    <div className="trip-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTrainBadge(trip)}
                        {trip.type === 'IC' && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7b1fa2', textTransform: 'uppercase' }}>InterCity</span>}
                        {trip.type === 'RAILJET' && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c62828', textTransform: 'uppercase' }}>Railjet X-press</span>}
                    </div>
                    <div className="trip-times">
                      <span className="trip-time">{formatTime(trip.departureTime)}</span>
                      <span className="trip-arrow">→</span>
                      <span className="trip-time">{formatTime(trip.arrivalTime)}</span>
                      <span className="trip-duration">{getDuration(trip.departureTime, trip.arrivalTime)}</span>
                    </div>
                    <div className="trip-route">
                      <span className="trip-station">{trip.fromName}</span>
                      <span className="trip-arrow">→</span>
                      <span className="trip-station">{trip.toName}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDate(trip.departureTime)}
                      {trip.platform ? ` · ${trip.platform}. vágány` : ''}
                      <span style={{ marginLeft: 8 }}>· {trip.transfers} átszállás</span>
                    </div>
                  </div>

                  <div className="trip-meta">
                    <span className={`status-badge status-${trip.status}`}>
                      {trip.status === 'DELAYED' ? `+${trip.delayMinutes} perc` : 'Menetrend szerint'}
                    </span>
                    <span className="trip-seats">🪑 {trip.availableSeats} hely</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDelayTrip(trip)}
                    >
                      ⏱ Késés
                    </button>
                  </div>

                  <div className="trip-actions">
                    <div className="trip-price">
                       {Math.round((trip.basePrice ?? 0) * DISCOUNTS[discountType].multiplier).toLocaleString('hu-HU')} <span>Ft / fő</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setPurchaseTrip(trip)}
                      disabled={trip.availableSeats === 0}
                    >
                      🎫 Jegy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {purchaseTrip && (
        <PurchaseModal
          trip={purchaseTrip}
          discountType={discountType}
          onClose={() => setPurchaseTrip(null)}
          onSuccess={() => {}}
        />
      )}
      {delayTrip && (
        <DelayModal
          trip={delayTrip}
          onClose={() => setDelayTrip(null)}
          onUpdated={handleDelayUpdated}
        />
      )}
    </div>
  );
}
