// src/hooks/useNativeGoogleAuth.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Only import Google Sign-In for mobile platforms
let GoogleSignin: any = null;
let statusCodes: any = null;
let isErrorWithCode: any = null;

if (Platform.OS !== 'web') {
  try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
    isErrorWithCode = googleSignInModule.isErrorWithCode;
  } catch (error) {
    console.warn('Google Sign-In not available:', error);
  }
}

interface UseNativeGoogleAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: any;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
}

export const useNativeGoogleAuth = (): UseNativeGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    // Only configure Google Sign-In for mobile platforms
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        scopes: [
          'openid',
          'profile', 
          'email',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/calendar'
        ],
        offlineAccess: true,
      });
    }

    checkStatus();
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const connectGoogleWeb = async (): Promise<boolean> => {
    try {
      // Get the OAuth URL from your FastAPI backend
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Please log in to Betty first');
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/connect`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get OAuth URL');
      }

      const data = await response.json();
      const authUrl = data.authorization_url;

      if (!authUrl) {
        throw new Error('No authorization URL received from server');
      }

      console.log('🔍 OAuth URL received:', authUrl);

      // For web platform, open in same window
      if (Platform.OS === 'web') {
        window.open(authUrl, '_self');
        return true;
      } else {
        // For mobile platforms, use WebBrowser
        const result = await WebBrowser.openBrowserAsync(authUrl, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
          showTitle: true,
        });

        console.log('🔍 Browser result:', result);

        if (result.type === 'opened') {
          console.log('OAuth browser opened. Please complete authentication and return to the app.');
          return true;
        } else if (result.type === 'cancel') {
          throw new Error('Authentication was cancelled');
        }

        return false;
      }
    } catch (error) {
      console.error('Error connecting to Google (web):', error);
      throw error;
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Use web-based OAuth for web platform or if native Google Sign-In is not available
      if (Platform.OS === 'web' || !GoogleSignin) {
        return await connectGoogleWeb();
      }

      // Use native Google Sign-In for mobile platforms
      if (GoogleSignin) {
        // Check if user is already signed in
        await GoogleSignin.hasPlayServices();
        
        // Sign in with Google
        const userInfo = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();

        console.log('Google Sign-In successful:', userInfo);
        console.log('Tokens:', tokens);

        // Send the authorization code or access token to your backend
        const authToken = await getAuthToken();
        if (!authToken) {
          throw new Error('Please log in to Betty first');
        }

        // Send Google credentials to your backend
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
              email: (userInfo as any).email || '',
              name: (userInfo as any).name || '',
              photo: (userInfo as any).photo || '',
              id: (userInfo as any).id || '',
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to connect Google account');
        }

        const result = await response.json();
        setIsConnected(true);
        setUserInfo(result.user_info);

        return true;
      }

      throw new Error('Google Sign-In not available on this platform');

          } catch (error: any) {
        console.error('Google Sign-In error:', error);
        
        if (isErrorWithCode && isErrorWithCode(error)) {
          switch(error.code) {
            case statusCodes.SIGN_IN_CANCELLED:
              throw new Error('Sign-in was cancelled');
            case statusCodes.IN_PROGRESS:
              throw new Error('Sign-in already in progress');
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              throw new Error('Google Play Services not available');
            default:
              throw new Error(`Google Sign-In failed: ${error.message}`);
          }
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

      // Disconnect from backend first
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
          console.error('Failed to disconnect from backend:', error);
        }
      }

      // Sign out from Google (only for mobile)
      if (Platform.OS !== 'web' && GoogleSignin) {
        await GoogleSignin.signOut();
      }
      
      setIsConnected(false);
      setUserInfo(null);

      return true;

    } catch (error) {
      console.error('Error disconnecting Google:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      // Check backend status
      const authToken = await getAuthToken();
      if (!authToken) {
        setIsConnected(false);
        setUserInfo(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
        setUserInfo(data.user_info || null);
      } else {
        setIsConnected(false);
        setUserInfo(null);
      }

    } catch (error) {
      console.error('Error checking status:', error);
      setIsConnected(false);
      setUserInfo(null);
    }
  };

  return {
    isConnected,
    isLoading,
    userInfo,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
  };
};