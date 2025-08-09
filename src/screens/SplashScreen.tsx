// src/screens/SplashScreen.tsx - Fixed Navigation
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
      // Use replace instead of reset to avoid navigation warnings
      navigation.replace('AuthLoading');
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.9,
    fontWeight: '300',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    opacity: 0.7,
  },
});

export default SplashScreen;