import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import your navigation, theme, and components
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppStatusBar from './src/components/AppStatusBar';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStatusBar />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}