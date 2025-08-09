// src/services/taskService.ts - UPDATED METHODS
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum EventType {
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  REMINDER = 'reminder',
  TASK = 'task',
  PERSONAL = 'personal'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  completed_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags?: string[];
  calendar_event_id?: string;
  google_task_id?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  estimated_duration?: number;
  tags?: string[];
  sync_to_calendar?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags?: string[];
}

export interface QuickTaskCreate {
  title: string;
  due_today?: boolean;
  priority?: TaskPriority;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags?: string[];
  is_pinned?: boolean;
  google_keep_id?: string;
}

export interface NoteCreate {
  title: string;
  content: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  location?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  google_event_id?: string;
  task_id?: string;
}

export interface PlannerDashboard {
  stats: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
    total_notes: number;
    
  };
  upcoming_tasks: Task[];
  recent_notes: Note[];
  calendar_events: CalendarEvent[];
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  due_date_from?: string;
  due_date_to?: string;
  tags?: string[];
  search?: string;
  completed?: boolean;
  limit?: number;
}

// ============================================================================
// TASK SERVICE
// ============================================================================

class TaskService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: Config.API_BASE_URL,
    });

    // Add auth interceptor
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for better error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.log('API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          // Handle unauthorized access
          await AsyncStorage.removeItem('authToken');
          // Navigate to login screen
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // TASK METHODS - UPDATED
  // ============================================================================

  async createTask(task: TaskCreate): Promise<Task> {
    try {
      const response = await this.api.post<Task>('/planner/tasks', task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    try {
      // Build query parameters properly
      const params: Record<string, any> = {};
      
      if (filter) {
        if (filter.status?.length) {
          // Send status as individual parameters for each status
          filter.status.forEach((status, index) => {
            params[`status_${index}`] = status;
          });
          // Or as comma-separated string
          params.status = filter.status.join(',');
        }
        
        if (filter.priority?.length) {
          params.priority = filter.priority.join(',');
        }
        
        if (filter.due_date_from) {
          params.due_date_from = filter.due_date_from;
        }
        
        if (filter.due_date_to) {
          params.due_date_to = filter.due_date_to;
        }
        
        if (filter.completed !== undefined) {
          params.completed = filter.completed;
        }
      }

      console.log('Getting tasks with params:', params);
      
      const response = await this.api.get<Task[]>('/planner/tasks', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting tasks:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.api.get<Task>(`/planner/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting task:', error);
      throw new Error('Failed to get task');
    }
  }

  async updateTask(taskId: string, update: TaskUpdate): Promise<Task> {
    try {
      const response = await this.api.put<Task>(`/planner/tasks/${taskId}`, update);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.api.delete(`/planner/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  async toggleTaskStatus(taskId: string): Promise<Task> {
    try {
      const response = await this.api.post<Task>(`/planner/tasks/${taskId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling task status:', error);
      throw new Error('Failed to toggle task status');
    }
  }

  // ============================================================================
  // DASHBOARD METHODS - UPDATED
  // ============================================================================

  async getPlannerDashboard(): Promise<PlannerDashboard> {
    try {
      console.log('Getting planner dashboard...');
      const response = await this.api.get<PlannerDashboard>('/planner/dashboard');
      console.log('Dashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting planner dashboard:', error);
      
      // Return a default dashboard structure to prevent UI crashes
      return {
        stats: {
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          overdue_tasks: 0,
          completion_rate: 0,
          total_notes: 0
        },
        upcoming_tasks: [],
        recent_notes: [],
        calendar_events: []
      };
    }
  }

  async getPlannerStats(days: number = 30): Promise<any> {
    try {
      const response = await this.api.get('/planner/stats', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting planner stats:', error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        completion_rate: 0
      };
    }
  }

  // ============================================================================
  // CALENDAR METHODS - UPDATED
  // ============================================================================

  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      console.log(`Getting calendar events from ${startDate} to ${endDate}`);
      
      const response = await this.api.get<CalendarEvent[]>('/planner/calendar/events', {
        params: { 
          start_date: startDate, 
          end_date: endDate 
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<CalendarEvent> {
    try {
      const response = await this.api.post<CalendarEvent>('/planner/calendar/events', event);
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async syncWithGoogleCalendar(daysAhead: number = 7): Promise<any> {
    try {
      const response = await this.api.post('/planner/calendar/sync-google', {
        days_ahead: daysAhead
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      return { success: false, error: 'Failed to sync with Google Calendar' };
    }
  }

  // ============================================================================
  // NOTE METHODS - UPDATED
  // ============================================================================

  async createNote(note: NoteCreate): Promise<Note> {
    try {
      const response = await this.api.post<Note>('/planner/notes', note);
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  async getNotes(limit: number = 20): Promise<Note[]> {
    try {
      const response = await this.api.get<Note[]>('/planner/notes', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  async getNote(noteId: string): Promise<Note> {
    try {
      const response = await this.api.get<Note>(`/planner/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting note:', error);
      throw new Error('Failed to get note');
    }
  }

  async updateNote(noteId: string, update: NoteUpdate): Promise<Note> {
    try {
      const response = await this.api.put<Note>(`/planner/notes/${noteId}`, update);
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      await this.api.delete(`/planner/notes/${noteId}`);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return '#10B981';
      case TaskPriority.MEDIUM:
        return '#F59E0B';
      case TaskPriority.HIGH:
        return '#EF4444';
      case TaskPriority.URGENT:
        return '#DC2626';
      default:
        return '#6B7280';
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return '#6B7280';
      case TaskStatus.IN_PROGRESS:
        return '#3B82F6';
      case TaskStatus.COMPLETED:
        return '#10B981';
      case TaskStatus.CANCELLED:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Low';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.HIGH:
        return 'High';
      case TaskPriority.URGENT:
        return 'Urgent';
      default:
        return 'Unknown';
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.COMPLETED:
        return 'Completed';
      case TaskStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  isOverdue(dueDateString: string): boolean {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    return dueDate < now;
  }

  isDueToday(dueDateString: string): boolean {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  }

  isDueSoon(dueDateString: string, days: number = 3): boolean {
    const dueDate = new Date(dueDateString);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return dueDate <= futureDate && dueDate >= new Date();
  }
}

export default new TaskService();