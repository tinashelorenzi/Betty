// src/hooks/useNativeGoogleAuth.ts - FIXED VERSION WITH ROBUST ERROR HANDLING

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

interface UserInfo {
  email: string;
  name: string;
  photo?: string;
  id: string;
}

interface GoogleAuthState {
  isConnected: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
}

const GOOGLE_AUTH_CACHE_KEY = 'google_auth_state';
const GOOGLE_AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNativeGoogleAuth = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0);

  // Initialize Google Auth and load cached state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing Google Auth...');
      
      // Load cached state first for immediate UI response
      await loadCachedState();
      
      // Initialize Google Sign-In
      await configureGoogleSignIn();
      
      // Check actual status (this will update cache if needed)
      await checkStatus(true);
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Auth:', error);
      setIsLoading(false);
    }
  };

  const configureGoogleSignIn = async () => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        console.log('🔧 Configuring Google Sign-In...');
        
        const config = {
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1092345143344-vd984vtn6cdo6tlid624r5aqhi0ov331.apps.googleusercontent.com',
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '1092345143344-1b88lllija892eccovqf9r1o0h7uhjos.apps.googleusercontent.com',
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '1092345143344-iaj5k44f4kt3m7q37u12b92r3bq4g75j.apps.googleusercontent.com',
          scopes: [
            'openid',
            'profile', 
            'email',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/calendar'
          ],
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        };

        await GoogleSignin.configure(config);
        console.log('✅ Google Sign-In configured successfully');
      } catch (error) {
        console.error('❌ Google Sign-In configuration failed:', error);
        throw error;
      }
    }
  };

  const loadCachedState = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(GOOGLE_AUTH_CACHE_KEY);
      if (cachedData) {
        const { state, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        
        if (now - timestamp < GOOGLE_AUTH_CACHE_DURATION) {
          setIsConnected(state.isConnected);
          setUserInfo(state.userInfo);
          setIsLoading(state.isLoading);
          console.log('📱 Loaded cached Google auth state');
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cached auth state:', error);
    }
    
    // If no valid cache, set default state
    setIsLoading(false);
  };

  const cacheState = async (state: GoogleAuthState) => {
    try {
      await AsyncStorage.setItem(GOOGLE_AUTH_CACHE_KEY, JSON.stringify({
        state,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('⚠️ Failed to cache auth state:', error);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Try both possible token keys for backward compatibility
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        token = await AsyncStorage.getItem('auth_token');
      }
      
      if (token) {
        console.log('🔑 Auth token retrieved successfully');
      } else {
        console.warn('⚠️ No auth token found in storage');
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  };

  // ENHANCED: More robust user data extraction with better logging
  const extractUserDataFromGoogleResponse = (userInfo: any): UserInfo => {
    console.log('🔍 Raw Google Sign-In userInfo structure:', JSON.stringify(userInfo, null, 2));

    let extractedData: UserInfo | null = null;

    // Try different possible structures with more comprehensive mapping
    const possibleStructures = [
      // Structure 1: userInfo.user (most common for @react-native-google-signin/google-signin)
      () => userInfo?.user && {
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.displayName || 
              (userInfo.user.givenName && userInfo.user.familyName ? 
                userInfo.user.givenName + ' ' + userInfo.user.familyName : 
                userInfo.user.givenName || userInfo.user.familyName || ''),
        photo: userInfo.user.photo || userInfo.user.photoURL,
        id: userInfo.user.id,
      },
      
      // Structure 2: Direct userInfo object (for some Google SDK versions)
      () => userInfo && userInfo.email && {
        email: userInfo.email,
        name: userInfo.name || userInfo.displayName || (userInfo.givenName && userInfo.familyName ? userInfo.givenName + ' ' + userInfo.familyName : ''),
        photo: userInfo.photo || userInfo.photoURL || userInfo.picture,
        id: userInfo.id || userInfo.sub,
      },
      
      // Structure 3: Nested in userInfo.additionalUserInfo (Firebase Auth structure)
      () => userInfo?.additionalUserInfo?.profile && {
        email: userInfo.additionalUserInfo.profile.email,
        name: userInfo.additionalUserInfo.profile.name || userInfo.additionalUserInfo.profile.displayName,
        photo: userInfo.additionalUserInfo.profile.photo || userInfo.additionalUserInfo.profile.picture,
        id: userInfo.additionalUserInfo.profile.id || userInfo.additionalUserInfo.profile.sub,
      },

      // Structure 4: Check if userInfo itself is the user object (alternate SDK responses)
      () => userInfo && userInfo.user && userInfo.user.email && {
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.displayName || 
              (userInfo.user.given_name && userInfo.user.family_name ? 
                userInfo.user.given_name + ' ' + userInfo.user.family_name : 
                userInfo.user.given_name || userInfo.user.family_name || ''),
        photo: userInfo.user.photo || userInfo.user.picture,
        id: userInfo.user.id || userInfo.user.sub,
      },

      // Structure 5: Google OAuth2 standard claims format
      () => userInfo && (userInfo.email || userInfo.user?.email) && {
        email: userInfo.email || userInfo.user?.email,
        name: userInfo.name || userInfo.user?.name || userInfo.displayName || userInfo.user?.displayName || 
              (userInfo.given_name || userInfo.user?.given_name ? 
                (userInfo.given_name || userInfo.user?.given_name) + ' ' + (userInfo.family_name || userInfo.user?.family_name || '') : ''),
        photo: userInfo.picture || userInfo.user?.picture || userInfo.photo || userInfo.user?.photo,
        id: userInfo.sub || userInfo.user?.sub || userInfo.id || userInfo.user?.id,
      }
    ];

    // Try each structure until we find one that works
    for (let i = 0; i < possibleStructures.length; i++) {
      try {
        const result = possibleStructures[i]();
        if (result && result.email && result.email.includes('@')) {
          extractedData = result;
          console.log(`✅ Successfully extracted user data using structure ${i + 1}:`, {
            email: result.email,
            name: result.name,
            hasPhoto: !!result.photo,
            id: result.id
          });
          break;
        } else {
          console.log(`⚠️ Structure ${i + 1} failed: missing email or invalid email format`);
        }
      } catch (error) {
        console.log(`⚠️ Structure ${i + 1} failed with error:`, error);
        continue;
      }
    }

    if (!extractedData || !extractedData.email) {
      console.error('❌ Failed to extract user data from all known structures');
      console.error('Raw userInfo keys:', Object.keys(userInfo || {}));
      
      // Enhanced debugging: log all possible email-like fields
      const flattenObject = (obj: any, prefix = ''): any => {
        let flattened: any = {};
        for (let key in obj) {
          if (obj[key] !== null && obj[key] !== undefined) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'));
            } else {
              flattened[prefix + key] = obj[key];
              // Log potential email fields
              if (key.toLowerCase().includes('email') || (typeof obj[key] === 'string' && obj[key].includes('@'))) {
                console.log(`🔍 Found potential email field: ${prefix + key} = ${obj[key]}`);
              }
            }
          }
        }
        return flattened;
      };

      const flatData = flattenObject(userInfo);
      console.error('Flattened userInfo:', flatData);
      
      // Last resort: try to find ANY email-like string
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      let foundEmail = null;
      
      Object.entries(flatData).forEach(([key, value]) => {
        if (typeof value === 'string' && emailPattern.test(value)) {
          console.log(`🎯 Found email in field ${key}: ${value}`);
          foundEmail = value;
        }
      });
      
      if (foundEmail) {
        console.log('🚨 Using last resort email extraction');
        extractedData = {
          email: foundEmail,
          name: flatData['user.name'] || flatData['name'] || flatData['displayName'] || 'Unknown User',
          photo: flatData['user.photo'] || flatData['photo'] || flatData['picture'],
          id: flatData['user.id'] || flatData['id'] || flatData['sub'] || 'unknown'
        };
      } else {
        throw new Error('Unable to extract email from Google user information. Please try signing out of Google and signing back in.');
      }
    }

    // Validate email format
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (!emailPattern.test(extractedData.email)) {
      throw new Error(`Invalid email format extracted: ${extractedData.email}`);
    }

    // Ensure required fields are not empty
    if (!extractedData.name || extractedData.name.trim() === '') {
      extractedData.name = extractedData.email.split('@')[0]; // Use email prefix as fallback
    }
    
    if (!extractedData.id || extractedData.id.trim() === '') {
      extractedData.id = extractedData.email; // Use email as fallback ID
    }

    console.log('✅ Final validated user data:', {
      email: extractedData.email,
      name: extractedData.name,
      hasPhoto: !!extractedData.photo,
      id: extractedData.id
    });

    return extractedData;
  };

  // FIXED: Better fresh token handling
  const getFreshGoogleTokens = async () => {
    try {
      console.log('🔄 Getting fresh Google tokens...');
      
      if (Platform.OS === 'web' || !GoogleSignin) {
        throw new Error('Google Sign-In not available on this platform');
      }

      // Check if already signed in
      let userInfo = null;
      try {
        userInfo = await GoogleSignin.getCurrentUser();
        console.log('Current user found:', !!userInfo);
      } catch (error) {
        console.log('No current user, will need to sign in');
      }

      // If not signed in or need fresh tokens, sign in
      if (!userInfo) {
        console.log('🔐 Initiating Google Sign-In...');
        userInfo = await GoogleSignin.signIn();
      } else {
        // Try to refresh tokens if user is already signed in
        try {
          console.log('🔄 Refreshing existing tokens...');
          await GoogleSignin.clearCachedAccessToken(userInfo.user.id);
          userInfo = await GoogleSignin.signInSilently();
        } catch (silentError) {
          console.log('Silent refresh failed, doing full sign-in:', silentError);
          await GoogleSignin.signOut();
          userInfo = await GoogleSignin.signIn();
        }
      }

      if (!userInfo) {
        throw new Error('Failed to obtain user information from Google Sign-In');
      }

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Fresh tokens obtained');
      
      return { userInfo, tokens };
    } catch (error) {
      console.error('❌ Failed to get fresh tokens:', error);
      throw error;
    }
  };

  const updateState = async (connected: boolean, info: UserInfo | null) => {
    setIsConnected(connected);
    setUserInfo(info);
    
    await cacheState({
      isConnected: connected,
      isLoading: false,
      userInfo: info
    });
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting Google connection process...');
      
      if (Platform.OS === 'web' || !GoogleSignin) {
        throw new Error('Google Sign-In not available on this platform');
      }

      // Get fresh tokens and user info
      const { userInfo, tokens } = await getFreshGoogleTokens();

      if (!userInfo) {
        throw new Error('Failed to get user information from Google');
      }

      // Extract user data using robust method
      const extractedUserData = extractUserDataFromGoogleResponse(userInfo);
      
      console.log('✅ Final extracted user data:', extractedUserData);

      // Validate that we have the required email
      if (!extractedUserData.email) {
        throw new Error('Failed to get user email from Google. Please try signing out and signing in again.');
      }

      // Send to backend
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Please log in to Betty first');
      }

      // Ensure all required fields are present and properly formatted
      const requestPayload = {
        access_token: tokens.accessToken,
        id_token: tokens.idToken,
        user_info: {
          email: extractedUserData.email.trim().toLowerCase(), // Normalize email
          name: extractedUserData.name.trim(),
          photo: extractedUserData.photo || null,
          id: extractedUserData.id.toString(), // Ensure ID is string
          // Add additional fields that backend might expect
          given_name: extractedUserData.name.split(' ')[0] || '',
          family_name: extractedUserData.name.split(' ').slice(1).join(' ') || '',
          verified_email: true, // Google emails are always verified
          locale: 'en'
        }
      };

      console.log('📤 Sending to backend:', JSON.stringify({
        ...requestPayload,
        access_token: tokens.accessToken ? '[PRESENT]' : '[MISSING]',
        id_token: tokens.idToken ? '[PRESENT]' : '[MISSING]',
        user_info: {
          ...requestPayload.user_info,
          // Don't log the full email for privacy, just show if it's present
          email: requestPayload.user_info.email ? '[EMAIL_PRESENT]' : '[EMAIL_MISSING]'
        }
      }, null, 2));

      const response = await fetch(`${API_BASE_URL}/auth/google/connect-native`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${responseText}` };
        }
        
        console.error('❌ Backend error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          headers: Object.fromEntries(response.headers.entries()),
          requestPayload: {
            ...requestPayload,
            access_token: '[REDACTED]',
            id_token: '[REDACTED]',
            user_info: {
              ...requestPayload.user_info,
              email: '[REDACTED]'
            }
          }
        });

        // Provide more specific error messages based on common backend issues
        let userFriendlyError = errorData.detail || 'Failed to connect Google account';
        
        if (errorData.detail && errorData.detail.includes('email')) {
          userFriendlyError = 'There was an issue with your Google account email. Please try signing out of Google completely and signing back in.';
        } else if (response.status === 400) {
          userFriendlyError = 'Invalid Google account data. Please try signing out of Google and signing back in.';
        } else if (response.status === 401) {
          userFriendlyError = 'Authentication failed. Please log out of Betty and log back in.';
        } else if (response.status >= 500) {
          userFriendlyError = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(userFriendlyError);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Backend response received:', {
        hasUserInfo: !!result.user_info,
        userInfoKeys: result.user_info ? Object.keys(result.user_info) : [],
        message: result.message
      });
      
      await updateState(true, result.user_info || extractedUserData);
      
      console.log('✅ Google connection successful');
      return true;

    } catch (error: any) {
      console.error('❌ Google connection error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check Google connection status with backend
  const checkStatus = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastStatusCheck < 30000) {
      return; // Don't check more than once per 30 seconds
    }
    
    setLastStatusCheck(now);
    
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('No auth token available');
        await updateState(false, null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        await updateState(data.connected || false, data.user_info || null);
        console.log('Google connection status updated:', data.connected);
      } else {
        console.warn('Status check failed with status:', response.status);
        if (response.status >= 500) {
          console.log('Server error, keeping current state');
          return;
        }
        await updateState(false, null);
      }
    } catch (error: any) {
      console.error('Error checking Google auth status:', error);
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.log('Status check timed out, keeping current state');
        return;
      }
      
      if (!error.message?.includes('Network') && !error.message?.includes('fetch')) {
        await updateState(false, null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastStatusCheck]);

  const disconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Please log in to Betty first');
      }

      // Disconnect from backend
      const response = await fetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to disconnect Google account');
      }

      // Sign out from Google on device
      if (Platform.OS !== 'web' && GoogleSignin) {
        await GoogleSignin.signOut();
      }

      await updateState(false, null);
      
      console.log('Google disconnection successful');
      return true;

    } catch (error: any) {
      console.error('Google disconnection error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Public method to force refresh status
  const refreshStatus = useCallback(() => {
    return checkStatus(true);
  }, [checkStatus]);

  return {
    isConnected,
    isLoading,
    userInfo,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    refreshStatus,
  };
};