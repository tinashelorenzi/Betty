// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserResponse } from '../services/authService';

interface AuthState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  loading: boolean;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (user: UserResponse, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    token: null,
  });

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const token = await authService.getStoredToken();
      const userData = await authService.getStoredUserData();
      
      if (token && userData) {
        // Verify token with backend
        const isValid = await authService.isAuthenticated();
        
        if (isValid) {
          setAuthState({
            isAuthenticated: true,
            user: userData,
            loading: false,
            token,
          });
          return;
        }
      }
      
      // Token invalid or not found
      await authService.clearToken();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      await authService.clearToken();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
    }
  };

  const login = async (user: UserResponse, token: string): Promise<void> => {
    try {
      await authService.storeToken(token);
      await authService.storeUserData(user);
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        token,
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still update state even if API call fails
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!authState.isAuthenticated) return;
      
      const updatedUser = await authService.getCurrentUser();
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails due to auth error, logout
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        await logout();
      }
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;