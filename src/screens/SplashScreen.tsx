// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { RouteProp } from '@react-navigation/native';
import { SplashScreenNavigationProp, RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Splash'>;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  useEffect(() => {
    // Auto-navigate after 2 seconds to the auth loading screen
    // which will handle checking authentication status
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthLoading' }],
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.content}>
        <Animatable.View 
          animation="bounceIn" 
          duration={1500}
          style={styles.logoContainer}
        >
          <Text style={styles.logoText}>Betty</Text>
          <Text style={styles.taglineText}>Your AI Office Assistant</Text>
        </Animatable.View>
        
        <Animatable.View 
          animation="fadeIn" 
          delay={1000}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingDots}>
            <Animatable.View 
              animation="pulse" 
              iterationCount="infinite" 
              delay={0}
              style={styles.dot}
            />
            <Animatable.View 
              animation="pulse" 
              iterationCount="infinite" 
              delay={200}
              style={styles.dot}
            />
            <Animatable.View 
              animation="pulse" 
              iterationCount="infinite" 
              delay={400}
              style={styles.dot}
            />
          </View>
        </Animatable.View>
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
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 18,
    color: '#E8E8E8',
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    opacity: 0.7,
  },
});

export default SplashScreen;