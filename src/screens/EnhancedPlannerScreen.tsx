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
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { 
  Task, 
  TaskPriority, 
  TaskStatus, 
  QuickTaskCreate, 
  TaskCreate, 
  PlannerDashboard,
  Note,
  NoteCreate,
  CalendarEvent,
  TaskFilter
} from '../services/taskService';
import taskService from '../services/taskService';

const { width } = Dimensions.get('window');

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

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EnhancedPlannerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'calendar' | 'notes'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<PlannerDashboard | null>(null);
  
  // Enhanced loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // ADD new state for Google connection status
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);

  // Task states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Note states
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Calendar states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('🔄 Loading initial planner data...');
      setIsLoading(true);
      setError(null);
      
      // Load data concurrently but handle errors independently
      const results = await Promise.allSettled([
        loadDashboard(),
        loadTasks(),
        loadNotes(),
        loadCalendarEvents(),
        checkGoogleConnectionStatus()
      ]);
      
      // Log any failures but don't crash the app
      results.forEach((result, index) => {
        const names = ['dashboard', 'tasks', 'notes', 'calendar', 'google_status'];
        if (result.status === 'rejected') {
          console.error(`❌ Failed to load ${names[index]}:`, result.reason);
        }
      });
      
      console.log('✅ Initial data loading completed');
      
    } catch (error) {
      console.error('❌ Error during initial data loading:', error);
      setError('Failed to load planner data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkGoogleConnectionStatus = async () => {
    try {
      const status = await taskService.checkGoogleConnection();
      setGoogleConnected(status.connected);
      
      if (!status.connected) {
        console.log('⚠️ Google account not connected, some features may be limited');
      } else {
        console.log('✅ Google account connected');
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnected(false);
    }
  };

  // UPDATE the refresh control to be more robust
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ============================================================================
  // DATA LOADING METHODS
  // ============================================================================

  const loadDashboard = async () => {
    try {
      console.log('🔄 Loading dashboard...');
      setDashboardLoading(true);
      setDashboardError(null);
      
      const dashboardData = await taskService.getPlannerDashboard();
      
      console.log('✅ Dashboard loaded successfully');
      
      setDashboard(dashboardData);
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setDashboardError('Failed to load dashboard');
      
      // Set empty dashboard to prevent crashes
      setDashboard({
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
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      console.log('🔄 Loading tasks...');
      setTasksLoading(true);
      
      // Create a basic filter - don't pass undefined
      const filter: TaskFilter = {
        completed: false,
        limit: 50
      };
      
      const tasksData = await taskService.getTasks(filter);
      console.log('✅ Tasks loaded:', tasksData.length);
      
      setTasks(tasksData);
      setTasksError(null);
      
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      setTasksError('Failed to load tasks');
      setTasks([]); // Set empty array to prevent crashes
    } finally {
      setTasksLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const notesData = await taskService.getNotes();
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      console.log('🔄 Loading calendar events...');
      setCalendarLoading(true);
      setCalendarError(null);
      
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Loading events from ${startDate} to ${endDate}`);
      
      const eventsData = await taskService.getCalendarEvents(startDate, endDate);
      
      if (eventsData.length === 0) {
        console.log('📅 No calendar events found or Google account not connected');
      } else {
        console.log(`✅ Loaded ${eventsData.length} calendar events`);
      }
      
      setCalendarEvents(eventsData);
      
    } catch (error) {
      console.error('❌ Error loading calendar events:', error);
      setCalendarError('Failed to load calendar events');
      setCalendarEvents([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Add retry functionality
  const retryLoadData = async () => {
    console.log('🔄 Retrying data load...');
    await loadInitialData();
  };

  // ADD Google connection prompt component
  const renderGoogleConnectionPrompt = () => {
    if (googleConnected) return null;
    
    return (
      <View style={styles.connectionPrompt}>
        <Ionicons name="link-outline" size={24} color="#F59E0B" />
        <Text style={styles.connectionPromptText}>
          Connect your Google account to sync calendar and tasks
        </Text>
        <TouchableOpacity style={styles.connectButton} onPress={handleConnectGoogle}>
          <Text style={styles.connectButtonText}>Connect Google</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleConnectGoogle = () => {
    // Navigate to Google OAuth or show connection instructions
    Alert.alert(
      "Connect Google Account",
      "To sync your calendar and tasks, please connect your Google account in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go to Settings", onPress: () => {
          // Navigate to settings or profile screen
          console.log("Navigate to Google connection settings");
        }}
      ]
    );
  };

  // Error boundary component
  const renderErrorBoundary = (error: string | null, retryFunction: () => void) => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryFunction}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // TASK METHODS
  // ============================================================================

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTask = await taskService.toggleTaskStatus(taskId);
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      await loadDashboard(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
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
              setTasks(tasks.filter(task => task.id !== taskId));
              await loadDashboard();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  // ============================================================================
  // NOTE METHODS
  // ============================================================================

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteNote(noteId);
              setNotes(notes.filter(note => note.id !== noteId));
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading planner...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.header}>
        <Text style={styles.headerTitle}>Enhanced Planner</Text>
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={async () => {
            try {
              await taskService.syncWithGoogleCalendar();
              Alert.alert('Success', 'Synced with Google Calendar');
            } catch (error) {
              Alert.alert('Error', 'Failed to sync with calendar');
            }
          }}
        >
          <Ionicons name="sync" size={20} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: 'analytics' },
          { key: 'tasks', label: 'Tasks', icon: 'checkbox' },
          { key: 'calendar', label: 'Calendar', icon: 'calendar' },
          { key: 'notes', label: 'Notes', icon: 'document-text' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.key ? '#2563EB' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Google Connection Prompt */}
        {renderGoogleConnectionPrompt()}
        
        {activeTab === 'dashboard' && <DashboardTab dashboard={dashboard} />}
        {activeTab === 'tasks' && (
          <TasksTab 
            tasks={tasks} 
            onToggle={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onCreateNew={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab 
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab 
            notes={notes}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            onCreateNew={() => {
              setEditingNote(null);
              setShowNoteModal(true);
            }}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <TaskModal 
        visible={showTaskModal}
        task={editingTask}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={async (taskData) => {
          try {
            if (editingTask) {
              const updatedTask = await taskService.updateTask(editingTask.id, taskData);
              setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
            } else {
              const newTask = await taskService.createTask(taskData as TaskCreate);
              setTasks([...tasks, newTask]);
            }
            await loadDashboard();
            setShowTaskModal(false);
            setEditingTask(null);
          } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task');
          }
        }}
      />

      <NoteModal 
        visible={showNoteModal}
        note={editingNote}
        onClose={() => {
          setShowNoteModal(false);
          setEditingNote(null);
        }}
        onSave={async (noteData) => {
          try {
            if (editingNote) {
              const updatedNote = await taskService.updateNote(editingNote.id, noteData);
              setNotes(notes.map(n => n.id === editingNote.id ? updatedNote : n));
            } else {
              const newNote = await taskService.createNote(noteData);
              setNotes([...notes, newNote]);
            }
            setShowNoteModal(false);
            setEditingNote(null);
          } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note');
          }
        }}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// TAB COMPONENTS
// ============================================================================

const DashboardTab: React.FC<{ dashboard: PlannerDashboard | null }> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ✅ FIXED: Access stats from the correct structure
  const { stats, upcoming_tasks, recent_notes, calendar_events } = dashboard;

  return (
    <View style={styles.dashboardContainer}>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatsCard 
          title="Total Tasks" 
          value={stats.total_tasks.toString()}  // ✅ FIXED: Use stats.total_tasks
          subtitle={`${stats.completed_tasks} completed`}  // ✅ FIXED
          color="#3B82F6"
        />
        <StatsCard 
          title="Completion Rate" 
          value={`${Math.round(stats.completion_rate)}%`}  // ✅ FIXED
          subtitle="Overall"
          color="#10B981"
        />
        <StatsCard 
          title="Overdue Tasks" 
          value={stats.overdue_tasks.toString()}  // ✅ FIXED
          subtitle="Need attention"
          color="#EF4444"
        />
        <StatsCard 
          title="Notes" 
          value={stats.total_notes.toString()}  // ✅ FIXED
          subtitle="Total"
          color="#8B5CF6"
        />
      </View>

      {/* Upcoming Tasks */}
      {upcoming_tasks && upcoming_tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          {upcoming_tasks.slice(0, 3).map((task) => (
            <View key={task.id} style={styles.upcomingTaskItem}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
              {task.due_date && (
                <Text style={styles.dueDateText}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Recent Notes */}
      {recent_notes && recent_notes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notes</Text>
          {recent_notes.slice(0, 3).map((note) => (
            <View key={note.id} style={styles.recentNoteItem}>
              <Text style={styles.recentNoteTitle}>{note.title}</Text>
              <Text style={styles.recentNoteContent} numberOfLines={2}>
                {note.content}
              </Text>
              <Text style={styles.recentNoteDate}>
                {new Date(note.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Calendar Events */}
      {calendar_events && calendar_events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {calendar_events.slice(0, 3).map((event) => (
            <View key={event.id} style={styles.upcomingEventItem}>
              <View style={styles.eventTimeContainer}>
                <Text style={styles.eventTime}>
                  {new Date(event.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.location && (
                  <Text style={styles.eventLocation}>{event.location}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const TasksTab: React.FC<{
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onCreateNew: () => void;
}> = ({ tasks, onToggle, onEdit, onDelete, onCreateNew }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status !== TaskStatus.COMPLETED;
    if (filter === 'completed') return task.status === TaskStatus.COMPLETED;
    return true;
  });

  return (
    <View style={styles.tasksContainer}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed'].map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterType as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterType && styles.activeFilterButtonText
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addButton} onPress={onCreateNew}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem 
            task={item} 
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No tasks found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first task to get started
            </Text>
          </View>
        }
      />
    </View>
  );
};

const CalendarTab: React.FC<{
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}> = ({ events, selectedDate, onDateSelect }) => {
  const today = new Date();
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const eventsForSelectedDate = events.filter(event => {
    const eventDate = new Date(event.start_time);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <View style={styles.calendarContainer}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={() => {
            const prevMonth = new Date(selectedDate);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            onDateSelect(prevMonth);
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#2563EB" />
        </TouchableOpacity>
        
        <Text style={styles.calendarTitle}>
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity
          onPress={() => {
            const nextMonth = new Date(selectedDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            onDateSelect(nextMonth);
          }}
        >
          <Ionicons name="chevron-forward" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeadersContainer}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <View key={`empty-${i}`} style={styles.calendarDay} />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const hasEvents = events.some(event => {
            const eventDate = new Date(event.start_time);
            return eventDate.toDateString() === date.toDateString();
          });

          return (
            <CalendarDay
              key={day}
              day={day}
              isToday={isToday}
              isSelected={isSelected}
              hasEvents={hasEvents}
              onPress={() => onDateSelect(date)}
            />
          );
        })}
      </View>

      {/* Events for Selected Date */}
      <View style={styles.selectedDateEvents}>
        <Text style={styles.selectedDateTitle}>
          Events for {selectedDate.toLocaleDateString()}
        </Text>
        {eventsForSelectedDate.length > 0 ? (
          eventsForSelectedDate.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventTimeContainer}>
                <Text style={styles.eventTime}>
                  {new Date(event.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                {event.location && (
                  <Text style={styles.eventLocation}>{event.location}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No events for this date</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const NotesTab: React.FC<{
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onCreateNew: () => void;
}> = ({ notes, onEdit, onDelete, onCreateNew }) => {
  return (
    <View style={styles.notesContainer}>
      {/* Add Note Button */}
      <TouchableOpacity style={styles.addButton} onPress={onCreateNew}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Note</Text>
      </TouchableOpacity>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteItem 
            note={item} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No notes found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first note to get started
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ============================================================================
// ITEM COMPONENTS
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
  const isOverdue = task.due_date && taskService.isOverdue(task.due_date) && !isCompleted;

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
              <ActivityIndicator size="small" color={getPriorityColor()} />
            ) : isCompleted ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : null}
          </TouchableOpacity>
          
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              isCompleted && styles.taskTitleCompleted
            ]}>
              {task.title}
            </Text>
            
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskMetadata}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
                <Text style={styles.priorityText}>
                  {taskService.getPriorityLabel(task.priority)}
                </Text>
              </View>
              
              {task.due_date && (
                <Text style={[
                  styles.dueDateText,
                  isOverdue && styles.overdueDateText
                ]}>
                  {taskService.formatDate(task.due_date)}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(task.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete }) => {
  return (
    <Animatable.View animation="fadeInUp" style={styles.noteItem}>
      <TouchableOpacity onPress={() => onEdit(note)} style={styles.noteContent}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          {note.is_pinned && (
            <Ionicons name="pin" size={16} color="#F59E0B" />
          )}
        </View>
        
        <Text style={styles.noteContentText} numberOfLines={3}>
          {note.content}
        </Text>
        
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>
            {taskService.formatDate(note.updated_at)}
          </Text>
          
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {note.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {note.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(note.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </Animatable.View>
  );
};

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  day, 
  isToday, 
  isSelected, 
  hasEvents, 
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        isToday && styles.calendarDayToday,
        isSelected && styles.calendarDaySelected
      ]}
      onPress={() => onPress(day)}
    >
      <Text style={[
        styles.calendarDayText,
        isToday && styles.calendarDayTodayText,
        isSelected && styles.calendarDaySelectedText
      ]}>
        {day}
      </Text>
      {hasEvents && <View style={styles.eventIndicator} />}
    </TouchableOpacity>
  );
};

const StatsCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ title, value, subtitle, color }) => {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color }]}>
        <Text style={styles.statsValue}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsSubtitle}>{subtitle}</Text>
    </View>
  );
};

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

const TaskModal: React.FC<{
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskData: Partial<TaskCreate>) => void;
}> = ({ visible, task, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
    }
  }, [task, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const taskData: Partial<TaskCreate> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    };

    onSave(taskData);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format the date as YYYY-MM-DD to maintain the same format
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDueDate(formattedDate);
    }
  };

  const openDatePicker = () => {
    setCalendarDate(new Date()); // Reset to current month
    setShowDatePicker(true);
  };

  const clearDueDate = () => {
    setDueDate('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {task ? 'Edit Task' : 'New Task'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((priorityValue) => (
                <TouchableOpacity
                  key={priorityValue}
                  style={[
                    styles.priorityButton,
                    priority === priorityValue && styles.priorityButtonSelected,
                    { borderColor: taskService.getPriorityColor(priorityValue) }
                  ]}
                  onPress={() => setPriority(priorityValue)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === priorityValue && { color: taskService.getPriorityColor(priorityValue) }
                  ]}>
                    {taskService.getPriorityLabel(priorityValue)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Due Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={[styles.textInput, styles.dateInput]}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                editable={false}
              />
              <TouchableOpacity 
                style={styles.calendarButton} 
                onPress={openDatePicker}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              {dueDate && (
                <TouchableOpacity 
                  style={styles.clearDateButton} 
                  onPress={clearDueDate}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
            <Modal visible={showDatePicker} transparent animationType="fade">
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerCancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Due Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerDoneButton}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity 
                        style={styles.quickDateButton}
                        onPress={() => {
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = String(today.getMonth() + 1).padStart(2, '0');
                          const day = String(today.getDate()).padStart(2, '0');
                          setDueDate(`${year}-${month}-${day}`);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.quickDateButtonText}>Today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.quickDateButton}
                        onPress={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const year = tomorrow.getFullYear();
                          const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                          const day = String(tomorrow.getDate()).padStart(2, '0');
                          setDueDate(`${year}-${month}-${day}`);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.quickDateButtonText}>Tomorrow</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.quickDateButton}
                        onPress={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          const year = nextWeek.getFullYear();
                          const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
                          const day = String(nextWeek.getDate()).padStart(2, '0');
                          setDueDate(`${year}-${month}-${day}`);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.quickDateButtonText}>Next Week</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.datePickerCalendarSelector}>
                      <View style={styles.datePickerCalendarHeader}>
                        <TouchableOpacity 
                          style={styles.datePickerCalendarNavButton}
                          onPress={() => {
                            const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
                            setCalendarDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-back" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <Text style={styles.datePickerCalendarMonthYear}>
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity 
                          style={styles.datePickerCalendarNavButton}
                          onPress={() => {
                            const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
                            setCalendarDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.datePickerCalendarGrid}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <Text key={day} style={styles.datePickerCalendarDayHeader}>{day}</Text>
                        ))}
                        {Array.from({ length: 35 }, (_, i) => {
                          const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                          const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
                          const startOffset = firstDay.getDay();
                          const dayNumber = i - startOffset + 1;
                          
                          if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
                            return <View key={i} style={styles.datePickerCalendarDayEmpty} />;
                          }
                          
                          const today = new Date();
                          const isToday = dayNumber === today.getDate() && 
                                        calendarDate.getMonth() === today.getMonth() && 
                                        calendarDate.getFullYear() === today.getFullYear();
                          const isSelected = dueDate === `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                          
                          return (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.datePickerCalendarDay,
                                isToday && styles.datePickerCalendarDayToday,
                                isSelected && styles.datePickerCalendarDaySelected
                              ]}
                              onPress={() => {
                                const year = calendarDate.getFullYear();
                                const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
                                const day = String(dayNumber).padStart(2, '0');
                                setDueDate(`${year}-${month}-${day}`);
                                setShowDatePicker(false);
                              }}
                            >
                              <Text style={[
                                styles.datePickerCalendarDayText,
                                isToday && styles.datePickerCalendarDayTodayText,
                                isSelected && styles.datePickerCalendarDaySelectedText
                              ]}>
                                {dayNumber}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    
                    <Text style={styles.datePickerSubtitle}>Or enter manually:</Text>
                    <TextInput
                      style={[styles.textInput, styles.manualDateInput]}
                      value={dueDate}
                      onChangeText={setDueDate}
                      placeholder="YYYY-MM-DD"
                      maxLength={10}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const NoteModal: React.FC<{
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (noteData: NoteCreate) => void;
}> = ({ visible, note, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.is_pinned || false);
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
    }
  }, [note, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    const noteData: NoteCreate = {
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned,
    };

    onSave(noteData);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {note ? 'Edit Note' : 'New Note'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter note title"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.textInput, styles.noteContentInput]}
              value={content}
              onChangeText={setContent}
              placeholder="Enter note content"
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity 
              style={styles.pinToggle}
              onPress={() => setIsPinned(!isPinned)}
            >
              <Ionicons 
                name={isPinned ? "pin" : "pin-outline"} 
                size={20} 
                color={isPinned ? "#F59E0B" : "#6B7280"} 
              />
              <Text style={styles.pinToggleText}>Pin this note</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  syncButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },

  // Dashboard Styles
  dashboardContainer: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  recentNoteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recentNoteContent: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  recentNoteDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  upcomingEventItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventTimeContainer: {
    width: 60,
    marginRight: 12,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Tasks Styles
  tasksContainer: {
    paddingHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  overdueDateText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },

  // Notes Styles
  notesContainer: {
    paddingHorizontal: 16,
  },
  noteItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  noteContentText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },

  // Calendar Styles
  calendarContainer: {
    paddingHorizontal: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  dayHeadersContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarDay: {
    width: (width - 64) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#374151',
  },
  calendarDayTodayText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  calendarDaySelectedText: {
    color: 'white',
    fontWeight: '600',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  selectedDateEvents: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  noteContentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#D1D5DB',
  },
  priorityButtonSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pinToggleText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // Enhanced Error Handling Styles
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dashboard Tab Styles
  upcomingTaskItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Date Picker Styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  calendarButton: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 1,
    borderLeftColor: '#D1D5DB',
  },
  clearDateButton: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 1,
    borderLeftColor: '#D1D5DB',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  datePickerCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDoneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickerContent: {
    padding: 20,
    alignItems: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quickDateButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quickDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  datePickerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  manualDateInput: {
    width: 200,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Date Picker Calendar Styles
  datePickerCalendarSelector: {
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerCalendarNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  datePickerCalendarMonthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  datePickerCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  datePickerCalendarDayHeader: {
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  datePickerCalendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 8,
  },
  datePickerCalendarDayEmpty: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  datePickerCalendarDayToday: {
    backgroundColor: '#3B82F6',
  },
  datePickerCalendarDaySelected: {
    backgroundColor: '#10B981',
  },
  datePickerCalendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  datePickerCalendarDayTodayText: {
    color: 'white',
    fontWeight: '600',
  },
  datePickerCalendarDaySelectedText: {
    color: 'white',
    fontWeight: '600',
  },

  // Google Connection Prompt Styles
  connectionPrompt: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    alignItems: 'center',
  },
  connectionPromptText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedPlannerScreen;