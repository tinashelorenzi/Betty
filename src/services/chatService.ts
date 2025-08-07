// src/services/chatService.ts - Fixed version with proper conversation handling

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Enhanced types
export interface ChatMessage {
  content: string;
  message_type?: 'text' | 'document_creation' | 'task_creation';
  context?: Record<string, any>;
  attachments?: string[];
  conversation_id?: string; // Make it optional in the message body
}

export interface ChatResponse {
  content: string;
  message_type: string;
  document_created: boolean;
  document_title?: string;
  document_content?: string;
  task_created: boolean;
  task_data?: Record<string, any>;
  processing_time?: number;
  tokens_used?: number;
  conversation_id?: string; // Add conversation_id to response
}

export interface MessageHistory {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string;
  timestamp: string;
  processing_time?: number;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  conversation_id: string;
  title: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatStats {
  total_conversations: number;
  total_messages: number;
  messages_today: number;
  avg_messages_per_conversation: number;
}

class ChatService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 Adding auth token to chat request');
          }
        } catch (error) {
          console.error('Error getting auth token for chat request:', error);
        }
        return config;
      },
      (error) => {
        console.error('❌ Chat request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ Chat API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ Chat API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // FIXED: Send message with proper conversation handling
  async sendMessage(message: ChatMessage, conversationId?: string): Promise<ChatResponse> {
    try {
      // Method 1: Use conversation_id as query parameter (matches backend expectation)
      const url = conversationId 
        ? `/chat/message?conversation_id=${conversationId}`
        : '/chat/message';
      
      // Don't include conversation_id in the body if using query param
      const messageBody = { ...message };
      if (conversationId) {
        delete messageBody.conversation_id;
      }
      
      console.log(`🔄 Sending message to: ${url}`);
      console.log(`📝 Message content: ${message.content.substring(0, 50)}...`);
      
      const response = await this.api.post(url, messageBody);
      
      console.log('✅ Message sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Enhanced error handling
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        if (error.response.status === 500) {
          throw new Error('Server error occurred. Please try again.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.status === 422) {
          throw new Error('Invalid message format. Please check your input.');
        }
      }
      
      throw new Error('Failed to send message. Please check your connection.');
    }
  }

  // Create new conversation
  async createNewConversation(): Promise<string> {
    try {
      console.log('🔄 Creating new conversation...');
      
      const response = await this.api.post('/chat/conversation/new', {});
      
      const conversationId = response.data.conversation_id;
      console.log(`✅ New conversation created: ${conversationId}`);
      
      return conversationId;
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw new Error('Failed to create conversation');
    }
  }

  // Enhanced conversation flow
  async startNewConversation(firstMessage: string): Promise<{ 
    conversationId: string, 
    response: ChatResponse 
  }> {
    try {
      // Step 1: Create conversation
      const conversationId = await this.createNewConversation();
      
      // Step 2: Send first message
      const message: ChatMessage = {
        content: firstMessage,
        message_type: 'text',
      };
      
      const response = await this.sendMessage(message, conversationId);
      
      return { conversationId, response };
      
    } catch (error) {
      console.error('❌ Error starting new conversation:', error);
      throw error;
    }
  }

  // Get user's conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await this.api.get('/chat/conversations');
      return response.data.conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string): Promise<MessageHistory[]> {
    try {
      const response = await this.api.get(`/chat/conversation/${conversationId}`);
      return response.data.messages;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw new Error('Failed to fetch conversation messages');
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await this.api.delete(`/chat/conversation/${conversationId}`);
      return response.data.success;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  // Get chat history (legacy endpoint)
  async getChatHistory(limit: number = 50): Promise<MessageHistory[]> {
    try {
      const response = await this.api.get(`/chat/history?limit=${limit}`);
      return response.data.messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  // Get chat statistics
  async getChatStats(): Promise<ChatStats> {
    try {
      const response = await this.api.get('/user/stats/chat');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      return {
        total_conversations: 0,
        total_messages: 0,
        messages_today: 0,
        avg_messages_per_conversation: 0
      };
    }
  }
}

export default new ChatService();