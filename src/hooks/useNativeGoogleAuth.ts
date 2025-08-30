// src/hooks/useNativeGoogleAuth.ts - Fixed version for your existing backend
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

// Storage keys for Google auth state
const GOOGLE_AUTH_STATE_KEY = 'google_auth_state';
const GOOGLE_USER_INFO_KEY = 'google_user_info';
const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';
const GOOGLE_ID_TOKEN_KEY = 'google_id_token';

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
    Alert.alert(type === 'error' ? 'Error' : 'Info', message);
  }
};

export const useNativeGoogleAuth = (): UseNativeGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const [userInfo, setUserInfo] = useState(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

  // Store Google auth state persistently
  const storeGoogleAuthState = async (connected: boolean, userInfo: any = null, tokens: any = null) => {
    try {
      await AsyncStorage.multiSet([
        [GOOGLE_AUTH_STATE_KEY, JSON.stringify(connected)],
        [GOOGLE_USER_INFO_KEY, JSON.stringify(userInfo)],
        [GOOGLE_ACCESS_TOKEN_KEY, tokens?.accessToken || ''],
        [GOOGLE_ID_TOKEN_KEY, tokens?.idToken || '']
      ]);
      await logToBackend('debug', 'Google auth state stored', { connected, hasUserInfo: !!userInfo });
    } catch (error: any) {
      await logToBackend('error', 'Failed to store Google auth state', { error: error.message });
    }
  };

  // Retrieve Google auth state from storage
  const getStoredGoogleAuthState = async () => {
    try {
      const [authState, userInfoStr, accessToken, idToken] = await AsyncStorage.multiGet([
        GOOGLE_AUTH_STATE_KEY,
        GOOGLE_USER_INFO_KEY,
        GOOGLE_ACCESS_TOKEN_KEY,
        GOOGLE_ID_TOKEN_KEY
      ]);

      const connected = authState[1] ? JSON.parse(authState[1]) : false;
      const storedUserInfo = userInfoStr[1] ? JSON.parse(userInfoStr[1]) : null;
      
      await logToBackend('debug', 'Retrieved stored Google auth state', { 
        connected, 
        hasUserInfo: !!storedUserInfo,
        hasAccessToken: !!accessToken[1],
        hasIdToken: !!idToken[1]
      });

      return {
        connected,
        userInfo: storedUserInfo,
        accessToken: accessToken[1],
        idToken: idToken[1]
      };
    } catch (error: any) {
      await logToBackend('error', 'Failed to retrieve Google auth state', { error: error.message });
      return { connected: false, userInfo: null, accessToken: null, idToken: null };
    }
  };

  // Clear stored Google auth state
  const clearStoredGoogleAuthState = async () => {
    try {
      await AsyncStorage.multiRemove([
        GOOGLE_AUTH_STATE_KEY,
        GOOGLE_USER_INFO_KEY,
        GOOGLE_ACCESS_TOKEN_KEY,
        GOOGLE_ID_TOKEN_KEY
      ]);
      await logToBackend('debug', 'Google auth state cleared');
    } catch (error: any) {
      await logToBackend('error', 'Failed to clear Google auth state', { error: error.message });
    }
  };

  // Check status function - improved logic
  const checkStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await logToBackend('info', 'Checking Google connection status');

      const authToken = await getAuthToken();
      if (!authToken) {
        await logToBackend('info', 'No auth token, user not logged in');
        setIsConnected(false);
        setUserInfo(null);
        return;
      }

      // First, try to get stored state for immediate UI update
      const storedState = await getStoredGoogleAuthState();
      if (storedState.connected && storedState.userInfo) {
        await logToBackend('debug', 'Using stored Google auth state for immediate update');
        setIsConnected(true);
        setUserInfo(storedState.userInfo);
      }

      // Then verify with backend
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        await logToBackend('debug', 'Backend Google status check', { status: response.status });

        if (response.ok) {
          const data = await response.json();
          const backendConnected = data.connected === true;
          
          await logToBackend('info', 'Backend status response', { 
            connected: backendConnected, 
            hasUserInfo: !!data.user_info,
            responseData: data 
          });
          
          if (backendConnected) {
            // Backend confirms connection
            setIsConnected(true);
            if (data.user_info) {
              setUserInfo(data.user_info);
              // Update stored state with backend data
              await storeGoogleAuthState(true, data.user_info, { 
                accessToken: storedState.accessToken, 
                idToken: storedState.idToken 
              });
            } else if (storedState.userInfo) {
              // Keep stored user info if backend doesn't have it
              setUserInfo(storedState.userInfo);
            }
          } else {
            // Backend says not connected
            await logToBackend('info', 'Backend reports Google not connected');
            
            // Only clear state if we're sure it's not connected
            // Don't clear on network errors or unclear responses
            if (data && data.hasOwnProperty('connected') && data.connected === false) {
              setIsConnected(false);
              setUserInfo(null);
              await clearStoredGoogleAuthState();
            } else {
              // Keep stored state if response is unclear
              await logToBackend('debug', 'Keeping stored state due to unclear backend response');
            }
          }
        } else {
          await logToBackend('error', 'Backend status check failed', { 
            status: response.status,
            statusText: response.statusText 
          });
          // On HTTP error, keep stored state - don't clear it
          await logToBackend('debug', 'Keeping stored state due to backend error');
        }
      } catch (networkError: any) {
        await logToBackend('error', 'Network error during status check - keeping stored state', { 
          error: networkError.message 
        });
        // On network error, keep stored state for offline resilience
      }

    } catch (error: any) {
      await logToBackend('error', 'Error in checkStatus', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        await logToBackend('info', 'Initializing Google Auth', {
          platform: Platform.OS,
          hasGoogleSignin: !!GoogleSignin,
        });

        // Configure Google Sign-In for mobile platforms
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

          await logToBackend('debug', 'Configuring GoogleSignin');
          GoogleSignin.configure(config);
          await logToBackend('info', 'GoogleSignin configured successfully');
        }

        // Check status after initialization
        await checkStatus();
      } catch (error: any) {
        await logToBackend('error', 'Failed to initialize Google Auth', { 
          error: error.message, 
          stack: error.stack 
        });
        setIsLoading(false);
      }
    };

    initializeGoogleAuth();
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error: any) {
      await logToBackend('error', 'Error getting auth token', { error: error.message });
      return null;
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

        // Send tokens to your existing backend endpoint
        const authToken = await getAuthToken();
        if (!authToken) {
          throw new Error('Please log in to Betty first');
        }

        // Your backend expects this format based on your GoogleService
        const response = await fetch(`${API_BASE_URL}/auth/google/store-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: tokens.accessToken,
            id_token: tokens.idToken,
            user_info: userInfo?.data?.user
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to connect Google account');
        }

        const backendData = await response.json();
        await logToBackend('info', 'Google account connected successfully', backendData);

        // Store the connection state and user info
        await storeGoogleAuthState(true, userInfo?.data?.user, tokens);
        
        setIsConnected(true);
        setUserInfo(userInfo?.data?.user);
        showToast('Google account connected successfully!', 'success');
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

      // Use your existing backend endpoint
      const response = await fetch(`${API_BASE_URL}/auth/google/oauth-url`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

      await logToBackend('info', 'OAuth URL received, opening browser');

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
          
          // Check status after a delay to see if connection was successful
          setTimeout(async () => {
            await checkStatus();
          }, 5000);
          
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

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await logToBackend('info', 'Starting Google disconnection');
      showToast('Disconnecting from Google...', 'info');

      // Use your existing disconnect endpoint
      const authToken = await getAuthToken();
      if (authToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            await logToBackend('info', 'Backend disconnection successful');
          } else {
            await logToBackend('error', 'Backend disconnection failed', { status: response.status });
          }
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

      // Clear stored state
      await clearStoredGoogleAuthState();
      
      setIsConnected(false);
      setUserInfo(null);
      showToast('Google account disconnected', 'success');
      await logToBackend('info', 'Google disconnection completed');
      
      return true;
    } catch (error: any) {
      await logToBackend('error', 'Error disconnecting Google', { error: error.message });
      showToast(`Disconnection failed: ${error.message}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
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