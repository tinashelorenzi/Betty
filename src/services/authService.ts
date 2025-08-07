// src/services/authService.ts - BACKWARD COMPATIBLE VERSION WITH JWT FIX
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types for API responses (matching your FastAPI backend)
interface UserResponse {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
  timezone?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  avatar_filename?: string;
  is_verified: boolean;
  google_connected: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  preferences?: Record<string, any>;
}

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

// Request types (matching your FastAPI UserCreate and UserLogin models)
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  location?: string;
  timezone?: string;
}

// Form data types for React Native components
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface AuthError {
  message: string;
  statusCode?: number;
  field?: string;
}

// Keep the IAuthError interface for backward compatibility
export interface IAuthError {
  message: string;
  statusCode?: number;
  field?: string;
}

class AuthService {
  private baseURL: string;
  private token: string | null = null;
  private api: AxiosInstance;
  private user: UserResponse | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Adding auth token to request');
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error) => {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
        
        if (error.response?.status === 401) {
          // Token expired or invalid, clear stored token
          console.log('🔄 Token appears invalid, clearing stored credentials');
          await this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  async storeToken(token: string): Promise<void> {
    try {
      if (!token || token.trim() === '') {
        throw new Error('Cannot store empty or null token');
      }
      
      await AsyncStorage.setItem('authToken', token);
      this.token = token;
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('❌ Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      if (this.token) return this.token;
      
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
      return token;
    } catch (error) {
      console.error('❌ Error getting stored token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData', 'tokenExpiry']);
      this.token = null;
      this.user = null;
      console.log('✅ All auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing token:', error);
    }
  }

  // ============================================================================
  // USER DATA MANAGEMENT
  // ============================================================================

  async storeUserData(user: UserResponse): Promise<void> {
    try {
      if (!user) {
        throw new Error('Cannot store null user data');
      }
      
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      this.user = user;
      console.log('✅ User data stored successfully');
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
  }

  async getStoredUserData(): Promise<UserResponse | null> {
    try {
      if (this.user) return this.user;
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        this.user = JSON.parse(userData);
        return this.user;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting stored user data:', error);
      return null;
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async register(userData: RegisterFormData): Promise<AuthTokenResponse> {
    try {
      console.log('🔄 Attempting registration for:', userData.email);
      
      const requestData: RegisterRequest = {
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        location: 'Johannesburg, South Africa', // Default from your backend
        timezone: 'Africa/Johannesburg', // Default from your backend
      };

      const response = await this.api.post<UserResponse>('/auth/register', requestData);

      console.log('✅ Registration successful, attempting auto-login');

      // Note: Your FastAPI register endpoint returns UserResponse, not AuthTokenResponse
      // So we need to automatically log in after registration
      const loginResponse = await this.login({
        email: userData.email,
        password: userData.password,
      });

      return loginResponse;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw this.handleError(error);
    }
  }

  async login(credentials: LoginFormData): Promise<AuthTokenResponse> {
    try {
      console.log('🔄 Attempting login for:', credentials.email);
      
      // Your FastAPI login endpoint expects query parameters, not JSON body
      const params = new URLSearchParams();
      params.append('email', credentials.email);
      params.append('password', credentials.password);

      const response = await axios.post<AuthTokenResponse>(
        `${this.baseURL}/auth/login?${params.toString()}`,
        null, // No body needed since using query params
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('✅ Login response received');

      if (!response.data.access_token) {
        throw new Error('No access token received from server');
      }

      if (!response.data.user) {
        throw new Error('No user data received from server');
      }

      // Store token and user data
      await this.storeToken(response.data.access_token);
      await this.storeUserData(response.data.user);

      // Store token expiry time if provided
      if (response.data.expires_in) {
        const expiryTime = Date.now() + (response.data.expires_in * 1000);
        await AsyncStorage.setItem('tokenExpiry', expiryTime.toString());
      }

      console.log('✅ Login successful - token and user data stored');

      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🔄 Logging out...');
      
      // Optional: Call backend logout endpoint if you have one
      try {
        await this.api.post('/auth/logout');
      } catch (error) {
        // Don't fail logout if backend call fails
        console.warn('⚠️ Backend logout failed, continuing with local logout');
      }
      
      await this.clearToken();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still clear local data even if API call fails
      await this.clearToken();
    }
  }

  // ============================================================================
  // USER PROFILE METHODS
  // ============================================================================

  async getCurrentUser(): Promise<UserResponse> {
    try {
      console.log('🔄 Fetching current user...');
      const response = await this.api.get<UserResponse>('/auth/me');
      await this.storeUserData(response.data);
      console.log('✅ Current user fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw this.handleError(error);
    }
  }

  async verifyToken(): Promise<{ valid: boolean; user: UserResponse }> {
    try {
      console.log('🔄 Verifying token with backend...');
      const response = await this.api.post<{ valid: boolean; user: UserResponse }>('/auth/verify-token');
      
      if (response.data.valid && response.data.user) {
        await this.storeUserData(response.data.user);
        console.log('✅ Token verification successful');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // AUTHENTICATION STATE
  // ============================================================================

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        console.log('❌ No token found - user not authenticated');
        return false;
      }

      // Check if token is expired
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        console.log('❌ Token expired - clearing credentials');
        await this.clearToken();
        return false;
      }

      // Verify token with backend
      const verification = await this.verifyToken();
      return verification.valid;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      await this.clearToken();
      return false;
    }
  }

  getCurrentUserData(): UserResponse | null {
    return this.user;
  }

  // ============================================================================
  // TOKEN EXPIRY MANAGEMENT
  // ============================================================================

  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryTime = await AsyncStorage.getItem('tokenExpiry');
      if (!expiryTime) {
        return false; // No expiry time stored, assume valid for now
      }
      
      const now = Date.now();
      const expiry = parseInt(expiryTime, 10);
      
      return now >= expiry;
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return false; // Assume valid on error
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: unknown): IAuthError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        // Server responded with error status
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data;
        
        let message = 'An error occurred';
        
        if (typeof errorData === 'string') {
          message = errorData;
        } else if (errorData?.detail) {
          message = errorData.detail;
        } else if (errorData?.message) {
          message = errorData.message;
        }

        // Handle specific status codes
        switch (statusCode) {
          case 400:
            if (message.includes('email already exists')) {
              return { message: 'An account with this email already exists', statusCode, field: 'email' };
            }
            if (message.includes('Passwords do not match')) {
              return { message: 'Passwords do not match', statusCode, field: 'password' };
            }
            break;
          case 401:
            return { message: 'Invalid email or password', statusCode };
          case 422:
            return { message: 'Please check your input and try again', statusCode };
          case 500:
            return { message: 'Server error. Please try again later.', statusCode };
        }
        
        return { message, statusCode };
      } else if (axiosError.request) {
        // Network error
        return { 
          message: 'Network error. Please check your internet connection and try again.',
          statusCode: 0 
        };
      }
    }
    
    // Generic error
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { message };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getBaseURL(): string {
    return this.baseURL;
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }

  // Debug method to check current auth state
  async debugAuthState(): Promise<void> {
    console.log('🔍 Debug Auth State:');
    const token = await this.getStoredToken();
    const userData = await this.getStoredUserData();
    const isExpired = await this.isTokenExpired();
    
    console.log('- Token exists:', !!token);
    console.log('- Token length:', token?.length || 0);
    console.log('- Token expired:', isExpired);
    console.log('- User data exists:', !!userData);
    console.log('- User email:', userData?.email || 'none');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

// Export types for use in components
export type { 
  UserResponse, 
  AuthTokenResponse, 
  RegisterFormData, 
  LoginFormData,
  AuthError
};