import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';

// Import your screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Define the navigation param list
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  // TODO: Add your main app screens here later
  // Home: undefined;
  // Profile: undefined;
};

// Navigation prop types for each screen
export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // Hide headers for all screens
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Splash Screen */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{
            gestureEnabled: false, // Disable swipe back on splash
          }}
        />
        
        {/* Authentication Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false, // Disable swipe back to splash
          }}
        />
        
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
        />
        
        {/* TODO: Add your main app screens here later */}
        {/* 
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        */}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;