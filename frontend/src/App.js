import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { api } from './api/client';
import { version } from './version';
import './index.css';
import SchedulePage      from './pages/SchedulePage';
import TicketsPage       from './pages/TicketsPage';
import MapPage           from './pages/MapPage';
import BKKMapPage        from './pages/BKKMapPage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import FAQPage           from './pages/FAQPage';
import AboutPage         from './pages/AboutPage';
import PrivacyPage       from './pages/PrivacyPage';
import PassesPage        from './pages/PassesPage';
import PrivateRoute      from './components/PrivateRoute';
import HeroSlider        from './components/HeroSlider';
import CertificatePage   from './pages/CertificatePage';

function AppInner() {
  const { user, isLoggedIn } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [siteInfo, setSiteInfo] = useState(null);

  useEffect(() => {
    api.getSiteInfo()
      .then(data => setSiteInfo(data))
      .catch(err => console.error('Site info load error:', err));
  }, []);

  return (
    <div className="layout">
      <nav className="navbar">
        <NavLink className="navbar-brand" to="/">
          <svg className="logo-icon-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="16" rx="2" />
            <path d="M4 11h16" />
            <path d="M12 3v8" />
            <path d="m8 19-2 2" />
            <path d="m18 21-2-2" />
            <circle cx="8" cy="15" r="1" />
            <circle cx="16" cy="15" r="1" />
          </svg>
          <span>TransportHU</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🔍 Kereső
          </NavLink>
          <NavLink to="/map"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🚆 Vonat
          </NavLink>
          <NavLink to="/bkk-map"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🚌 BKK
          </NavLink>
          {isLoggedIn && (
            <>
              <NavLink to="/passes"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                🎫 Bérlet
              </NavLink>
              <NavLink to="/tickets"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                🎟️ Jegyek
              </NavLink>
            </>
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
              <HeroSlider />
            </div>
            <main className="main"><SchedulePage /></main>
          </>
        } />

        <Route path="/map" element={
          <main style={{ flex:1, padding:0 }}><MapPage /></main>
        } />

        <Route path="/bkk-map" element={
          <main style={{ flex:1, padding:0 }}><BKKMapPage /></main>
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
        
        <Route path="/faq"     element={<main className="main"><FAQPage /></main>} />
        <Route path="/about"   element={<main className="main"><AboutPage /></main>} />
        <Route path="/privacy" element={<main className="main"><PrivacyPage /></main>} />
        <Route path="/passes"  element={<main className="main"><PassesPage /></main>} />
        <Route path="/certificate" element={<main className="main"><CertificatePage /></main>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links-row">
            <NavLink to="/faq" className="footer-doc-link">🙋 GY.I.K.</NavLink>
            <NavLink to="/about" className="footer-doc-link">👥 Rólunk</NavLink>
            <NavLink to="/privacy" className="footer-doc-link">⚖️ Adatkezelés</NavLink>
            <NavLink to="/certificate" className="footer-doc-link">📜 Tanúsítvány</NavLink>
            <button className="footer-link-btn" onClick={() => setShowContact(!showContact)}>📇 Kapcsolat</button>
          </div>

          {showContact && (
            <div className="footer-contact-info">
              <p><strong>Felelős:</strong> Huszár Barnabás · <strong>Email:</strong> hbgmunka@gmail.com</p>
            </div>
          )}

          <div className="footer-sponsors">
            <a href="https://www.mavcsoport.hu/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/M%C3%81V_Szem%C3%A9lysz%C3%A1ll%C3%ADt%C3%A1si_Zrt.png" className="sponsor-logo mav-logo" alt="" />
            </a>
            <a href="https://bkk.hu/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
              <img src="https://logowik.com/content/uploads/images/t_budapesti-kozlekedesi-kozpont2751.logowik.com.webp" className="sponsor-logo bkk-logo" alt="" />
            </a>
            <a href="https://stripe.com/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="sponsor-logo stripe-logo" alt="" />
            </a>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">
              © 2026 TransportHU · <span className="footer-version">v{version}</span>
            </p>
          </div>
        </div>
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
