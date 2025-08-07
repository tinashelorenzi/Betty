// src/services/chatService.ts - Fixed version with proper conversation_id handling

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all types from the centralized types file
import {
  ChatMessage,
  ChatResponse,
  MessageHistory,
  Conversation,
  ChatStats,
  MessageType,
  MessageRole
} from '../types/chat';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

  // Send message with proper conversation handling - FIXED VERSION
  async sendMessage(message: ChatMessage, conversationId?: string): Promise<ChatResponse> {
    try {
      // ✅ FIXED: Always include conversation_id in the message body if provided
      const messageWithConversation: ChatMessage = {
        ...message,
        conversation_id: conversationId || message.conversation_id
      };
      
      console.log(`🔄 Sending message to /chat/message`);
      console.log(`📝 Message content: ${message.content.substring(0, 100)}...`);
      console.log(`💬 Conversation ID: ${messageWithConversation.conversation_id || 'new conversation'}`);
      
      const response = await this.api.post<ChatResponse>('/chat/message', messageWithConversation);
      
      console.log('✅ Message sent successfully');
      console.log(`📄 Document created: ${response.data.document_created}`);
      console.log(`💬 Response conversation ID: ${response.data.conversation_id}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw this.handleError(error);
    }
  }

  // Start new conversation - FIXED VERSION
  async startNewConversation(initialMessage: string): Promise<{ conversationId: string; response: ChatResponse }> {
    try {
      console.log('🔄 Starting new conversation...');
      
      const message: ChatMessage = {
        content: initialMessage,
        message_type: MessageType.TEXT,
        // ✅ FIXED: Don't include conversation_id for new conversations
      };
      
      // Send to new conversation endpoint
      const response = await this.api.post<ChatResponse>('/chat/message', message);
      
      // Extract conversation ID from response
      const conversationId = response.data.conversation_id;
      
      if (!conversationId) {
        throw new Error('No conversation ID received from server');
      }
      
      console.log(`✅ New conversation created: ${conversationId}`);
      
      return { 
        conversationId, 
        response: response.data 
      };
      
    } catch (error) {
      console.error('❌ Error starting new conversation:', error);
      throw this.handleError(error);
    }
  }

  // Continue existing conversation - NEW METHOD
  async continueConversation(
    message: string, 
    conversationId: string
  ): Promise<ChatResponse> {
    try {
      console.log('🔄 Continuing conversation...');
      
      const chatMessage: ChatMessage = {
        content: message,
        message_type: MessageType.TEXT,
        conversation_id: conversationId, // ✅ Include conversation_id
      };
      
      return await this.sendMessage(chatMessage, conversationId);
      
    } catch (error) {
      console.error('❌ Error continuing conversation:', error);
      throw this.handleError(error);
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

  // Error handling
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data as any;
        
        // Handle specific error cases
        switch (statusCode) {
          case 401:
            return new Error('Authentication failed. Please log in again.');
          case 403:
            return new Error('Access denied. Please check your permissions.');
          case 404:
            return new Error('Conversation not found.');
          case 429:
            return new Error('Too many requests. Please try again later.');
          case 500:
            return new Error('Server error. Please try again later.');
          default:
            return new Error(errorData?.detail || errorData?.message || 'An error occurred');
        }
      } else if (axiosError.request) {
        return new Error('Network error. Please check your connection.');
      }
    }
    
    return new Error('An unexpected error occurred');
  }
}

// Export the service instance and types
export default new ChatService();
export type { ChatMessage, ChatResponse, MessageHistory, Conversation, ChatStats };