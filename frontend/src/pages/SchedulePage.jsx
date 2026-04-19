import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import PurchaseModal from '../components/PurchaseModal';
import DelayModal from '../components/DelayModal';
import { useAuth } from '../contexts/AuthContext';
import { version } from '../version';

import { ALL_HUNGARY_STATIONS } from '../data/allStations';

export default function SchedulePage() {
  const ALL_STATIONS = ALL_HUNGARY_STATIONS;
  const { ws } = useAuth();
  const [form, setForm] = useState({ from: '', to: '', date: new Date().toISOString().split('T')[0], network: 'mav', sortBy: 'departure' });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [purchaseTrip, setPurchaseTrip] = useState(null);
  const [delayTrip, setDelayTrip] = useState(null);
  const [discountType, setDiscountType] = useState('full');
  
  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Accordion state
  const [expandedTripId, setExpandedTripId] = useState(null);

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
    setExpandedTripId(null);

    try {
      const response = await api.search(searchParams);
      if (!response || !Array.isArray(response.results)) {
        throw new Error('A szerver érvénytelen adatot küldött vissza.');
      }
      setTrips(response.results);
      
      if (response.results.length > 0) {
        setAiLoading(true);
        api.aiAnalyze({ from: searchParams.from, to: searchParams.to, network: searchParams.network, results: response.results })
          .then(res => setAiAnalysis(res.analysis))
          .catch(err => {
             console.error('AI hiba:', err);
             setAiAnalysis('🤖 Sajnálom, az AI asszisztens jelenleg túlterhelt (Rate Limit). Kérlek próbáld meg később!');
          })
          .finally(() => setAiLoading(false));
      }
    } catch (err) {
      console.error('[SchedulePage] search hiba:', err);
      setError(`Hiba a menetrend betöltésekor: ${err.message}`);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderTrainBadge = (trip) => {
    let color = '#fff'; 
    let bg = '#005bac'; 
    if (trip.type === 'LOCAL') { bg = '#005bac'; }
    if (trip.type === 'FAST')  { bg = '#00a3e0'; }
    if (trip.type === 'IC')    { bg = '#7b1fa2'; }
    if (trip.type === 'EC' || trip.type === 'RAILJET') { bg = '#c62828'; }

    return (
      <span style={{
        backgroundColor: bg,
        color: color,
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: '900',
        fontSize: '0.75rem',
        display: 'inline-block',
        minWidth: '40px',
        textAlign: 'center',
        marginRight: 6,
        letterSpacing: '0.5px'
      }}>
        {trip.routeName}
      </span>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
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
  
  useEffect(() => {
     if(searched) fetchResults(form);
  }, [form.sortBy, searched, fetchResults, form]);

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'delay_update') {
          const { id, delayMinutes, status } = message.data;
          setTrips(prev => prev.map(t => 
             t.id === id ? { ...t, delayMinutes, status } : t
          ));
        }
      } catch (err) { console.error('WS MSG Parse Error', err); }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso) => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  const getDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.round((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}ó ${mins}p` : `${mins}p`;
  };

  return (
    <div className="schedule-page" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div className="search-card">
        <h2>🔍 Menetrend keresés</h2>
        <form onSubmit={handleSearch}>
            <div className="network-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button type="button" className={`btn btn-sm ${form.network === 'mav' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, network: 'mav', from: '', to: '' }))}>🚆 MÁV</button>
              <button type="button" className={`btn btn-sm ${form.network === 'bkk' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, network: 'bkk', from: '', to: '' }))}>🚌 BKK</button>
            </div>
            <div className="search-grid">
              <div className="field">
                <label>Indulás</label>
                <input id="search-from" list="stations-list" required value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="field">
                <label>Érkezés</label>
                <input id="search-to" list="stations-list" required value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
                <datalist id="stations-list">{ALL_STATIONS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="field">
                <label>Dátum</label>
                <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="field">
                <label>Rendezés</label>
                <select value={form.sortBy} onChange={e => setForm(f => ({ ...f, sortBy: e.target.value }))}>
                  <option value="departure">Legkorábbi indulás</option>
                  <option value="duration">Leggyorsabb út</option>
                  <option value="price">Legolcsóbb ár</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>{loading ? 'Keresés...' : '🔍 Keresés indítása'}</button>
        </form>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-skeletons" style={{ marginTop: '20px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '10px', borderRadius: '12px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }}></div>)}
        </div>
      ) : searched && (
        <div className="results-container" style={{ marginTop: '20px' }}>
          <div className="trips-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Járatok ({trips.length})</h2>
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="discount-select">
                {Object.entries(DISCOUNTS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
            </select>
          </div>

          {(aiLoading || aiAnalysis) && (
            <div className="ai-box" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#a78bfa' }}>🤖 AI Asszisztens</div>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>{aiLoading ? 'Elemzés folyamatban...' : aiAnalysis}</p>
            </div>
          )}

          <div className="trips-list">
            {trips.map(trip => (
              <div key={trip.id} className={`trip-card-v2 ${expandedTripId === trip.id ? 'active' : ''}`} style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', 
                marginBottom: '12px', transition: 'all 0.3s ease' 
              }}>
                {/* Main Card Header (Visible always) */}
                <div className="trip-summary" onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)} style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}</span>
                      {trip.status === 'DELAYED' && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>+{trip.delayMinutes}'</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Utazási idő: {getDuration(trip.departureTime, trip.arrivalTime)} · Átszállás: 0
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      {Math.round(trip.basePrice * DISCOUNTS[discountType].multiplier)} Ft
                    </div>
                    <button className="buy-btn-small" onClick={(e) => { e.stopPropagation(); setPurchaseTrip(trip); }} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}>Jegy</button>
                    <span style={{ transform: expandedTripId === trip.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>⌄</span>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {expandedTripId === trip.id && (
                  <div className="trip-expanded-details" style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: '20px' }}>
                      
                      {/* Vertical Timeline */}
                      <div className="timeline-container" style={{ position: 'relative', paddingLeft: '40px', color: '#fff', flex: 1 }}>
                        <div style={{ position: 'absolute', left: '12px', top: '10px', bottom: '10px', width: '3px', background: '#ffcc00', borderRadius: '2px' }}></div>
                        
                        {(trip.stops && trip.stops.length > 0 ? trip.stops : [
                            { station: trip.fromName, time: formatTime(trip.departureTime) },
                            { station: 'Közbülső megálló', time: '...' },
                            { station: trip.toName, time: formatTime(trip.arrivalTime) }
                        ]).map((stop, sIdx, arr) => (
                          <div key={sIdx} style={{ position: 'relative', marginBottom: sIdx === arr.length - 1 ? 0 : '35px', minHeight: '24px' }}>
                            {/* Circle Dot */}
                            <div style={{ 
                                position: 'absolute', left: '-33px', top: '4px', 
                                width: '12px', height: '12px', borderRadius: '50%', 
                                background: '#fff', border: '3px solid #ffcc00', zIndex: 10 
                            }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '1rem', fontWeight: (sIdx === 0 || sIdx === arr.length - 1) ? 800 : 500, color: '#fff' }}>
                                {stop.station}
                              </div>
                              <div style={{ fontWeight: 700, opacity: 0.9, color: '#fff' }}>{stop.time}</div>
                            </div>

                            {sIdx === 0 && (
                                <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                      {renderTrainBadge(trip)}
                                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{trip.type === 'LOCAL' ? 'személyvonat' : 'gyorsvonat'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '1.2rem', marginBottom: '8px' }}>
                                      <span title="2. osztály">2</span>
                                      {trip.features?.accessible && <span title="Akadálymentes">♿</span>}
                                      {trip.features?.wifi && <span title="Ingyen WiFi">📶</span>}
                                      {trip.features?.bicycle && <span title="Kerékpárszállítás">🚲</span>}
                                      {trip.features?.climate && <span title="Klíma">❄️</span>}
                                      <span title="Elővárosi">E</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {trip.platform}. vágány · Idő: {getDuration(trip.departureTime, trip.arrivalTime)}
                                    </div>
                                </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Legend / Info */}
                      <div className="legend-section" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jelmagyarázat</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                           <div style={{ display: 'flex', gap: '8px' }}><span>🚲</span><span>Kerékpár a megjelölt helyen szállítható.</span></div>
                           <div style={{ display: 'flex', gap: '8px' }}><span>2</span><span>A vonat 2. osztályú kocsikkal közlekedik.</span></div>
                           <div style={{ display: 'flex', gap: '8px' }}><span>♿</span><span>Kerekesszékes utazásra alkalmas.</span></div>
                           <div style={{ display: 'flex', gap: '8px' }}><span>E</span><span>Elővárosi vonat</span></div>
                           <div style={{ display: 'flex', gap: '8px' }}><span>📶</span><span>Ingyen WiFi a kijelölt kocsikban.</span></div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDelayTrip(trip)} style={{ width: '100%', marginTop: '20px', fontSize: '0.7rem' }}>⏱ Késés jelentése</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {purchaseTrip && <PurchaseModal trip={purchaseTrip} discountType={discountType} onClose={() => setPurchaseTrip(null)} />}
      {delayTrip && <DelayModal trip={delayTrip} onClose={() => setDelayTrip(null)} onUpdated={(u) => setTrips(prev => prev.map(t => t.id === u.id ? { ...t, ...u } : t))} />}
    </div>
  );
}
