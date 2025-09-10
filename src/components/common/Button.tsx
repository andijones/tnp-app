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
    borderRadius: 11, // 8px Figma size × 1.33
    alignItems: 'center',
    justifyContent: 'center',
    height: 64, // 48px Figma size × 1.33
    paddingHorizontal: 24,
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
    backgroundColor: '#1F5932',
    borderWidth: 1,
    borderColor: '#144925',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    // Note: React Native doesn't support gradient backgrounds or inset shadows natively
    // You may need to use react-native-linear-gradient for the gradient effect
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
    fontSize: theme.typography.subtitle.fontSize,
    fontFamily: theme.typography.subtitle.fontFamily,
    fontWeight: theme.typography.subtitle.fontWeight,
    lineHeight: theme.typography.subtitle.lineHeight,
    letterSpacing: theme.typography.subtitle.letterSpacing,
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
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  leftIcon: {
    marginRight: theme.spacing.sm,
    opacity: 0.5,
  },
  
  rightIcon: {
    marginLeft: theme.spacing.sm,
    opacity: 0.5,
  },
});