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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <NavLink to="/faq" className="footer-link">🙋 GY.I.K.</NavLink>
            <NavLink to="/about" className="footer-link">👥 Rólunk</NavLink>
            <NavLink to="/privacy" className="footer-link">⚖️ Adatkezelés</NavLink>
            <button className="footer-link-btn" onClick={() => setShowContact(!showContact)}>📇 Kapcsolat</button>
          </div>

          {showContact && (
            <div className="footer-contact-info">
              <p><strong>Felelős:</strong> Huszár Barnabás · <strong>Email:</strong> hbgmunka@gmail.com</p>
            </div>
          )}

          <div className="footer-sponsors">
            <a href="https://www.mavcsoport.hu/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
              <svg className="sponsor-logo mav-logo" width="80" height="30" viewBox="0 0 500 250">
                <path fill="white" d="M253.19 37c-33.339 0-62.443 18.036-78.066 44.854h-65.12l8.0633 29.995h135.12c8.3064 0 15.038 6.7138 15.038 14.998 0 8.2839-6.732 14.998-15.038 14.998h-127.06l8.0633 29.995h40.763c15.584 26.979 44.774 45.16 78.234 45.16 33.07 0 61.992-17.751 77.703-44.214h44.502l8.2865-30.802h-41.516c0.81905-4.8744 1.2555-9.8915 1.2555-14.998 0-5.1062-0.43648-10.124-1.2555-14.998h49.552l8.2865-30.802h-69.11c-15.711-26.455-44.634-44.186-77.703-44.186zm0 29.995c33.226 0 60.154 26.855 60.154 59.991s-26.928 60.019-60.154 60.019c-15.335 0-29.325-5.7406-39.954-15.165h39.954c24.919 0 45.115-20.141 45.115-44.993s-20.196-44.993-45.115-44.993h-39.619c10.583-9.2516 24.443-14.859 39.619-14.859z"/>
                <path fill="white" d="M276.3 226.72-15.899 25.509h34.138l25.088-25.509zm-148.76 33.64-51.54 0.14v92.101h31.771v-71.868l19.129 71.98h28.235l19.129-71.98v71.868h31.771v-92.101l-51.541-0.14032-13.477 50.681zm126.81 0-38.398 92.353h34.444l4.7058-11.281h47.559l4.7058 11.281h34.444l-38.398-92.353zm67.709 0 38.426 92.353h35.112l38.398-92.353h-34.444l-21.524 51.747-21.496-51.747zm-43.177 23.881 14.841 35.667h-29.683z" transform="translate(0, -70)"/>
              </svg>
            </a>
            <a href="https://bkk.hu/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
              <svg className="sponsor-logo bkk-logo" viewBox="0 0 252 121" width="80" height="30">
                <path fill="white" d="M190.48,1.301c-15.855,0-31.15,6.014-43.149,16.489l-19.129,71.98l-19.129-71.98c-11.999-10.475-27.294-16.489-43.149-16.489H11.75c-6.082,0-10.45,4.368-10.45,10.45v100.127c0,6.082,4.368,10.45,10.45,10.45h54.17c6.082,0,10.45-4.368,10.45-10.45V40.547l18.441,69.467c1.301,4.894,5.491,8.349,10.583,8.349s9.282-3.455,10.584-8.349l18.441-69.467v70.027c0,6.082,4.368,10.45,10.45,10.45h54.17c6.082,0,10.45-4.368,10.45-10.45V11.751C190.48,5.669,186.111,1.301,190.48,1.301z"/>
              </svg>
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
