// src/screens/AssistantScreen.tsx - Updated with chat navigation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import chatService, { Conversation, ChatStats } from '../services/chatService';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface AssistantScreenProps {
  // Remove navigation prop from props since we'll use useNavigation hook
}

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
  onPress,
  delay = 0,
}) => (
  <Animatable.View animation="fadeInUp" delay={delay} style={styles.featureCard}>
    <TouchableOpacity style={styles.featureButton} onPress={onPress}>
      <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  </Animatable.View>
);

const AssistantScreen: React.FC<AssistantScreenProps> = () => {
  const navigation = useNavigation<NavigationProp>();
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats>({
    total_conversations: 0,
    total_messages: 0,
    messages_today: 0,
    avg_messages_per_conversation: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conversations, stats] = await Promise.all([
        chatService.getConversations(),
        chatService.getChatStats()
      ]);
      
      setRecentConversations(conversations.slice(0, 3)); // Show only 3 recent
      setChatStats(stats);
    } catch (error) {
      console.error('Error loading assistant data:', error);
    }
  };

  const startNewChat = async () => {
    try {
      const conversationId = await chatService.createNewConversation();
      navigation.navigate('Chat', { 
        conversationId, 
        isNew: true,
        title: 'New Chat'
      });
    } catch (error) {
      console.error('Error starting new chat:', error);
      navigation.navigate('Chat', { isNew: true });
    }
  };

  const viewAllConversations = () => {
    navigation.navigate('Conversations');
  };

  const openConversation = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.conversation_id,
      title: conversation.title
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const features = [
    {
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      title: 'Document Analysis',
      description: 'Upload and analyze documents with AI',
      color: '#8b5cf6',
      onPress: () => console.log('Navigate to documents'),
    },
    {
      icon: 'create' as keyof typeof Ionicons.glyphMap,
      title: 'Content Creation',
      description: 'Generate emails, reports, and more',
      color: '#06b6d4',
      onPress: () => console.log('Navigate to content creation'),
    },
    {
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      title: 'Smart Planning',
      description: 'AI-powered task and schedule management',
      color: '#10b981',
      onPress: () => console.log('Navigate to planner'),
    },
    {
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      title: 'Data Insights',
      description: 'Get intelligent analysis of your data',
      color: '#f59e0b',
      onPress: () => console.log('Navigate to analytics'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Betty AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              Your intelligent office companion
            </Text>
          </View>
          <View style={styles.aiAvatar}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
            >
              <Ionicons name="sparkles" size={24} color="white" />
            </LinearGradient>
          </View>
        </Animatable.View>

        {/* Chat Section */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Start Chatting</Text>
            {chatStats.total_conversations > 0 && (
              <TouchableOpacity onPress={viewAllConversations}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* New Chat Button */}
          <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.newChatGradient}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.newChatText}>Start New Conversation</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Chat Stats */}
          {chatStats.total_conversations > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{chatStats.total_conversations}</Text>
                <Text style={styles.statLabel}>Conversations</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{chatStats.messages_today}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{chatStats.avg_messages_per_conversation}</Text>
                <Text style={styles.statLabel}>Avg/Chat</Text>
              </View>
            </View>
          )}

          {/* Recent Conversations */}
          {recentConversations.length > 0 && (
            <View style={styles.recentConversations}>
              <Text style={styles.subsectionTitle}>Recent Conversations</Text>
              {recentConversations.map((conversation, index) => (
                <TouchableOpacity
                  key={conversation.conversation_id}
                  style={styles.conversationItem}
                  onPress={() => openConversation(conversation)}
                >
                  <View style={styles.conversationIcon}>
                    <Ionicons name="chatbubble" size={16} color="#667eea" />
                  </View>
                  <View style={styles.conversationContent}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                      {conversation.title}
                    </Text>
                    <Text style={styles.conversationPreview} numberOfLines={1}>
                      {conversation.last_message}
                    </Text>
                  </View>
                  <Text style={styles.conversationTime}>
                    {formatDate(conversation.updated_at)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animatable.View>

        {/* AI Features */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <Text style={styles.sectionDescription}>
            Explore what Betty can help you with
          </Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={600 + index * 100}
              />
            ))}
          </View>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="help-circle-outline" size={20} color="#667eea" />
              <Text style={styles.quickActionText}>How to use Betty</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="settings-outline" size={20} color="#667eea" />
              <Text style={styles.quickActionText}>AI Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="star-outline" size={20} color="#667eea" />
              <Text style={styles.quickActionText}>Rate Betty</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  aiAvatar: {
    marginLeft: 16,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },

  // New Chat Button
  newChatButton: {
    marginBottom: 20,
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  newChatText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },

  // Recent Conversations
  recentConversations: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  conversationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  conversationPreview: {
    fontSize: 12,
    color: '#64748b',
  },
  conversationTime: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCard: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  featureButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 120,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Quick Actions
  quickActions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },

  bottomSpacing: {
    height: 100,
  },
});

export default AssistantScreen;