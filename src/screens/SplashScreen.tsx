import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { theme } from '../theme';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('SplashScreen mounted and starting animation');
    // Set status bar style for splash screen
    StatusBar.setBarStyle('light-content', true);

    // Staggered animation sequence
    const animationSequence = Animated.sequence([
      // Initial delay
      Animated.delay(300),

      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      // Subtle rotation for polish
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),

      // Hold for a moment
      Animated.delay(800),

      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      console.log('SplashScreen animation finished');
      // Reset status bar style
      StatusBar.setBarStyle('dark-content', true);
      onAnimationComplete?.();
    });

    return () => {
      animationSequence.stop();
    };
  }, [fadeAnim, scaleAnim, rotateAnim, onAnimationComplete]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.green[900]} barStyle="light-content" />

      {/* Animated logo container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolation },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo-splash.png')}
          style={{ width: 169, height: 100 }}
          resizeMode="contain"
        />
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.green[900], // #26733E
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});