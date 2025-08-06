// src/screens/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true,
  color = '#667eea'
}) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <Ionicons name="chevron-forward" size={16} color="#999" />}
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
  const { user, logout } = useAuth();

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

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleSettings = () => {
    console.log('Open settings');
  };

  const handleNotifications = () => {
    console.log('Notification settings');
  };

  const handlePrivacy = () => {
    console.log('Privacy settings');
  };

  const handleHelp = () => {
    console.log('Help & Support');
  };

  const handleAbout = () => {
    console.log('About');
  };

  const stats = [
    {
      title: 'Tasks Completed',
      value: '127',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      color: '#27ae60',
    },
    {
      title: 'Documents',
      value: '43',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#3498db',
    },
    {
      title: 'Hours Saved',
      value: '85.5',
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      color: '#f39c12',
    },
    {
      title: 'AI Chats',
      value: '256',
      icon: 'chatbubble' as keyof typeof Ionicons.glyphMap,
      color: '#9b59b6',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Profile Info */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    {user?.last_name?.charAt(0)?.toUpperCase() || ''}
                  </Text>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.first_name || 'User'} {user?.last_name || ''}
                </Text>
                <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                  <Ionicons name="pencil" size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Stats Grid */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
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
        </Animatable.View>

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

          {/* Logout Section */}
          <Animatable.View animation="fadeInUp" delay={1100} style={styles.logoutSection}>
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
        <Animatable.View animation="fadeIn" delay={1200} style={styles.versionContainer}>
          <Text style={styles.versionText}>Betty AI Assistant v1.0.0</Text>
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
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    borderWidth: 3,
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
    marginBottom: 12,
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
});

export default ProfileScreen;