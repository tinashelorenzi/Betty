// src/screens/ProfileScreen.tsx - ENHANCED WITH GOOGLE PERSISTENCE
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
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useNativeGoogleAuth } from '../hooks/useNativeGoogleAuth';
import GoogleConnectButton from '../components/GoogleConnectButton';
import ErrorBoundary from '../components/ErrorBoundary';

const { width, height } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();
  const { user, logout } = useAuth();
  
  // Enhanced Google Auth hook with persistence
  const { 
    isConnected, 
    userInfo, 
    isLoading: googleLoading,
    refreshStatus 
  } = useNativeGoogleAuth();
  
  // State management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Load profile data and check Google status on mount
  useEffect(() => {
    loadProfileData();
    // Ensure Google status is fresh when component mounts
    refreshStatus();
  }, [refreshStatus]);

  // Refresh Google status every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('ProfileScreen focused - checking Google status');
      // Always refresh Google status when returning to profile
      refreshStatus();
      
      // Also reload profile data if it's been more than 30 seconds
      if (Date.now() - lastRefresh > 30000) {
        loadProfileData();
      }
    }, [refreshStatus, lastRefresh])
  );

  // Auto-refresh Google status every 2 minutes while on profile screen
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing Google status...');
      refreshStatus();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [refreshStatus]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Load your profile data here
      // const profileData = await profileService.getProfile();
      // setProfile(profileData);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload both profile and Google status
      await Promise.all([
        loadProfileData(),
        refreshStatus()
      ]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoogleConnectionChange = (connected: boolean) => {
    console.log('Google connection changed:', connected);
    // Force refresh status after connection change
    setTimeout(() => {
      refreshStatus();
    }, 1000);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout 
        }
      ]
    );
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.profileHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeaderContent}>
            <TouchableOpacity style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
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
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              {user?.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.profileLocation}>{user.location}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
              <Ionicons name="pencil" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Google Integration Section */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.accountIconContainer}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountTitle}>Google Account</Text>
                <View style={styles.statusContainer}>
                  {googleLoading ? (
                    <View style={styles.statusLoading}>
                      <ActivityIndicator size="small" color="#4285F4" />
                      <Text style={styles.statusText}>Checking...</Text>
                    </View>
                  ) : isConnected ? (
                    <View style={styles.statusConnected}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.statusText}>Connected</Text>
                    </View>
                  ) : (
                    <View style={styles.statusDisconnected}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.statusText}>Not Connected</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {isConnected && userInfo ? (
              <View style={styles.accountDetails}>
                <Text style={styles.connectedEmail}>{userInfo.user_email}</Text>
                <Text style={styles.accountCapabilities}>
                  • Export documents to Google Drive{'\n'}
                  • Access Google Calendar{'\n'}
                  • Sync data across devices
                </Text>
              </View>
            ) : (
              <Text style={styles.accountDescription}>
                Connect your Google account to enable document export, 
                calendar integration, and cloud storage features.
              </Text>
            )}

            <GoogleConnectButton 
              style={styles.connectButton}
              onConnectionChange={handleGoogleConnectionChange}
            />
          </View>
        </Animatable.View>

        {/* Menu Section */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={[styles.menuIcon, { backgroundColor: '#667eea20' }]}>
                <Ionicons name="person-circle" size={20} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Edit Profile</Text>
                <Text style={styles.menuSubtitle}>Update your personal information</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={[styles.menuIcon, { backgroundColor: '#667eea20' }]}>
                <Ionicons name="settings" size={20} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>App preferences and configurations</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => refreshStatus()}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="refresh" size={20} color="#10B981" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Refresh Connections</Text>
                <Text style={styles.menuSubtitle}>Check account connection status</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Logout Section */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#6B7280',
  },
  profileHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
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
    marginBottom: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusConnected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDisconnected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  accountDetails: {
    marginBottom: 16,
  },
  connectedEmail: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '500',
    marginBottom: 8,
  },
  accountCapabilities: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  accountDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  connectButton: {
    marginTop: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default ProfileScreen;