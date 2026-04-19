import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TicketsPage() {
  const { user, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Auto-fetch tickets on mount if user is logged in
  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setEmail(user.email);
      fetchTickets(user.email);
    }
  }, [isLoggedIn, user]);

  async function fetchTickets(targetEmail) {
    if (!targetEmail) return;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const results = await api.getMyTickets(targetEmail);
      setTickets(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    await fetchTickets(email);
  }

  return (
    <div className="tickets-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>🎫 Jegyeim</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Bejelentkezve: <b style={{ color: 'var(--accent)' }}>{user.email}</b>
              </div>
          )}
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => fetchTickets(email)}
            disabled={loading || !email}
          >
            🔄 Frissítés
          </button>
        </div>
      </div>

      {!isLoggedIn && (
        <div className="search-card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSearch}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Add meg az e-mail címedet a vásárolt jegyeid megtekintéséhez:
            </p>
            <div className="search-grid" style={{ gridTemplateColumns: '1fr auto' }}>
              <div className="field">
                <input
                  type="email"
                  placeholder="utas@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳...' : '🔍 Lekérés'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="error-banner">⚠️ {error}</div>}
      
      {loading && (
        <div className="loading-skeletons">
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12, borderRadius: 12 }}></div>)}
          <div className="loading"><span className="spinner" /> Betöltés...</div>
        </div>
      )}

      {!loading && searched && tickets.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎫</div>
          <h3>Nem találtunk jegyet</h3>
          <p>Ehhez az e-mail címhez ({email}) jelenleg nem tartozik érvényes jegy.</p>
          {!isLoggedIn && <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Próbálj meg bejelentkezni a szinkronizáláshoz.</p>}
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="tickets-list" style={{ animation: 'fadeIn 0.5s ease' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div>
                <div className="ticket-conf">{ticket.confirmationCode}</div>
                <div className="ticket-route" style={{ fontSize: '1.1rem' }}>{ticket.from} → {ticket.to}</div>
                <div className="ticket-meta">
                  <b>{ticket.tripName}</b> · {formatDate(ticket.departureTime)}
                </div>
                <div className="ticket-meta" style={{ marginTop: 4, display: 'flex', gap: '10px' }}>
                  <span>🕒 {formatTime(ticket.departureTime)} – {formatTime(ticket.arrivalTime)}</span>
                  <span>👤 {ticket.passengerName}</span>
                </div>
                <div className="ticket-meta" style={{ marginTop: 4, opacity: 0.8 }}>
                  {ticket.quantity} db · {ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ticket-price" style={{ color: 'var(--accent)' }}>{ticket.totalPrice.toLocaleString('hu-HU')} Ft</div>
                <div className={`status-badge status-${ticket.status}`} style={{ marginTop: 8 }}>
                  {ticket.status === 'CONFIRMED' ? '✓ Érvényes' : ticket.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
