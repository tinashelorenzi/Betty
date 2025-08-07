// src/screens/DocumentViewScreen.tsx - Fixed scrolling and zoom issue
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
import { useGoogleAuth } from '../hooks/useGoogleAuth';

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
  const [isPushing, setIsPushing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Add the Google Auth hook
  const { isConnected, pushToGoogleDrive, checkStatus } = useGoogleAuth();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

  // Updated push to Google Drive function
  const handlePushToGoogleDrive = async () => {
    // Check if Google is connected first
    if (!isConnected) {
      Alert.alert(
        'Google Account Not Connected',
        'Please connect your Google account first to push documents to Google Drive.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('Profile')
          }
        ]
      );
      return;
    }

    setIsPushing(true);
    try {
      const success = await pushToGoogleDrive(title, content);
      
      if (success) {
        Alert.alert(
          'Success! 🎉', 
          'Document has been created in your Google Drive.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        throw new Error('Failed to create document');
      }
    } catch (error: any) {
      console.error('Error pushing to Google Drive:', error);
      
      let errorMessage = 'Failed to push document to Google Drive.';
      
      if (error.message?.includes('not connected')) {
        errorMessage = 'Google account is not connected. Please reconnect your Google account.';
        Alert.alert(
          'Connection Error',
          errorMessage,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Go to Profile',
              onPress: () => navigation.navigate('Profile')
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsPushing(false);
    }
  };

  // Check Google connection status when component mounts
  useEffect(() => {
    checkStatus();
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await Share.share({
        message: `${title}\n\n${content}`,
        title: title,
      });

      if (result.action === Share.sharedAction) {
        console.log('Document shared successfully');
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Share Failed', 'Unable to share the document. Please try again.');
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
    } else {
      return (
        <Text style={styles.textContent}>
          {content}
        </Text>
      );
    }
  };

  // Update the push button to show connection status
  const PushToGoogleButton = () => (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        !isConnected && styles.disabledButton,
        isPushing && styles.loadingButton
      ]}
      onPress={handlePushToGoogleDrive}
      disabled={isPushing}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          !isConnected 
            ? ['#9ca3af', '#6b7280']
            : isPushing 
              ? ['#93c5fd', '#60a5fa'] 
              : ['#4285f4', '#1a73e8']
        }
        style={styles.floatingButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {isPushing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons 
            name={isConnected ? "cloud-upload" : "cloud-offline"} 
            size={20} 
            color="#fff" 
          />
        )}
        <Text style={styles.floatingButtonText}>
          {isPushing 
            ? 'Pushing...' 
            : isConnected 
              ? 'Push to Google Drive' 
              : 'Connect Google First'
          }
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {format === 'markdown' ? 'Markdown Document' : 'Text Document'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleZoomOut}
          >
            <Ionicons name="remove" size={22} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleZoomIn}
          >
            <Ionicons name="add" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={resetZoom}
          >
            <Ionicons name="resize-outline" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Ionicons name="share-outline" size={22} color="#64748b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content - Fixed Layout */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={zoomLevel > 1}
        bounces={true}
        scrollEventThrottle={16}
        maximumZoomScale={3}
        minimumZoomScale={0.5}
        zoomScale={zoomLevel}
        bouncesZoom={true}
      >
        <View style={[styles.documentContent, { transform: [{ scale: zoomLevel }] }]}>
          {renderContent()}
        </View>
      </ScrollView>

      {/* Floating Google Drive Button */}
      <View style={styles.floatingButtonContainer}>
        <PushToGoogleButton />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Fixed header - not scrollable
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Remove flex to make it fixed height
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    minWidth: 45,
    textAlign: 'center',
  },
  // Fixed ScrollView layout
  scrollView: {
    flex: 1, // Takes remaining space
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100, // Space for floating button
    flexGrow: 1, // Allow content to grow
  },
  documentContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: height * 0.8, // Ensure content is tall enough to scroll
    alignSelf: 'stretch', // Full width
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  floatingButton: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 140,
    justifyContent: 'center',
  },
  floatingButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingButton: {
    opacity: 0.8,
  },
});

// Markdown styles for better rendering
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 0,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 14,
    marginTop: 24,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20,
    lineHeight: 28,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 10,
    marginTop: 16,
    lineHeight: 26,
  },
  heading5: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
    marginTop: 14,
    lineHeight: 24,
  },
  heading6: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 12,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  strong: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  em: {
    fontStyle: 'italic',
    color: '#4b5563',
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 16,
  },
  ordered_list: {
    marginBottom: 16,
  },
  code_inline: {
    backgroundColor: '#f1f5f9',
    color: '#667eea',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    }),
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  code_block: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',  
      default: 'monospace'
    }),
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  blockquote: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    paddingLeft: 16,
    paddingVertical: 12,
    marginVertical: 12,
    fontStyle: 'italic',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: '#f8fafc',
  },
  tbody: {
    backgroundColor: 'white',
  },
  th: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  td: {
    fontSize: 14,
    color: '#4b5563',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  link: {
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: '#e2e8f0',
    height: 1,
    marginVertical: 20,
  },
});

export default DocumentViewScreen;