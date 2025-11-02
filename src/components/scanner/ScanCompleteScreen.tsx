import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface ScanCompleteScreenProps {
  novaGroup: 1 | 2 | 3 | 4;
  onCelebrationTrigger?: () => void; // Callback to trigger celebration animation
}

/**
 * Unified scan completion screen used by both barcode and ingredient scanners.
 * Shows positive feedback for non-UPF foods and warning for UPF foods.
 */
export const ScanCompleteScreen: React.FC<ScanCompleteScreenProps> = ({
  novaGroup,
  onCelebrationTrigger,
}) => {
  const isNonUPF = novaGroup <= 3;

  // Trigger celebration animation for non-UPF foods
  useEffect(() => {
    if (isNonUPF && onCelebrationTrigger) {
      onCelebrationTrigger();
    }
  }, [isNonUPF, onCelebrationTrigger]);

  // Get title and subtitle based on NOVA group
  const getCompletionText = () => {
    if (isNonUPF) {
      switch (novaGroup) {
        case 1:
          return {
            title: 'Great Choice!',
            subtitle: 'Natural and unprocessed',
          };
        case 2:
          return {
            title: 'Good Find!',
            subtitle: 'Single ingredient food',
          };
        case 3:
          return {
            title: 'Lightly Processed',
            subtitle: 'Made with natural ingredients',
          };
        default:
          return {
            title: 'Scan Complete',
            subtitle: 'Analysis finished',
          };
      }
    } else {
      return {
        title: 'Ultra-Processed',
        subtitle: 'Contains additives and processed ingredients',
      };
    }
  };

  const { title, subtitle } = getCompletionText();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon with colored background */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isNonUPF ? '#E0FFE7' : 'rgba(255, 59, 48, 0.15)' },
          ]}
        >
          <Ionicons
            name={isNonUPF ? 'checkmark-circle' : 'warning'}
            size={80}
            color={isNonUPF ? '#22c55e' : '#ef4444'}
          />
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: isNonUPF ? '#26733E' : '#9A2019' },
          ]}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 31,
    letterSpacing: -0.78,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
