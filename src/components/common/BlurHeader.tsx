import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface BlurHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  opacity?: number;
}

export const BlurHeader: React.FC<BlurHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  backgroundColor = 'rgba(255, 255, 255, 0.75)',
  opacity = 0.75,
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurContainer}
        >
          <View style={[styles.overlay, { backgroundColor }]} />
          <View style={styles.headerContent}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            )}

            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}

            <View style={styles.rightContainer}>
              {rightComponent}
            </View>
          </View>
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

  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },

  rightContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});