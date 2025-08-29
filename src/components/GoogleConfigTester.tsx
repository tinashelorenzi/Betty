// src/components/GoogleConfigTester.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

const GoogleConfigTester: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  const checkConfiguration = async () => {
    const config = {
      webClientId: {
        value: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        present: !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        valid: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.includes('googleusercontent.com')
      },
      androidClientId: {
        value: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        present: !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        valid: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.includes('googleusercontent.com')
      },
      iosClientId: {
        value: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        present: !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        valid: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.includes('googleusercontent.com')
      },
      apiBaseUrl: {
        value: process.env.EXPO_PUBLIC_API_BASE_URL,
        present: !!process.env.EXPO_PUBLIC_API_BASE_URL,
        valid: process.env.EXPO_PUBLIC_API_BASE_URL?.startsWith('http')
      }
    };

    setConfigStatus(config);
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  const testBackendConnection = async () => {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Backend connection successful!');
      } else {
        Alert.alert('Error', `Backend returned status: ${response.status}`);
      }
    } catch (error: any) {
      Alert.alert('Connection Error', `Failed to connect to backend: ${error.message}`);
    }
  };

  const renderConfigItem = (name: string, config: any) => (
    <View key={name} style={styles.configItem}>
      <Text style={styles.configName}>{name}:</Text>
      <View style={styles.configDetails}>
        <View style={[styles.statusDot, { backgroundColor: config.present && config.valid ? '#27ae60' : '#e74c3c' }]} />
        <Text style={styles.configValue}>
          {config.present ? (config.valid ? '✓ Valid' : '⚠ Invalid format') : '✗ Missing'}
        </Text>
      </View>
      {config.present && (
        <Text style={styles.configValueText} numberOfLines={1}>
          {config.value?.substring(0, 50)}...
        </Text>
      )}
    </View>
  );

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.toggleButtonText}>🔧 Show Config Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Google OAuth Configuration</Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => setIsVisible(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          {Object.entries(configStatus).map(([key, config]) => 
            renderConfigItem(key, config)
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.testButton} onPress={testBackendConnection}>
            <Text style={styles.testButtonText}>Test Backend Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.refreshButton} onPress={checkConfiguration}>
            <Text style={styles.refreshButtonText}>Refresh Config</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Platform: {require('react-native').Platform.OS}
          </Text>
          <Text style={styles.debugText}>
            Environment: {__DEV__ ? 'Development' : 'Production'}
          </Text>
          <Text style={styles.debugText}>
            Timestamp: {new Date().toISOString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 10,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 10,
  },
  configItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  configName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 5,
  },
  configDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  configValue: {
    fontSize: 12,
    color: '#6c757d',
  },
  configValueText: {
    fontSize: 10,
    color: '#adb5bd',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  testButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 3,
  },
  toggleButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    margin: 10,
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GoogleConfigTester;