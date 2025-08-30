// src/hooks/useNativeGoogleAuth.ts - ENHANCED VERSION WITH PERSISTENCE
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

interface UserInfo {
  user_email?: string;
  name?: string;
  photo?: string;
  id?: string;
}

interface GoogleAuthState {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
}

const GOOGLE_AUTH_CACHE_KEY = 'google_auth_state';
const GOOGLE_AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNativeGoogleAuth = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0);

  // Initialize Google Auth and load cached state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Load cached state first for immediate UI response
      await loadCachedState();
      
      // Initialize Google Sign-In
      await configureGoogleSignIn();
      
      // Check actual status (this will update cache if needed)
      await checkStatus(true);
    } catch (error: any) {
      console.error('Failed to initialize Google Auth:', error);
      setIsLoading(false);
    }
  };

  const configureGoogleSignIn = async () => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      const config = {
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1092345143344-vd984vtn6cdo6tlid624r5aqhi0ov331.apps.googleusercontent.com',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '1092345143344-1b88lllija892eccovqf9r1o0h7uhjos.apps.googleusercontent.com',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '1092345143344-iaj5k44f4kt3m7q37u12b92r3bq4g75j.apps.googleusercontent.com',
        scopes: [
          'openid',
          'profile', 
          'email',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/calendar'
        ],
        offlineAccess: true,
      };

      GoogleSignin.configure(config);
    }
  };

  const loadCachedState = async () => {
    try {
      const cached = await AsyncStorage.getItem(GOOGLE_AUTH_CACHE_KEY);
      if (cached) {
        const { state, timestamp } = JSON.parse(cached);
        
        // Use cached state if it's recent
        if (Date.now() - timestamp < GOOGLE_AUTH_CACHE_DURATION) {
          setIsConnected(state.isConnected);
          setUserInfo(state.userInfo);
          setLastStatusCheck(timestamp);
          console.log('Loaded cached Google auth state:', state.isConnected);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached Google state:', error);
      return false;
    }
  };

  const cacheState = async (state: GoogleAuthState) => {
    try {
      const cacheData = {
        state: {
          isConnected: state.isConnected,
          userInfo: state.userInfo
        },
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(GOOGLE_AUTH_CACHE_KEY, JSON.stringify(cacheData));
      setLastStatusCheck(Date.now());
    } catch (error) {
      console.error('Error caching Google state:', error);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Enhanced checkStatus with caching and retry logic
  const checkStatus = useCallback(async (forceCheck: boolean = false): Promise<void> => {
    try {
      const now = Date.now();
      
      // Skip check if recent and not forced
      if (!forceCheck && (now - lastStatusCheck) < GOOGLE_AUTH_CACHE_DURATION) {
        console.log('Skipping status check - using cached result');
        return;
      }

      console.log('Checking Google connection status...');
      
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('No auth token found');
        await updateState(false, null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        await updateState(data.connected || false, data.user_info || null);
        console.log('Google connection status updated:', data.connected);
      } else {
        console.warn('Status check failed with status:', response.status);
        // Don't immediately set to disconnected on server errors
        if (response.status >= 500) {
          console.log('Server error, keeping current state');
          return;
        }
        await updateState(false, null);
      }
    } catch (error: any) {
      console.error('Error checking Google auth status:', error);
      
      // On network errors, keep current state but log the issue
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.log('Status check timed out, keeping current state');
        return;
      }
      
      // Only update state on non-network errors
      if (!error.message?.includes('Network') && !error.message?.includes('fetch')) {
        await updateState(false, null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastStatusCheck]);

  const updateState = async (connected: boolean, info: UserInfo | null) => {
    setIsConnected(connected);
    setUserInfo(info);
    
    // Cache the new state
    await cacheState({
      isConnected: connected,
      isLoading: false,
      userInfo: info
    });
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web' || !GoogleSignin) {
        throw new Error('Google Sign-In not available on this platform');
      }

      // Try to get current user first, if that fails, sign in
      let userInfo;
      try {
        userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo) {
          console.log('User already signed in, using current user');
        }
      } catch (error) {
        console.log('No current user, starting sign in flow');
        userInfo = await GoogleSignin.signIn();
      }

      if (!userInfo) {
        throw new Error('Failed to get user information from Google');
      }

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      
      // Send to backend
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Please log in to Betty first');
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/connect-native`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokens.accessToken,
          id_token: tokens.idToken,
          user_info: {
            email: (userInfo as any).data?.user?.email || '',
            name: (userInfo as any).data?.user?.name || '',
            photo: (userInfo as any).data?.user?.photo || '',
            id: (userInfo as any).data?.user?.id || '',
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to connect Google account');
      }

      const result = await response.json();
      await updateState(true, result.user_info);
      
      console.log('Google connection successful');
      return true;

    } catch (error: any) {
      console.error('Google connection error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Disconnect from backend
      const authToken = await getAuthToken();
      if (authToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Backend disconnection failed:', error);
        }
      }

      // Disconnect from Google Sign-In
      if (GoogleSignin && Platform.OS !== 'web') {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          console.error('Google Sign-In signout failed:', error);
        }
      }

      await updateState(false, null);
      console.log('Google disconnection successful');
      return true;
      
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Public method to force refresh status
  const refreshStatus = useCallback(() => {
    return checkStatus(true);
  }, [checkStatus]);

  // Auto-refresh every time the hook is used in a new component
  const ensureFreshStatus = useCallback(() => {
    const now = Date.now();
    if (now - lastStatusCheck > GOOGLE_AUTH_CACHE_DURATION) {
      checkStatus(false);
    }
  }, [checkStatus, lastStatusCheck]);

  // Call this whenever the hook is accessed
  useEffect(() => {
    ensureFreshStatus();
  }, [ensureFreshStatus]);

  return {
    isConnected,
    isLoading,
    userInfo,
    connectGoogle,
    disconnectGoogle,
    checkStatus: refreshStatus,
    refreshStatus,
  };
};