import React, { useState } from 'react';
import { api } from '../api/client';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TicketsPage() {
  const [email, setEmail] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const results = await api.getMyTickets(email);
      setTickets(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tickets-page">
      <h2>🎫 Jegyeim</h2>

      <div className="search-card">
        <form onSubmit={handleSearch}>
          <div className="search-grid" style={{ gridTemplateColumns: '1fr auto' }}>
            <div className="field">
              <label>E-mail cím</label>
              <input
                type="email"
                placeholder="utas@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '⏳ Keresés...' : '🔍 Jegyek lekérése'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {loading && <div className="loading"><span className="spinner" /> Betöltés...</div>}

      {!loading && searched && tickets.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎫</div>
          <h3>Nem találtunk jegyet</h3>
          <p>Ehhez az e-mail címhez nem tartozik jegy</p>
        </div>
      )}

      {!loading && tickets.map(ticket => (
        <div key={ticket.id} className="ticket-card">
          <div>
            <div className="ticket-conf">{ticket.confirmationCode}</div>
            <div className="ticket-route">{ticket.from} → {ticket.to}</div>
            <div className="ticket-meta">
              {ticket.tripName} · {formatDate(ticket.departureTime)} · {formatTime(ticket.departureTime)} – {formatTime(ticket.arrivalTime)}
            </div>
            <div className="ticket-meta" style={{ marginTop: 4 }}>
              {ticket.quantity} db · {ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'} · {ticket.passengerName}
            </div>
          </div>
          <div>
            <div className="ticket-price">{ticket.totalPrice.toLocaleString('hu-HU')} Ft</div>
            <div className={`status-badge status-${ticket.status}`} style={{ textAlign: 'right', marginTop: 6 }}>
              {ticket.status === 'CONFIRMED' ? '✓ Visszaigazolva' : ticket.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
