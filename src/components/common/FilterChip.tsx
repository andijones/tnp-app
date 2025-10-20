import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

/**
 * Filter chip component for multi-select filters
 * UX: Clear active/inactive states, tap to toggle
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  icon,
  count,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && styles.chipActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.chipContent}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color="#737373" // Neutral-500 - gray icons
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.chipText,
          active && styles.chipTextActive,
        ]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[
            styles.countBadge,
            active && styles.countBadgeActive,
          ]}>
            <Text style={[
              styles.countText,
              active && styles.countTextActive,
            ]}>
              {count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16, // Figma spacing-16
    paddingVertical: 8, // Figma spacing-8
    borderRadius: 1000, // Fully rounded pill
    backgroundColor: '#FAFAFA', // Neutral-50 base from Figma
    borderWidth: 0.5, // Figma 0.5px
    borderColor: 'rgba(161, 153, 105, 0.3)', // Subtle warm border from Figma
    marginRight: theme.spacing.sm,
    // Shadow from Figma
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },

  chipActive: {
    backgroundColor: '#FAFAFA', // Same as inactive
    borderColor: 'rgba(161, 153, 105, 0.3)', // Same subtle border
    borderWidth: 0.5,
    // Same shadow for active state
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    marginRight: 4,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717', // Neutral-900 from Figma
    fontFamily: 'System',
    letterSpacing: -0.28, // Figma tracking -0.28px
  },

  chipTextActive: {
    color: '#171717', // Same color whether active or not
    fontWeight: '600',
    letterSpacing: -0.28,
  },

  countBadge: {
    marginLeft: 6,
    minWidth: 16,
    width: 16,
    height: 16,
    borderRadius: 8, // Perfect circle (16px / 2)
    backgroundColor: '#1F5932', // Green-950 from Figma
    justifyContent: 'center',
    alignItems: 'center',
  },

  countBadgeActive: {
    backgroundColor: '#1F5932', // Same whether active or not
  },

  countText: {
    fontSize: 10,
    fontWeight: '600', // Semibold from Figma
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: -0.2, // Figma tracking -0.2px
  },

  countTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
