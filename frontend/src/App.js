import React, { useState } from 'react';
import './index.css';
import SchedulePage from './pages/SchedulePage';
import TicketsPage from './pages/TicketsPage';

const PAGES = [
  { id: 'schedule', label: '🔍 Menetrend' },
  { id: 'tickets', label: '🎫 Jegyeim' },
];

export default function App() {
  const [page, setPage] = useState('schedule');

  return (
    <div className="layout">
      {/* Navbar */}
      <nav className="navbar">
        <a className="navbar-brand" href="#top">
          <span className="logo-icon">🚆</span>
          <span>TransportHU</span>
        </a>
        <div className="nav-links">
          {PAGES.map(p => (
            <button
              key={p.id}
              className={`nav-link${page === p.id ? ' active' : ''}`}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      {page === 'schedule' && (
        <div style={{ padding: '2rem 2rem 0' , maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div className="hero">
            <h1>Utazzon velünk<br /><span>gyorsan és kényelmesen</span></h1>
            <p>Valós idejű menetrend · Késés követés · Azonnali jegyvásárlás</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="main">
        {page === 'schedule' && <SchedulePage />}
        {page === 'tickets' && <TicketsPage />}
      </main>

      <footer className="footer">
        © 2025 TransportHU · Menetrendi adatok szimuláltak · Demo alkalmazás
      </footer>
    </div>
  );
}
