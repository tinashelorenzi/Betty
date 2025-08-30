// src/hooks/useNativeGoogleAuth.ts - VERSION WITH FRESH TOKEN HANDLING

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';

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
        
        // Check if cache is still valid (5 minutes)
        if (Date.now() - timestamp < GOOGLE_AUTH_CACHE_DURATION) {
          setIsConnected(state.isConnected);
          setUserInfo(state.userInfo);
          setIsLoading(false);
          console.log('Loaded cached Google auth state');
          return;
        }
      }
    } catch (error) {
      console.log('Failed to load cached state:', error);
    }
  };

  const cacheState = async (state: GoogleAuthState) => {
    try {
      await AsyncStorage.setItem(GOOGLE_AUTH_CACHE_KEY, JSON.stringify({
        state,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.log('Failed to cache state:', error);
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

  // Get fresh tokens from Google
  const getFreshGoogleTokens = async () => {
    try {
      console.log('🔄 Getting fresh Google tokens...');
      
      // First, sign out to clear any cached tokens
      try {
        await GoogleSignin.signOut();
        console.log('✅ Signed out from Google to clear cached tokens');
      } catch (error) {
        console.log('ℹ️ Sign out not needed or failed, continuing...');
      }
      
      // Sign in again to get fresh tokens
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Fresh sign-in completed');
      
      // Get the fresh tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Fresh tokens obtained');
      
      return { userInfo, tokens };
    } catch (error) {
      console.error('❌ Failed to get fresh tokens:', error);
      throw error;
    }
  };

  // Check Google connection status with backend
  const checkStatus = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastStatusCheck < 30000) {
      return; // Don't check more than once per 30 seconds
    }
    
    setLastStatusCheck(now);
    
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('No auth token available');
        await updateState(false, null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        await updateState(data.connected || false, data.user_info || null);
        console.log('Google connection status updated:', data.connected);
      } else {
        console.warn('Status check failed with status:', response.status);
        if (response.status >= 500) {
          console.log('Server error, keeping current state');
          return;
        }
        await updateState(false, null);
      }
    } catch (error: any) {
      console.error('Error checking Google auth status:', error);
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.log('Status check timed out, keeping current state');
        return;
      }
      
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

      // Get fresh tokens and user info
      const { userInfo, tokens } = await getFreshGoogleTokens();

      if (!userInfo) {
        throw new Error('Failed to get user information from Google');
      }

      console.log('🔍 Raw Google Sign-In userInfo:', JSON.stringify(userInfo, null, 2));

      // Extract user data correctly based on the actual structure
      let extractedUserData;
      
      if ((userInfo as any).user) {
        // Standard structure: userInfo.user contains the actual user data
        extractedUserData = {
          email: (userInfo as any).user.email || '',
          name: (userInfo as any).user.name || '',
          photo: (userInfo as any).user.photo || '',
          id: (userInfo as any).user.id || '',
        };
      } else {
        // Alternative structure: userInfo itself contains user data
        extractedUserData = {
          email: (userInfo as any).email || '',
          name: (userInfo as any).name || '',
          photo: (userInfo as any).photo || '',
          id: (userInfo as any).id || '',
        };
      }

      console.log('✅ Extracted user data:', extractedUserData);

      // Validate that we have the required email
      if (!extractedUserData.email) {
        console.error('❌ No email found in Google user info:', userInfo);
        throw new Error('Failed to get user email from Google. Please try signing out and signing in again.');
      }

      // Send to backend
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Please log in to Betty first');
      }

      const requestPayload = {
        access_token: tokens.accessToken,
        id_token: tokens.idToken,
        user_info: extractedUserData
      };

      console.log('📤 Sending to backend:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch(`${API_BASE_URL}/auth/google/connect-native`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      console.log('📥 Backend response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${responseText}` };
        }
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.detail || 'Failed to connect Google account');
      }

      const result = JSON.parse(responseText);
      await updateState(true, result.user_info);
      
      console.log('✅ Google connection successful');
      return true;

    } catch (error: any) {
      console.error('❌ Google connection error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Please log in to Betty first');
      }

      // Disconnect from backend
      const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to disconnect Google account');
      }

      // Sign out from Google on device
      if (Platform.OS !== 'web' && GoogleSignin) {
        await GoogleSignin.signOut();
      }

      await updateState(false, null);
      
      console.log('Google disconnection successful');
      return true;

    } catch (error: any) {
      console.error('Google disconnection error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Public method to force refresh status
  const refreshStatus = useCallback(() => {
    return checkStatus(true);
  }, [checkStatus]);

  return {
    isConnected,
    isLoading,
    userInfo,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    refreshStatus,
  };
};