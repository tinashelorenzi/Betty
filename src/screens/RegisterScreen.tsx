import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { RouteProp } from '@react-navigation/native';
import { RegisterScreenNavigationProp, RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import PasswordInput from '../components/PasswordInput';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Register'>;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { theme } = useTheme();

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement API call to your FastAPI backend
      console.log('Register attempt:', formData);
      
      // Placeholder - replace with actual API call
      // const response = await authService.register(formData);
      
      Alert.alert(
        'Success', 
        'Registration functionality will be implemented next!',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = (): void => {
    navigation.navigate('Login');
  };

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    formContainer: {
      backgroundColor: theme.colors.backgroundOverlay,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      marginHorizontal: 10,
      ...theme.shadow.large,
    },
    welcomeText: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fontSize.md,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
    },
    termsText: {
      textAlign: 'center',
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 20,
      lineHeight: 18,
    },
    linkText: {
      color: theme.colors.accent,
      fontWeight: theme.fontWeight.semibold,
    },
    loginText: {
      color: theme.colors.textSecondary,
      fontSize: theme.fontSize.sm,
    },
    loginLink: {
      color: theme.colors.accent,
      fontWeight: theme.fontWeight.semibold,
    },
  });

  return (
    <LinearGradient colors={theme.gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animatable.View animation="slideInUp" duration={1000} style={dynamicStyles.formContainer}>
            
            {/* Logo */}
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Welcome Text */}
            <Animatable.View animation="fadeInUp" delay={500} duration={1000}>
              <Text style={dynamicStyles.welcomeText}>Create Account</Text>
              <Text style={dynamicStyles.subtitleText}>Join us today</Text>
            </Animatable.View>

            {/* Registration Form */}
            <Animatable.View animation="fadeInUp" delay={800} duration={1000} style={styles.inputContainer}>
              
              {/* Name Fields Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="First Name"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Last Name"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Email Address"
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <PasswordInput
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                />
              </View>

              <View style={styles.inputWrapper}>
                <PasswordInput
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={theme.gradients.button}
                  style={styles.gradientButton}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms and Privacy */}
              <Text style={dynamicStyles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={dynamicStyles.linkText}>Terms of Service</Text> and{' '}
                <Text style={dynamicStyles.linkText}>Privacy Policy</Text>
              </Text>

              {/* Login Link */}
              <TouchableOpacity onPress={navigateToLogin} style={styles.loginContainer}>
                <Text style={dynamicStyles.loginText}>
                  Already have an account? {' '}
                  <Text style={dynamicStyles.loginLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>

            </Animatable.View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nameInputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
  },
});

export default RegisterScreen;