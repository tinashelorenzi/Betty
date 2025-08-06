// src/screens/HomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradient: [string, string];
  onPress: () => void;
  delay?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  icon, 
  title, 
  subtitle, 
  gradient, 
  onPress,
  delay = 0
}) => (
  <Animatable.View 
    animation="fadeInUp"
    delay={delay}
    style={styles.quickActionWrapper}
  >
    <TouchableOpacity onPress={onPress} style={styles.quickAction}>
      <LinearGradient colors={gradient} style={styles.quickActionGradient}>
        <Ionicons name={icon} size={32} color="white" />
      </LinearGradient>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  </Animatable.View>
);

interface RecentActivityProps {
  type: string;
  title: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ type, title, time, icon }) => (
  <TouchableOpacity style={styles.recentItem}>
    <View style={styles.recentIcon}>
      <Ionicons name={icon} size={20} color="#667eea" />
    </View>
    <View style={styles.recentContent}>
      <Text style={styles.recentTitle}>{title}</Text>
      <Text style={styles.recentType}>{type} • {time}</Text>
    </View>
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: 'chatbubble-ellipses' as keyof typeof Ionicons.glyphMap,
      title: 'Start Chat',
      subtitle: 'Talk to Betty AI',
      gradient: ['#667eea', '#764ba2'] as [string, string],
      onPress: () => console.log('Navigate to chat'),
    },
    {
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      title: 'New Document',
      subtitle: 'Create & analyze',
      gradient: ['#f093fb', '#f5576c'] as [string, string],
      onPress: () => console.log('Navigate to documents'),
    },
    {
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      title: 'Plan Tasks',
      subtitle: 'Organize your day',
      gradient: ['#4facfe', '#00f2fe'] as [string, string],
      onPress: () => console.log('Navigate to planner'),
    },
    {
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      title: 'Analytics',
      subtitle: 'View insights',
      gradient: ['#43e97b', '#38f9d7'] as [string, string],
      onPress: () => console.log('View analytics'),
    },
  ];

  const recentActivities = [
    {
      type: 'Document',
      title: 'Q4 Sales Report Analysis',
      time: '2h ago',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
    },
    {
      type: 'Chat',
      title: 'Marketing Strategy Discussion',
      time: '4h ago',
      icon: 'chatbubble' as keyof typeof Ionicons.glyphMap,
    },
    {
      type: 'Task',
      title: 'Meeting with Client ABC',
      time: '1d ago',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.first_name || 'User'}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.statsContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>47</Text>
                <Text style={styles.statLabel}>Tasks Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8.5h</Text>
                <Text style={styles.statLabel}>Time Saved</Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Animatable.Text animation="fadeInLeft" delay={300} style={styles.sectionTitle}>
            Quick Actions
          </Animatable.Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickAction
                key={index}
                {...action}
                delay={400 + index * 100}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Animatable.Text animation="fadeInLeft" delay={800} style={styles.sectionTitle}>
            Recent Activity
          </Animatable.Text>
          <Animatable.View animation="fadeInUp" delay={900} style={styles.recentContainer}>
            {recentActivities.map((activity, index) => (
              <RecentActivity key={index} {...activity} />
            ))}
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
              <Ionicons name="chevron-forward" size={16} color="#667eea" />
            </TouchableOpacity>
          </Animatable.View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsGrid: {
    paddingHorizontal: 20,
  },
  quickActionWrapper: {
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  recentContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  recentType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  viewAllText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '500',
    marginRight: 4,
  },
});

export default HomeScreen;