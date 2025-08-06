import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types for API responses (based on your FastAPI backend)
interface UserResponse {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
  timezone?: string;
  is_verified: boolean;
  google_connected: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

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
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  private baseURL: string;
  private token: string | null = null;
  private api: AxiosInstance;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
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
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear stored token
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
      await AsyncStorage.setItem('authToken', token);
      this.token = token;
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      if (this.token) return this.token;
      
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      this.token = null;
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async register(userData: RegisterFormData): Promise<AuthTokenResponse> {
    try {
      const requestData: RegisterRequest = {
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
      };

      const response = await this.api.post<AuthTokenResponse>('/auth/register', requestData);

      if (response.data.access_token) {
        await this.storeToken(response.data.access_token);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    try {
      const requestData: LoginRequest = {
        email,
        password,
      };

      const response = await this.api.post<AuthTokenResponse>('/auth/login', requestData);

      if (response.data.access_token) {
        await this.storeToken(response.data.access_token);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      // Clear local token
      await this.clearToken();
      
      // You can also call a logout endpoint if your API has one
      // await this.api.post('/auth/logout');
      
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local token
      await this.clearToken();
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await this.api.get<UserResponse>('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyToken(): Promise<{ valid: boolean; user: UserResponse }> {
    try {
      const response = await this.api.post<{ valid: boolean; user: UserResponse }>('/auth/verify-token');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      // Verify token is still valid
      await this.verifyToken();
      return true;
    } catch (error) {
      // Token is invalid, clear it
      await this.clearToken();
      return false;
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      
      if (axiosError.response) {
        // Server responded with error status
        const message = axiosError.response.data?.detail || 
                       axiosError.response.data?.message || 
                       `Server error: ${axiosError.response.status}`;
        
        return new Error(message);
      } else if (axiosError.request) {
        // Request made but no response received
        return new Error('Network error - please check your connection');
      }
    }
    
    // Something else happened
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Error(message);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAuthHeaders(): { Authorization?: string } {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  isNetworkAvailable(): boolean {
    // You can implement network checking logic here
    // For now, just return true
    return true;
  }
}

// Export a singleton instance
export default new AuthService();