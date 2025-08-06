// src/screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { 
  profileService, 
  NotificationSettings 
} from '../services/profileService';

interface NotificationToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  color?: string;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  color = '#667eea'
}) => (
  <View style={styles.toggleRow}>
    <View style={[styles.toggleIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.toggleContent}>
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#ddd', true: `${color}40` }}
      thumbColor={value ? color : '#f4f3f4'}
    />
  </View>
);

interface NotificationLevelProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: 'all' | 'important' | 'none';
  onSelect: (value: 'all' | 'important' | 'none') => void;
  color?: string;
}

const NotificationLevel: React.FC<NotificationLevelProps> = ({
  icon,
  title,
  subtitle,
  value,
  onSelect,
  color = '#667eea'
}) => {
  const handlePress = () => {
    Alert.alert(
      title,
      'Choose notification level:',
      [
        {
          text: 'All Notifications',
          onPress: () => onSelect('all'),
          style: value === 'all' ? 'destructive' : 'default',
        },
        {
          text: 'Important Only',
          onPress: () => onSelect('important'),
          style: value === 'important' ? 'destructive' : 'default',
        },
        {
          text: 'None',
          onPress: () => onSelect('none'),
          style: value === 'none' ? 'destructive' : 'default',
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getLevelText = () => {
    switch (value) {
      case 'all': return 'All notifications';
      case 'important': return 'Important only';
      case 'none': return 'Disabled';
      default: return 'Not set';
    }
  };

  const getLevelColor = () => {
    switch (value) {
      case 'all': return '#27ae60';
      case 'important': return '#f39c12';
      case 'none': return '#e74c3c';
      default: return '#999';
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.levelRow}>
      <View style={[styles.levelIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.levelContent}>
        <Text style={styles.levelTitle}>{title}</Text>
        <Text style={styles.levelSubtitle}>{subtitle}</Text>
        <Text style={[styles.levelValue, { color: getLevelColor() }]}>
          {getLevelText()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );
};

const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await profileService.getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    try {
      if (!settings) return;
      
      setSaving(true);
      const updatedSettings = { ...settings, [key]: value };
      const result = await profileService.updateNotificationSettings(updatedSettings);
      setSettings(result);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHours = () => {
    if (!settings) return;

    Alert.alert(
      'Quiet Hours',
      'During quiet hours, you will only receive urgent notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          onPress: () => updateSetting('quiet_hours_start', null),
          style: 'destructive',
        },
        {
          text: 'Set Hours',
          onPress: () => {
            // For now, set default quiet hours
            updateSetting('quiet_hours_start', '22:00');
            updateSetting('quiet_hours_end', '07:00');
            Alert.alert('Success', 'Quiet hours set to 10:00 PM - 7:00 AM');
          },
        },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Notifications',
      'Reset all notification settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const defaultSettings: Partial<NotificationSettings> = {
                push_notifications: true,
                email_notifications: true,
                task_reminders: 'all',
                document_updates: 'important',
                ai_suggestions: 'all',
                marketing_emails: false,
                security_alerts: true,
                weekly_digest: true,
                quiet_hours_start: '22:00',
                quiet_hours_end: '07:00',
                weekend_notifications: false,
              };
              
              const result = await profileService.updateNotificationSettings(defaultSettings);
              setSettings(result);
              Alert.alert('Success', 'Notification settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Control how Betty keeps you informed</Text>
        </Animatable.View>

        {/* Main Notification Toggles */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionContent}>
            <NotificationToggle
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive notifications on your device"
              value={settings.push_notifications}
              onToggle={(value) => updateSetting('push_notifications', value)}
              color="#667eea"
            />
            <NotificationToggle
              icon="mail"
              title="Email Notifications"
              subtitle="Receive updates via email"
              value={settings.email_notifications}
              onToggle={(value) => updateSetting('email_notifications', value)}
              color="#27ae60"
            />
            <NotificationToggle
              icon="shield-checkmark"
              title="Security Alerts"
              subtitle="Important account security notifications"
              value={settings.security_alerts}
              onToggle={(value) => updateSetting('security_alerts', value)}
              color="#e74c3c"
            />
          </View>
        </Animatable.View>

        {/* Notification Levels */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Levels</Text>
          <View style={styles.sectionContent}>
            <NotificationLevel
              icon="checkmark-circle"
              title="Task Reminders"
              subtitle="Notifications about your tasks and deadlines"
              value={settings.task_reminders}
              onSelect={(value) => updateSetting('task_reminders', value)}
              color="#27ae60"
            />
            <NotificationLevel
              icon="document-text"
              title="Document Updates"
              subtitle="When documents are created or modified"
              value={settings.document_updates}
              onSelect={(value) => updateSetting('document_updates', value)}
              color="#3498db"
            />
            <NotificationLevel
              icon="bulb"
              title="AI Suggestions"
              subtitle="Smart suggestions from Betty"
              value={settings.ai_suggestions}
              onSelect={(value) => updateSetting('ai_suggestions', value)}
              color="#9b59b6"
            />
          </View>
        </Animatable.View>

        {/* Timing & Schedule */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
          <Text style={styles.sectionTitle}>Timing & Schedule</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity onPress={handleQuietHours} style={styles.quietHoursRow}>
              <View style={[styles.quietIcon, { backgroundColor: '#34495e20' }]}>
                <Ionicons name="moon" size={20} color="#34495e" />
              </View>
              <View style={styles.quietContent}>
                <Text style={styles.quietTitle}>Quiet Hours</Text>
                <Text style={styles.quietSubtitle}>
                  {settings.quiet_hours_start && settings.quiet_hours_end
                    ? `${settings.quiet_hours_start} - ${settings.quiet_hours_end}`
                    : 'Not configured'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
            
            <NotificationToggle
              icon="calendar"
              title="Weekend Notifications"
              subtitle="Receive notifications on weekends"
              value={settings.weekend_notifications}
              onToggle={(value) => updateSetting('weekend_notifications', value)}
              color="#f39c12"
            />
            <NotificationToggle
              icon="stats-chart"
              title="Weekly Digest"
              subtitle="Weekly summary of your activity"
              value={settings.weekly_digest}
              onToggle={(value) => updateSetting('weekly_digest', value)}
              color="#9b59b6"
            />
          </View>
        </Animatable.View>

        {/* Marketing */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing</Text>
          <View style={styles.sectionContent}>
            <NotificationToggle
              icon="megaphone"
              title="Marketing Emails"
              subtitle="Product updates and promotions"
              value={settings.marketing_emails}
              onToggle={(value) => updateSetting('marketing_emails', value)}
              color="#e67e22"
            />
          </View>
        </Animatable.View>

        {/* Reset Button */}
        <Animatable.View animation="fadeInUp" delay={1000} style={styles.resetSection}>
          <TouchableOpacity 
            onPress={resetToDefaults} 
            style={styles.resetButton}
            disabled={saving}
          >
            <Ionicons name="refresh" size={20} color="#667eea" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Save Indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText}>Saving changes...</Text>
          </View>
        )}
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
  toggleRow: {
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  levelSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  levelValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quietIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quietContent: {
    flex: 1,
  },
  quietTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quietSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resetSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  resetButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  savingText: {
    color: '#667eea',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default NotificationSettingsScreen;