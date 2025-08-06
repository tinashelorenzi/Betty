// src/services/profileService.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types matching your FastAPI models
export interface UserProfile {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
  timezone?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
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
  uid: string;
  tasks_completed: number;
  documents_created: number;
  hours_saved: number;
  ai_chats: number;
  last_activity?: string;
  streak_days: number;
  total_login_days: number;
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

class ProfileService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
    });

    // Add auth interceptor
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await this.api.get<UserProfile>('/profile/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await this.api.put<UserProfile>('/profile/me', updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData.append('file', blob as any, 'avatar.jpg');

      const uploadResponse = await this.api.post<{ avatar_url: string }>(
        '/profile/upload-avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return uploadResponse.data.avatar_url;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getStats(): Promise<ProfileStats> {
    try {
      const response = await this.api.get<ProfileStats>('/profile/stats');
      return response.data;
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
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // IMAGE PICKER UTILITIES
  // ============================================================================

  async pickImage(): Promise<string | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library is required');
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera is required');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message || 'Network error occurred';
      const statusCode = error.response?.status;
      
      console.error('Profile Service Error:', {
        message,
        statusCode,
        url: error.config?.url,
      });

      return new Error(message);
    }
    
    console.error('Profile Service Error:', error);
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export const profileService = new ProfileService();