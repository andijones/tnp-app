import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface GreenBlurHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export const GreenBlurHeader: React.FC<GreenBlurHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  showLogo = false,
  children,
}) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurContainer}
        >
          <View style={styles.overlay} />
          <View style={styles.headerContent}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {showLogo && (
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>TNP</Text>
              </View>
            )}

            {title && !showLogo && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}

            <View style={styles.rightContainer}>
              {rightComponent}
            </View>
          </View>

          {children && (
            <View style={styles.childrenContainer}>
              {children}
            </View>
          )}
        </BlurView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  blurContainer: {
    position: 'relative',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 89, 50, 0.65)', // Green with 65% opacity for more transparency
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },

  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },

  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },

  rightContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  childrenContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});