import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={theme.colors.text.primary} 
              style={styles.icon}
            />
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        
        {action && (
          <TouchableOpacity style={styles.action} onPress={action.onPress}>
            <Text style={styles.actionText}>{action.label}</Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  icon: {
    marginRight: theme.spacing.sm,
  },
  
  title: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
  },
  
  subtitle: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionText: {
    ...theme.typography.subtextMedium,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
});