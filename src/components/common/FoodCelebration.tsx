import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FOOD_EMOJIS = ['🍏', '🍌', '🥗', '🍅', '🥜', '🥕', '🌽', '🫑', '🍇', '🍓', '🥭', '🍒', '🥥'];
const EMOJI_COUNT = 40; // Increased from 25 to 40 emojis

interface FoodCelebrationProps {
  onComplete?: () => void;
}

export const FoodCelebration: React.FC<FoodCelebrationProps> = ({ onComplete }) => {
  const emojis = useRef(
    Array.from({ length: EMOJI_COUNT }, (_, index) => ({
      id: index,
      emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
      translateY: useRef(new Animated.Value(-100)).current,
      translateX: useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current,
      rotate: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(1)).current,
      scale: useRef(new Animated.Value(0.5 + Math.random() * 0.8)).current, // Random size between 0.5 and 1.3
      duration: 2500 + Math.random() * 2500, // Random duration between 2.5-5 seconds (increased)
      delay: Math.random() * 800, // Stagger start times (increased spread)
    }))
  ).current;

  useEffect(() => {
    // Trigger celebratory haptic pattern - feels like fireworks and confetti!
    const celebrationHaptics = async () => {
      // Initial burst (like fireworks launching)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Quick confetti burst
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 160);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 240);

      // Second burst
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 350);

      // More confetti
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 430);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 510);

      // Final celebration pop
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 650);

      // Trailing sparkles
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 750);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 850);
    };

    celebrationHaptics();

    // Start all animations
    const animations = emojis.map((item) => {
      return Animated.parallel([
        // Fall down
        Animated.timing(item.translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration: item.duration,
          delay: item.delay,
          useNativeDriver: true,
        }),
        // Slight horizontal drift
        Animated.timing(item.translateX, {
          toValue: item.translateX._value + (Math.random() - 0.5) * 100,
          duration: item.duration,
          delay: item.delay,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(item.rotate, {
          toValue: (Math.random() - 0.5) * 4, // Random rotation between -2 and 2 full rotations
          duration: item.duration,
          delay: item.delay,
          useNativeDriver: true,
        }),
        // Fade out at the end
        Animated.sequence([
          Animated.delay(item.delay + item.duration * 0.7), // Start fading at 70% of animation
          Animated.timing(item.opacity, {
            toValue: 0,
            duration: item.duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // Run all animations in parallel
    Animated.parallel(animations).start(() => {
      // Call onComplete after all animations finish
      if (onComplete) {
        onComplete();
      }
    });

    // Cleanup
    return () => {
      emojis.forEach((item) => {
        item.translateY.stopAnimation();
        item.translateX.stopAnimation();
        item.rotate.stopAnimation();
        item.opacity.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {emojis.map((item) => (
        <Animated.Text
          key={item.id}
          style={[
            styles.emoji,
            {
              transform: [
                { translateX: item.translateX },
                { translateY: item.translateY },
                {
                  rotate: item.rotate.interpolate({
                    inputRange: [-4, 4],
                    outputRange: ['-720deg', '720deg'],
                  }),
                },
                { scale: item.scale },
              ],
              opacity: item.opacity,
            },
          ]}
        >
          {item.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  emoji: {
    position: 'absolute',
    fontSize: 36,
    top: -100,
  },
});
