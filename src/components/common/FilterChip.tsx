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
            color={active ? theme.colors.green[950] : theme.colors.text.secondary}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.neutral[200],
    marginRight: theme.spacing.sm,
    // Subtle shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  chipActive: {
    backgroundColor: theme.colors.green[50],
    borderColor: theme.colors.green[600],
    borderWidth: 1.5,
    // Stronger shadow when active
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },

  chipTextActive: {
    color: theme.colors.green[950],
    fontWeight: '700',
  },

  countBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  countBadgeActive: {
    backgroundColor: theme.colors.green[600],
  },

  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },

  countTextActive: {
    color: '#FFFFFF',
  },
});
