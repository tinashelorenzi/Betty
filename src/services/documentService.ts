// src/services/documentService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface Document {
  id: string;
  title: string;
  content: string;
  document_type: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  metadata?: Record<string, any>;
  word_count: number;
  version: number;
  google_doc_id?: string;
  google_doc_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DocumentCreate {
  title: string;
  content: string;
  document_type?: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentStats {
  total_documents: number;
  total_words: number;
  average_words_per_doc: number;
  documents_by_type: Record<string, number>;
  documents_by_status: Record<string, number>;
  recent_documents: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
  google_docs_exported: number;
}

class DocumentService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createDocument(document: DocumentCreate): Promise<Document> {
    return this.makeRequest('/documents/', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async getUserDocuments(documentType?: string, limit?: number): Promise<Document[]> {
    const params = new URLSearchParams();
    if (documentType) params.append('document_type', documentType);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/documents/${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  async getDocument(documentId: string): Promise<Document> {
    return this.makeRequest(`/documents/${documentId}`);
  }

  async updateDocument(documentId: string, updates: Partial<DocumentCreate>): Promise<Document> {
    return this.makeRequest(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    await this.makeRequest(`/documents/${documentId}`, {
      method: 'DELETE',
    });
    return true;
  }

  async searchDocuments(searchTerm: string, documentType?: string, limit: number = 20): Promise<Document[]> {
    const params = new URLSearchParams({
      search_term: searchTerm,
      limit: limit.toString(),
    });
    if (documentType) params.append('document_type', documentType);
    
    return this.makeRequest(`/documents/search?${params.toString()}`);
  }

  async getDocumentStats(): Promise<DocumentStats> {
    return this.makeRequest('/documents/stats');
  }

  async exportToGoogleDocs(documentId: string): Promise<{ success: boolean; google_doc_url?: string; error?: string }> {
    try {
      const result = await this.makeRequest(`/documents/${documentId}/export-google`, {
        method: 'POST',
      });
      return { success: true, google_doc_url: result.google_doc_url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Utility method to generate preview text
  generatePreview(content: string, maxLength: number = 150): string {
    // Remove markdown formatting for preview
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
      .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
      .replace(/\n/g, ' ') // Replace single newlines with space
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    // Cut at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 ? 
      truncated.substring(0, lastSpace) + '...' : 
      truncated + '...';
  }
}

export const documentService = new DocumentService();