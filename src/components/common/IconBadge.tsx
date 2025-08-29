import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface IconBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  label,
  value,
  onPress,
  color = theme.colors.text.primary,
  backgroundColor = theme.colors.surface,
  size = 'medium',
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      style={[
        styles.container, 
        styles[size],
        { backgroundColor },
        onPress && styles.pressable
      ]} 
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={styles[`${size}Icon`].fontSize} 
        color={color} 
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {value !== undefined && (
        <Text style={[styles.value, { color }]}>{value}</Text>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 60,
  },
  
  pressable: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  small: {
    padding: theme.spacing.sm,
    minWidth: 50,
  },
  
  medium: {
    padding: theme.spacing.md,
    minWidth: 60,
  },
  
  large: {
    padding: theme.spacing.lg,
    minWidth: 80,
  },
  
  smallIcon: {
    fontSize: 16,
  },
  
  mediumIcon: {
    fontSize: 20,
  },
  
  largeIcon: {
    fontSize: 24,
  },
  
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  
  value: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
});