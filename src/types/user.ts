// src/types/user.ts - CREATE THIS NEW FILE OR UPDATE YOUR EXISTING USER TYPES

export interface UserProfile {
    uid: string;
    email: string;
    first_name: string;
    last_name: string;
    location?: string;
    timezone?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;        // ← Built dynamically by backend
    avatar_filename?: string;   // ← Stored in database
    is_verified: boolean;
    google_connected: boolean;
    created_at: string;
    updated_at: string;
    last_login?: string;
    preferences?: Record<string, any>;
    notification_settings?: NotificationSettings;
    user_preferences?: UserPreferences;
  }
  
  // For API responses - matches your FastAPI UserResponse
  export interface UserResponse {
    uid: string;
    email: string;
    first_name: string;
    last_name: string;
    location?: string;
    timezone?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;        // ← This should be here!
    avatar_filename?: string;   // ← New field
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