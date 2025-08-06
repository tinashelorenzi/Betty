import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { 
  profileService, 
  UserResponse,  // ← Updated type
  ProfileStats, 
  NotificationSettings 
} from '../services/profileService';
import { ProfileStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = NavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
  rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true,
  color = '#667eea',
  rightElement
}) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (showArrow && <Ionicons name="chevron-forward" size={16} color="#999" />)}
  </TouchableOpacity>
);

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData, notificationData] = await Promise.all([
        profileService.getProfile(),
        profileService.getStats(),
        profileService.getNotificationSettings(),
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleAvatarChange = async () => {
    Alert.alert(
      'Change Avatar',
      'Choose how you want to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleImageSelection('camera') },
        { text: 'Choose from Gallery', onPress: () => handleImageSelection('gallery') },
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
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy & Security', 'Privacy settings coming soon');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Support center coming soon');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Betty',
      'Betty AI Assistant v1.0.0\n\nYour intelligent office companion for productivity and automation.',
      [{ text: 'OK' }]
    );
  };

  const toggleNotificationSetting = async (setting: keyof NotificationSettings, value: boolean) => {
    try {
      if (!notifications) return;
      
      const updatedSettings = { ...notifications, [setting]: value };
      const result = await profileService.updateNotificationSettings(updatedSettings);
      setNotifications(result);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayProfile = profile || user;
  const profileStats = stats ? [
    {
      title: 'Tasks Completed',
      value: stats.tasks_completed.toString(),
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      color: '#27ae60',
    },
    {
      title: 'Documents',
      value: stats.documents_created.toString(),
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#3498db',
    },
    {
      title: 'Hours Saved',
      value: stats.hours_saved.toString(),
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      color: '#f39c12',
    },
    {
      title: 'AI Chats',
      value: stats.ai_chats.toString(),
      icon: 'chatbubble' as keyof typeof Ionicons.glyphMap,
      color: '#9b59b6',
    },
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Header with Profile Info */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handleAvatarChange}
                disabled={avatarLoading}
              >
                {avatarLoading ? (
                  <View style={styles.avatar}>
                    <ActivityIndicator size="small" color="white" />
                  </View>
                ) : displayProfile?.avatar_url ? (
                  <Image source={{ uri: displayProfile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {displayProfile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      {displayProfile?.last_name?.charAt(0)?.toUpperCase() || ''}
                    </Text>
                  </View>
                )}
                <View style={styles.editAvatarOverlay}>
                  <Ionicons name="camera" size={12} color="white" />
                </View>
                <View style={styles.onlineIndicator} />
              </TouchableOpacity>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {displayProfile?.first_name || 'User'} {displayProfile?.last_name || ''}
                </Text>
                <Text style={styles.userEmail}>{displayProfile?.email || 'user@example.com'}</Text>
                {displayProfile?.location && (
                  <Text style={styles.userLocation}>📍 {displayProfile.location}</Text>
                )}
                <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                  <Ionicons name="pencil" size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Stats Grid */}
        {stats && (
          <Animatable.View animation="fadeInUp" delay={200} style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              {profileStats.map((stat, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeInUp"
                  delay={300 + index * 100}
                  style={styles.statCardWrapper}
                >
                  <StatCard {...stat} />
                </Animatable.View>
              ))}
            </View>
            {stats.streak_days > 0 && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>🔥 {stats.streak_days} day streak!</Text>
              </View>
            )}
          </Animatable.View>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Animatable.Text animation="fadeInLeft" delay={700} style={styles.sectionTitle}>
            Settings
          </Animatable.Text>
          
          <Animatable.View animation="fadeInUp" delay={800} style={styles.menuGroup}>
            <MenuItem
              icon="settings"
              title="App Settings"
              subtitle="Preferences and configurations"
              onPress={handleSettings}
            />
            <MenuItem
              icon="notifications"
              title="Notifications"
              subtitle="Manage your alerts"
              onPress={handleNotifications}
              rightElement={
                notifications && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notifications.push_notifications ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                )
              }
            />
            <MenuItem
              icon="shield-checkmark"
              title="Privacy & Security"
              subtitle="Control your data"
              onPress={handlePrivacy}
            />
          </Animatable.View>

          <Animatable.Text animation="fadeInLeft" delay={900} style={styles.sectionTitle}>
            Support
          </Animatable.Text>
          
          <Animatable.View animation="fadeInUp" delay={1000} style={styles.menuGroup}>
            <MenuItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get assistance"
              onPress={handleHelp}
            />
            <MenuItem
              icon="information-circle"
              title="About Betty"
              subtitle="App version and info"
              onPress={handleAbout}
            />
          </Animatable.View>

          {/* Quick Notification Toggles */}
          {notifications && (
            <Animatable.View animation="fadeInUp" delay={1100} style={styles.menuGroup}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginBottom: 8 }]}>
                Quick Settings
              </Text>
              <MenuItem
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Receive app notifications"
                onPress={() => toggleNotificationSetting('push_notifications', !notifications.push_notifications)}
                showArrow={false}
                rightElement={
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: notifications.push_notifications ? '#27ae60' : '#ddd' }
                    ]}
                    onPress={() => toggleNotificationSetting('push_notifications', !notifications.push_notifications)}
                  >
                    <View style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: notifications.push_notifications ? 20 : 2 }] }
                    ]} />
                  </TouchableOpacity>
                }
              />
              <MenuItem
                icon="mail-outline"
                title="Email Notifications"
                subtitle="Receive email updates"
                onPress={() => toggleNotificationSetting('email_notifications', !notifications.email_notifications)}
                showArrow={false}
                rightElement={
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: notifications.email_notifications ? '#27ae60' : '#ddd' }
                    ]}
                    onPress={() => toggleNotificationSetting('email_notifications', !notifications.email_notifications)}
                  >
                    <View style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: notifications.email_notifications ? 20 : 2 }] }
                    ]} />
                  </TouchableOpacity>
                }
              />
            </Animatable.View>
          )}

          {/* Logout Section */}
          <Animatable.View animation="fadeInUp" delay={1200} style={styles.logoutSection}>
            <MenuItem
              icon="log-out"
              title="Logout"
              onPress={handleLogout}
              showArrow={false}
              color="#e74c3c"
            />
          </Animatable.View>
        </View>

        {/* App Version */}
        <Animatable.View animation="fadeIn" delay={1300} style={styles.versionContainer}>
          <Text style={styles.versionText}>Betty AI Assistant v1.0.0</Text>
          {displayProfile?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          )}
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    elevation: 10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#27ae60',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  userLocation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCardWrapper: {
    width: '47%',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  streakContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  menuSection: {
    marginBottom: 20,
  },
  menuGroup: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notificationBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    position: 'absolute',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.3,
    elevation: 3,
  },
  logoutSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#27ae60',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ProfileScreen;