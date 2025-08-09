// src/screens/PlannerScreen.tsx - Updated to use Enhanced Planner
import React from 'react';
import EnhancedPlannerScreen from './EnhancedPlannerScreen';

// Simply export the Enhanced Planner Screen
// This maintains backward compatibility while using the new implementation
const PlannerScreen: React.FC = () => {
  return <EnhancedPlannerScreen />;
};

export default PlannerScreen;