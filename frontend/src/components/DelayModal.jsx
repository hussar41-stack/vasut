import React, { useState } from 'react';
import { api } from '../api/client';

export default function DelayModal({ trip, onClose, onUpdated }) {
  const [delay, setDelay] = useState(trip.delayMinutes ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      const updated = await api.updateDelay(trip.id, delay);
      onUpdated && onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delay-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱ Késés beállítása</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-trip-info">
          <div className="trip-route">{trip.fromName} → {trip.toName}</div>
          <div className="trip-detail">{trip.routeName}</div>
        </div>
        {error && <div className="error-banner">⚠️ {error}</div>}
        <div className="delay-input-wrap" style={{ marginBottom: '1rem' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Késés percben (0 = menetrend szerint)</label>
            <input
              type="number" min="0" max="240"
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Mégse</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? '⏳ Mentés...' : '✓ Mentés'}
          </button>
        </div>
      </div>
    </div>
  );
}
