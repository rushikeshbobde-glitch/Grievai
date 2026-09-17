import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('grievai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('grievai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('grievai_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('grievai_token', access_token);
    localStorage.setItem('grievai_user', JSON.stringify(userData));
    return userData;
  };

  const demoLogin = async (role = 'citizen') => {
    const credentials = {
      admin: { email: 'admin@grievai.gov', password: 'Admin@123' },
      water_officer: { email: 'officer.water@grievai.gov', password: 'Officer@123' },
      roads_officer: { email: 'officer.roads@grievai.gov', password: 'Officer@123' },
      electricity_officer: { email: 'officer.electricity@grievai.gov', password: 'Officer@123' },
      sanitation_officer: { email: 'officer.sanitation@grievai.gov', password: 'Officer@123' },
      citizen: { email: 'citizen@grievai.gov', password: 'Citizen@123' },
    };

    const target = credentials[role] || credentials.citizen;
    return await login(target.email, target.password);
  };

  const register = async (formData) => {
    const res = await apiClient.post('/auth/register', formData);
    // After registration, auto login
    return await login(formData.email, formData.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('grievai_token');
    localStorage.removeItem('grievai_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
