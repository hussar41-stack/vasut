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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Auto-fetch tickets on mount if user is logged in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchTickets(user.id);
    }
  }, [isLoggedIn, user]);

  async function fetchTickets(userId) {
    if (!userId) return;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const results = await api.getMyTickets(userId);
      setTickets(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tickets-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>🎫 Jegyeim</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Azonosító: <b style={{ color: 'var(--accent)' }}>{user.id.substring(0,8)}...</b>
              </div>
          )}
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => fetchTickets(user?.id)}
            disabled={loading || !user?.id}
          >
            🔄 Frissítés
          </button>
        </div>
      </div>

      {!isLoggedIn && (
        <div className="search-card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3>Bejelentkezés szükséges</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              A jegyeid megtekintéséhez kérjük jelentkezz be. Az új adatvédelmi szabályzatunk értelmében a jegyeket már csak azonosítás után tesszük elérhetővé.
            </p>
            <a href="/login" className="btn btn-primary">Bejelentkezés</a>
        </div>
      )}

      {error && <div className="error-banner">⚠️ {error}</div>}
      
      {loading && (
        <div className="loading-skeletons">
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12, borderRadius: 12 }}></div>)}
          <div className="loading"><span className="spinner" /> Betöltés...</div>
        </div>
      )}

      {!loading && searched && isLoggedIn && tickets.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎫</div>
          <h3>Nem találtunk jegyet</h3>
          <p>Ehhez a fiókhoz jelenleg nem tartozik érvényes jegy vagy bérlet.</p>
        </div>
      )}

      {!loading && isLoggedIn && tickets.length > 0 && (
        <div className="tickets-list" style={{ animation: 'fadeIn 0.5s ease' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card" style={{ borderLeft: `4px solid ${ticket.type === 'PASS' ? 'var(--success)' : 'var(--accent)'}` }}>
              <div>
                <div className="ticket-conf">{ticket.confirmationCode || ticket.qr_code}</div>
                <div className="ticket-route" style={{ fontSize: '1.1rem' }}>
                    {ticket.type === 'PASS' ? ticket.route_name : `${ticket.from_station} → ${ticket.to_station}`}
                </div>
                <div className="ticket-meta">
                  {ticket.type === 'PASS' ? (
                      <div>Érvényes havi bérlet</div>
                  ) : (
                      <b>{ticket.route_name}</b>
                  )}
                  {ticket.departure_time && <span> · {formatDate(ticket.departure_time)}</span>}
                </div>
                <div className="ticket-meta" style={{ marginTop: 4, display: 'flex', gap: '10px' }}>
                  {ticket.departure_time && <span>🕒 {formatTime(ticket.departure_time)}</span>}
                  <span>🆔 Ügyfél: {user.id.substring(0,8)}</span>
                </div>
                <div className="ticket-meta" style={{ marginTop: 4, opacity: 0.8 }}>
                  {ticket.type === 'PASS' ? (
                      <span>{ticket.pass_type === 'student' ? 'Diák bérlet' : 'Havi bérlet'}</span>
                  ) : (
                      <span>{ticket.type} · Validálva</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ticket-price" style={{ color: ticket.type === 'PASS' ? 'var(--success)' : 'var(--accent)' }}>
                    {ticket.price?.toLocaleString('hu-HU')} Ft
                </div>
                <div className={`status-badge status-${ticket.status}`} style={{ marginTop: 8 }}>
                  {ticket.status === 'CONFIRMED' || ticket.status === 'ACTIVE' ? '✓ Érvényes' : ticket.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
