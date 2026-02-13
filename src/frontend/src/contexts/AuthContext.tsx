import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, UserInfo } from '../api/auth';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: 'consultant_rapport' | 'consultant' | 'editeur' | 'admin') => boolean;
  isAdmin: boolean;
  isEditeur: boolean;
  isConsultant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Vérifier que le token est toujours valide
      authApi.getCurrentUser()
        .then((userInfo) => {
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    setToken(response.access_token);
    localStorage.setItem('token', response.access_token);

    const userInfo = await authApi.getCurrentUser();
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (role: 'consultant_rapport' | 'consultant' | 'editeur' | 'admin'): boolean => {
    if (!user) return false;
    const roleHierarchy = { consultant_rapport: 0, consultant: 1, editeur: 2, admin: 3 };
    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    hasRole,
    isAdmin: user?.role === 'admin',
    isEditeur: user?.role === 'editeur' || user?.role === 'admin',
    isConsultant : user?.role === 'consultant' || user?.role === 'editeur' || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
