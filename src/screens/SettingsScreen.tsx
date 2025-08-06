// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';
import { 
  profileService, 
  NotificationSettings, 
  UserPreferences 
} from '../services/profileService';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, delay = 0 }) => (
  <Animatable.View animation="fadeInUp" delay={delay} style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </Animatable.View>
);

interface ToggleItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  color?: string;
}

const ToggleItem: React.FC<ToggleItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  color = '#667eea'
}) => (
  <View style={styles.toggleItem}>
    <View style={[styles.toggleIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.toggleContent}>
      <Text style={styles.toggleTitle}>{title}</Text>
      {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#ddd', true: `${color}40` }}
      thumbColor={value ? color : '#f4f3f4'}
    />
  </View>
);

interface SelectItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  color?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  options,
  onSelect,
  color = '#667eea'
}) => {
  const handlePress = () => {
    Alert.alert(
      title,
      'Select an option:',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => onSelect(option.value),
          style: option.value === value ? 'destructive' : 'default' as any,
        })),
        { text: 'Cancel', style: 'cancel' as any },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.selectItem}>
      <View style={[styles.selectIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.selectContent}>
        <Text style={styles.selectTitle}>{title}</Text>
        {subtitle && <Text style={styles.selectSubtitle}>{subtitle}</Text>}
        <Text style={styles.selectValue}>
          {options.find(opt => opt.value === value)?.label || value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );
};

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [notificationData, preferencesData] = await Promise.all([
        profileService.getNotificationSettings(),
        profileService.getUserPreferences(),
      ]);
      
      setNotifications(notificationData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (key: keyof NotificationSettings, value: any) => {
    try {
      if (!notifications) return;
      
      const updatedSettings = { ...notifications, [key]: value };
      const result = await profileService.updateNotificationSettings(updatedSettings);
      setNotifications(result);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    try {
      if (!preferences) return;
      
      const updatedPreferences = { ...preferences, [key]: value };
      const result = await profileService.updateUserPreferences(updatedPreferences);
      setPreferences(result);
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const handleQuietHours = () => {
    Alert.alert(
      'Quiet Hours',
      'Set your quiet hours for notifications',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Configure', onPress: () => Alert.alert('Coming Soon', 'Time picker will be available soon') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all your data from Betty',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Coming Soon', 'Data export will be available soon') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will permanently delete your account and all data.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await profileService.deleteAccount();
                      Alert.alert('Account Deleted', 'Your account has been scheduled for deletion.');
                      // Handle logout/navigation
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account');
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

  if (loading || !notifications || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your Betty experience</Text>
        </Animatable.View>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" delay={200}>
          <ToggleItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive app notifications"
            value={notifications.push_notifications}
            onToggle={(value) => updateNotificationSetting('push_notifications', value)}
            color="#667eea"
          />
          <ToggleItem
            icon="mail"
            title="Email Notifications"
            subtitle="Receive email updates"
            value={notifications.email_notifications}
            onToggle={(value) => updateNotificationSetting('email_notifications', value)}
            color="#27ae60"
          />
          <ToggleItem
            icon="shield-checkmark"
            title="Security Alerts"
            subtitle="Important account security notifications"
            value={notifications.security_alerts}
            onToggle={(value) => updateNotificationSetting('security_alerts', value)}
            color="#e74c3c"
          />
          <ToggleItem
            icon="calendar"
            title="Weekly Digest"
            subtitle="Weekly summary of your activity"
            value={notifications.weekly_digest}
            onToggle={(value) => updateNotificationSetting('weekly_digest', value)}
            color="#f39c12"
          />
          <ToggleItem
            icon="moon"
            title="Weekend Notifications"
            subtitle="Receive notifications on weekends"
            value={notifications.weekend_notifications}
            onToggle={(value) => updateNotificationSetting('weekend_notifications', value)}
            color="#9b59b6"
          />
          
          <TouchableOpacity onPress={handleQuietHours} style={styles.quietHoursItem}>
            <View style={[styles.selectIcon, { backgroundColor: '#34495e20' }]}>
              <Ionicons name="moon-outline" size={20} color="#34495e" />
            </View>
            <View style={styles.selectContent}>
              <Text style={styles.selectTitle}>Quiet Hours</Text>
              <Text style={styles.selectSubtitle}>
                {notifications.quiet_hours_start && notifications.quiet_hours_end
                  ? `${notifications.quiet_hours_start} - ${notifications.quiet_hours_end}`
                  : 'Not set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
        </SettingsSection>

        {/* App Preferences Section */}
        <SettingsSection title="App Preferences" delay={400}>
          <SelectItem
            icon="color-palette"
            title="Theme"
            subtitle="Choose your preferred theme"
            value={preferences.theme}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ]}
            onSelect={(value) => updatePreference('theme', value)}
            color="#667eea"
          />
          <SelectItem
            icon="language"
            title="Language"
            subtitle="App language"
            value={preferences.language}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Afrikaans', value: 'af' },
              { label: 'Zulu', value: 'zu' },
            ]}
            onSelect={(value) => updatePreference('language', value)}
            color="#27ae60"
          />
          <SelectItem
            icon="cash"
            title="Currency"
            subtitle="Default currency for calculations"
            value={preferences.currency}
            options={[
              { label: 'South African Rand (ZAR)', value: 'ZAR' },
              { label: 'US Dollar (USD)', value: 'USD' },
              { label: 'Euro (EUR)', value: 'EUR' },
            ]}
            onSelect={(value) => updatePreference('currency', value)}
            color="#f39c12"
          />
          <SelectItem
            icon="time"
            title="Time Format"
            subtitle="Choose time display format"
            value={preferences.time_format}
            options={[
              { label: '24-hour (23:59)', value: '24h' },
              { label: '12-hour (11:59 PM)', value: '12h' },
            ]}
            onSelect={(value) => updatePreference('time_format', value)}
            color="#9b59b6"
          />
          <ToggleItem
            icon="save"
            title="Auto Save"
            subtitle="Automatically save your work"
            value={preferences.auto_save}
            onToggle={(value) => updatePreference('auto_save', value)}
            color="#27ae60"
          />
          <ToggleItem
            icon="analytics"
            title="Analytics"
            subtitle="Help improve Betty with usage data"
            value={preferences.analytics_enabled}
            onToggle={(value) => updatePreference('analytics_enabled', value)}
            color="#3498db"
          />
        </SettingsSection>

        {/* Data & Privacy Section */}
        <SettingsSection title="Data & Privacy" delay={600}>
          <TouchableOpacity onPress={handleExportData} style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#3498db20' }]}>
              <Ionicons name="download" size={20} color="#3498db" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionSubtitle}>Download all your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#e74c3c20' }]}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: '#e74c3c' }]}>Delete Account</Text>
              <Text style={styles.actionSubtitle}>Permanently delete your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
        </SettingsSection>

        {/* App Info */}
        <Animatable.View animation="fadeIn" delay={800} style={styles.appInfo}>
          <Text style={styles.appInfoText}>Betty AI Assistant</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.buildText}>Build 2025.08.06</Text>
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
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectContent: {
    flex: 1,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectValue: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 4,
    fontWeight: '500',
  },
  quietHoursItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default SettingsScreen;