// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Import any other providers you might have
// import { ThemeProvider } from './src/contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Add other providers here if needed */}
        {/* <ThemeProvider> */}
          <AppNavigator />
          <StatusBar style="light" />
        {/* </ThemeProvider> */}
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;