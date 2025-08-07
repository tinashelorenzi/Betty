import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoogleAuthStatus {
  connected: boolean;
  user_email?: string;
  user_name?: string;
  error?: string;
}

interface UseGoogleAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: GoogleAuthStatus | null;
  connectGoogle: () => Promise<string | null>;
  disconnectGoogle: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
  pushToGoogleDrive: (title: string, content: string) => Promise<boolean>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleAuthStatus | null>(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
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
        const status: GoogleAuthStatus = await response.json();
        setIsConnected(status.connected);
        setUserInfo(status);
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

  const connectGoogle = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/connect`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get authorization URL');
      }

      const data = await response.json();
      return data.authorization_url;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      throw error;
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