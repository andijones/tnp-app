import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

interface AislePillProps {
  label: string;
  count: number;
  onPress: () => void;
}

/**
 * Aisle pill component for displaying aisle search results
 * Shows aisle name with food count in a pill format
 */
export const AislePill: React.FC<AislePillProps> = ({
  label,
  count,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pillContent}>
        <Text style={styles.pillText}>
          {label}
        </Text>
        <Text style={styles.countText}>
          ({count})
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16, // Figma spacing-16
    paddingVertical: 8, // Figma spacing-8
    borderRadius: 1000, // Fully rounded pill
    backgroundColor: '#FAFAFA', // Neutral-50 base
    borderWidth: 0.5, // Figma 0.5px
    borderColor: 'rgba(161, 153, 105, 0.3)', // Subtle warm border
    marginRight: theme.spacing.sm,
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },

  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717', // Neutral-900
    fontFamily: 'System',
    letterSpacing: -0.28,
  },

  countText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373', // Neutral-500
    fontFamily: 'System',
    letterSpacing: -0.28,
  },
});
