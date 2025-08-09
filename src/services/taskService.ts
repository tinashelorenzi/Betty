// src/services/taskService.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
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

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  tags: string[];
  metadata: Record<string, any>;
  completed_at?: string;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  sync_to_calendar?: boolean;
}

export interface QuickTaskCreate {
  title: string;
  due_today?: boolean;
  priority?: TaskPriority;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string;
  attendees: string[];
  location?: string;
}

export interface CalendarEventCreate {
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  attendees?: string[];
  location?: string;
  reminders?: Array<{ method: string; minutes: number }>;
}

export interface PlannerStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  total_notes: number;
  tasks_this_week: number;
  tasks_completed_this_week: number;
}

export interface PlannerDashboard {
  stats: PlannerStats;
  upcoming_tasks: Task[];
  recent_notes: any[];
  calendar_events: CalendarEvent[];
  overdue_tasks: Task[];
}

// ============================================================================
// TASK SERVICE CLASS
// ============================================================================

class TaskService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add auth interceptor
    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        console.error('Auth interceptor error:', error);
        return config;
      }
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  // ========================================================================
  // TASK OPERATIONS
  // ========================================================================

  async createTask(task: TaskCreate): Promise<Task> {
    try {
      const response = await this.api.post('/planner/tasks', task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  async createQuickTask(quickTask: QuickTaskCreate): Promise<Task> {
    try {
      const response = await this.api.post('/planner/tasks/quick', quickTask);
      return response.data;
    } catch (error) {
      console.error('Error creating quick task:', error);
      throw new Error('Failed to create quick task');
    }
  }

  async getTasks(filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date_from?: string;
    due_date_to?: string;
    completed?: boolean;
    limit?: number;
  }): Promise<Task[]> {
    try {
      const response = await this.api.get('/planner/tasks', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  async getTodayTasks(): Promise<Task[]> {
    try {
      const response = await this.api.get('/planner/tasks/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      throw new Error('Failed to fetch today tasks');
    }
  }

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    try {
      const response = await this.api.get(`/planner/tasks/upcoming?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to fetch upcoming tasks');
    }
  }

  async updateTask(taskId: string, update: TaskUpdate): Promise<Task> {
    try {
      const response = await this.api.put(`/planner/tasks/${taskId}`, update);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      const response = await this.api.post(`/planner/tasks/${taskId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw new Error('Failed to toggle task completion');
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

  // ========================================================================
  // CALENDAR OPERATIONS
  // ========================================================================

  async getCalendarEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await this.api.get('/planner/calendar/events', { params });
      return response.data.events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async createCalendarEvent(event: CalendarEventCreate): Promise<CalendarEvent> {
    try {
      const response = await this.api.post('/planner/calendar/events', event);
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async syncCalendarTasks(daysAhead: number = 30): Promise<any> {
    try {
      const response = await this.api.post(`/planner/calendar/sync?days_ahead=${daysAhead}`);
      return response.data;
    } catch (error) {
      console.error('Error syncing calendar tasks:', error);
      throw new Error('Failed to sync calendar tasks');
    }
  }

  // ========================================================================
  // DASHBOARD AND ANALYTICS
  // ========================================================================

  async getDashboard(): Promise<PlannerDashboard> {
    try {
      const response = await this.api.get('/planner/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw new Error('Failed to fetch dashboard');
    }
  }

  async getStats(days: number = 30): Promise<PlannerStats> {
    try {
      const response = await this.api.get(`/planner/stats?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch stats');
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  formatDateForAPI(date: Date): string {
    return date.toISOString();
  }

  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatTimeForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT:
        return '#dc2626'; // red-600
      case TaskPriority.HIGH:
        return '#ea580c'; // orange-600
      case TaskPriority.MEDIUM:
        return '#ca8a04'; // yellow-600
      case TaskPriority.LOW:
        return '#16a34a'; // green-600
      default:
        return '#6b7280'; // gray-500
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '#16a34a'; // green-600
      case TaskStatus.IN_PROGRESS:
        return '#2563eb'; // blue-600
      case TaskStatus.TODO:
        return '#6b7280'; // gray-500
      case TaskStatus.CANCELLED:
        return '#dc2626'; // red-600
      default:
        return '#6b7280'; // gray-500
    }
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService;