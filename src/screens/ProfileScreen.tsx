// src/screens/ProfileScreen.tsx - COMPLETE REWRITE WITH ALL TYPES FIXED
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { 
  profileService, 
  UserResponse,
  ProfileStats, 
  NotificationSettings 
} from '../services/profileService';
import { ProfileStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ProfileScreenNavigationProp = NavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ProfileHeaderProps {
  profile: UserResponse | null;
  avatarLoading: boolean;
  onEditProfile: () => void;
  onChangeAvatar: () => void;
}

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true,
  color = '#667eea',
  rightElement,
  disabled = false
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[styles.menuItem, disabled && styles.menuItemDisabled]}
    disabled={disabled}
  >
    <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={disabled ? '#ccc' : color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, disabled && styles.menuTitleDisabled]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.menuSubtitle, disabled && styles.menuSubtitleDisabled]}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightElement || (showArrow && (
      <Ionicons name="chevron-forward" size={16} color={disabled ? '#ccc' : '#999'} />
    ))}
  </TouchableOpacity>
);

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Animatable.View animation="fadeInUp" style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </Animatable.View>
);

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  avatarLoading, 
  onEditProfile, 
  onChangeAvatar 
}) => (
  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
    <View style={styles.headerContent}>
      <TouchableOpacity onPress={onChangeAvatar} style={styles.avatarContainer}>
        {avatarLoading ? (
          <View style={styles.avatarLoader}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#667eea" />
          </View>
        )}
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
        </Text>
        <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        {profile?.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.profileLocation}>{profile.location}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={onEditProfile} style={styles.editButton}>
        <Ionicons name="pencil" size={16} color="#667eea" />
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  
  // State management
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Load profile data on mount and when screen is focused
  useEffect(() => {
    loadProfileData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reload profile data when screen comes into focus
      loadProfileData();
    }, [])
  );

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData, notificationData] = await Promise.all([
        profileService.getProfile(),
        profileService.getStats().catch(() => null), // Don't fail if stats endpoint doesn't exist
        profileService.getNotificationSettings().catch(() => null), // Don't fail if notifications endpoint doesn't exist
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setNotifications(notificationData);
    } catch (error: any) {
      console.error('Error loading profile data:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to load profile data',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleChangeAvatar = () => {
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
              // Clear cache when logging out
              await profileService.clearCache();
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you absolutely sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete all your data. Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Forever', 
                  style: 'destructive', 
                  onPress: async () => {
                    try {
                      await profileService.deleteAccount();
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    }
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatStatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toString();
  };

  // ============================================================================
  // RENDER LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
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
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          avatarLoading={avatarLoading}
          onEditProfile={handleEditProfile}
          onChangeAvatar={handleChangeAvatar}
        />

        {/* Stats Section */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Tasks"
                value={formatStatValue(stats.tasks_completed)}
                icon="checkmark-circle"
                color="#4CAF50"
              />
              <StatCard
                title="Documents"
                value={formatStatValue(stats.documents_created)}
                icon="document-text"
                color="#2196F3"
              />
              <StatCard
                title="Hours Saved"
                value={formatStatValue(stats.hours_saved)}
                icon="time"
                color="#FF9800"
              />
              <StatCard
                title="AI Chats"
                value={formatStatValue(stats.ai_chats)}
                icon="chatbubble-ellipses"
                color="#9C27B0"
              />
            </View>
          </View>
        )}

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.menuSection}>
            <MenuItem
              icon="person-circle"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={handleEditProfile}
              color="#667eea"
            />
            
            <MenuItem
              icon="settings"
              title="Settings"
              subtitle="App preferences and configurations"
              onPress={handleSettings}
              color="#667eea"
            />
            
            <MenuItem
              icon="notifications"
              title="Notifications"
              subtitle={notifications ? 
                `${notifications.push_notifications ? 'Enabled' : 'Disabled'}` : 
                'Configure your notifications'
              }
              onPress={handleNotificationSettings}
              color="#FF9800"
            />
          </View>

          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.menuSection}>
            <MenuItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => Alert.alert('Help', 'Support feature coming soon!')}
              color="#4CAF50"
            />
            
            <MenuItem
              icon="document-text"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
              color="#2196F3"
            />
            
            <MenuItem
              icon="shield-checkmark"
              title="Terms of Service"
              subtitle="Read our terms of service"
              onPress={() => Alert.alert('Terms', 'Terms of service coming soon!')}
              color="#2196F3"
            />
          </View>

          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <View style={styles.menuSection}>
            <MenuItem
              icon="log-out"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              color="#FF5722"
              showArrow={false}
            />
            
            <MenuItem
              icon="trash"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
              color="#F44336"
              showArrow={false}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Betty - Your Office Genius</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
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
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarLoader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginRight: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Styles
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Menu Styles
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuTitleDisabled: {
    color: '#ccc',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuSubtitleDisabled: {
    color: '#ccc',
  },

  // Footer Styles
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;