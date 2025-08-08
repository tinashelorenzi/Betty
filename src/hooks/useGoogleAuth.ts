// src/hooks/useGoogleAuth.ts - Updated for new formatted endpoints
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface ExportProgress {
  progress: number;
  message: string;
  isExporting: boolean;
}

interface ExportResult {
  success: boolean;
  document_id?: string;
  document_url?: string;
  title?: string;
  formatted?: boolean;
  markdown_converted?: boolean;
  message?: string;
  error?: string;
}

interface UseGoogleAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: any;
  exportProgress: ExportProgress;
  connectGoogle: () => Promise<string | void>;
  disconnectGoogle: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
  // Updated method names and functionality
  exportToGoogleDocs: (title: string, content: string) => Promise<ExportResult>;
  generateDocument: (documentName: string) => Promise<{ success: boolean; content?: string; error?: string }>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    progress: 0,
    message: '',
    isExporting: false
  });

  // Get API base URL from environment variables
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const connectGoogle = async (): Promise<string | void> => {
    try {
      setIsLoading(true);
      console.log('Starting Google OAuth flow...');

      // Get the OAuth URL from your FastAPI backend
      const token = await getToken();
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

      // Handle different platforms
      if (Platform.OS === 'web') {
        // For web platform, open in same window
        window.open(authUrl, '_self');
        return;
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
          
          // Start polling for connection status after a delay
          setTimeout(() => {
            checkStatus();
          }, 3000);
        } else if (result.type === 'cancel') {
          throw new Error('Authentication was cancelled');
        }

        return authUrl;
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
        const data = await response.json();
        setIsConnected(data.connected || false);
        setUserInfo(data.user_info || null);
        console.log('Google connection status:', data.connected);
      } else {
        // If status check fails, assume not connected
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
      const token = await getToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setUserInfo(null);
        console.log('Google account disconnected successfully');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to disconnect Google account:', errorData);
        return false;
      }
      
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      return false;
    }
  };

  // NEW: Generate document using server-side AI (secure)
  const generateDocument = async (documentName: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    try {
      const token = await getToken();
      if (!token) {
        return { success: false, error: 'No auth token available' };
      }

      console.log('Generating document:', documentName);

      const response = await fetch(`${API_BASE_URL}/api/documents/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_name: documentName.trim(),
          user_id: userInfo?.id || 'anonymous'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Document generated successfully');
        return {
          success: true,
          content: result.content
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to generate document:', errorData);
        return {
          success: false,
          error: errorData.detail || 'Failed to generate document'
        };
      }

    } catch (error) {
      console.error('Error generating document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  // UPDATED: Export to Google Docs with formatting (replaces pushToGoogleDrive)
  const exportToGoogleDocs = async (title: string, content: string): Promise<ExportResult> => {
    try {
      const token = await getToken();
      if (!token) {
        return { success: false, error: 'No auth token available' };
      }

      if (!isConnected) {
        return { success: false, error: 'Google account not connected' };
      }

      // Start export process with progress tracking
      setExportProgress({
        progress: 0,
        message: 'Preparing document for export...',
        isExporting: true
      });

      console.log('Exporting document to Google Docs:', title);

      // Simulate progress updates
      const updateProgress = (progress: number, message: string) => {
        setExportProgress({
          progress,
          message,
          isExporting: true
        });
      };

      updateProgress(25, 'Converting markdown to Google Docs format...');

      // Call the NEW formatted endpoint instead of old /google/drive/create-doc
      const response = await fetch(`${API_BASE_URL}/api/google/create-formatted-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          format: true,
          preserve_markdown: true
        }),
      });

      updateProgress(75, 'Creating document in Google Drive...');

      if (response.ok) {
        const result = await response.json();
        
        updateProgress(100, 'Export completed successfully!');
        
        // Reset progress after a short delay
        setTimeout(() => {
          setExportProgress({
            progress: 0,
            message: '',
            isExporting: false
          });
        }, 1000);

        console.log('Document exported to Google Docs successfully:', result);
        
        return {
          success: true,
          document_id: result.document_id,
          document_url: result.document_url,
          title: result.title,
          formatted: result.formatted,
          markdown_converted: result.markdown_converted,
          message: result.message
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to export to Google Docs:', errorData);
        
        setExportProgress({
          progress: 0,
          message: '',
          isExporting: false
        });

        return {
          success: false,
          error: errorData.detail || 'Failed to export to Google Docs'
        };
      }

    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      
      setExportProgress({
        progress: 0,
        message: '',
        isExporting: false
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  // Check status on mount and when component focuses
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle deep links for mobile OAuth callback (if needed)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const handleDeepLink = (url: string) => {
        console.log('Deep link received:', url);
        // You can handle OAuth callback here if your backend supports it
        if (url.includes('google-auth-success')) {
          checkStatus();
        }
      };

      const subscription = Linking.addEventListener('url', ({ url }) => {
        handleDeepLink(url);
      });

      // Check if app was opened with a deep link
      Linking.getInitialURL().then(url => {
        if (url) {
          handleDeepLink(url);
        }
      });

      return () => {
        subscription?.remove();
      };
    }
  }, []);

  // Cleanup loading state if component unmounts during operation
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setExportProgress({
        progress: 0,
        message: '',
        isExporting: false
      });
    };
  }, []);

  return {
    isConnected,
    isLoading,
    userInfo,
    exportProgress,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    exportToGoogleDocs, // Renamed from pushToGoogleDrive
    generateDocument, // New method for secure document generation
  };
};