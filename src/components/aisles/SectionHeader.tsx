import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  showSeeAll = false,
  onSeeAllPress,
  icon,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {showSeeAll && onSeeAllPress && (
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={onSeeAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.primary}
            style={styles.seeAllIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },

  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  seeAllIcon: {
    marginLeft: 4,
  },
});