import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';


// We don't need stripePromise here anymore because we redirect directly to url
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_mock');

export default function PurchaseModal({ trip, discountType, onClose, onSuccess }) {
  const { user } = useAuth();
  
  const DISCOUNTS = {
    full: { label: 'Teljes ár (100%)', multiplier: 1 },
    discount50: { label: '50% Kedvezmény', multiplier: 0.5 },
    discount90: { label: '90% Kedvezmény (Diák)', multiplier: 0.1 },
    free: { label: 'Díjmentes (0 Ft)', multiplier: 0 }
  };

  const [form, setForm] = useState({
    passengerName:  user?.name || '',
    seatClass:      'SECOND',
    quantity:       1,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const priceMultiplier = (form.seatClass === 'FIRST' ? 1.5 : 1) * DISCOUNTS[discountType].multiplier;
  const total = Math.round(trip.basePrice * priceMultiplier * form.quantity);

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
       setError("Jegyvásárláshoz bejelentkezés szükséges!");
       return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const session = await api.createCheckoutSession({
        type:     'TICKET',
        tripId:   trip.id,
        tripData: trip,
        passengerName: form.passengerName,
        passengerEmail: user.email,
        seatClass: form.seatClass,
        quantity: form.quantity,
        discountType: discountType
      });
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Szerver hiba: Nincs érvényes Stripe átirányítási URL.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎫 Jegyvásárlás (Stripe)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-trip-info">
          <div className="trip-route">{trip.fromName} → {trip.toName}</div>
          <div className="trip-detail">
            {trip.routeName} · {formatDate(trip.departureTime)} · {formatTime(trip.departureTime)} – {formatTime(trip.arrivalTime)}
          </div>
          <div className="trip-detail" style={{ marginTop: 4 }}>🪑 {trip.availableSeats} szabad hely</div>
          {discountType !== 'full' && (
            <div className="trip-detail" style={{ marginTop: 4, color: 'var(--accent)', fontWeight: 600 }}>
              🏷️ Alkalmazott kedvezmény: {DISCOUNTS[discountType].label}
            </div>
          )}
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
              type="email"
              disabled
              value={user?.email || ''}
              title="A jegyet az accountodhoz rendeljük"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)'}}>A fiókhoz rendelt email címet használjuk.</p>
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
          <button className="btn btn-success" type="submit" disabled={loading} style={{ width: '100%', background: '#635BFF', borderColor: '#635BFF' }}>
            {loading ? '⏳ Átirányítás Stripe-ra...' : '💳 Fizetés Stripe-pal'}
          </button>
        </form>
      </div>
    </div>
  );
}
