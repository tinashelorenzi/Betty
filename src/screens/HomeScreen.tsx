// src/screens/HomeScreen.tsx - Updated with chat navigation
import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import chatService, { ChatStats } from '../services/chatService';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

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

interface HomeScreenProps {
  // Remove navigation prop since we'll use useNavigation hook
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [chatStats, setChatStats] = useState<ChatStats>({
    total_conversations: 0,
    total_messages: 0,
    messages_today: 0,
    avg_messages_per_conversation: 0
  });

  useEffect(() => {
    loadChatStats();
  }, []);

  const loadChatStats = async () => {
    try {
      const stats = await chatService.getChatStats();
      setChatStats(stats);
    } catch (error) {
      console.error('Error loading chat stats:', error);
    }
  };

  const startNewChat = async () => {
    try {
      // Create a new conversation and navigate to it
      const conversationId = await chatService.createNewConversation();
      navigation.navigate('Chat', { 
        conversationId, 
        isNew: true,
        title: 'New Chat'
      });
    } catch (error) {
      console.error('Error starting new chat:', error);
      // Fallback - navigate to chat without conversation ID
      navigation.navigate('Chat', { isNew: true });
    }
  };

  const viewConversations = () => {
    navigation.navigate('Conversations');
  };

  const quickActions = [
    {
      icon: 'chatbubble-ellipses' as keyof typeof Ionicons.glyphMap,
      title: 'Start Chat',
      subtitle: 'Talk to Betty AI',
      gradient: ['#667eea', '#764ba2'] as [string, string],
      onPress: startNewChat,
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
      type: 'Chat',
      title: chatStats.total_conversations > 0 ? `${chatStats.total_conversations} conversations` : 'No conversations yet',
      time: chatStats.messages_today > 0 ? `${chatStats.messages_today} messages today` : 'Start chatting',
      icon: 'chatbubble' as keyof typeof Ionicons.glyphMap,
    },
    {
      type: 'Document',
      title: 'Q4 Sales Report Analysis',
      time: '2h ago',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
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

        {/* Chat Quick Access */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.chatQuickAccess}>
          <Text style={styles.sectionTitle}>Betty AI Assistant</Text>
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.primaryChatButton} onPress={startNewChat}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.primaryChatGradient}
              >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.primaryChatText}>New Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {chatStats.total_conversations > 0 && (
              <TouchableOpacity style={styles.secondaryChatButton} onPress={viewConversations}>
                <Ionicons name="chatbubbles-outline" size={20} color="#667eea" />
                <Text style={styles.secondaryChatText}>
                  {chatStats.total_conversations} Conversations
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {chatStats.messages_today > 0 && (
            <View style={styles.chatStats}>
              <Text style={styles.chatStatsText}>
                {chatStats.messages_today} messages sent today
              </Text>
            </View>
          )}
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <QuickAction
                key={action.title}
                {...action}
                delay={600 + index * 100}
              />
            ))}
          </View>
        </Animatable.View>

        {/* Recent Activity */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentActivities}>
            {recentActivities.map((activity, index) => (
              <RecentActivity key={index} {...activity} />
            ))}
          </View>
        </Animatable.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  
  // Chat Quick Access Styles
  chatQuickAccess: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryChatButton: {
    flex: 1,
    marginRight: 12,
  },
  primaryChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  primaryChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryChatText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  chatStats: {
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chatStatsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },

  // Quick Actions Styles
  quickActions: {
    gap: 12,
  },
  quickActionWrapper: {
    width: '100%',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },

  // Recent Activities Styles
  recentActivities: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  recentType: {
    fontSize: 12,
    color: '#64748b',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;