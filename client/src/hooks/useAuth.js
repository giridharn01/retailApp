import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { setToken, getToken, removeToken } from '../utils/tokenHandler';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest('/auth/me', { auth: true });
        setUser(res.user);
      } catch {
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const signIn = async (email, password) => {
    const res = await apiRequest('/auth/signin', {
      method: 'POST',
      body: { email, password },
    });
    setToken(res.token);
    setUser(res.user);
  };

  const signUp = async (name, email, password) => {
    const res = await apiRequest('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
    setToken(res.token);
    setUser(res.user);
  };

  const signOut = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 