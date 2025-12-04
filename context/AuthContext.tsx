'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserInfo } from '@/hooks/use-user-info';
import { useAuthToken } from '@/hooks/use-auth-token';

interface User {
  id: string;
  userId?: string;
  email: string;
  accountType: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, userId, email, accountType } = useUserInfo();
  const { removeToken } = useAuthToken();

  const user: User | null = isAuthenticated && userId ? {
    id: userId,
    userId,
    email: email || '',
    accountType: accountType || 'user',
    isAdmin: accountType === 'admin',
    isSuperAdmin: accountType === 'super_admin',
  } : null;

  const logout = () => {
    removeToken();
    // Optionally redirect or trigger any logout logic
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const checkAuth = () => {
    return isAuthenticated;
  };

  const contextValue: AuthContextType = {
    isLoggedIn: isAuthenticated,
    user,
    isLoading: false, // Since useUserInfo already handles loading states
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

export default AuthContext;