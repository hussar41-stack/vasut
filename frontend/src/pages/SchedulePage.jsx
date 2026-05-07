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
             setAiAnalysis('🤖 Sajnálom, az AI asszisztens jelenleg túlterhelt. Kérlek próbáld meg később!');
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
    let bg = '#3b82f6'; 
    if (trip.type === 'LOCAL') { bg = '#3b82f6'; }
    if (trip.type === 'FAST')  { bg = '#0ea5e9'; }
    if (trip.type === 'IC')    { bg = '#c084fc'; }
    if (trip.type === 'EC' || trip.type === 'RAILJET') { bg = '#f43f5e'; }

    return (
      <span style={{
        backgroundColor: bg,
        color: color,
        padding: '4px 10px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.85rem',
        display: 'inline-block',
        minWidth: '40px',
        textAlign: 'center',
        marginRight: 8,
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
  const getDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.round((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}ó ${mins}p` : `${mins}p`;
  };

  return (
    <div className="schedule-page">
      <div className="search-card">
        <h2>
          Utazástervező
        </h2>
        <form onSubmit={handleSearch}>
            <div className="network-toggle" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button type="button" className={`btn btn-sm ${form.network === 'mav' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, network: 'mav', from: '', to: '' }))}>🚆 MÁV</button>
              <button type="button" className={`btn btn-sm ${form.network === 'bkk' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, network: 'bkk', from: '', to: '' }))}>🚌 BKK</button>
            </div>
            <div className="search-grid">
              <div className="field">
                <label>Honnan</label>
                <input id="search-from" list="stations-list" placeholder="Indulási állomás" required value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="field">
                <label>Hová</label>
                <input id="search-to" list="stations-list" placeholder="Érkezési állomás" required value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
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
                  <option value="price">Legolcsóbb</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ minWidth: '200px' }}>
                {loading ? 'Keresés folyamatban...' : 'Keresés indítása'}
              </button>
            </div>
        </form>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-skeletons">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }}></div>)}
        </div>
      ) : searched && (
        <div className="results-container">
          <div className="trips-header">
            <h2>Találatok ({trips.length})</h2>
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="field" style={{ padding: '10px 16px', width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }}>
                {Object.entries(DISCOUNTS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
            </select>
          </div>

          {(aiLoading || aiAnalysis) && (
            <div className="ai-box" style={{ background: 'var(--accent-light)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '16px', margin: '0 0 20px 0' }}>
              <div style={{ fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>🤖 AI Asszisztens</div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{aiLoading ? 'Elemzés folyamatban...' : aiAnalysis}</p>
            </div>
          )}

          <div className="trips-list">
            {trips.map(trip => (
              <div key={trip.id} className={`trip-card-v2 ${expandedTripId === trip.id ? 'active' : ''}`}>
                <div className="trip-summary" onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}>
                  
                  <div className="trip-time-block">
                    <span className="time">{formatTime(trip.departureTime)} — {formatTime(trip.arrivalTime)}</span>
                    <span className="duration">{getDuration(trip.departureTime, trip.arrivalTime)} • 0 átszállás</span>
                    {trip.status === 'DELAYED' && <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, marginLeft: '8px', background: 'var(--danger-light)', padding: '4px 10px', borderRadius: '8px' }}>+{trip.delayMinutes}'</span>}
                  </div>
                  
                  <div className="trip-price-block">
                    <div className="price">
                      {Math.round(trip.basePrice * DISCOUNTS[discountType].multiplier)} Ft
                    </div>
                    <button className="buy-btn-small" onClick={(e) => { e.stopPropagation(); setPurchaseTrip(trip); }}>Jegyvásárlás</button>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedTripId === trip.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                </div>

                {/* Expanded Details Section */}
                {expandedTripId === trip.id && (
                  <div className="trip-expanded-details">
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 250px', gap: '30px' }}>
                      
                      {/* Vertical Timeline */}
                      <div className="timeline-container">
                        {(trip.stops && trip.stops.length > 0 ? trip.stops : [
                            { station: trip.fromName, time: formatTime(trip.departureTime) },
                            { station: 'Közbülső megálló', time: '...' },
                            { station: trip.toName, time: formatTime(trip.arrivalTime) }
                        ]).map((stop, sIdx, arr) => (
                          <div key={sIdx} style={{ position: 'relative', marginBottom: sIdx === arr.length - 1 ? 0 : '32px' }}>
                            <div className={`timeline-dot ${sIdx === 0 || sIdx === arr.length - 1 ? 'active' : ''}`}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '1.05rem', fontWeight: (sIdx === 0 || sIdx === arr.length - 1) ? 700 : 500, color: 'var(--text-primary)' }}>
                                {stop.station}
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{stop.time}</div>
                            </div>

                            {sIdx === 0 && (
                                <div className="train-info-box">
                                    <div className="train-info-row">
                                      {renderTrainBadge(trip)}
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                        {trip.type === 'LOCAL' ? 'Személyvonat' : trip.type === 'IC' ? 'InterCity' : 'Gyorsvonat'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                                      <span title="2. osztály">2</span>
                                      {trip.features?.accessible && <span title="Akadálymentes">♿</span>}
                                      {trip.features?.wifi && <span title="Ingyen WiFi">📶</span>}
                                      {trip.features?.bicycle && <span title="Kerékpárszállítás">🚲</span>}
                                      {trip.features?.climate && <span title="Klíma">❄️</span>}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        {trip.platform}. vágányról indul
                                    </div>
                                </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Info / Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                           <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jelmagyarázat</h4>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', gap: '12px' }}><span>🚲</span><span>Kerékpár szállítható</span></div>
                              <div style={{ display: 'flex', gap: '12px' }}><span>2</span><span>Csak 2. osztály</span></div>
                              <div style={{ display: 'flex', gap: '12px' }}><span>♿</span><span>Kerekesszékes utazás</span></div>
                              <div style={{ display: 'flex', gap: '12px' }}><span>📶</span><span>Ingyenes WiFi</span></div>
                           </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDelayTrip(trip)} style={{ width: '100%', marginTop: '24px' }}>⏱ Késés jelentése</button>
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
