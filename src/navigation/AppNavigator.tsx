// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../contexts/AuthContext';

// Import screens
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Import your main app screens here
// import HomeScreen from '../screens/HomeScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import SettingsScreen from '../screens/SettingsScreen';

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
  Splash: undefined; // Add this for your SplashScreen
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Chat: undefined;
  Planner: undefined;
  Profile: undefined;
};

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens (replace with your actual screens)
const PlaceholderHomeScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
    <Text>Replace with your actual home screen</Text>
  </View>
);

const PlaceholderProfileScreen: React.FC = () => {
  const { logout, user } = useAuth();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Profile Screen</Text>
      <Text>Welcome, {user?.first_name} {user?.last_name}!</Text>
      <Text>Email: {user?.email}</Text>
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: '#e74c3c',
          padding: 10,
          borderRadius: 5,
          marginTop: 20,
        }}
      >
        <Text style={{ color: 'white' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    screenOptions={{
      headerShown: true,
      tabBarActiveTintColor: '#667eea',
      tabBarInactiveTintColor: '#999',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={PlaceholderHomeScreen}
      options={{
        title: 'Home',
        // Add your tab bar icon here
        // tabBarIcon: ({ focused, color, size }) => (
        //   <Icon name="home" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen 
      name="Documents" 
      component={PlaceholderHomeScreen} // Replace with DocumentsScreen
      options={{
        title: 'Documents',
        // tabBarIcon: ({ focused, color, size }) => (
        //   <Icon name="document" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen 
      name="Chat" 
      component={PlaceholderHomeScreen} // Replace with ChatScreen
      options={{
        title: 'AI Chat',
        // tabBarIcon: ({ focused, color, size }) => (
        //   <Icon name="chat" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen 
      name="Planner" 
      component={PlaceholderHomeScreen} // Replace with PlannerScreen
      options={{
        title: 'Planner',
        // tabBarIcon: ({ focused, color, size }) => (
        //   <Icon name="calendar" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={PlaceholderProfileScreen}
      options={{
        title: 'Profile',
        // tabBarIcon: ({ focused, color, size }) => (
        //   <Icon name="user" size={size} color={color} />
        // ),
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