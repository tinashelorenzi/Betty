// src/types/chat.ts - Complete Chat Type Definitions

// Enums matching your FastAPI backend
export enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant", 
    SYSTEM = "system"
  }
  
  export enum MessageType {
    TEXT = "text",
    DOCUMENT_CREATION = "document_creation",
    DOCUMENT_FILE = "document_file", // New type for file-like messages
    TASK_CREATION = "task_creation",
    CALENDAR_EVENT = "calendar_event",
    FILE_ANALYSIS = "file_analysis"
  }
  
  // Core message interfaces
  export interface ChatMessage {
    content: string;
    message_type?: MessageType;
    context?: Record<string, any>;
    attachments?: string[];
    conversation_id?: string;
  }
  
  export interface ChatResponse {
    content: string;
    message_type: MessageType;
    document_created: boolean;
    document_title?: string;
    document_content?: string;
    document_type?: string;
    document_id?: string;
    document_format?: 'markdown' | 'text'; // Add format field
    task_created: boolean;
    task_data?: Record<string, any>;
    calendar_event_created?: boolean;
    event_data?: Record<string, any>;
    analysis_data?: Record<string, any>;
    processing_time?: number;
    tokens_used?: number;
    confidence_score?: number;
    conversation_id?: string;
  }
  
  export interface MessageHistory {
    id: string;
    user_id: string;
    role: MessageRole | 'user' | 'assistant' | 'system'; // Allow both enum and string
    content: string;
    message_type: MessageType | string; // Allow both enum and string
    context?: Record<string, any>;
    timestamp: string;
    processing_time?: number;
    tokens_used?: number;
    conversation_id?: string;
    
    // Document-specific fields (for document file messages)
    document_title?: string;
    document_content?: string;
    document_format?: 'markdown' | 'text';
    document_id?: string;
    document_type?: string;
  }
  
  // Extended interface for document file messages
  export interface DocumentMessage extends MessageHistory {
    message_type: MessageType.DOCUMENT_FILE;
    document_title: string;
    document_content: string;
    document_format: 'markdown' | 'text';
    document_id?: string;
  }
  
  export interface Conversation {
    id: string;
    conversation_id: string;
    user_id: string;
    title: string;
    message_count: number;
    last_message: string;
    last_message_at: string;
    created_at: string;
    updated_at: string;
    status?: string;
  }
  
  export interface ConversationSummary {
    conversation: Conversation;
    recent_messages: MessageHistory[];
  }
  
  export interface ChatStats {
    total_conversations: number;
    total_messages: number;
    messages_today: number;
    avg_messages_per_conversation: number;
    last_chat_at?: string;
  }
  
  export interface AIContext {
    user_location: string;
    user_timezone: string;
    current_time: string;
    user_preferences: Record<string, any>;
    conversation_history: MessageHistory[];
    recent_documents: string[];
    recent_tasks: string[];
  }
  
  export interface ChatSettings {
    user_id: string;
    ai_personality: string;
    response_length: string;
    auto_create_documents: boolean;
    auto_create_tasks: boolean;
    language: string;
    max_context_messages: number;
  }