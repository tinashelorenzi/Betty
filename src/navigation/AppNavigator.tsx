// src/navigation/AppNavigator.tsx - FIXED VERSION
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
import PlannerScreen from '../screens/PlannerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Import new chat screens
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';

// Type definitions for navigation
export type RootStackParamList = {
  Splash: undefined;
  AuthLoading: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  // Chat screens
  Conversations: undefined;
  Chat: {
    conversationId?: string;
    title?: string;
    isNew?: boolean;
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

// Navigation prop types for all screens
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type AssistantScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Assistant'>;
export type ConversationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Conversations'>;
export type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Auth Stack Component
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Login"
    screenOptions={{ 
      headerShown: false 
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Profile Stack Component
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ 
        title: 'Settings',
        headerStyle: { backgroundColor: '#667eea' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    />
    <ProfileStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ 
        title: 'Notifications',
        headerStyle: { backgroundColor: '#667eea' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    />
    <ProfileStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ 
        title: 'Edit Profile',
        headerStyle: { backgroundColor: '#667eea' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    />
  </ProfileStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
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

// Main App Navigator (includes chat screens)
const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false 
        }}
        initialRouteName="Splash"
      >
        {/* Always show splash first */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        
        {/* Auth loading screen */}
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        
        {loading ? (
          // Show loading screen while checking auth
          <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        ) : isAuthenticated ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen 
              name="Conversations" 
              component={ConversationsScreen}
              options={{ 
                title: 'Conversations',
                headerShown: true,
                headerStyle: { backgroundColor: '#667eea' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ 
                headerShown: true,
                headerStyle: { backgroundColor: '#667eea' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }}
            />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;