// src/screens/EnhancedPlannerScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { taskService, Task, TaskPriority, TaskStatus, QuickTaskCreate, TaskCreate, PlannerDashboard } from '../services/taskService';

// ============================================================================
// INTERFACES
// ============================================================================

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  onPress: (day: number) => void;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onEdit, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    await onToggle(task.id);
    setIsLoading(false);
  };

  const getPriorityColor = () => taskService.getPriorityColor(task.priority);
  const getStatusColor = () => taskService.getStatusColor(task.status);

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

  return (
    <Animatable.View animation="fadeInUp" style={styles.taskItem}>
      <TouchableOpacity onPress={() => onEdit(task)} style={styles.taskContent}>
        <View style={styles.taskLeft}>
          <TouchableOpacity
            onPress={handleToggle}
            disabled={isLoading}
            style={[
              styles.taskCheckbox,
              isCompleted && styles.taskCheckboxCompleted,
              { borderColor: getPriorityColor() }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              isCompleted && <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>
          
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle, 
              isCompleted && styles.taskTitleCompleted,
              isOverdue && styles.taskOverdue
            ]}>
              {task.title}
            </Text>
            
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
                <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
              </View>
              
              {task.due_date && (
                <Text style={[styles.taskTime, isOverdue && styles.taskOverdueText]}>
                  {taskService.formatDateForDisplay(task.due_date)}
                  {task.due_date.includes('T') && ' • ' + taskService.formatTimeForDisplay(task.due_date)}
                </Text>
              )}
              
              {task.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {task.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {task.tags.length > 2 && (
                    <Text style={styles.moreTagsText}>+{task.tags.length - 2}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.taskActions}>
          {task.calendar_event_id && (
            <Ionicons name="calendar" size={16} color="#10b981" style={styles.calendarIcon} />
          )}
          
          <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const CalendarDay: React.FC<CalendarDayProps> = ({ day, isToday, isSelected, hasEvents, onPress }) => (
  <TouchableOpacity onPress={() => onPress(day)} style={styles.calendarDay}>
    {isSelected ? (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.calendarDaySelected}>
        <Text style={styles.calendarDayTextSelected}>{day}</Text>
      </LinearGradient>
    ) : (
      <View style={[
        styles.calendarDayDefault, 
        isToday && styles.calendarDayToday,
        hasEvents && styles.calendarDayWithEvents
      ]}>
        <Text style={[
          styles.calendarDayText, 
          isToday && styles.calendarDayTextToday
        ]}>
          {day}
        </Text>
        {hasEvents && <View style={styles.eventDot} />}
      </View>
    )}
  </TouchableOpacity>
);

const CreateTaskModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: TaskCreate) => void;
  editTask?: Task;
}> = ({ visible, onClose, onSubmit, editTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [syncToCalendar, setSyncToCalendar] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setPriority(editTask.priority);
      setDueDate(editTask.due_date || '');
      setSyncToCalendar(!!editTask.calendar_event_id);
    } else {
      resetForm();
    }
  }, [editTask, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setDueDate('');
    setSyncToCalendar(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    const taskData: TaskCreate = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      sync_to_calendar: syncToCalendar,
      tags: [],
      metadata: {}
    };

    onSubmit(taskData);
    onClose();
    resetForm();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editTask ? 'Edit Task' : 'Create Task'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityOption,
                    priority === p && styles.priorityOptionSelected,
                    { borderColor: taskService.getPriorityColor(p) }
                  ]}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    priority === p && { color: taskService.getPriorityColor(p) }
                  ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD or YYYY-MM-DDTHH:MM"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              onPress={() => setSyncToCalendar(!syncToCalendar)}
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkbox, syncToCalendar && styles.checkboxChecked]}>
                {syncToCalendar && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Sync to Google Calendar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  calendarSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  calendar: {
    paddingHorizontal: 8,
  },
  calendarDay: {
    marginHorizontal: 4,
  },
  calendarDayDefault: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  calendarDaySelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayToday: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  calendarDayWithEvents: {
    backgroundColor: '#fef3c7',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  calendarDayTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  calendarDayTextToday: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  tasksSection: {
    margin: 16,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 8,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskContent: {
    padding: 16,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskOverdue: {
    color: '#ef4444',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  taskTime: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
    marginBottom: 4,
  },
  taskOverdueText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#6b7280',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  calendarIcon: {
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  priorityOptionSelected: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
});

export default EnhancedPlannerScreen;
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<PlannerDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all'>('today');

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashboardData, todayTasks] = await Promise.all([
        taskService.getDashboard(),
        taskService.getTodayTasks()
      ]);
      
      setDashboard(dashboardData);
      setTasks(todayTasks);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load planner data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTasksByTab = useCallback(async (tab: 'today' | 'upcoming' | 'all') => {
    try {
      let newTasks: Task[];
      
      switch (tab) {
        case 'today':
          newTasks = await taskService.getTodayTasks();
          break;
        case 'upcoming':
          newTasks = await taskService.getUpcomingTasks(7);
          break;
        case 'all':
          newTasks = await taskService.getTasks({ limit: 50 });
          break;
        default:
          newTasks = [];
      }
      
      setTasks(newTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await loadTasksByTab(activeTab);
    setRefreshing(false);
  }, [loadData, loadTasksByTab, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTasksByTab(activeTab);
  }, [activeTab, loadTasksByTab]);

  // ========================================================================
  // TASK OPERATIONS
  // ========================================================================

  const handleCreateTask = async (taskData: TaskCreate) => {
    try {
      await taskService.createTask(taskData);
      await loadTasksByTab(activeTab);
      await loadData(); // Refresh dashboard
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await taskService.toggleTaskCompletion(taskId);
      await loadTasksByTab(activeTab);
      await loadData(); // Refresh dashboard
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(taskId);
              await loadTasksByTab(activeTab);
              await loadData(); // Refresh dashboard
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleQuickAddTask = async (title: string) => {
    if (!title.trim()) return;
    
    try {
      const quickTask: QuickTaskCreate = {
        title: title.trim(),
        due_today: activeTab === 'today',
        priority: TaskPriority.MEDIUM
      };
      
      await taskService.createQuickTask(quickTask);
      await loadTasksByTab(activeTab);
      await loadData(); // Refresh dashboard
    } catch (error) {
      console.error('Error creating quick task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  // ========================================================================
  // CALENDAR UTILITIES
  // ========================================================================

  const getCurrentMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getTasksForDay = (day: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === targetDate.toDateString();
    });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading planner...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarDays = getCurrentMonthDays();
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalTasks = tasks.length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Planner</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendar Section */}
        <Animatable.View animation="fadeInDown" delay={200} style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.calendar}
          >
            {calendarDays.map((day) => (
              <CalendarDay
                key={day}
                day={day}
                isToday={day === new Date().getDate()}
                isSelected={day === selectedDay}
                hasEvents={getTasksForDay(day).length > 0}
                onPress={setSelectedDay}
              />
            ))}
          </ScrollView>
        </Animatable.View>

        {/* Stats Section */}
        {dashboard && (
          <Animatable.View animation="fadeInUp" delay={400} style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{dashboard.stats.completed_tasks}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>{dashboard.stats.pending_tasks}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#8b5cf6" />
                <Text style={styles.statNumber}>{Math.round(dashboard.stats.completion_rate)}%</Text>
                <Text style={styles.statLabel}>Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#ef4444" />
                <Text style={styles.statNumber}>{dashboard.stats.overdue_tasks}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Task Tabs */}
        <Animatable.View animation="fadeInLeft" delay={600} style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {(['today', 'upcoming', 'all'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animatable.View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Animatable.View animation="fadeInLeft" delay={800} style={styles.tasksSectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'today' ? "Today's Tasks" : 
               activeTab === 'upcoming' ? 'Upcoming Tasks' : 'All Tasks'}
            </Text>
            <Text style={styles.taskCount}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </Text>
          </Animatable.View>

          {tasks.length === 0 ? (
            <Animatable.View animation="fadeIn" style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No tasks found</Text>
              <Text style={styles.emptyStateSubtext}>
                {activeTab === 'today' ? 'You have no tasks for today' :
                 activeTab === 'upcoming' ? 'No upcoming tasks' : 'No tasks created yet'}
              </Text>
            </Animatable.View>
          ) : (
            <Animatable.View animation="fadeInUp" delay={900}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </Animatable.View>
          )}
        </View>
      </ScrollView>

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(undefined);
        }}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />
    </SafeAreaView>
  );
};