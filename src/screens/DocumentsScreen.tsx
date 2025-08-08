// src/screens/DocumentViewScreen.tsx - Updated with Success Modal & Markdown Conversion
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
  Modal,
  Linking,
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

// Utility function to convert markdown to plain text for Google Docs
const convertMarkdownToPlainText = (markdown: string): string => {
  let text = markdown;
  
  // Convert headers to plain text with appropriate formatting
  text = text.replace(/^#{6}\s+(.+)$/gm, '$1\n');
  text = text.replace(/^#{5}\s+(.+)$/gm, '$1\n');
  text = text.replace(/^#{4}\s+(.+)$/gm, '$1\n');
  text = text.replace(/^#{3}\s+(.+)$/gm, '$1\n\n');
  text = text.replace(/^#{2}\s+(.+)$/gm, '$1\n\n');
  text = text.replace(/^#{1}\s+(.+)$/gm, '$1\n\n');
  
  // Convert bold and italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1'); // Bold italic
  text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
  text = text.replace(/\*(.+?)\*/g, '$1'); // Italic
  text = text.replace(/___(.+?)___/g, '$1'); // Bold italic
  text = text.replace(/__(.+?)__/g, '$1'); // Bold
  text = text.replace(/_(.+?)_/g, '$1'); // Italic
  
  // Convert code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
  });
  text = text.replace(/`(.+?)`/g, '$1');
  
  // Convert links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
  
  // Convert lists
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, '• $1');
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, (match, content, offset, string) => {
    const lineNumber = (string.substring(0, offset).match(/^\s*\d+\.\s+/gm) || []).length + 1;
    return `${lineNumber}. ${content}`;
  });
  
  // Clean up extra newlines but preserve paragraph breaks
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
};

const DocumentViewScreen: React.FC<DocumentViewScreenProps> = ({ navigation, route }) => {
  const { title, content, format, documentId } = route.params as DocumentViewParams;
  const [isPushing, setIsPushing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  
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

  // Enhanced push to Google Drive function with proper API call
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
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Convert content based on format
      let contentToSend = content;
      if (format === 'markdown') {
        contentToSend = convertMarkdownToPlainText(content);
      }

      const response = await fetch(`${API_BASE_URL}/google/drive/create-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: title,
          content: contentToSend 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGoogleDocUrl(result.document_url);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create document');
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

  // Handle opening Google Doc
  const handleOpenGoogleDoc = async () => {
    if (googleDocUrl) {
      const canOpen = await Linking.canOpenURL(googleDocUrl);
      if (canOpen) {
        await Linking.openURL(googleDocUrl);
      } else {
        Alert.alert('Error', 'Cannot open Google Docs link');
      }
    }
    setShowSuccessModal(false);
  };

  // Check Google connection status when component mounts
  useEffect(() => {
    checkStatus();
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      let shareContent = content;
      if (format === 'markdown') {
        shareContent = convertMarkdownToPlainText(content);
      }

      const result = await Share.share({
        message: `${title}\n\n${shareContent}`,
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

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View
          animation="zoomIn"
          duration={300}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            <Text style={styles.modalTitle}>Success! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              Your document has been created in Google Drive
            </Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalDocumentTitle}>{title}</Text>
            <Text style={styles.modalDescription}>
              The document is now available in your Google Drive and ready to share or edit.
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonSecondaryText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={handleOpenGoogleDoc}
            >
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonPrimaryText}>View in Google</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  // Update the push button to show connection status
  const PushToGoogleButton = () => (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        !isConnected && styles.disabledButton,
        isPushing && styles.loadingButton
      ]}
      onPress={handlePushToGoogleDrive}
      disabled={isPushing || !isConnected}
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

      {/* Success Modal */}
      <SuccessModal />
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  zoomText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    paddingHorizontal: 6,
    minWidth: 40,
    textAlign: 'center',
  },
  // Scrollable content area
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  documentContent: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: height * 0.7,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
  },
  // Floating button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  floatingButton: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 28,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalDocumentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    color: '#e11d48',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  fence: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
    padding: 12,
    marginVertical: 16,
    borderRadius: 6,
  },
  blockquote: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingLeft: 16,
    paddingVertical: 8,
    marginVertical: 16,
    fontStyle: 'italic',
  },
});

export default DocumentViewScreen;