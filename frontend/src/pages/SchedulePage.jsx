import React, { useState, useCallback } from 'react';
import { api } from '../api/client';
import PurchaseModal from '../components/PurchaseModal';
import DelayModal from '../components/DelayModal';

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
  const [form, setForm]             = useState({ from: '', to: '', date: TODAY });
  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [searched, setSearched]     = useState(false);
  const [purchaseTrip, setPurchaseTrip] = useState(null);
  const [delayTrip, setDelayTrip]   = useState(null);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSearched(true);

    try {
      const response = await api.search(form);

      if (!response || !Array.isArray(response.results)) {
        throw new Error('A szerver érvénytelen adatot küldött vissza.');
      }

      setTrips(response.results);
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
  }, [form]);

  // Merge delay update into local trip state (keeps all other fields)
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
          <div className="search-grid">
            <div className="field">
              <label>Indulás</label>
              <input
                id="search-from"
                placeholder="pl. Budapest Keleti"
                value={form.from}
                onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Érkezés</label>
              <input
                id="search-to"
                placeholder="pl. Győr"
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Dátum</label>
              <input
                id="search-date"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" id="search-submit" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Keresés…</>
                : '🔍 Keresés'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading spinner ───────────────────────────────────────────────── */}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Járatok betöltése…
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {!loading && searched && (
        <div>
          <div className="trips-header">
            <h2>Találatok</h2>
            <span className="result-count">{trips.length} járat</span>
          </div>

          {trips.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🚆</div>
              <h3>Nem találtunk járatot</h3>
              <p>Próbálj más indulási / érkezési állomást vagy dátumot.</p>
            </div>
          ) : (
            <div className="trips-list">
              {trips.map(trip => (
                <div
                  key={trip.id}
                  className={`trip-card ${trip.status === 'DELAYED' ? 'delayed' : 'on-time'}`}
                >
                  <div className="trip-main">
                    <div className="trip-name">{trip.routeName}</div>
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
                    </div>
                  </div>

                  <div className="trip-meta">
                    <span className={`trip-badge badge-${trip.type}`}>{trip.type}</span>
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
                      {(trip.basePrice ?? 0).toLocaleString('hu-HU')} <span>Ft / fő</span>
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
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {purchaseTrip && (
        <PurchaseModal
          trip={purchaseTrip}
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
