import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface NovaBadgeProps {
  novaGroup: 1 | 2 | 3 | 4;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const NovaBadge: React.FC<NovaBadgeProps> = ({
  novaGroup,
  size = 'medium',
  showLabel = false,
}) => {
  const getNovaInfo = () => {
    switch (novaGroup) {
      case 1:
        return {
          color: theme.colors.nova.group1,
          label: 'Unprocessed',
          description: 'Natural foods',
        };
      case 2:
        return {
          color: theme.colors.nova.group2,
          label: 'Culinary Ingredients',
          description: 'Natural ingredients',
        };
      case 3:
        return {
          color: theme.colors.nova.group3,
          label: 'Processed',
          description: 'Some processing',
        };
      case 4:
        return {
          color: theme.colors.nova.group4,
          label: 'Ultra-processed',
          description: 'Heavily processed',
        };
    }
  };

  const info = getNovaInfo();

  return (
    <View style={[styles.container, showLabel && styles.containerWithLabel]}>
      <View style={[
        styles.badge,
        styles[size],
        { backgroundColor: info.color }
      ]}>
        <Text style={[styles.text, styles[`${size}Text`]]}>
          NOVA {novaGroup}
        </Text>
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{info.label}</Text>
          <Text style={styles.description}>{info.description}</Text>
        </View>
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
  
  labelContainer: {
    marginTop: theme.spacing.xs,
  },
  
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  description: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});