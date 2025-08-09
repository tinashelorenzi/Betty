// src/services/taskService.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    by_priority: Record<TaskPriority, number>;
    by_status: Record<TaskStatus, number>;
  };
  notes: {
    total: number;
    pinned: number;
    recent: Note[];
  };
  calendar: {
    upcoming_events: CalendarEvent[];
    events_today: number;
    events_this_week: number;
  };
  productivity: {
    completion_rate: number;
    average_completion_time: number;
    streak_days: number;
    tasks_completed_today: number;
  };
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  due_date_from?: string;
  due_date_to?: string;
  tags?: string[];
  search?: string;
}

// ============================================================================
// TASK SERVICE
// ============================================================================

class TaskService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // TASK METHODS
  // ============================================================================

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await this.api.post<Task>('/planner/tasks', task);
    return response.data;
  }

  async createQuickTask(quickTask: QuickTaskCreate): Promise<Task> {
    const response = await this.api.post<Task>('/planner/tasks/quick', quickTask);
    return response.data;
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const params = filter ? this.buildFilterParams(filter) : {};
    const response = await this.api.get<Task[]>('/planner/tasks', { params });
    return response.data;
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.api.get<Task>(`/planner/tasks/${taskId}`);
    return response.data;
  }

  async updateTask(taskId: string, update: TaskUpdate): Promise<Task> {
    const response = await this.api.put<Task>(`/planner/tasks/${taskId}`, update);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.api.delete(`/planner/tasks/${taskId}`);
  }

  async toggleTaskStatus(taskId: string): Promise<Task> {
    const response = await this.api.patch<Task>(`/planner/tasks/${taskId}/toggle`);
    return response.data;
  }

  async syncTasksWithCalendar(daysAhead: number = 7): Promise<any> {
    const response = await this.api.post(`/planner/tasks/sync-calendar`, {
      days_ahead: daysAhead
    });
    return response.data;
  }

  // ============================================================================
  // NOTE METHODS
  // ============================================================================

  async createNote(note: NoteCreate): Promise<Note> {
    const response = await this.api.post<Note>('/planner/notes', note);
    return response.data;
  }

  async getNotes(limit: number = 20): Promise<Note[]> {
    const response = await this.api.get<Note[]>('/planner/notes', {
      params: { limit }
    });
    return response.data;
  }

  async getNote(noteId: string): Promise<Note> {
    const response = await this.api.get<Note>(`/planner/notes/${noteId}`);
    return response.data;
  }

  async updateNote(noteId: string, update: NoteUpdate): Promise<Note> {
    const response = await this.api.put<Note>(`/planner/notes/${noteId}`, update);
    return response.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.api.delete(`/planner/notes/${noteId}`);
  }

  async exportNoteToGoogleKeep(noteId: string): Promise<any> {
    const response = await this.api.post(`/planner/notes/${noteId}/export-google`);
    return response.data;
  }

  // ============================================================================
  // CALENDAR METHODS
  // ============================================================================

  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const response = await this.api.get<CalendarEvent[]>('/planner/calendar/events', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<CalendarEvent> {
    const response = await this.api.post<CalendarEvent>('/planner/calendar/events', event);
    return response.data;
  }

  async syncWithGoogleCalendar(daysAhead: number = 7): Promise<any> {
    const response = await this.api.post('/planner/calendar/sync-google', {
      days_ahead: daysAhead
    });
    return response.data;
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  async getPlannerDashboard(): Promise<PlannerDashboard> {
    const response = await this.api.get<PlannerDashboard>('/planner/dashboard');
    return response.data;
  }

  async getPlannerStats(days: number = 30): Promise<any> {
    const response = await this.api.get('/planner/stats', {
      params: { days }
    });
    return response.data;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private buildFilterParams(filter: TaskFilter): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (filter.status?.length) {
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
    if (filter.tags?.length) {
      params.tags = filter.tags.join(',');
    }
    if (filter.search) {
      params.search = filter.search;
    }
    
    return params;
  }

  // Helper methods for UI
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

// Export singleton instance
export const taskService = new TaskService();
export default taskService;