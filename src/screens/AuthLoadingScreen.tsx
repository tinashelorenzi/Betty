// src/screens/AuthLoadingScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface AuthLoadingScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'AuthLoading'>;
  route: RouteProp<RootStackParamList, 'AuthLoading'>;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ navigation }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Wait for auth check to complete, then navigate
    if (!loading) {
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: isAuthenticated ? 'MainApp' : 'Auth' }],
        });
      }, 1000); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, navigation]);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.content}>
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          style={styles.logoContainer}
        >
          <Text style={styles.logoText}>Betty</Text>
        </Animatable.View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    opacity: 0.8,
  },
});

export default AuthLoadingScreen;