// src/components/TypingIndicator.tsx - WhatsApp-style typing animation
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TypingIndicatorProps {
  visible: boolean;
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  visible, 
  message = "Betty is typing" 
}) => {
  const dot1Animation = useRef(new Animated.Value(0)).current;
  const dot2Animation = useRef(new Animated.Value(0)).current;
  const dot3Animation = useRef(new Animated.Value(0)).current;
  const containerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in the container
      Animated.timing(containerAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start the bouncing animation for dots
      const createDotAnimation = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 300,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 300,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const dot1Anim = createDotAnimation(dot1Animation, 0);
      const dot2Anim = createDotAnimation(dot2Animation, 200);
      const dot3Anim = createDotAnimation(dot3Animation, 400);

      dot1Anim.start();
      dot2Anim.start();
      dot3Anim.start();
    } else {
      // Fade out the container
      Animated.timing(containerAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Stop all dot animations
      dot1Animation.stopAnimation();
      dot2Animation.stopAnimation();
      dot3Animation.stopAnimation();
      
      // Reset dot positions
      dot1Animation.setValue(0);
      dot2Animation.setValue(0);
      dot3Animation.setValue(0);
    }
  }, [visible, dot1Animation, dot2Animation, dot3Animation, containerAnimation]);

  const getDotStyle = (animatedValue: Animated.Value) => ({
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: containerAnimation,
          transform: [
            {
              translateY: containerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.messageContainer}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color="#667eea" />
        </View>
        
        <View style={styles.messageBubble}>
          <View style={styles.textContainer}>
            <Text style={styles.typingText}>{message}</Text>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, getDotStyle(dot1Animation)]} />
              <Animated.View style={[styles.dot, getDotStyle(dot2Animation)]} />
              <Animated.View style={[styles.dot, getDotStyle(dot3Animation)]} />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Alternative pulse-style typing indicator
export const PulseTypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  visible, 
  message = "Betty is thinking" 
}) => {
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const containerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in container
      Animated.timing(containerAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      pulse.start();
    } else {
      // Fade out
      Animated.timing(containerAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      pulseAnimation.stopAnimation();
      pulseAnimation.setValue(0);
    }
  }, [visible, pulseAnimation, containerAnimation]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: containerAnimation,
        },
      ]}
    >
      <View style={styles.messageContainer}>
        <Animated.View 
          style={[
            styles.aiAvatar,
            {
              transform: [
                {
                  scale: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
              opacity: pulseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ]}
        >
          <Ionicons name="sparkles" size={14} color="#667eea" />
        </Animated.View>
        
        <View style={styles.messageBubble}>
          <Text style={styles.typingText}>{message}...</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  messageBubble: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 44,
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#667eea',
  },
});

export default TypingIndicator;