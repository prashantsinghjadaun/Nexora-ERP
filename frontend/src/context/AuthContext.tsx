import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { apiRequest } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('nexora_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexora_jwt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const storedToken = localStorage.getItem('nexora_jwt_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest<User>('/auth/me');
      setUser(response.data);
      localStorage.setItem('nexora_user', JSON.stringify(response.data));
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nexora_jwt_token');
      localStorage.removeItem('nexora_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('nexora_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('nexora_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { token: newJwt, user: loggedInUser } = response.data;
    localStorage.setItem('nexora_jwt_token', newJwt);
    localStorage.setItem('nexora_user', JSON.stringify(loggedInUser));

    setToken(newJwt);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem('nexora_jwt_token');
    localStorage.removeItem('nexora_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
