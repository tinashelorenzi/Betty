// src/components/PasswordInput.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  showStrengthIndicator?: boolean;
  editable?: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder = "Enter password",
  error,
  showStrengthIndicator = false,
  editable = true,
  ...textInputProps
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '#E0E0E0' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Reduce score for common patterns
    if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score--; // Sequential patterns
    
    score = Math.max(0, Math.min(4, score));
    
    const strengthMap = {
      0: { label: 'Too weak', color: '#e74c3c' },
      1: { label: 'Weak', color: '#e67e22' },
      2: { label: 'Fair', color: '#f39c12' },
      3: { label: 'Good', color: '#2ecc71' },
      4: { label: 'Strong', color: '#27ae60' },
    };
    
    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          {...textInputProps}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.eyeButton}
          disabled={!editable}
        >
          <Text style={styles.eyeButtonText}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Password Strength Indicator */}
      {showStrengthIndicator && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            {[...Array(4)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor: index < passwordStrength.score 
                      ? passwordStrength.color 
                      : '#E0E0E0'
                  }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            {passwordStrength.label}
          </Text>
        </View>
      )}
      
      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default PasswordInput;