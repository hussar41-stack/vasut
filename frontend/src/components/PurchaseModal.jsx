import React, { useState } from 'react';
import { api } from '../api/client';

export default function PurchaseModal({ trip, onClose, onSuccess }) {
  const [form, setForm] = useState({
    passengerName:  '',
    passengerEmail: '',
    seatClass:      'SECOND',
    quantity:       1,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [ticket,  setTicket]  = useState(null);

  const priceMultiplier = form.seatClass === 'FIRST' ? 1.5 : 1;
  const total = Math.round(trip.basePrice * priceMultiplier * form.quantity);

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Pass tripData so the server can create the ticket without a DB trip lookup
      const result = await api.purchaseTicket({
        tripId:   trip.id,
        tripData: trip,
        ...form,
      });
      setTicket(result);
      onSuccess && onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (ticket) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="confirmation">
            <div className="check-icon">✅</div>
            <h3>Sikeres jegyvásárlás!</h3>
            <p>Foglalási kód:</p>
            <div className="conf-code">{ticket.confirmationCode}</div>
            <p>{ticket.from} → {ticket.to}</p>
            <p>{formatDate(ticket.departureTime)} · {formatTime(ticket.departureTime)} – {formatTime(ticket.arrivalTime)}</p>
            <p style={{ marginTop: '0.5rem' }}>
              {ticket.quantity} db · {ticket.seatClass === 'FIRST' ? '1. oszt.' : '2. oszt.'}
            </p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.75rem' }}>
              {ticket.totalPrice.toLocaleString('hu-HU')} Ft
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
              Bezárás
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎫 Jegyvásárlás</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-trip-info">
          <div className="trip-route">{trip.fromName} → {trip.toName}</div>
          <div className="trip-detail">
            {trip.routeName} · {formatDate(trip.departureTime)} · {formatTime(trip.departureTime)} – {formatTime(trip.arrivalTime)}
          </div>
          <div className="trip-detail" style={{ marginTop: 4 }}>🪑 {trip.availableSeats} szabad hely</div>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Utas neve</label>
            <input
              required
              placeholder="Pl. Kiss Péter"
              value={form.passengerName}
              onChange={e => setForm(f => ({ ...f, passengerName: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>E-mail cím</label>
            <input
              type="email" required
              placeholder="utas@example.hu"
              value={form.passengerEmail}
              onChange={e => setForm(f => ({ ...f, passengerEmail: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Osztály</label>
              <select value={form.seatClass} onChange={e => setForm(f => ({ ...f, seatClass: e.target.value }))}>
                <option value="SECOND">2. osztály</option>
                <option value="FIRST">1. osztály (+50%)</option>
              </select>
            </div>
            <div className="field">
              <label>Jegyek száma</label>
              <select value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} db</option>)}
              </select>
            </div>
          </div>
          <div className="modal-total">
            <span className="label">Fizetendő összeg</span>
            <span className="price">{total.toLocaleString('hu-HU')} Ft</span>
          </div>
          <button className="btn btn-success" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '⏳ Feldolgozás...' : '💳 Fizetés & Foglalás'}
          </button>
        </form>
      </div>
    </div>
  );
}
