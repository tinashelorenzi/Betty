// src/screens/EditProfileScreen.tsx - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { 
  profileService, 
  UserResponse,
  ProfileUpdateData 
} from '../services/profileService';
import { ProfileStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type EditProfileScreenNavigationProp = NavigationProp<ProfileStackParamList>;

interface FormData extends ProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string; // Read-only
  phone: string;
  bio: string;
  location: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, refreshUser } = useAuth();
  
  // State management
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Check if form has changes
    if (profile) {
      const hasFormChanges = 
        formData.first_name !== (profile.first_name || '') ||
        formData.last_name !== (profile.last_name || '') ||
        formData.phone !== (profile.phone || '') ||
        formData.bio !== (profile.bio || '') ||
        formData.location !== (profile.location || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, profile]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      
      // Populate form with current data
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleImageSelection('camera') },
        { text: 'Choose from Gallery', onPress: () => handleImageSelection('gallery') },
        ...(profile?.avatar_url ? [{ 
          text: 'Remove Photo', 
          style: 'destructive' as const, 
          onPress: handleRemoveAvatar 
        }] : []),
      ]
    );
  };

  const handleImageSelection = async (source: 'camera' | 'gallery') => {
    try {
      setAvatarLoading(true);
      
      let imageUri: string | null = null;
      
      if (source === 'camera') {
        imageUri = await profileService.takePhoto();
      } else {
        imageUri = await profileService.pickImage();
      }

      if (imageUri) {
        const avatarUrl = await profileService.uploadAvatar(imageUri);
        setProfile((prev: UserResponse | null) => prev ? { 
          ...prev, 
          avatar_url: avatarUrl 
        } : null);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarLoading(true);
      await profileService.removeAvatar();
      setProfile((prev: UserResponse | null) => prev ? { 
        ...prev, 
        avatar_url: undefined 
      } : null);
      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', error.message || 'Failed to remove profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    
    if (!formData.last_name.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    
    if (formData.bio && formData.bio.length > 500) {
      Alert.alert('Validation Error', 'Bio must be less than 500 characters');
      return false;
    }
    
    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        Alert.alert('Validation Error', 'Please enter a valid phone number');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Prepare update data (exclude email and empty fields)
      const updateData: ProfileUpdateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        location: formData.location.trim() || undefined,
      };
      
      const updatedProfile = await profileService.updateProfile(updateData);
      setProfile(updatedProfile);
      
      // Refresh user context if available
      if (refreshUser) {
        await refreshUser();
      }
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!', 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { 
            text: 'Leave', 
            style: 'destructive', 
            onPress: () => navigation.goBack() 
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // ============================================================================
  // RENDER LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.headerButton, 
              styles.saveButton, 
              (!hasChanges || saving) && styles.saveButtonDisabled
            ]}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[
                styles.saveButtonText, 
                (!hasChanges || saving) && styles.saveButtonTextDisabled
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <Animatable.View animation="fadeInDown" delay={200} style={styles.avatarSection}>
            <TouchableOpacity 
              onPress={handleAvatarChange}
              style={styles.avatarContainer}
              disabled={avatarLoading}
            >
              {avatarLoading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="large" color="#667eea" />
                </View>
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                  </Text>
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(102, 126, 234, 0.8)']}
                style={styles.avatarOverlay}
              >
                <Ionicons name="camera" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change profile picture</Text>
          </Animatable.View>

          {/* Form Sections */}
          <View style={styles.formSection}>
            {/* Basic Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.first_name}
                  onChangeText={(text) => handleInputChange('first_name', text)}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.last_name}
                  onChangeText={(text) => handleInputChange('last_name', text)}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.email}
                  editable={false}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputHint}>Email cannot be changed</Text>
              </View>
            </View>

            {/* Contact Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => handleInputChange('location', text)}
                  placeholder="Enter your location"
                  placeholderTextColor="#999"
                  maxLength={100}
                />
              </View>
            </View>

            {/* About Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>About</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.bio}
                  onChangeText={(text) => handleInputChange('bio', text)}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {formData.bio.length}/500 characters
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButtonTextDisabled: {
    color: '#999',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  // Form Styles
  formSection: {
    paddingBottom: 30,
  },
  inputGroup: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
});

export default EditProfileScreen;