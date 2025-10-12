import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getProcessingLevel } from '../../utils/processingLevel';

interface ProcessingLevelBannerProps {
  novaGroup?: number;
  style?: any;
}

/**
 * Card banner showing processing level with visual scale
 * Replaces NovaRatingBanner with user-friendly design
 */
export const ProcessingLevelBanner: React.FC<ProcessingLevelBannerProps> = ({
  novaGroup,
  style,
}) => {
  if (!novaGroup) {
    return null;
  }

  const level = getProcessingLevel(novaGroup);
  const colorConfig = theme.colors.processing[level.type];

  // Icon based on processing level
  const getIcon = () => {
    switch (level.type) {
      case 'wholeFood':
        return 'leaf';
      case 'extractedFoods':
        return 'restaurant';
      case 'lightlyProcessed':
        return 'warning-outline';
      case 'processed':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorConfig.light }, style]}>
      <View style={styles.content}>
        {/* Left: Icon and Text */}
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: colorConfig.color }]}>
            <Ionicons name={getIcon()} size={20} color="white" />
          </View>

          <View style={styles.textContent}>
            <Text style={[styles.labelText, { color: colorConfig.color }]}>
              {level.label}
            </Text>
            <Text style={styles.descriptionText}>{level.description}</Text>
          </View>
        </View>

        {/* Right: Visual Scale Indicator */}
        <View style={styles.rightContent}>
          <View style={styles.miniScale}>
            <View style={styles.miniScaleTrack}>
              <View
                style={[
                  styles.miniScaleIndicator,
                  {
                    left: `${level.position}%`,
                    backgroundColor: colorConfig.color,
                  },
                ]}
              />
            </View>
            <View style={styles.miniScaleLabels}>
              <Text style={styles.miniScaleLabel}>Whole</Text>
              <Text style={styles.miniScaleLabel}>Processed</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },

  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  textContent: {
    flex: 1,
  },

  labelText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 2,
  },

  descriptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },

  rightContent: {
    alignItems: 'flex-end',
  },

  miniScale: {
    width: 80,
  },

  miniScaleTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 4,
  },

  miniScaleIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -3,
    transform: [{ translateX: -6 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  miniScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  miniScaleLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    fontFamily: 'System',
  },
});
