import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getProcessingLevel } from '../../utils/processingLevel';

interface ProcessingLevelScaleProps {
  novaGroup: 1 | 2 | 3 | 4;
  variant?: 'compact' | 'detailed';
}

/**
 * Visual scale showing where food sits on processing spectrum
 * Whole Food ●━━━━○━━━━○ Processed
 */
export const ProcessingLevelScale: React.FC<ProcessingLevelScaleProps> = ({
  novaGroup,
  variant = 'compact',
}) => {
  const level = getProcessingLevel(novaGroup);
  const colorConfig = theme.colors.processing[level.type];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.labelBadge, { backgroundColor: colorConfig.light }]}>
          <Text style={[styles.labelText, { color: colorConfig.color }]}>
            {level.label}
          </Text>
        </View>
      </View>

      {/* Scale Bar */}
      <View style={styles.scaleContainer}>
        {/* Labels */}
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabelText}>Whole Food</Text>
          <Text style={styles.scaleLabelText}>Processed</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          {/* Background track with gradient effect */}
          <View style={styles.progressBackground} />

          {/* Indicator dot */}
          <View
            style={[
              styles.indicator,
              {
                left: `${level.position}%`,
                backgroundColor: colorConfig.color,
                shadowColor: colorConfig.color,
              },
            ]}
          >
            <View style={styles.indicatorInner} />
          </View>

          {/* Milestone markers */}
          <View style={[styles.milestone, { left: '10%' }]} />
          <View style={[styles.milestone, { left: '35%' }]} />
          <View style={[styles.milestone, { left: '65%' }]} />
          <View style={[styles.milestone, { left: '90%' }]} />
        </View>
      </View>

      {/* Description (detailed variant) */}
      {variant === 'detailed' && (
        <Text style={styles.description}>{level.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },

  header: {
    marginBottom: theme.spacing.md,
  },

  labelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },

  labelText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },

  scaleContainer: {
    marginBottom: theme.spacing.sm,
  },

  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 4,
  },

  scaleLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },

  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 4,
    position: 'relative',
    marginHorizontal: 4,
  },

  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    // Subtle gradient effect from green to orange
    backgroundColor: theme.colors.neutral[200],
  },

  milestone: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: theme.colors.neutral[300],
    top: 0,
    transform: [{ translateX: -1 }],
  },

  indicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -6, // Center on track
    transform: [{ translateX: -10 }], // Center the dot
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  indicatorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontFamily: 'System',
  },
});
