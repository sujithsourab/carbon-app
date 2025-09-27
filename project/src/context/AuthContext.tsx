import React, { createContext, useContext, useState, useEffect } from 'react';
import { cloudflareClient } from '../utils/cloudflare';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextType['status']>('loading');

  useEffect(() => {
    // Check for existing token and validate
    const token = localStorage.getItem('auth_token');
    if (token) {
      cloudflareClient.getCurrentUser()
        .then(({ user }) => {
          setUser(user);
          setStatus('authenticated');
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setStatus('unauthenticated');
        });
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const login = async (email: string, password: string) => {
    setStatus('loading');
    try {
      const { user } = await cloudflareClient.login(email, password);
      setUser(user);
      setStatus('authenticated');
    } catch (error) {
      setStatus('unauthenticated');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setStatus('loading');
    try {
      const { user } = await cloudflareClient.signup(email, password, name);
      setUser(user);
      setStatus('authenticated');
    } catch (error) {
      setStatus('unauthenticated');
      throw error;
    }
  };

  const logout = async () => {
    setStatus('loading');
    try {
      await cloudflareClient.logout();
      setUser(null);
      setStatus('unauthenticated');
    } catch (error) {
      setStatus('authenticated');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};