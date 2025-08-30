// src/services/documentExportService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

interface ExportResponse {
  success: boolean;
  google_doc_id?: string;
  google_doc_url?: string;
  message: string;
  error?: string;
}

interface ExportToGoogleDocsParams {
  documentId: string;
  title: string;
  content: string;
  format?: 'html' | 'plain';
}

export class DocumentExportService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async logToBackend(level: 'info' | 'error' | 'debug', message: string, data?: any) {
    try {
      const authToken = await this.getAuthToken();
      
      const logData = {
        level,
        message,
        data: data ? JSON.stringify(data) : null,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        component: 'DocumentExportService'
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
  }

  /**
   * Check if user has Google connection before attempting export
   */
  async checkGoogleConnection(): Promise<boolean> {
    try {
      await this.logToBackend('info', 'Checking Google connection for export');
      
      const authToken = await this.getAuthToken();
      if (!authToken) {
        await this.logToBackend('error', 'No auth token found');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        await this.logToBackend('error', 'Google status check failed', { status: response.status });
        return false;
      }

      const data = await response.json();
      const isConnected = data.connected === true;
      
      await this.logToBackend('info', 'Google connection status checked', { connected: isConnected });
      return isConnected;
      
    } catch (error: any) {
      await this.logToBackend('error', 'Error checking Google connection', { error: error.message });
      return false;
    }
  }

  /**
   * Export document to Google Docs
   */
  async exportToGoogleDocs(params: ExportToGoogleDocsParams): Promise<ExportResponse> {
    try {
      await this.logToBackend('info', 'Starting Google Docs export', {
        documentId: params.documentId,
        title: params.title,
        contentLength: params.content.length
      });

      // First check if Google is connected
      const isConnected = await this.checkGoogleConnection();
      if (!isConnected) {
        const errorMsg = 'Google account not connected. Please connect your Google account first.';
        await this.logToBackend('error', errorMsg);
        
        Alert.alert(
          'Google Account Required',
          'Please connect your Google account in the Profile section before exporting documents.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => {
              // You can navigate to profile here if you have navigation access
              // navigation.navigate('Profile');
            }}
          ]
        );
        
        return {
          success: false,
          message: errorMsg,
          error: 'GOOGLE_NOT_CONNECTED'
        };
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Prepare export data
      const exportData = {
        document_id: params.documentId,
        title: params.title,
        content: params.content,
        format: params.format || 'html'
      };

      await this.logToBackend('debug', 'Sending export request', exportData);

      const response = await fetch(`${API_BASE_URL}/documents/export/google-docs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        await this.logToBackend('error', 'Export request failed', {
          status: response.status,
          response: responseData
        });

        // Handle specific error cases
        if (response.status === 401) {
          return {
            success: false,
            message: 'Authentication failed. Please reconnect your Google account.',
            error: 'AUTH_FAILED'
          };
        } else if (response.status === 403) {
          return {
            success: false,
            message: 'Google Drive access denied. Please check your permissions.',
            error: 'PERMISSION_DENIED'
          };
        } else if (responseData.detail?.includes('Google')) {
          return {
            success: false,
            message: responseData.detail || 'Google Docs export failed',
            error: 'GOOGLE_API_ERROR'
          };
        }

        throw new Error(responseData.detail || `Export failed with status ${response.status}`);
      }

      await this.logToBackend('info', 'Export successful', {
        google_doc_id: responseData.google_doc_id,
        google_doc_url: responseData.google_doc_url
      });

      return {
        success: true,
        google_doc_id: responseData.google_doc_id,
        google_doc_url: responseData.google_doc_url,
        message: 'Document exported to Google Docs successfully!'
      };

    } catch (error: any) {
      await this.logToBackend('error', 'Export error', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: error.message || 'Failed to export document to Google Docs',
        error: 'EXPORT_FAILED'
      };
    }
  }

  /**
   * Export document with user-friendly error handling
   */
  async exportDocumentWithUI(params: ExportToGoogleDocsParams): Promise<boolean> {
    try {
      // Show loading state if you have a loading context
      const result = await this.exportToGoogleDocs(params);
      
      if (result.success) {
        Alert.alert(
          'Export Successful! 🎉',
          `Your document "${params.title}" has been exported to Google Docs.`,
          [
            { text: 'OK', style: 'default' },
            ...(result.google_doc_url ? [{
              text: 'Open Document',
              onPress: () => {
                // Open the Google Doc if possible
                if (result.google_doc_url) {
                  // You can use Linking.openURL here
                  console.log('Opening Google Doc:', result.google_doc_url);
                }
              }
            }] : [])
          ]
        );
        return true;
      } else {
        // Handle different error types with appropriate messages
        let alertTitle = 'Export Failed';
        let alertMessage = result.message;
        
        switch (result.error) {
          case 'GOOGLE_NOT_CONNECTED':
            alertTitle = 'Google Account Required';
            break;
          case 'AUTH_FAILED':
            alertTitle = 'Authentication Error';
            break;
          case 'PERMISSION_DENIED':
            alertTitle = 'Permission Denied';
            break;
          case 'GOOGLE_API_ERROR':
            alertTitle = 'Google Drive Error';
            break;
        }
        
        Alert.alert(alertTitle, alertMessage, [{ text: 'OK', style: 'default' }]);
        return false;
      }
    } catch (error: any) {
      await this.logToBackend('error', 'Unexpected export error', { error: error.message });
      
      Alert.alert(
        'Unexpected Error',
        'An unexpected error occurred while exporting your document. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
  }
}

// Export singleton instance
export const documentExportService = new DocumentExportService();