// src/screens/DocumentViewScreen.tsx - ENHANCED WITH PERSISTENT GOOGLE AUTH
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNativeGoogleAuth } from '../hooks/useNativeGoogleAuth';

const { width, height } = Dimensions.get('window');

interface DocumentViewScreenProps {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
}

interface DocumentViewParams {
  title: string;
  content: string;
  format: 'markdown' | 'text';
  documentId?: string;
}

const DocumentViewScreen: React.FC<DocumentViewScreenProps> = ({ navigation, route }) => {
  const { title, content, format, documentId } = route.params as DocumentViewParams;
  
  // State management
  const [isPushing, setIsPushing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [exportProgress, setExportProgress] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Enhanced Google Auth hook
  const { 
    isConnected, 
    isLoading: googleLoading,
    userInfo,
    refreshStatus 
  } = useNativeGoogleAuth();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bettygenius.co.za';

  // Check Google connection status when component mounts
  useEffect(() => {
    console.log('DocumentViewScreen mounted - checking Google status');
    refreshStatus();
  }, [refreshStatus]);

  // Re-check status when returning from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('DocumentViewScreen focused - refreshing Google status');
      refreshStatus();
    });

    return unsubscribe;
  }, [navigation, refreshStatus]);

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Enhanced Google Drive export functionality
  const handlePushToGoogleDrive = async () => {
    // First, refresh the Google connection status
    await refreshStatus();
    
    if (!isConnected) {
      Alert.alert(
        'Google Account Required',
        'Your Google account is not connected. Connect your Google account to export documents to Google Drive.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Connect Google Account',
            onPress: () => navigation.navigate('Profile')
          }
        ]
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Export to Google Drive',
      `Export "${title}" to your Google Drive?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Export',
          onPress: () => performGoogleDriveExport()
        }
      ]
    );
  };

  const performGoogleDriveExport = async () => {
    try {
      setIsPushing(true);
      setExportProgress(0);

      const authToken = await getToken();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_BASE_URL}/documents/export/google-drive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          format: format,
          document_id: documentId
        }),
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Google auth errors
        if (response.status === 401 && errorData.detail?.includes('Google')) {
          throw new Error('Google authentication expired. Please reconnect your Google account.');
        }
        
        throw new Error(errorData.detail || `Export failed with status ${response.status}`);
      }

      const result = await response.json();
      
      Alert.alert(
        'Export Successful! 🎉',
        `"${title}" has been successfully exported to your Google Drive.`,
        [
          {
            text: 'View in Drive',
            onPress: () => {
              if (result.document_url) {
                // Open Google Drive URL if available
                console.log('Opening Google Drive URL:', result.document_url);
              }
            }
          },
          {
            text: 'Done',
            style: 'default'
          }
        ]
      );

    } catch (error: any) {
      console.error('Google Drive export error:', error);
      
      let errorMessage = error.message || 'Failed to export document to Google Drive';
      let actions: Array<{text: string, style?: 'default' | 'cancel' | 'destructive', onPress?: () => void}> = [
        { text: 'OK', style: 'default' }
      ];

      // Handle Google authentication errors
      if (errorMessage.includes('Google authentication expired') || 
          errorMessage.includes('Google account')) {
        actions = [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reconnect Google',
            style: 'default',
            onPress: () => navigation.navigate('Profile')
          }
        ];
      }

      Alert.alert(
        'Export Failed',
        errorMessage,
        actions
      );
      
    } finally {
      setIsPushing(false);
      setExportProgress(0);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      await Share.share({
        title: title,
        message: `${title}\n\n${content}`,
      });
      
    } catch (error: any) {
      console.error('Error sharing document:', error);
      if (error.code !== 'CANCELLED') {
        Alert.alert('Error', 'Failed to share document');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const renderContent = () => {
    if (format === 'markdown') {
      return (
        <Markdown style={markdownStyles}>
          {content}
        </Markdown>
      );
    }
    
    return (
      <Text style={[styles.textContent, { fontSize: 16 * zoomLevel }]}>
        {content}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#667eea" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.actionButton, isSharing && styles.actionButtonDisabled]}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : (
              <Ionicons name="share-outline" size={20} color="#667eea" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        pinchGestureEnabled={true}
      >
        <Animatable.View animation="fadeInUp" duration={600} style={styles.contentWrapper}>
          {renderContent()}
        </Animatable.View>
      </ScrollView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
          <Ionicons name="remove" size={20} color="#667eea" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={resetZoom} style={styles.zoomButton}>
          <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
          <Ionicons name="add" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Google Drive Export Button */}
      <Animatable.View animation="slideInUp" delay={800} style={styles.actionBar}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.exportButton, isPushing && styles.exportButtonDisabled]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            onPress={handlePushToGoogleDrive}
            style={styles.exportButtonContent}
            disabled={isPushing}
          >
            {isPushing ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.exportButtonText}>
                  Exporting... {exportProgress}%
                </Text>
              </>
            ) : (
              <>
                <View style={styles.exportButtonIcon}>
                  {googleLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : isConnected ? (
                    <Ionicons name="logo-google" size={20} color="#fff" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  )}
                </View>
                <Text style={styles.exportButtonText}>
                  {isConnected ? 'Export to Google Drive' : 'Connect Google to Export'}
                </Text>
                <View style={styles.connectionStatus}>
                  {isConnected ? (
                    <View style={styles.statusIndicatorConnected} />
                  ) : (
                    <View style={styles.statusIndicatorDisconnected} />
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
        
        {isConnected && userInfo && (
          <Text style={styles.connectedAsText}>
            Connected as {userInfo.user_email}
          </Text>
        )}
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
  },
  contentWrapper: {
    padding: 20,
    minHeight: height - 200,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'left',
  },
  zoomControls: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'column',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  zoomButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  zoomText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  exportButtonIcon: {
    marginRight: 12,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  connectionStatus: {
    marginLeft: 8,
  },
  statusIndicatorConnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusIndicatorDisconnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  connectedAsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  code_block: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    paddingLeft: 16,
    marginLeft: 8,
    fontStyle: 'italic',
  },
};

export default DocumentViewScreen;