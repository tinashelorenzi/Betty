// src/services/chatService.ts - Fixed with proper authentication
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types matching your backend models
export interface ChatMessage {
  content: string;
  message_type?: 'text' | 'document_creation' | 'task_creation';
  context?: Record<string, any>;
  attachments?: string[];
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
    
    // Create axios instance with same pattern as your authService
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token (same as your other services)
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

    // Add response interceptor for error handling
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

  // Send a message to AI
  async sendMessage(message: ChatMessage, conversationId?: string): Promise<ChatResponse> {
    try {
      const url = conversationId 
        ? `/chat/message?conversation_id=${conversationId}`
        : '/chat/message';
      
      const response = await this.api.post(url, message);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
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

  // Create new conversation
  async createNewConversation(): Promise<string> {
    try {
      const response = await this.api.post('/chat/conversation/new', {});
      return response.data.conversation_id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
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

  // Get chat history (legacy endpoint for backward compatibility)
  async getChatHistory(limit: number = 50): Promise<MessageHistory[]> {
    try {
      const response = await this.api.get(`/chat/history?limit=${limit}`);
      return response.data.messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  // Get chat statistics for profile
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