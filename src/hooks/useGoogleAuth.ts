// Fixed useGoogleAuth.ts - Explicitly use Expo proxy URL
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete the auth session when returning to the app
WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: any;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
  pushToGoogleDrive: (title: string, content: string) => Promise<boolean>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Get configuration from app.json extra or environment variables
  const googleClientId = Constants.expoConfig?.extra?.googleClientId || 
                        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 
                      process.env.EXPO_PUBLIC_API_BASE_URL || 
                      'http://localhost:8000';

  // OAuth configuration for Expo
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // Explicitly construct the Expo proxy redirect URI
  const projectSlug = Constants.expoConfig?.slug || 'betty-office-genius';
  const expoUsername = Constants.expoConfig?.owner || 'tinashelorenzi';
  
  // Force the Expo proxy URL instead of letting makeRedirectUri decide
  const redirectUri = `http://10.0.0.166:8000/auth/google/mobile-redirect`;

  console.log('OAuth Config:', {
    clientId: googleClientId?.substring(0, 20) + '...',
    redirectUri,
    apiBaseUrl: API_BASE_URL,
    projectSlug,
    expoUsername
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: googleClientId,
      scopes: [
        'openid',
        'profile', 
        'email',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/calendar'
      ],
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
        prompt: 'consent', // Force consent screen to get refresh token
      },
      responseType: 'code',
      redirectUri, // Use our explicitly constructed URI
    },
    discovery
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('OAuth success, handling auth code...');
      handleAuthSuccess(response.params.code);
    } else if (response?.type === 'error') {
      console.error('OAuth error:', response.error);
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('OAuth cancelled by user');
      setIsLoading(false);
    }
  }, [response]);

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const handleAuthSuccess = async (authCode: string) => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in to Betty first.');
      }

      console.log('Sending auth code to backend...');

      // Send the authorization code to your backend
      const response = await fetch(`${API_BASE_URL}/auth/google/mobile-callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          redirect_uri: redirectUri, // Send the same redirect URI used for OAuth
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        
        throw new Error(errorData.detail || 'Failed to complete authentication');
      }

      const data = await response.json();
      console.log('Auth success:', data);
      
      if (data.success) {
        // Refresh status to show connected state
        await checkStatus();
      } else {
        throw new Error('Authentication failed on server');
      }
    } catch (error) {
      console.error('Error handling auth success:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const connectGoogle = async (): Promise<void> => {
    try {
      if (!googleClientId) {
        throw new Error('Google Client ID not configured. Please check your app.json configuration.');
      }
      
      if (!request) {
        throw new Error('OAuth request not ready. Please try again.');
      }
      
      setIsLoading(true);
      console.log('Starting OAuth flow with redirect URI:', redirectUri);
      
      const result = await promptAsync();
      
      // Note: handleAuthSuccess will be called automatically via useEffect
      // when response changes, so we don't need to handle it here
      
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      const token = await getToken();
      
      if (!token) {
        setIsConnected(false);
        setUserInfo(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const status = await response.json();
        setIsConnected(status.connected);
        setUserInfo(status);
        console.log('Google connection status:', status.connected);
      } else {
        setIsConnected(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      setIsConnected(false);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to disconnect Google account');
      }

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        setUserInfo(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const pushToGoogleDrive = async (title: string, content: string): Promise<boolean> => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/google/create-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create Google Doc');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error pushing to Google Drive:', error);
      throw error;
    }
  };

  // Check status on hook initialization
  useEffect(() => {
    checkStatus();
  }, []);

  return {
    isConnected,
    isLoading,
    userInfo,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    pushToGoogleDrive,
  };
};