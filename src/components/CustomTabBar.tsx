// src/components/CustomTabBar.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  isCenter?: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, isCenter = false }) => {
  if (isCenter) {
    return (
      <View style={styles.centerIconContainer}>
        <LinearGradient
          colors={focused ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
          style={styles.centerIconGradient}
        >
          <Ionicons 
            name={name} 
            size={28} 
            color="white" 
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.iconContainer}>
      <Ionicons 
        name={name} 
        size={24} 
        color={focused ? '#667eea' : '#999'} 
      />
    </View>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const getIconName = (routeName: string): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Documents':
        return 'document-text';
      case 'Assistant':
        return 'chatbubble-ellipses';
      case 'Planner':
        return 'calendar';
      case 'Profile':
        return 'person';
      default:
        return 'help';
    }
  };

  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;
          const isCenter = route.name === 'Assistant';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabItem,
                isCenter && styles.centerTabItem
              ]}
            >
              <TabBarIcon 
                name={getIconName(route.name)} 
                focused={isFocused} 
                isCenter={isCenter}
              />
              {!isCenter && (
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? '#667eea' : '#999' }
                ]}>
                  {label as string}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    elevation: 8,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CustomTabBar;