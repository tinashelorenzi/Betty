import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp } from '@react-navigation/native';
import { SplashScreenNavigationProp, RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Splash'>;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  useEffect(() => {
    // Navigate to login screen after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animatable.Image
          animation="bounceIn"
          duration={2000}
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          duration={1000}
          style={styles.textContainer}
        >
          {/* Add any text or tagline here if needed */}
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
    width: width,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default SplashScreen;