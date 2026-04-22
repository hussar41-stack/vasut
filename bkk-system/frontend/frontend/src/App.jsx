// Build Trigger: 2026-04-22 17:17 - Deployment Force
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Login from './components/Login';
import AdminDashboard from './components/Dashboard';
import EngineerView from './components/EngineerView';
import ConductorView from './components/ConductorView';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', flexDirection: 'column', gap: '20px' }}>
       <div className="spinner"></div>
       <p style={{ letterSpacing: '2px', fontSize: '0.8rem', opacity: 0.6 }}>RENDSZER INICIALIZÁLÁSA...</p>
    </div>
  );
  if (!admin) return <Navigate to="/login" />;
  
  // Szerepkör alapú renderelés
  if (admin.role === 'ENGINEER') return <EngineerView />;
  if (admin.role === 'CONDUCTOR') return <ConductorView />;
  
  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AdminAuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AdminAuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
