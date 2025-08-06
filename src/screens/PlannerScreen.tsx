// src/screens/PlannerScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

interface TaskProps {
  id: string;
  title: string;
  time?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category: string;
  onToggle: (id: string) => void;
}

const TaskItem: React.FC<TaskProps> = ({
  id,
  title,
  time,
  priority,
  completed,
  category,
  onToggle,
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#999';
    }
  };

  return (
    <TouchableOpacity onPress={() => onToggle(id)} style={styles.taskItem}>
      <View style={styles.taskLeft}>
        <TouchableOpacity
          onPress={() => onToggle(id)}
          style={[
            styles.taskCheckbox,
            completed && styles.taskCheckboxCompleted,
          ]}
        >
          {completed && <Ionicons name="checkmark" size={16} color="white" />}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>
            {title}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={styles.taskCategory}>{category}</Text>
            {time && <Text style={styles.taskTime}> • {time}</Text>}
          </View>
        </View>
      </View>
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
    </TouchableOpacity>
  );
};

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  onPress: (day: number) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, isToday, isSelected, onPress }) => (
  <TouchableOpacity onPress={() => onPress(day)} style={styles.calendarDay}>
    {isSelected ? (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.calendarDaySelected}>
        <Text style={styles.calendarDayTextSelected}>{day}</Text>
      </LinearGradient>
    ) : (
      <View style={[styles.calendarDayDefault, isToday && styles.calendarDayToday]}>
        <Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
          {day}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

const PlannerScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(15);
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Review quarterly reports',
      time: '9:00 AM',
      priority: 'high' as const,
      completed: false,
      category: 'Work',
    },
    {
      id: '2',
      title: 'Client meeting preparation',
      time: '10:30 AM',
      priority: 'high' as const,
      completed: true,
      category: 'Meeting',
    },
    {
      id: '3',
      title: 'Update project documentation',
      time: '2:00 PM',
      priority: 'medium' as const,
      completed: false,
      category: 'Development',
    },
    {
      id: '4',
      title: 'Team standup meeting',
      time: '4:00 PM',
      priority: 'medium' as const,
      completed: false,
      category: 'Meeting',
    },
    {
      id: '5',
      title: 'Review code changes',
      priority: 'low' as const,
      completed: false,
      category: 'Development',
    },
    {
      id: '6',
      title: 'Send follow-up emails',
      priority: 'low' as const,
      completed: true,
      category: 'Communication',
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = (completedTasks / totalTasks) * 100;

  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Planner</Text>
            <Text style={styles.headerDate}>August 2025</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#667eea" />
          </TouchableOpacity>
        </Animatable.View>

        {/* Progress Card */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.progressCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.progressGradient}>
            <View style={styles.progressContent}>
              <View style={styles.progressText}>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {completedTasks} of {totalTasks} tasks completed
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}%</Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Mini Calendar */}
        <Animatable.View animation="fadeInLeft" delay={400} style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>August</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendar}>
            {calendarDays.map((day) => (
              <CalendarDay
                key={day}
                day={day}
                isToday={day === 15}
                isSelected={day === selectedDay}
                onPress={setSelectedDay}
              />
            ))}
          </ScrollView>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
              <Text style={styles.statNumber}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#f39c12" />
              <Text style={styles.statNumber}>{totalTasks - completedTasks}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color="#e74c3c" />
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Animatable.View animation="fadeInLeft" delay={800} style={styles.tasksSectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={900}>
            {tasks.map((task, index) => (
              <Animatable.View
                key={task.id}
                animation="fadeInRight"
                delay={1000 + index * 100}
              >
                <TaskItem {...task} onToggle={toggleTask} />
              </Animatable.View>
            ))}
          </Animatable.View>
        </View>

        {/* Add Task Button */}
        <Animatable.View animation="fadeInUp" delay={1400} style={styles.addTaskContainer}>
          <TouchableOpacity style={styles.addTaskButton}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.addTaskGradient}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addTaskText}>Add New Task</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: 20,
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  calendarSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  calendar: {
    paddingHorizontal: 20,
    gap: 8,
  },
  calendarDay: {
    marginRight: 8,
  },
  calendarDayDefault: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayToday: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  calendarDaySelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tasksSection: {
    marginBottom: 20,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskCategory: {
    fontSize: 12,
    color: '#666',
  },
  taskTime: {
    fontSize: 12,
    color: '#999',
  },
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  addTaskContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addTaskButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addTaskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addTaskText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PlannerScreen;