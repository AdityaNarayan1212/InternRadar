import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { User } from '../types';
import { AuthContext, type RegisterData } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On app load, fetch current user if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
        } catch (error) {
          if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            console.error('[auth] Could not verify the saved session', error);
          }
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Re-fetches the current user - used after a profile edit so Navbar/etc.
  // reflect the new data without a full page reload.
  const refreshUser = async () => {
    if (!token) return;
    const res = await api.get('/auth/me');
    setUser(res.data.data);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data.data;
    queryClient.clear();
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: newUser } = res.data.data;
    queryClient.clear();
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    queryClient.clear();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
