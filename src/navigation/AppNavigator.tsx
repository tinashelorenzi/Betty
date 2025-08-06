// src/navigation/AppNavigator.tsx - COMPLETE NAVIGATOR
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

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Auth Stack - for unauthenticated users
const AuthStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Profile Stack - for profile-related screens
const ProfileStackNavigator: React.FC = () => (
  <ProfileStack.Navigator
    initialRouteName="ProfileMain"
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#667eea',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{
        title: 'Profile',
        headerShown: false, // Profile screen has its own header
      }}
    />
    <ProfileStack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        title: 'Settings',
      }}
    />
    <ProfileStack.Screen 
      name="NotificationSettings" 
      component={NotificationSettingsScreen}
      options={{
        title: 'Notifications',
      }}
    />
    <ProfileStack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{
        title: 'Edit Profile',
      }}
    />
  </ProfileStack.Navigator>
);

// Main Tab Navigator - for authenticated users
const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Home"
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        title: 'Home',
      }}
    />
    <Tab.Screen 
      name="Documents" 
      component={DocumentsScreen}
      options={{
        title: 'Documents',
      }}
    />
    <Tab.Screen 
      name="Assistant" 
      component={AssistantScreen}
      options={{
        title: 'Assistant',
      }}
    />
    <Tab.Screen 
      name="Planner" 
      component={PlannerScreen}
      options={{
        title: 'Planner',
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStackNavigator}
      options={{
        title: 'Profile',
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#f8f9ff' }
        }}
      >
        {/* Always show splash first */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{
            cardStyle: { backgroundColor: '#2563EB' }
          }}
        />
        
        {/* Then show auth loading */}
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        
        {isAuthenticated ? (
          <Stack.Screen 
            name="MainApp" 
            component={MainTabNavigator}
            options={{
              gestureEnabled: false, // Prevent swipe back from main app
            }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthStack}
            options={{
              animationTypeForReplace: !isAuthenticated ? 'pop' : 'push',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;