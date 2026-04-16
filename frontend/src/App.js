import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';
import SchedulePage      from './pages/SchedulePage';
import TicketsPage       from './pages/TicketsPage';
import MapPage           from './pages/MapPage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import PrivateRoute      from './components/PrivateRoute';

function AppInner() {
  const { user, isLoggedIn } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <NavLink className="navbar-brand" to="/">
          <span className="logo-icon">🚆</span>
          <span>TransportHU</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🔍 Menetrend
          </NavLink>
          <NavLink to="/map"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🗺️ Térkép
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/tickets"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              🎫 Jegyeim
            </NavLink>
          )}
          {isLoggedIn ? (
            <NavLink to="/profile" className={({ isActive }) => `nav-link nav-user${isActive ? ' active' : ''}`}>
              👤 {user?.name?.split(' ')[0]}
            </NavLink>
          ) : (
            <>
              <NavLink to="/login"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Bejelentkezés
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm nav-register">
                Regisztráció
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={
          <>
            <div style={{ padding:'2rem 2rem 0', maxWidth:1200, margin:'0 auto', width:'100%' }}>
              <div className="hero">
                <h1>Utazzon velünk<br /><span>gyorsan és kényelmesen</span></h1>
                <p>Valós idejű menetrend · Interaktív térkép · Azonnali jegyvásárlás · AI Útvonalak</p>
              </div>
            </div>
            <main className="main"><SchedulePage /></main>
          </>
        } />

        <Route path="/map" element={
          <main style={{ flex:1, padding:0 }}><MapPage /></main>
        } />

        <Route path="/tickets" element={
          <PrivateRoute>
            <main className="main"><TicketsPage /></main>
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <main className="main"><ProfilePage /></main>
          </PrivateRoute>
        } />

        <Route path="/success" element={
          <PrivateRoute>
             <main className="main"><SuccessPage /></main>
          </PrivateRoute>
        } />

        <Route path="/cancel" element={
          <PrivateRoute>
             <main className="main"><CancelPage /></main>
          </PrivateRoute>
        } />

        <Route path="/login"           element={<main className="main"><LoginPage /></main>} />
        <Route path="/register"        element={<main className="main"><RegisterPage /></main>} />
        <Route path="/forgot-password" element={<main className="main"><ForgotPasswordPage /></main>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        <p className="footer-disclaimer">Nem hivatalos demo alkalmazás · JWT autentikáció · Leaflet térkép</p>

        <div className="footer-sponsors">
          <a
            href="https://www.mavcsoport.hu/"
            target="_blank"
            rel="noopener noreferrer"
            className="sponsor-card"
            title="MÁV Csoport – Magyar Államvasutak"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MAV_log%C3%B3.svg/180px-MAV_log%C3%B3.svg.png"
              alt="MÁV logó"
              className="sponsor-logo"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <span className="sponsor-fallback mav-fallback">MÁV</span>
          </a>

          <a
            href="https://bkk.hu/"
            target="_blank"
            rel="noopener noreferrer"
            className="sponsor-card"
            title="BKK – Budapesti Közlekedési Központ"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/BKK_logo.svg/180px-BKK_logo.svg.png"
              alt="BKK logó"
              className="sponsor-logo"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <span className="sponsor-fallback bkk-fallback">BKK</span>
          </a>
        </div>

        <p className="footer-copy">© 2025 TransportHU</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppInner />
      </Router>
    </AuthProvider>
  );
}
