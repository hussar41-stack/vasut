import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Login from './components/Login';
import AdminDashboard from './components/Dashboard';
import EngineerView from './components/EngineerView';
import ConductorView from './components/ConductorView';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div>Betöltés...</div>;
  if (!admin) return <Navigate to="/login" />;
  
  // Szerepkör alapú renderelés
  if (admin.role === 'ENGINEER') return <EngineerView />;
  if (admin.role === 'CONDUCTOR') return <ConductorView />;
  
  return children;
};

export default function App() {
  return (
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
  );
}
