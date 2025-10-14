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
      activeOpacity={0.8}
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
    height: 48, // Figma 48px → 48pt RN (no scaling needed)
    borderRadius: 8, // Keep at 8px (design system standard)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },

  // Primary: Bright green button
  primary: {
    backgroundColor: '#44DB6D',
    borderWidth: 0.5,
    borderColor: '#3CC161',
    shadowColor: 'rgba(90, 82, 34, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Secondary: Dark green button
  secondary: {
    backgroundColor: '#1F5932',
    borderWidth: 0.5,
    borderColor: '#043614',
    shadowColor: 'rgba(90, 82, 34, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Tertiary (Outline): Light neutral button
  tertiary: {
    backgroundColor: '#FAFAFA',
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    shadowColor: 'rgba(90, 82, 34, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Text: Border-only button
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#1F5932',
  },

  disabled: {
    opacity: 0.4,
  },

  // Text styles - direct from Figma (no scaling)
  buttonText: {
    fontFamily: 'System',
    fontSize: 16, // Figma 16px → 16pt RN
    fontWeight: '600',
    lineHeight: 19, // Figma 19.15px → 19pt
    letterSpacing: -0.48, // Figma -0.48px
    textAlign: 'center',
  },

  primaryText: {
    color: '#1F5932', // Dark green text on bright green background
  },

  secondaryText: {
    color: '#FFFFFF', // White text on dark green background
  },

  tertiaryText: {
    color: '#404040', // Neutral-700
  },

  textText: {
    color: '#1F5932', // Dark green text
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  leftIcon: {
    marginRight: 8,
  },

  rightIcon: {
    marginLeft: 8,
  },
});
