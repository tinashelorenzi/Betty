// src/services/profileService.ts - COMPLETE REWRITE WITH ALL TYPES FIXED
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// TYPE DEFINITIONS - MATCHING YOUR FASTAPI BACKEND
// ============================================================================

export interface UserResponse {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
  timezone?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;        // Built dynamically by backend
  avatar_filename?: string;   // Stored in database
  is_verified: boolean;
  google_connected: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  preferences?: Record<string, any>;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  location?: string;
  timezone?: string;
  phone?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export interface ProfileStats {
    // Original stats that the UI expects
    tasks_completed: number;
    documents_created: number;
    hours_saved: number;
    ai_chats: number;
    
    // New comprehensive stats from indexed system
    total_messages?: number;
    messages_today?: number;
    last_chat_at?: string;
    last_activity?: string;
  }

export interface NotificationSettings {
  uid: string;
  push_notifications: boolean;
  email_notifications: boolean;
  task_reminders: 'all' | 'important' | 'none';
  document_updates: 'all' | 'important' | 'none';
  ai_suggestions: 'all' | 'important' | 'none';
  marketing_emails: boolean;
  security_alerts: boolean;
  weekly_digest: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  weekend_notifications: boolean;
  updated_at?: string;
}

export interface UserPreferences {
  uid: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  date_format: string;
  time_format: '12h' | '24h';
  default_view: 'home' | 'assistant' | 'documents' | 'planner';
  auto_save: boolean;
  analytics_enabled: boolean;
  updated_at?: string;
}

interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

// ============================================================================
// PROFILE SERVICE CLASS
// ============================================================================

class ProfileService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        const statusCode = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        return {
          message: data?.detail || data?.message || 'Server error occurred',
          statusCode,
          details: data,
        };
      } else if (axiosError.request) {
        // Request made but no response
        return {
          message: 'Network error - please check your internet connection',
          statusCode: 0,
        };
      }
    }
    
    // Generic error
    return {
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  async getProfile(): Promise<UserResponse> {
    try {
      const response = await this.api.get<UserResponse>('/profile/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<UserResponse> {
    try {
      const response = await this.api.put<UserResponse>('/profile/me', updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // AVATAR MANAGEMENT
  // ============================================================================

  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      // Create file object for React Native
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      const response = await this.api.post<{ avatar_url: string }>(
        '/profile/upload-avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // Longer timeout for file uploads
        }
      );

      return response.data.avatar_url;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeAvatar(): Promise<void> {
    try {
      await this.api.delete('/profile/avatar');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getStats(): Promise<ProfileStats> {
    try {
      // Use the new optimized chat stats endpoint instead of the old profile/stats
      const response = await this.api.get<any>('/user/stats/chat');
      const chatStats = response.data;
      
      // Transform the new chat stats format to match the old ProfileStats interface
      const profileStats: ProfileStats = {
        tasks_completed: 0, // This might need to come from a different endpoint
        documents_created: 0, // We'll get this from user document indexes
        hours_saved: Math.round((chatStats.total_messages || 0) * 0.1), // Estimated: 6 minutes per 10 messages
        ai_chats: chatStats.total_conversations || 0,
        
        // Additional stats from the new endpoint
        total_messages: chatStats.total_messages || 0,
        messages_today: chatStats.messages_today || 0,
        last_chat_at: chatStats.last_chat_at,
      };
  
      // Get documents count from the new endpoint if needed
      try {
        const dashboardResponse = await this.api.get<any>('/user/dashboard');
        profileStats.documents_created = dashboardResponse.data.stats?.total_documents || 0;
        profileStats.tasks_completed = dashboardResponse.data.stats?.total_tasks || 0;
      } catch (error) {
        console.warn('Could not fetch dashboard stats, using chat stats only');
      }
      
      return profileStats;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  

  // ============================================================================
  // NOTIFICATION SETTINGS
  // ============================================================================

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.api.get<NotificationSettings>('/profile/notifications');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await this.api.put<NotificationSettings>('/profile/notifications', settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const response = await this.api.get<UserPreferences>('/profile/preferences');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await this.api.put<UserPreferences>('/profile/preferences', preferences);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  async deleteAccount(): Promise<void> {
    try {
      await this.api.delete('/profile/account');
      // Clear local storage after successful deletion
      await AsyncStorage.multiRemove(['authToken', 'userProfile']);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // IMAGE PICKER UTILITIES
  // ============================================================================

  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  }

  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to select an image.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw new Error('Failed to pick image from library');
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take a photo.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to take photo');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.removeItem('profileStats');
      await AsyncStorage.removeItem('notificationSettings');
      await AsyncStorage.removeItem('userPreferences');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async cacheProfile(profile: UserResponse): Promise<void> {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  async getCachedProfile(): Promise<UserResponse | null> {
    try {
      const cached = await AsyncStorage.getItem('userProfile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  validateProfileData(data: ProfileUpdateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.first_name && data.first_name.trim().length < 1) {
      errors.push('First name cannot be empty');
    }

    if (data.last_name && data.last_name.trim().length < 1) {
      errors.push('Last name cannot be empty');
    }

    if (data.phone && data.phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Please enter a valid phone number');
      }
    }

    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;