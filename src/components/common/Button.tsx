import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  leftIcon,
  rightIcon,
}) => {
  const hasIcons = leftIcon || rightIcon;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {hasIcons ? (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      ) : (
        <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
  },
  md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56,
  },
  
  disabled: {
    opacity: 0.4,
  },
  
  // Text styles
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  textText: {
    color: theme.colors.primary,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
});