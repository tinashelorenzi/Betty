// src/screens/AssistantScreen.tsx
import React from 'react';
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

const { width } = Dimensions.get('window');

interface SuggestionCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
  delay?: number;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  title,
  description,
  icon,
  gradient,
  onPress,
  delay = 0,
}) => (
  <Animatable.View animation="fadeInUp" delay={delay} style={styles.cardWrapper}>
    <TouchableOpacity onPress={onPress} style={styles.suggestionCard}>
      <LinearGradient colors={gradient} style={styles.cardGradient}>
        <View style={styles.cardContent}>
          <View style={styles.cardIcon}>
            <Ionicons name={icon} size={28} color="white" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </Animatable.View>
);

const AssistantScreen: React.FC = () => {
  const suggestions = [
    {
      title: 'Ask me anything',
      description: 'I can help with business questions, analysis, and more',
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      gradient: ['#667eea', '#764ba2'] as [string, string],
      onPress: () => console.log('Start general chat'),
    },
    {
      title: 'Analyze documents',
      description: 'Upload and get insights from your files',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      gradient: ['#f093fb', '#f5576c'] as [string, string],
      onPress: () => console.log('Document analysis'),
    },
    {
      title: 'Plan my day',
      description: 'Help organize tasks and schedule',
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      gradient: ['#4facfe', '#00f2fe'] as [string, string],
      onPress: () => console.log('Day planning'),
    },
    {
      title: 'Create content',
      description: 'Generate emails, reports, and presentations',
      icon: 'create' as keyof typeof Ionicons.glyphMap,
      gradient: ['#43e97b', '#38f9d7'] as [string, string],
      onPress: () => console.log('Content creation'),
    },
  ];

  const quickPrompts = [
    'Summarize my recent documents',
    'What tasks do I have today?',
    'Help me write an email',
    'Analyze my productivity trends',
    'Create a meeting agenda',
    'Draft a project proposal',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.headerContent}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.bettyAvatar}>
              <Ionicons name="sparkles" size={32} color="white" />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Betty AI</Text>
              <Text style={styles.headerSubtitle}>Your intelligent assistant</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Welcome Message */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Hello! I'm Betty, your all-in-one business assistant. Ask me anything business related. 
            I can create documents, do analysis, help with tasks, manage your daily routine and much more.
          </Text>
        </Animatable.View>

        {/* Suggestion Cards */}
        <View style={styles.section}>
          <Animatable.Text animation="fadeInLeft" delay={300} style={styles.sectionTitle}>
            What can I help you with?
          </Animatable.Text>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                {...suggestion}
                delay={400 + index * 100}
              />
            ))}
          </View>
        </View>

        {/* Quick Prompts */}
        <View style={styles.section}>
          <Animatable.Text animation="fadeInLeft" delay={800} style={styles.sectionTitle}>
            Quick Prompts
          </Animatable.Text>
          <Animatable.View animation="fadeInUp" delay={900} style={styles.promptsContainer}>
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptButton}
                onPress={() => console.log('Quick prompt:', prompt)}
              >
                <Text style={styles.promptText}>"{prompt}"</Text>
                <Ionicons name="send" size={16} color="#667eea" />
              </TouchableOpacity>
            ))}
          </Animatable.View>
        </View>

        {/* Chat Button */}
        <Animatable.View animation="fadeInUp" delay={1200} style={styles.chatButtonContainer}>
          <TouchableOpacity style={styles.startChatButton}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.chatButtonGradient}>
              <Ionicons name="chatbubble-ellipses" size={24} color="white" />
              <Text style={styles.chatButtonText}>Start New Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bettyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  welcomeContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'center',
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
  suggestionsGrid: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  suggestionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  promptsContainer: {
    paddingHorizontal: 20,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  promptText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontStyle: 'italic',
  },
  chatButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startChatButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default AssistantScreen;