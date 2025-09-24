import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
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
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {hasIcons ? (
        <View style={styles.content}>
          {leftIcon && <View style={[styles.leftIcon, styles[`${variant}Icon`]]}>{leftIcon}</View>}
          <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
          {rightIcon && <View style={[styles.rightIcon, styles[`${variant}Icon`]]}>{rightIcon}</View>}
        </View>
      ) : (
        <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 11, // 8px Figma size × 1.33 (will be overridden for secondary)
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 24,
    width: '100%',
  },
  
  // Variants
  primary: {
    backgroundColor: '#44DB6D',
    borderWidth: 1,
    borderColor: '#3CC161',
    shadowColor: '#9C9C9C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  secondary: {
    backgroundColor: '#1F5932', // var(--Green-950, #1F5932)
    borderRadius: 8, // var(--Spacing-8, 8px) - exact Figma value
    borderWidth: 1,
    borderColor: '#144925', // border: 1px solid #144925
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // 0 1px 4px 0 rgba(0, 0, 0, 0.10)
    shadowRadius: 4,
    elevation: 2,
    // Note: The Figma design includes a linear gradient and inset shadow:
    // background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.10) 100%), var(--Green-950, #1F5932);
    // box-shadow: 0 1px 0 0 rgba(38, 106, 60, 0.50) inset, 0 1px 4px 0 rgba(0, 0, 0, 0.10);
    // These effects are not natively supported in React Native
  },
  tertiary: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  text: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1F5932',
  },
  
  
  disabled: {
    opacity: 0.4,
  },
  
  // Text styles
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 19, // 16px * 1.2 scale factor
    fontWeight: '600',
    lineHeight: Math.round(19 * 1.19712), // 119.712% of 19px = 22.75px rounded to 23
    letterSpacing: -0.58, // -0.48px * 1.2 scale factor
    textAlign: 'center',
  },
  primaryText: {
    color: '#1F5932', // Green-950
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  tertiaryText: {
    color: theme.colors.text.primary,
  },
  textText: {
    color: '#1F5932',
  },

  // Icon color styles (same as text colors but with 50% opacity)
  primaryIcon: {
    color: '#1F5932',
    opacity: 0.5,
  },
  secondaryIcon: {
    color: '#FFFFFF',
    opacity: 0.5,
  },
  tertiaryIcon: {
    color: theme.colors.text.primary,
    opacity: 0.5,
  },
  textIcon: {
    color: '#1F5932',
    opacity: 0.5,
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