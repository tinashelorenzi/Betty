// src/screens/ChatScreen.tsx - FIXED VERSION
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

import chatService, { MessageHistory, ChatMessage } from '../services/chatService';
import { RootStackParamList } from '../navigation/AppNavigator';

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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversationId && !isNew) {
      loadMessages();
    }
    // Set header title
    navigation.setOptions({
      title: title || 'Chat with Betty',
    });
  }, [conversationId, isNew, title, navigation]);

  const loadMessages = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const messageHistory = await chatService.getConversationMessages(conversationId);
      setMessages(messageHistory);
      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);

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
      const chatMessage: ChatMessage = {
        content: userMessage,
        message_type: 'text',
      };

      // Send message to AI
      const response = await chatService.sendMessage(chatMessage, conversationId);
      
      // If this is a new conversation, we might get a conversation ID back
      if (!conversationId && response) {
        // The backend should handle creating the conversation automatically
        // We'll get the conversation ID from subsequent API calls or context
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
      };

      setMessages(prev => [...prev, aiMessage]);

      // Show notifications for special actions
      if (response.document_created) {
        Alert.alert(
          'Document Created',
          `Betty has created a new document: "${response.document_title}"`,
          [{ text: 'OK' }]
        );
      }

      if (response.task_created) {
        Alert.alert(
          'Task Created',
          'Betty has created a new task for you.',
          [{ text: 'OK' }]
        );
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the temporary user message and show error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      
      Alert.alert(
        'Error',
        'Failed to send message. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setInputText(userMessage);
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            
            {item.processing_time && (
              <Text style={styles.processingTime}>
              <Text>• {item.processing_time.toFixed(1)}s</Text>
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
        >
          <Text style={styles.suggestionText}>Create an invoice template</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.suggestionChip}
          onPress={() => setInputText("Help me plan my day")}
        >
          <Text style={styles.suggestionText}>Help me plan my day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.suggestionChip}
          onPress={() => setInputText("What can you help me with?")}
        >
          <Text style={styles.suggestionText}>What can you help me with?</Text>
        </TouchableOpacity>
      </View>
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
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messagesContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={4000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
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
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
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
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    maxHeight: 100,
    marginRight: 8,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});

export default ChatScreen;