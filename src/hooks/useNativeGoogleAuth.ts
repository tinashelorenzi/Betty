// src/hooks/useNativeGoogleAuth.ts - Enhanced with logging and toast messages
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, ToastAndroid } from 'react-native';
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

// Enhanced logging function
const logToBackend = async (level: 'info' | 'error' | 'debug', message: string, data?: any) => {
  try {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';
    const authToken = await AsyncStorage.getItem('authToken');
    
    const logData = {
      level,
      message,
      data: data ? JSON.stringify(data) : null,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      component: 'useNativeGoogleAuth'
    };

    console.log(`[${level.toUpperCase()}] ${message}`, data || '');

    if (authToken) {
      fetch(`${API_BASE_URL}/debug/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      }).catch(err => console.warn('Failed to send log to backend:', err));
    }
  } catch (error) {
    console.warn('Logging error:', error);
  }
};

// Toast message function
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    // For iOS, use Alert as fallback
    Alert.alert(type === 'error' ? 'Error' : 'Info', message);
  }
};

export const useNativeGoogleAuth = (): UseNativeGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        await logToBackend('info', 'Initializing Google Auth', {
          platform: Platform.OS,
          hasGoogleSignin: !!GoogleSignin,
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'present' : 'missing',
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'present' : 'missing',
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'present' : 'missing'
        });

        // Only configure Google Sign-In for mobile platforms
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

          await logToBackend('debug', 'Configuring GoogleSignin', config);
          GoogleSignin.configure(config);
          await logToBackend('info', 'GoogleSignin configured successfully');
          showToast('Google Auth initialized', 'success');
        } else {
          await logToBackend('info', 'Skipping GoogleSignin configuration', {
            reason: Platform.OS === 'web' ? 'web platform' : 'GoogleSignin not available'
          });
        }

        await checkStatus();
      } catch (error: any) {
        await logToBackend('error', 'Failed to initialize Google Auth', { error: error.message, stack: error.stack });
        showToast('Failed to initialize Google Auth', 'error');
      }
    };

    initializeGoogleAuth();
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await logToBackend('debug', 'Retrieved auth token', { hasToken: !!token });
      return token;
    } catch (error: any) {
      await logToBackend('error', 'Error getting auth token', { error: error.message });
      return null;
    }
  };

  const connectGoogleWeb = async (): Promise<boolean> => {
    try {
      await logToBackend('info', 'Starting web-based Google OAuth');
      showToast('Opening Google authentication...', 'info');

      const token = await getAuthToken();
      if (!token) {
        const errorMsg = 'Please log in to Betty first';
        await logToBackend('error', errorMsg);
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/connect`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await logToBackend('debug', 'OAuth URL request response', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || 'Failed to get OAuth URL';
        await logToBackend('error', 'OAuth URL request failed', errorData);
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const authUrl = data.authorization_url;

      if (!authUrl) {
        const errorMsg = 'No authorization URL received from server';
        await logToBackend('error', errorMsg);
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      await logToBackend('info', 'OAuth URL received, opening browser', { authUrl });

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

        await logToBackend('debug', 'Browser result', result);

        if (result.type === 'opened') {
          showToast('Please complete authentication in browser', 'info');
          await logToBackend('info', 'OAuth browser opened successfully');
          return true;
        } else if (result.type === 'cancel') {
          const errorMsg = 'Authentication was cancelled';
          await logToBackend('info', errorMsg);
          showToast(errorMsg, 'info');
          throw new Error(errorMsg);
        }

        return false;
      }
        } catch (error: any) {
      await logToBackend('error', 'Error in connectGoogleWeb', { 
        error: error.message,
        stack: error.stack
      });
      showToast(`Web OAuth error: ${error.message}`, 'error');
      throw error;
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await logToBackend('info', 'Starting Google connection process', {
        platform: Platform.OS,
        hasGoogleSignin: !!GoogleSignin
      });
      showToast('Connecting to Google...', 'info');

      // Use web-based OAuth for web platform or if native Google Sign-In is not available
      if (Platform.OS === 'web' || !GoogleSignin) {
        await logToBackend('info', 'Using web-based OAuth');
        return await connectGoogleWeb();
      }

      // Use native Google Sign-In for mobile platforms
      if (GoogleSignin) {
        await logToBackend('info', 'Using native Google Sign-In');
        
        // Check if user is already signed in
        try {
          await GoogleSignin.hasPlayServices();
          await logToBackend('info', 'Google Play Services available');
        } catch (playServicesError: any) {
          await logToBackend('error', 'Google Play Services not available', {
            error: playServicesError.message,
            code: playServicesError.code
          });
          showToast('Google Play Services not available', 'error');
          throw playServicesError;
        }
        
        // Sign in with Google
        const userInfo = await GoogleSignin.signIn();
        await logToBackend('info', 'Google Sign-In successful', {
          userEmail: userInfo?.data?.user?.email || 'unknown',
          userId: userInfo?.data?.user?.id || 'unknown'
        });

        const tokens = await GoogleSignin.getTokens();
        await logToBackend('debug', 'Retrieved Google tokens', {
          hasAccessToken: !!tokens.accessToken,
          hasIdToken: !!tokens.idToken
        });

        // Send the authorization code or access token to your backend
        const authToken = await getAuthToken();
        if (!authToken) {
          const errorMsg = 'Please log in to Betty first';
          await logToBackend('error', errorMsg);
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
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
              email: (userInfo as any).data?.user?.email || '',
              name: (userInfo as any).data?.user?.name || '',
              photo: (userInfo as any).data?.user?.photo || '',
              id: (userInfo as any).data?.user?.id || '',
            }
          }),
        });

        await logToBackend('debug', 'Backend connection response', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || 'Failed to connect Google account';
          await logToBackend('error', 'Backend connection failed', errorData);
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        const result = await response.json();
        setIsConnected(true);
        setUserInfo(result.user_info);
        
        await logToBackend('info', 'Google connection completed successfully');
        showToast('Successfully connected to Google!', 'success');
        return true;
      }

      throw new Error('Google Sign-In not available on this platform');

    } catch (error: any) {
      await logToBackend('error', 'Google Sign-In error', {
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      
      if (isErrorWithCode && isErrorWithCode(error)) {
        let errorMessage = '';
        switch(error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = 'Sign-in was cancelled';
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign-in already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Google Play Services not available';
            break;
          default:
            errorMessage = `Google Sign-In failed: ${error.message}`;
        }
        await logToBackend('error', 'Google Sign-In specific error', { code: error.code, message: errorMessage });
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      } else {
        showToast(`Connection failed: ${error.message}`, 'error');
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await logToBackend('info', 'Starting Google disconnection');
      showToast('Disconnecting from Google...', 'info');

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
          await logToBackend('info', 'Backend disconnection successful');
        } catch (error: any) {
          await logToBackend('error', 'Backend disconnection failed', { error: error.message });
        }
      }

      // Disconnect from Google Sign-In
      if (GoogleSignin && Platform.OS !== 'web') {
        try {
          await GoogleSignin.signOut();
          await logToBackend('info', 'Google Sign-In signout successful');
        } catch (error: any) {
          await logToBackend('error', 'Google Sign-In signout failed', { error: error.message });
        }
      }

      setIsConnected(false);
      setUserInfo(null);
      
      await logToBackend('info', 'Google disconnection completed');
      showToast('Disconnected from Google', 'success');
      return true;
    } catch (error: any) {
      await logToBackend('error', 'Error disconnecting Google', { error: error.message });
      showToast(`Disconnection failed: ${error.message}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      await logToBackend('debug', 'Checking Google connection status');
      
      const authToken = await getAuthToken();
      if (!authToken) {
        await logToBackend('debug', 'No auth token found');
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
        setIsConnected(data.connected);
        setUserInfo(data.user_info);
        
        await logToBackend('debug', 'Status check successful', {
          connected: data.connected,
          hasUserInfo: !!data.user_info
        });
      } else {
        await logToBackend('debug', 'Status check failed', { status: response.status });
      }
    } catch (error: any) {
      await logToBackend('error', 'Error checking status', { error: error.message });
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