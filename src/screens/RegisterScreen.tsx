// src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { RouteProp } from '@react-navigation/native';
import { RegisterScreenNavigationProp, RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { authService, RegisterFormData, IAuthError } from '../services/authService';
import PasswordInput from '../components/PasswordInput';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const { login: contextLogin } = useAuth();

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async (): Promise<void> => {
    try {
      const isOnline = await authService.checkServerHealth();
      setServerOnline(isOnline);
      if (!isOnline) {
        Alert.alert(
          'Server Offline',
          'Cannot connect to the server. Please check your network connection or try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setServerOnline(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    const errors: Record<string, string> = {};
    
    // Reset previous errors
    setFieldErrors({});
    
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      
      // Show the first error in an alert
      const firstError = Object.values(errors)[0];
      Alert.alert('Validation Error', firstError);
      return false;
    }
    
    return true;
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;
    if (!serverOnline) {
      await checkServerHealth();
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register(formData);
      
      // Update auth context (registration automatically logs in)
      await contextLogin(response.user, response.access_token);
      
      Alert.alert(
        'Registration Successful!',
        `Welcome to Betty, ${response.user.first_name}! Your account has been created successfully.`,
        [
          {
            text: 'Get Started',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }], // Replace 'Home' with your main screen name
              });
            }
          }
        ]
      );
      
    } catch (error) {
      const authError = error as IAuthError;
      
      // Handle field-specific errors
      if (authError.field) {
        setFieldErrors({
          [authError.field]: authError.message
        });
      }
      
      Alert.alert(
        'Registration Failed', 
        authError.message || 'Something went wrong during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = (): void => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Betty and boost your productivity</Text>
          </Animatable.View>

          {/* Server Status Indicator */}
          {!serverOnline && (
            <Animatable.View animation="slideInDown" style={styles.serverWarning}>
              <Text style={styles.serverWarningText}>⚠️ Server connection issue</Text>
              <TouchableOpacity onPress={checkServerHealth} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Form Container */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.formContainer}>
            
            {/* First Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, fieldErrors.firstName && styles.inputError]}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
              {fieldErrors.firstName && (
                <Text style={styles.errorText}>{fieldErrors.firstName}</Text>
              )}
            </View>

            {/* Last Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, fieldErrors.lastName && styles.inputError]}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
              {fieldErrors.lastName && (
                <Text style={styles.errorText}>{fieldErrors.lastName}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {fieldErrors.email && (
                <Text style={styles.errorText}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <PasswordInput
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Enter your password"
                error={fieldErrors.password}
                editable={!loading}
              />
              {fieldErrors.password && (
                <Text style={styles.errorText}>{fieldErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <PasswordInput
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm your password"
                error={fieldErrors.confirmPassword}
                editable={!loading}
              />
              {fieldErrors.confirmPassword && (
                <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, (!serverOnline || loading) && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading || !serverOnline}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

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
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8E8E8',
    textAlign: 'center',
  },
  serverWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverWarningText: {
    color: '#856404',
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#856404',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;