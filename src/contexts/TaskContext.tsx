// src/contexts/TaskContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { taskService, Task, TaskStatus, TaskPriority, PlannerDashboard } from '../services/taskService';

// ============================================================================
// TYPES
// ============================================================================

interface TaskState {
  tasks: Task[];
  dashboard: PlannerDashboard | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_DASHBOARD'; payload: PlannerDashboard }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; task: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'RESET' };

interface TaskContextType {
  state: TaskState;
  // Task Operations
  createTask: (taskData: any) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  // Data Loading
  loadTasks: (filters?: any) => Promise<void>;
  loadTodayTasks: () => Promise<void>;
  loadUpcomingTasks: (days?: number) => Promise<void>;
  loadDashboard: () => Promise<void>;
  refreshAll: () => Promise<void>;
  // Utilities
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getOverdueTasks: () => Task[];
  getCompletionRate: () => number;
}

// ============================================================================
// REDUCER
// ============================================================================

const initialState: TaskState = {
  tasks: [],
  dashboard: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      };
    
    case 'SET_DASHBOARD':
      return {
        ...state,
        dashboard: action.payload,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        lastUpdated: new Date(),
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.task, updated_at: new Date().toISOString() }
            : task
        ),
        lastUpdated: new Date(),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        lastUpdated: new Date(),
      };
    
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                status: task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED,
                completed_at: task.status === TaskStatus.COMPLETED ? null : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : task
        ),
        lastUpdated: new Date(),
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // ========================================================================
  // TASK OPERATIONS
  // ========================================================================

  const createTask = async (taskData: any): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newTask = await taskService.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: newTask });
    } catch (error) {
      console.error('Error creating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: any): Promise<void> => {
    try {
      const updatedTask = await taskService.updateTask(taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, task: updatedTask } });
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
      throw error;
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await taskService.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
      throw error;
    }
  };

  const toggleTask = async (taskId: string): Promise<void> => {
    try {
      // Optimistic update
      dispatch({ type: 'TOGGLE_TASK', payload: taskId });
      
      // API call
      await taskService.toggleTaskCompletion(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert optimistic update on error
      dispatch({ type: 'TOGGLE_TASK', payload: taskId });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
      throw error;
    }
  };

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  const loadTasks = async (filters?: any): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tasks = await taskService.getTasks(filters);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
    }
  };

  const loadTodayTasks = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tasks = await taskService.getTodayTasks();
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error loading today tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load today tasks' });
    }
  };

  const loadUpcomingTasks = async (days: number = 7): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tasks = await taskService.getUpcomingTasks(days);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error loading upcoming tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load upcoming tasks' });
    }
  };

  const loadDashboard = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const dashboard = await taskService.getDashboard();
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load dashboard' });
    }
  };

  const refreshAll = async (): Promise<void> => {
    try {
      const [dashboard, tasks] = await Promise.all([
        taskService.getDashboard(),
        taskService.getTasks({ limit: 50 })
      ]);
      
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error refreshing data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    }
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return state.tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: TaskPriority): Task[] => {
    return state.tasks.filter(task => task.priority === priority);
  };

  const getOverdueTasks = (): Task[] => {
    const now = new Date();
    return state.tasks.filter(task => {
      if (!task.due_date || task.status === TaskStatus.COMPLETED) return false;
      return new Date(task.due_date) < now;
    });
  };

  const getCompletionRate = (): number => {
    if (state.tasks.length === 0) return 0;
    const completed = state.tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / state.tasks.length) * 100);
  };

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const contextValue: TaskContextType = {
    state,
    // Task Operations
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    // Data Loading
    loadTasks,
    loadTodayTasks,
    loadUpcomingTasks,
    loadDashboard,
    refreshAll,
    // Utilities
    getTasksByStatus,
    getTasksByPriority,
    getOverdueTasks,
    getCompletionRate,
  };

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Auto-refresh every 5 minutes when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isLoading) {
        refreshAll();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.isLoading]);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};