// src/navigation/AppNavigator.tsx - Fixed Navigation Structure
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../contexts/AuthContext';
import CustomTabBar from '../components/CustomTabBar';

// Import screens
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AssistantScreen from '../screens/AssistantScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import PlannerScreen from '../screens/PlannerScreen'; // This now uses EnhancedPlannerScreen
import EnhancedPlannerScreen from '../screens/EnhancedPlannerScreen'; // Direct import for future use
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Import chat and document screens
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import DocumentViewScreen from '../screens/DocumentViewScreen';

// Type definitions for navigation
export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  Auth: undefined;
  Splash: undefined;
  Planner: undefined;
  EnhancedPlanner: undefined; // Add enhanced planner route
  // Chat screens
  Conversations: undefined;
  Chat: {
    conversationId?: string;
    title?: string;
    isNew?: boolean;
  };
  // Document screens
  DocumentView: {
    title: string;
    content: string;
    format: 'markdown' | 'text';
    documentId?: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Assistant: undefined;
  Planner: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
};

// Navigation prop types
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type AssistantScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Assistant'>;
export type ConversationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Conversations'>;
export type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
export type DocumentViewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DocumentView'>;
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
export type PlannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Planner'>;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
  </ProfileStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Documents" component={DocumentsScreen} />
    <Tab.Screen name="Assistant" component={AssistantScreen} />
    <Tab.Screen name="Planner" component={PlannerScreen} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

// Auth Stack Navigator
const AuthStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main App Navigator - Fixed Structure
const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Splash"
      >
        {/* Always available screens - these are the base level */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        
        {loading ? (
          // While checking auth status, show loading
          null // AuthLoading is already available above
        ) : user ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen 
              name="Conversations" 
              component={ConversationsScreen}
              options={{
                headerShown: true,
                title: 'Conversations',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Betty Assistant',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="DocumentView" 
              component={DocumentViewScreen}
              options={{
                headerShown: true,
                title: 'Document',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="EnhancedPlanner" 
              component={EnhancedPlannerScreen}
              options={{
                headerShown: true,
                title: 'Enhanced Planner',
                headerBackTitleVisible: false,
              }}
            />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;