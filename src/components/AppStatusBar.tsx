import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';

const AppStatusBar: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <StatusBar 
      style={isDarkMode ? 'light' : 'light'} // Keep light for gradient screens
      backgroundColor="transparent"
      translucent={true}
    />
  );
};

export default AppStatusBar;