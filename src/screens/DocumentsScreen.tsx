// src/screens/DocumentsScreen.tsx - Fixed to use updated hook functions
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

interface DocumentsScreenProps {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
}

// Mock DocumentContext - you'll need to create this or use your existing context
interface DocumentContextType {
  documents: { [key: string]: string };
  addDocument: (name: string, content: string) => void;
}

// Mock documents data - replace with your actual context
const mockDocuments: { [key: string]: string } = {
  'Non-Disclosure Agreement': '# Non-Disclosure Agreement\n\nThis agreement is made between...',
  'Business Plan': '# Business Plan\n\n## Executive Summary\n\nOur company aims to...',
  'Meeting Notes': '# Meeting Notes\n\n## Agenda\n- Item 1\n- Item 2\n\n## Action Items\n1. Follow up on...',
};

const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ navigation }) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { user: googleUser } = useAuth();
  
  // FIXED: Use the updated hook with correct function names
  const { 
    isConnected, 
    exportProgress,           // NEW: Built-in progress tracking
    exportToGoogleDocs,       // FIXED: Renamed from pushToGoogleDrive
    generateDocument          // NEW: Secure document generation
  } = useGoogleAuth();
  
  // Mock documents state - replace with your actual context
  const [documents, setDocuments] = useState(mockDocuments);
  const [exportResult, setExportResult] = useState<any>(null);

  // Mock addDocument function - replace with your actual context
  const addDocument = (name: string, content: string) => {
    setDocuments(prev => ({
      ...prev,
      [name]: content
    }));
  };

  // FIXED: Use the new generateDocument function from the hook
  const handleCreateFromInput = async () => {
    if (newDocName.trim() === '' || isGenerating) return;
    setIsGenerating(true);
    
    try {
      // Use the generateDocument function from the hook (secure)
      const result = await generateDocument(newDocName.trim());
      
      if (result.success && result.content) {
        addDocument(newDocName.trim(), result.content);
        setNewDocName('');
      } else {
        throw new Error(result.error || 'Failed to generate document');
      }
      
    } catch (error: any) { 
      console.error("Document generation failed:", error);
      Alert.alert('Error', error.message || 'Failed to generate document. Please try again.');
    } finally { 
      setIsGenerating(false); 
    }
  };

  // FIXED: Use the new exportToGoogleDocs function from the hook
  const handleExportToGoogle = async () => {
    if (!isConnected) {
      Alert.alert(
        'Google Account Not Connected',
        'Please connect your Google Account in Profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }
    
    if (!selectedDoc) return;
    
    try {
      // Use the exportToGoogleDocs function from the hook
      const result = await exportToGoogleDocs(selectedDoc, documents[selectedDoc]);
      
      if (result.success) {
        setExportResult(result);
        setModalVisible(true);
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', `Failed to export to Google Docs: ${error.message}`);
    }
  };

  const openInGoogleDocs = async () => {
    if (exportResult?.document_url) {
      const canOpen = await Linking.canOpenURL(exportResult.document_url);
      if (canOpen) {
        await Linking.openURL(exportResult.document_url);
      } else {
        Alert.alert('Error', 'Cannot open Google Docs link');
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setExportResult(null);
  };

  const openDocument = (docName: string) => {
    setSelectedDoc(docName); // Show document in current screen
    // OR navigate to separate view:
    // navigation.navigate('DocumentView', {
    //   title: docName,
    //   content: documents[docName],
    //   format: 'markdown',
    //   documentId: docName
    // });
  };

  if (selectedDoc) {
    return (
      <SafeAreaView style={styles.container}>
        {/* FIXED: Use exportProgress from hook instead of local state */}
        <Modal visible={modalVisible || exportProgress.isExporting} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animatable.View
              animation="zoomIn"
              duration={300}
              style={styles.enhancedModalContent}
            >
              {exportProgress.isExporting ? (
                // Export Progress View - Uses hook's progress tracking
                <View style={styles.modalHeader}>
                  <View style={styles.loadingIcon}>
                    <ActivityIndicator size="large" color="#4285F4" />
                  </View>
                  <Text style={styles.modalTitle}>Exporting to Google Docs</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${exportProgress.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{exportProgress.message}</Text>
                  </View>
                </View>
              ) : exportResult ? (
                // Success View
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.successIcon}>
                      <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                    </View>
                    <Text style={styles.modalTitle}>Export Successful!</Text>
                  </View>
                  
                  <View style={styles.modalBody}>
                    <Text style={styles.modalText}>
                      "{selectedDoc}" has been successfully exported to Google Docs with formatting preserved from your markdown.
                    </Text>
                    
                    {exportResult && (
                      <View style={styles.docInfoContainer}>
                        <Text style={styles.docInfoLabel}>Document:</Text>
                        <Text style={styles.docInfoValue}>{selectedDoc}</Text>
                        
                        <Text style={styles.docInfoLabel}>Formatting Applied:</Text>
                        <Text style={styles.docInfoValue}>
                          {exportResult.markdown_converted ? 'Markdown → Rich Text' : 'Basic'}
                        </Text>
                        
                        {exportResult.document_id && (
                          <>
                            <Text style={styles.docInfoLabel}>Document ID:</Text>
                            <Text style={styles.docInfoValue}>
                              {exportResult.document_id.substring(0, 12)}...
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.viewInGoogleButton} 
                      onPress={openInGoogleDocs}
                    >
                      <Ionicons name="logo-google" size={20} color="#fff" />
                      <Text style={styles.viewInGoogleText}>View in Google Docs</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalCloseButton} 
                      onPress={closeModal}
                    >
                      <Text style={styles.modalCloseText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </Animatable.View>
          </View>
        </Modal>

        <View style={styles.pageContainer}>
          <TouchableOpacity onPress={() => setSelectedDoc(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
            <Text style={styles.backButtonText}>Back to Documents</Text>
          </TouchableOpacity>
          
          <Text style={styles.screenTitle}>{selectedDoc}</Text>
          
          {/* Keep your existing markdown rendering */}
          <ScrollView style={styles.documentContent}>
            <Text style={styles.documentText}>
              {documents[selectedDoc].trim()}
            </Text>
          </ScrollView>
          
          {/* FIXED: Use exportProgress.isExporting instead of local isExporting */}
          <TouchableOpacity 
            style={[
              isConnected ? styles.googleDocButton : styles.googleDocButtonDisabled,
              exportProgress.isExporting && styles.googleDocButtonExporting
            ]} 
            onPress={handleExportToGoogle}
            disabled={!isConnected || exportProgress.isExporting}
          >
            <LinearGradient
              colors={
                !isConnected 
                  ? ['#9ca3af', '#6b7280']
                  : exportProgress.isExporting 
                    ? ['#93c5fd', '#60a5fa'] 
                    : ['#4285f4', '#1a73e8']
              }
              style={styles.googleDocButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {exportProgress.isExporting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="logo-google" size={20} color="#fff" />
              )}
              <Text style={styles.googleDocButtonText}>
                {exportProgress.isExporting ? 
                  `Exporting... ${exportProgress.progress}%` : 
                  isConnected ? 'Export to Google Docs' : 'Connect Google to Export'
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Document list view - unchanged
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        <Text style={styles.screenTitle}>Business Documents</Text>
        <Text style={styles.pageDescription}>Select an existing document, or create a new one below.</Text>
        
        <View style={styles.createTemplateSection}>
          <Text style={styles.sectionTitle}>Create New Document</Text>
          <View style={styles.inputArea}>
            <TextInput 
              style={styles.textInput} 
              value={newDocName} 
              onChangeText={setNewDocName} 
              placeholder="e.g., 'Non-Disclosure Agreement'" 
              onSubmitEditing={handleCreateFromInput}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleCreateFromInput}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.documentsList}>
          <Text style={styles.sectionTitle}>Your Documents</Text>
          {Object.keys(documents).map(docName => (
            <TouchableOpacity 
              key={docName} 
              style={styles.documentItem} 
              onPress={() => openDocument(docName)}
            >
              <Ionicons name="document-text" size={24} color="#6B7280" />
              <Text style={styles.documentTitle}>{docName}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  pageContainer: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  pageDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 16,
    marginLeft: 8,
  },
  createTemplateSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentsList: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  documentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  documentContent: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  documentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  googleDocButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  googleDocButtonDisabled: {
    opacity: 0.6,
  },
  googleDocButtonExporting: {
    opacity: 0.8,
  },
  googleDocButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  googleDocButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enhancedModalContent: {
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
  loadingIcon: {
    marginBottom: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  docInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  docInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  docInfoValue: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  modalActions: {
    gap: 12,
  },
  viewInGoogleButton: {
    backgroundColor: '#4285f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  viewInGoogleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalCloseButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentsScreen;