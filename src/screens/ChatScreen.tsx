// src/screens/ChatScreen.tsx - WITH AI TYPING ANIMATION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import chatService, { MessageHistory, ChatMessage, ChatResponse } from '../services/chatService';
import { RootStackParamList } from '../navigation/AppNavigator';
import TypingIndicator, { PulseTypingIndicator } from '../components/TypingIndicator';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

interface ChatScreenParams {
  conversationId?: string;
  title?: string;
  isNew?: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { conversationId: initialConversationId, title, isNew } = (route.params || {}) as ChatScreenParams;
  
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [connectionError, setConnectionError] = useState(false);
  const [aiTypingMessage, setAiTypingMessage] = useState<string>('Betty is typing');
  const flatListRef = useRef<FlatList>(null);

  // Random typing messages for variety
  const typingMessages = [
    'Betty is thinking',
    'Betty is crafting a response',
    'Betty is analyzing',
    'Betty is working on it',
    'Betty is typing',
    'Betty is processing',
  ];

  const getRandomTypingMessage = () => {
    return typingMessages[Math.floor(Math.random() * typingMessages.length)];
  };

  useEffect(() => {
    if (conversationId && !isNew) {
      loadMessages();
    }
    
    navigation.setOptions({
      title: title || (conversationId ? 'Chat with Betty' : 'New Chat'),
      headerRight: () => (
        <View style={styles.headerRight}>
          {conversationId && (
            <View style={styles.conversationIndicator}>
              <View style={[
                styles.activeIndicator, 
                isSending && styles.processingIndicator
              ]} />
            </View>
          )}
        </View>
      ),
    });
  }, [conversationId, isNew, title, navigation, isSending]);

  // Auto-scroll to bottom when AI starts typing
  useEffect(() => {
    if (isSending) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isSending]);

  const loadMessages = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    setConnectionError(false);
    
    try {
      console.log(`📥 Loading messages for conversation: ${conversationId}`);
      const messageHistory = await chatService.getConversationMessages(conversationId);
      
      setMessages(messageHistory);
      console.log(`✅ Loaded ${messageHistory.length} messages`);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setConnectionError(true);
      
      Alert.alert(
        'Loading Error', 
        'Failed to load conversation history. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadMessages() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);
    setConnectionError(false);

    // Set random typing message
    setAiTypingMessage(getRandomTypingMessage());

    // Add user message to UI immediately
    const tempUserMessage: MessageHistory = {
      id: Date.now().toString(),
      user_id: 'current_user',
      role: 'user',
      content: userMessage,
      message_type: 'text',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      let response: ChatResponse;
      let currentConversationId = conversationId;

      if (!conversationId) {
        console.log('🔄 Starting new conversation...');
        setAiTypingMessage('Betty is starting a new conversation');
        
        const result = await chatService.startNewConversation(userMessage);
        currentConversationId = result.conversationId;
        response = result.response;
        
        setConversationId(currentConversationId);
        navigation.setOptions({
          title: 'Chat with Betty',
        });
        
        console.log(`✅ New conversation started: ${currentConversationId}`);
      } else {
        console.log(`🔄 Sending to existing conversation: ${currentConversationId}`);
        
        // Update typing message based on content
        if (userMessage.toLowerCase().includes('create') || userMessage.toLowerCase().includes('make')) {
          setAiTypingMessage('Betty is creating something for you');
        } else if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('advice')) {
          setAiTypingMessage('Betty is thinking of the best advice');
        } else if (userMessage.toLowerCase().includes('plan') || userMessage.toLowerCase().includes('schedule')) {
          setAiTypingMessage('Betty is organizing your plans');
        } else {
          setAiTypingMessage(getRandomTypingMessage());
        }
        
        const chatMessage: ChatMessage = {
          content: userMessage,
          message_type: 'text',
        };

        response = await chatService.sendMessage(chatMessage, currentConversationId);
      }

      // Add AI response to UI
      const aiMessage: MessageHistory = {
        id: (Date.now() + 1).toString(),
        user_id: 'current_user',
        role: 'assistant',
        content: response.content,
        message_type: response.message_type,
        timestamp: new Date().toISOString(),
        processing_time: response.processing_time,
        conversation_id: currentConversationId,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Enhanced notifications for special actions
      if (response.document_created) {
        Alert.alert(
          '📄 Document Created',
          `Betty has created a new document: "${response.document_title}"`,
          [
            { text: 'View Later', style: 'cancel' },
            { 
              text: 'View Now', 
              onPress: () => navigation.navigate('Documents' as never)
            }
          ]
        );
      }

      if (response.task_created) {
        Alert.alert(
          '✅ Task Created',
          'Betty has created a new task for you.',
          [
            { text: 'View Later', style: 'cancel' },
            { 
              text: 'View Now', 
              onPress: () => navigation.navigate('Planner' as never)
            }
          ]
        );
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      setConnectionError(true);
      
      let errorTitle = 'Message Failed';
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (error.message.includes('Server error')) {
        errorTitle = 'Service Unavailable';
        errorMessage = 'The AI assistant is temporarily unavailable. Please try again in a moment.';
      } else if (error.message.includes('Authentication failed')) {
        errorTitle = 'Session Expired';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('connection')) {
        errorTitle = 'Connection Error';
        errorMessage = 'Please check your internet connection and try again.';
      } else if (error.message.includes('conversation')) {
        errorTitle = 'Conversation Error';
        errorMessage = 'There was an issue with the conversation. Try starting a new one.';
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => {
              setInputText(userMessage);
              setConnectionError(false);
            },
          },
          {
            text: 'New Chat',
            onPress: () => {
              setConversationId(undefined);
              setMessages([]);
              navigation.setOptions({ title: 'New Chat' });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item, index }: { item: MessageHistory; index: number }) => {
    const isUser = item.role === 'user';
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        isLastMessage && styles.lastMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.aiMessage
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.content}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.aiMessageTime
            ]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            
            {item.processing_time && item.processing_time > 0 && (
              <Text style={styles.processingTime}>
                • {item.processing_time.toFixed(1)}s
              </Text>
            )}
          </View>
        </View>
        
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color="#667eea" />
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <TypingIndicator visible={isSending} message={aiTypingMessage} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="chatbubble-ellipses" size={48} color="#667eea" />
      </View>
      <Text style={styles.welcomeTitle}>Hey there! 👋</Text>
      <Text style={styles.welcomeSubtitle}>
        I'm Betty, your AI office assistant. How can I help you today?
      </Text>
      
      <View style={styles.suggestionsContainer}>
        <TouchableOpacity 
          style={styles.suggestionChip}
          onPress={() => setInputText("Create an invoice template")}
          disabled={isSending}
        >
          <Ionicons name="document-text" size={16} color="#667eea" style={styles.suggestionIcon} />
          <Text style={styles.suggestionText}>Create an invoice template</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.suggestionChip}
          onPress={() => setInputText("Help me plan my day")}
          disabled={isSending}
        >
          <Ionicons name="calendar" size={16} color="#667eea" style={styles.suggestionIcon} />
          <Text style={styles.suggestionText}>Help me plan my day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.suggestionChip}
          onPress={() => setInputText("What can you help me with?")}
          disabled={isSending}
        >
          <Ionicons name="help-circle" size={16} color="#667eea" style={styles.suggestionIcon} />
          <Text style={styles.suggestionText}>What can you help me with?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectionError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorMessage}>
        Unable to connect to Betty. Please check your internet connection.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
        <Text style={styles.retryButtonText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Messages Area */}
        <View style={styles.messagesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          ) : connectionError && messages.length === 0 ? (
            renderConnectionError()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messagesContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              ListFooterComponent={renderTypingIndicator}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={21}
              removeClippedSubviews={true}
            />
          )}
        </View>

        {/* Connection Status Bar */}
        {connectionError && messages.length > 0 && (
          <View style={styles.connectionBar}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.connectionBarText}>Connection issues detected</Text>
            <TouchableOpacity onPress={() => setConnectionError(false)}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                connectionError && styles.textInputError
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                conversationId 
                  ? "Ask Betty anything..." 
                  : "Start a conversation with Betty..."
              }
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={4000}
              returnKeyType="send"
              onSubmitEditing={Platform.OS === 'ios' ? sendMessage : undefined}
              blurOnSubmit={false}
              editable={!isSending}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <View style={styles.sendingState}>
                  <Ionicons name="hourglass" size={18} color="#94a3b8" />
                </View>
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? "#fff" : "#94a3b8"} 
                />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Character Counter */}
          <View style={styles.inputFooter}>
            {isSending && (
              <Text style={styles.sendingText}>
                {aiTypingMessage}...
              </Text>
            )}
            <Text style={[
              styles.characterCount,
              inputText.length > 3800 && styles.characterCountWarning,
              inputText.length >= 4000 && styles.characterCountError
            ]}>
              {inputText.length}/4000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  processingIndicator: {
    backgroundColor: '#f59e0b',
  },
  messagesContainer: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionBar: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
  },
  connectionBarText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
  },
  messageContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  lastMessage: {
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 6,
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#1e293b',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiMessageTime: {
    color: '#94a3b8',
  },
  processingTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  suggestionIcon: {
    opacity: 0.7,
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    maxHeight: 100,
    marginRight: 8,
    paddingVertical: 8,
  },
  textInputError: {
    borderColor: '#ef4444',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  sendingText: {
    fontSize: 12,
    color: '#667eea',
    fontStyle: 'italic',
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  characterCountWarning: {
    color: '#f59e0b',
  },
  characterCountError: {
    color: '#ef4444',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    elevation: 0,
    shadowOpacity: 0,
  },
  sendingState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;