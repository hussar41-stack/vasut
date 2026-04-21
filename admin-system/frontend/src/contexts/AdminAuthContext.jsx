import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Itt lehetne egy verify check a backend felé
      setAdmin(JSON.parse(localStorage.getItem('adminData')));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, admin: adminData } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      setAdmin(adminData);
      return true;
    } catch (err) {
      console.error('Admin login error:', err);
      throw err;
    }
  };

  const updateAdmin = (newData) => {
    const updated = { ...admin, ...newData };
    localStorage.setItem('adminData', JSON.stringify(updated));
    setAdmin(updated);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading, updateAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
