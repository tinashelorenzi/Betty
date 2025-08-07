// src/screens/DocumentViewScreen.tsx - Markdown Document Viewer with Google Drive Integration
import React, { useState } from 'react';
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

// You'll need to install this: npm install react-native-markdown-display
import Markdown from 'react-native-markdown-display';

import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const handlePushToGoogleDrive = async () => {
    setIsPushing(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to push to Google Drive.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/google/create-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title,
          content: content,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success! 🎉', 
          'Document has been created in your Google Drive.',
          [
            { text: 'Got it', style: 'default' },
            { 
              text: 'Open in Drive', 
              onPress: () => {
                // You could implement deep linking to Google Drive here
                console.log('Open Google Drive:', result.document_url);
              }
            }
          ]
        );
      } else {
        throw new Error(result.detail || 'Failed to push to Google Drive');
      }
    } catch (error: any) {
      console.error('Error pushing to Google Drive:', error);
      Alert.alert(
        'Upload Failed', 
        error.message || 'Failed to push document to Google Drive. Please try again.'
      );
    } finally {
      setIsPushing(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
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
      </Animatable.View>

      {/* Document Content */}
      <Animatable.View animation="fadeInUp" delay={200} style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.documentContent}>
            {renderContent()}
          </View>
        </ScrollView>
      </Animatable.View>

      {/* Floating Google Drive Button */}
      <Animatable.View 
        animation="bounceIn" 
        delay={600}
        style={styles.floatingButtonContainer}
      >
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handlePushToGoogleDrive}
          disabled={isPushing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isPushing ? ['#94a3b8', '#64748b'] : ['#4285f4', '#1a73e8']}
            style={styles.floatingButtonGradient}
          >
            {isPushing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.floatingButtonText}>Pushing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="white" />
                <Text style={styles.floatingButtonText}>Push to Drive</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Space for floating button
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
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
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