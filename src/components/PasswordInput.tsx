import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: any;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  placeholder = "Password",
  value,
  onChangeText,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const { theme } = useTheme();

  const togglePasswordVisibility = (): void => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingRight: 50, // Make room for the eye icon
      fontSize: theme.fontSize.md,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
    },
    eyeButton: {
      position: 'absolute',
      right: 15,
      top: '50%',
      transform: [{ translateY: -12 }], // Half of icon height
      padding: 4,
    },
  });

  return (
    <View style={[dynamicStyles.container, style]}>
      <TextInput
        {...props}
        style={dynamicStyles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TouchableOpacity
        style={dynamicStyles.eyeButton}
        onPress={togglePasswordVisibility}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isPasswordVisible ? 'eye-off' : 'eye'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

export default PasswordInput;