import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import OAuthWebView from './OAuthWebView';

interface GoogleConnectButtonProps {
  style?: any;
  onConnectionChange?: (connected: boolean) => void;
}

const GoogleConnectButton: React.FC<GoogleConnectButtonProps> = ({ 
  style, 
  onConnectionChange 
}) => {
  const { 
    isConnected, 
    isLoading, 
    userInfo, 
    connectGoogle, 
    disconnectGoogle, 
    checkStatus 
  } = useGoogleAuth();

  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  const handleConnect = async () => {
    try {
      const url = await connectGoogle();
      if (url) {
        setAuthUrl(url);
        setShowWebView(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to Google. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Google Account',
      'Are you sure you want to disconnect your Google account? You will no longer be able to push documents to Google Drive.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await disconnectGoogle();
              if (success) {
                Alert.alert('Success', 'Google account disconnected successfully');
                onConnectionChange?.(false);
              }
            } catch (error: any) {
              Alert.alert(
                'Disconnection Failed',
                error.message || 'Failed to disconnect Google account'
              );
            }
          },
        },
      ]
    );
  };

  const handleAuthSuccess = async (data: any) => {
    setShowWebView(false);
    setAuthUrl('');
    
    if (data.success) {
      Alert.alert(
        'Success! 🎉',
        'Your Google account has been connected successfully. You can now push documents to Google Drive.',
        [{ text: 'OK' }]
      );
      
      // Refresh status
      await checkStatus();
      onConnectionChange?.(true);
    } else {
      Alert.alert(
        'Connection Failed',
        'Failed to connect your Google account. Please try again.'
      );
    }
  };

  const handleAuthError = (error: string) => {
    setShowWebView(false);
    setAuthUrl('');
    Alert.alert(
      'Connection Failed',
      error || 'Authentication failed. Please try again.'
    );
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
    setAuthUrl('');
  };

  if (isLoading) {
    return (
      <View style={[styles.buttonContainer, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#1E40AF" />
        <Text style={styles.loadingText}>Checking status...</Text>
      </View>
    );
  }

  return (
    <>
      {isConnected ? (
        <View style={[styles.connectedContainer, style]}>
          <View style={styles.connectedInfo}>
            <View style={styles.connectedStatus}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.connectedText}>Google Connected</Text>
            </View>
            {userInfo?.user_email && (
              <Text style={styles.userEmail}>{userInfo.user_email}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.buttonContainer, style]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#4285F4', '#34A853', '#FBBC05']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.buttonText}>Connect to Google</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {authUrl ? (
          <OAuthWebView
            url={authUrl}
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
            onClose={handleCloseWebView}
          />
        ) : null}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  connectedInfo: {
    flex: 1,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  connectedText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    color: '#6b7280',
    fontSize: 14,
  },
  disconnectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  disconnectText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GoogleConnectButton;