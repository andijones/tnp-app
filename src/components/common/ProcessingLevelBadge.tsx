import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getProcessingLevel } from '../../utils/processingLevel';

interface ProcessingLevelBadgeProps {
  novaGroup: 1 | 2 | 3 | 4;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * Simple badge showing processing level with color
 * Replaces the old NovaBadge with user-friendly terminology
 */
export const ProcessingLevelBadge: React.FC<ProcessingLevelBadgeProps> = ({
  novaGroup,
  size = 'medium',
  showLabel = false,
}) => {
  const level = getProcessingLevel(novaGroup);
  const colorConfig = theme.colors.processing[level.type];

  return (
    <View style={[styles.container, showLabel && styles.containerWithLabel]}>
      <View
        style={[
          styles.badge,
          styles[size],
          { backgroundColor: colorConfig.color }
        ]}
      >
        <Text style={[styles.text, styles[`${size}Text`]]}>
          {showLabel ? level.label : level.shortLabel}
        </Text>
      </View>
      {showLabel && (
        <Text style={styles.description}>{level.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  containerWithLabel: {
    alignItems: 'flex-start',
  },

  badge: {
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  medium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },

  large: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
    textAlign: 'center',
  },

  smallText: {
    fontSize: 10,
  },

  mediumText: {
    fontSize: theme.typography.fontSize.xs,
  },

  largeText: {
    fontSize: theme.typography.fontSize.sm,
  },

  description: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
