// Alternative approach: Manual browser OAuth flow
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const googleClientId = Constants.expoConfig?.extra?.googleClientId || 
                        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  const SERVEO_URL = 'http://localhost:8000';
  const API_BASE_URL = SERVEO_URL;

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const connectGoogle = async (): Promise<void> => {
    try {
      if (!googleClientId) {
        throw new Error('Google Client ID not configured');
      }
      
      setIsLoading(true);
      console.log('Starting Google OAuth flow...');

      // Get the OAuth URL from your backend
      const token = await getToken();
      if (!token) {
        throw new Error('Please log in to Betty first');
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/connect`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      const authUrl = data.authorization_url;

      console.log('🔍 OPENING OAUTH URL:', authUrl);

      // Open the OAuth URL in browser
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
      });

      console.log('🔍 BROWSER RESULT:', result);

      if (result.type === 'opened') {
        // Browser opened successfully
        // User will complete OAuth in browser
        // We'll need to check status periodically or have user manually trigger check
        console.log('OAuth browser opened. Please complete authentication and return to the app.');
        
        // Start polling for connection status
        setTimeout(() => {
          checkStatus();
        }, 3000);
      }

    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setUserInfo(data.user_info);
        console.log('Google connection status:', data.connected);
      }
    } catch (error) {
      console.error('Error checking Google auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setUserInfo(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      return false;
    }
  };

  const pushToGoogleDrive = async (title: string, content: string): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/google/drive/create-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error pushing to Google Drive:', error);
      return false;
    }
  };

  // Check status on mount
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