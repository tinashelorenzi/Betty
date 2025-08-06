// src/navigation/AppNavigator.tsx
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

// Type definitions for navigation
export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
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

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
      component={ProfileScreen}
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
        screenOptions={{ headerShown: false }}
      >
        {/* Always show splash first */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        
        {/* Then show auth loading */}
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        
        {isAuthenticated ? (
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;