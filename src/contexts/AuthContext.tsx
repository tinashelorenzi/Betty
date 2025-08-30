// src/contexts/AuthContext.tsx - ENHANCED VERSION WITH GOOGLE INTEGRATION
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserResponse } from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  loading: boolean;
  token: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
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

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      console.log('🔄 Initializing authentication...');
      
      // Check if user is already authenticated
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const [token, user] = await Promise.all([
          authService.getStoredToken(),
          authService.getStoredUserData()
        ]);

        if (token && user) {
          console.log('✅ User authenticated from storage:', user.email);
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            token,
          });
          return;
        }
      }

      console.log('❌ User not authenticated');
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });

    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
    }
  };

  const login = async (email: string, password: string): Promise<UserResponse> => {
    try {
      console.log('🔄 Attempting login for:', email);
      setAuthState(prev => ({ ...prev, loading: true }));

      const response = await authService.login({ email, password });
      
      // Store token and user data
      await authService.storeToken(response.access_token);
      await authService.storeUserData(response.user);

      console.log('✅ Login successful:', response.user.email);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        token: response.access_token,
      });

      return response.user;
    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔄 Logging out user...');
      setAuthState(prev => ({ ...prev, loading: true }));

      // Call logout API if available
      try {
        await authService.logout();
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error);
        // Continue with local logout even if API fails
      }

      // Clear all stored data
      await authService.clearToken();
      
      // Clear any Google auth cache as well
      try {
        await AsyncStorage.removeItem('google_auth_state');
      } catch (error) {
        console.warn('⚠️ Failed to clear Google auth cache:', error);
      }

      console.log('✅ User logged out successfully');

      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still update state even if logout fails
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
      
      console.log('🔄 Refreshing user data...');
      
      const updatedUser = await authService.getCurrentUser();
      
      // Update stored user data
      await authService.storeUserData(updatedUser);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      console.log('✅ User data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      
      // If refresh fails due to auth error, logout
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        console.log('🔄 Auth token invalid, logging out...');
        await logout();
      }
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        // Clear state if not authenticated
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          token: null,
        });
        return false;
      }

      // If authenticated but no user data in state, refresh
      if (!authState.user) {
        await refreshUser();
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      return false;
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