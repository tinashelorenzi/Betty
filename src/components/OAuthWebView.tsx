import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface OAuthWebViewProps {
  url: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const OAuthWebView: React.FC<OAuthWebViewProps> = ({
  url,
  onSuccess,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'GOOGLE_AUTH_SUCCESS') {
        onSuccess(data.data);
      } else if (data.type === 'GOOGLE_AUTH_ERROR') {
        onError(data.error);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      onError('Failed to process authentication response');
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    // Handle navigation changes if needed
    console.log('Navigation state:', navState.url);
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
    onError('Failed to load authentication page');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect to Google</Text>
        <View style={styles.placeholder} />
      </View>
      
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40, // Same width as close button for centering
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default OAuthWebView;