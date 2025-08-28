// src/screens/HomeScreen.tsx - Updated with chat navigation and error boundary protection
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import chatService, { ChatStats } from '../services/chatService';
import GoogleConnectButton from '../components/GoogleConnectButton';
import ErrorBoundary from '../components/ErrorBoundary';
import { useNativeGoogleAuth } from '../hooks/useNativeGoogleAuth';

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

// Separate component for Google-related content with error boundary
const GoogleIntegrationSection: React.FC = () => {
  const [initError, setInitError] = useState<string | null>(null);
  
  try {
    const { isConnected, isLoading, userInfo, connectGoogle } = useNativeGoogleAuth();
    
    useEffect(() => {
      // Log the initialization
      console.log('GoogleIntegrationSection mounted', {
        isConnected,
        isLoading,
        hasUserInfo: !!userInfo
      });
    }, [isConnected, isLoading, userInfo]);

    if (initError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Google services unavailable: {initError}</Text>
        </View>
      );
    }

    return (
      <View style={styles.googleSection}>
        <Text style={styles.sectionTitle}>Google Integration</Text>
        {isLoading ? (
          <Text>Loading Google services...</Text>
        ) : isConnected ? (
          <View>
            <Text style={styles.successText}>✓ Connected to Google</Text>
            {userInfo && <Text>Welcome, {userInfo.name}</Text>}
          </View>
        ) : (
          <Text style={styles.infoText}>Google not connected</Text>
        )}
      </View>
    );
  } catch (error: any) {
    console.error('Error in GoogleIntegrationSection:', error);
    setInitError(error.message);
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Google services failed to initialize</Text>
      </View>
    );
  }
};

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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'chat':
        navigation.navigate('Chat', { isNew: true, title: 'New Chat' });
        break;
      case 'documents':
        navigation.navigate('Documents' as any);
        break;
      case 'planner':
        navigation.navigate('EnhancedPlanner');
        break;
      case 'assistant':
        navigation.navigate('Assistant' as any);
        break;
      default:
        break;
    }
  };

  const welcomeName = user ? 
    user.first_name || user.email || 'User' : 
    'User';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
            <Text style={styles.welcome}>Welcome back, {welcomeName}!</Text>
          </View>
        </View>

        {/* Google Integration Section with Error Boundary */}
        <ErrorBoundary 
          fallback={({ error, resetError }) => (
            <View style={styles.googleErrorContainer}>
              <Text style={styles.errorText}>Google services unavailable</Text>
              <Text style={styles.errorSubtext}>{error.message}</Text>
              <TouchableOpacity style={styles.smallRetryButton} onPress={resetError}>
                <Text style={styles.retryButtonText}>Retry Google Services</Text>
              </TouchableOpacity>
            </View>
          )}
        >
          <GoogleIntegrationSection />
        </ErrorBoundary>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionDescription}>
            Get started with Betty's features
          </Text>
          
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="chatbubble-ellipses"
              title="Chat with Betty"
              subtitle="Ask questions and get help"
              gradient={['#667eea', '#764ba2']}
              onPress={() => handleQuickAction('chat')}
              delay={300}
            />
            
            <QuickAction
              icon="document-text"
              title="Documents"
              subtitle="Create and manage documents"
              gradient={['#f093fb', '#f5576c']}
              onPress={() => handleQuickAction('documents')}
              delay={400}
            />
            
            <QuickAction
              icon="calendar"
              title="Planner"
              subtitle="Organize tasks and schedule"
              gradient={['#4facfe', '#00f2fe']}
              onPress={() => handleQuickAction('planner')}
              delay={500}
            />
            
            <QuickAction
              icon="bulb"
              title="AI Assistant"
              subtitle="Explore AI features"
              gradient={['#43e97b', '#38f9d7']}
              onPress={() => handleQuickAction('assistant')}
              delay={600}
            />
          </View>
        </Animatable.View>

        {/* Chat Stats */}
        <Animatable.View animation="fadeInUp" delay={700} style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="chatbubble" size={24} color="#667eea" />
              <Text style={styles.statValue}>{chatStats.total_conversations}</Text>
              <Text style={styles.statLabel}>Conversations</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="mail" size={24} color="#10b981" />
              <Text style={styles.statValue}>{chatStats.total_messages}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="today" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{chatStats.messages_today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#ef4444" />
              <Text style={styles.statValue}>{chatStats.avg_messages_per_conversation.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg/Conv</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Recent Activity */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.recentActivity}>
            <RecentActivity
              type="Chat"
              title="Asked about project planning"
              time="2 hours ago"
              icon="chatbubble"
            />
            
            <RecentActivity
              type="Document"
              title="Created business proposal"
              time="Yesterday"
              icon="document-text"
            />
            
            <RecentActivity
              type="Task"
              title="Completed weekly review"
              time="2 days ago"
              icon="checkmark-circle"
            />
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionWrapper: {
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  recentActivity: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
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
  googleSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    padding: 15,
    borderRadius: 8,
    borderColor: '#fed7d7',
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  googleErrorContainer: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 6,
    borderColor: '#fed7d7',
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 5,
  },
  errorSubtext: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 10,
  },
  smallRetryButton: {
    backgroundColor: '#3182ce',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;