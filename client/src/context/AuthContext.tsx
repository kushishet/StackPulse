import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('stackpulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stackpulse_token');
      if (storedToken) {
        try {
          const { user } = await authApi.getMe();
          setUser(user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('stackpulse_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    const data = await authApi.login(email, pass);
    localStorage.setItem('stackpulse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
  };

  const register = async (email: string, pass: string, name?: string) => {
    const data = await authApi.register(email, pass, name);
    localStorage.setItem('stackpulse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
  };

  const demoLogin = async () => {
    const data = await authApi.demoLogin();
    localStorage.setItem('stackpulse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
  };

  const logout = () => {
    localStorage.removeItem('stackpulse_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
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
