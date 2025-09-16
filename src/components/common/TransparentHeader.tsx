import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface TransparentHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export const TransparentHeader: React.FC<TransparentHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  backgroundColor = 'rgba(255, 255, 255, 0.95)',
  textColor = theme.colors.text.primary,
  statusBarStyle = 'dark-content',
}) => {
  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.headerContainer, { backgroundColor }]}>
          <View style={styles.headerContent}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
            )}

            {title && (
              <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title}
              </Text>
            )}

            <View style={styles.rightContainer}>
              {rightComponent}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

// Green version for brand screens
export const GreenTransparentHeader: React.FC<Omit<TransparentHeaderProps, 'backgroundColor' | 'textColor' | 'statusBarStyle'> & {
  children?: React.ReactNode;
  showLogo?: boolean;
}> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  children,
  showLogo = false,
}) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.headerContainer, { backgroundColor: 'rgba(31, 89, 50, 0.95)' }]}>
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
              <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={1}>
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
        </View>
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

  headerContainer: {
    position: 'relative',
    paddingTop: 0, // SafeAreaView handles this
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