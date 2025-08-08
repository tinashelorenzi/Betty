// src/components/GoogleConnectButton.tsx - Cross-platform for Mobile & Expo Web
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

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

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      if (Platform.OS === 'web') {
        // For web, the OAuth will redirect in the same window
        await connectGoogle();
        // No need for additional handling as the page will redirect
      } else {
        // For mobile, handle the OAuth flow
        const authUrl = await connectGoogle();
        
        if (authUrl) {
          // Show instructions for mobile users
          Alert.alert(
            'Complete Authentication',
            'Please complete the Google authentication in the browser that just opened. After authorizing, return to this app.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start checking status periodically
                  const checkInterval = setInterval(async () => {
                    await checkStatus();
                    if (isConnected) {
                      clearInterval(checkInterval);
                      Alert.alert(
                        'Success! 🎉',
                        'Your Google account has been connected successfully.',
                        [{ text: 'Great!' }]
                      );
                      onConnectionChange?.(true);
                    }
                  }, 3000);
                  
                  // Stop checking after 2 minutes
                  setTimeout(() => {
                    clearInterval(checkInterval);
                  }, 120000);
                }
              }
            ]
          );
        }
      }
      
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setIsConnecting(true);
      await checkStatus();
      
      // Give user feedback about the result
      setTimeout(() => {
        if (isConnected) {
          Alert.alert(
            'Success! 🎉',
            'Your Google account has been connected successfully. You can now push documents to Google Drive.',
            [{ text: 'Great!' }]
          );
          onConnectionChange?.(true);
        } else {
          Alert.alert(
            'Not Connected',
            'Google account is not yet connected. Please make sure you completed the authentication in your browser.',
            [
              {
                text: 'Try Again',
                onPress: handleConnect
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        }
      }, 1000);
      
    } catch (error: any) {
      Alert.alert(
        'Check Failed',
        'Unable to check connection status. Please try again.'
      );
    } finally {
      setIsConnecting(false);
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
              setIsConnecting(true);
              const success = await disconnectGoogle();
              
              if (success) {
                Alert.alert('Success', 'Google account disconnected successfully');
                onConnectionChange?.(false);
              } else {
                Alert.alert(
                  'Disconnection Failed',
                  'Failed to disconnect Google account. Please try again.'
                );
              }
            } catch (error: any) {
              Alert.alert(
                'Disconnection Failed',
                error.message || 'Failed to disconnect Google account'
              );
            } finally {
              setIsConnecting(false);
            }
          },
        },
      ]
    );
  };

  const isButtonLoading = isLoading || isConnecting;

  if (isConnected) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.connectedContainer}>
          <View style={styles.connectedInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.connectedText}>
              <Text style={styles.connectedTitle}>Google Connected</Text>
              {userInfo?.email && (
                <Text style={styles.connectedEmail}>{userInfo.email}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            disabled={isButtonLoading}
          >
            {isButtonLoading ? (
              <ActivityIndicator size="small" color="#FF5722" />
            ) : (
              <Text style={styles.disconnectText}>Disconnect</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={handleConnect}
        disabled={isButtonLoading}
      >
        <LinearGradient
          colors={['#4285F4', '#34A853']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isButtonLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={styles.connectText}>Connect Google</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Show check status button only on mobile platforms */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.checkStatusButton}
          onPress={handleCheckStatus}
          disabled={isButtonLoading}
        >
          <Text style={styles.checkStatusText}>Check Connection Status</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  connectButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  checkStatusButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  checkStatusText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  connectedContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedText: {
    marginLeft: 12,
    flex: 1,
  },
  connectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  connectedEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  disconnectButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  disconnectText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GoogleConnectButton;