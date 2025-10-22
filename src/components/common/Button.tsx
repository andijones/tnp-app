import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const hasIcons = leftIcon || rightIcon;
  const defaultAccessibilityLabel = accessibilityLabel || title;
  const defaultAccessibilityHint = accessibilityHint || `Double tap to ${title.toLowerCase()}`;

  const renderContent = () => {
    if (hasIcons) {
      return (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      );
    }
    return <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>;
  };

  // Secondary button has gradient overlay
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[styles.base, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={defaultAccessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={defaultAccessibilityHint}
        accessibilityState={{ disabled }}
      >
        <LinearGradient
          colors={['rgba(5, 55, 22, 0.2)', 'rgba(31, 89, 50, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.gradientOverlay, styles.secondary]}
        >
          {renderContent()}
          {/* Inset highlight */}
          <View style={styles.insetHighlight} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Outline button has gradient overlay
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.base, styles.outlineContainer, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={defaultAccessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={defaultAccessibilityHint}
        accessibilityState={{ disabled }}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(212, 207, 181, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0.5, 1]}
          style={[styles.gradientOverlay, styles.outline]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Primary and Text variants don't need gradient
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
      accessible={true}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={defaultAccessibilityHint}
      accessibilityState={{ disabled }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56, // Updated from Figma
    borderRadius: 9999, // Fully rounded (pill shape)
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // For gradient clipping
  },

  // Primary: Bright green button
  primary: {
    backgroundColor: '#44DB6D', // Green-500
    borderWidth: 1,
    borderColor: '#3CC161', // Green-600
    paddingHorizontal: 24, // Padding for non-gradient variants
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Secondary: Dark green button with gradient overlay
  secondary: {
    backgroundColor: '#1F5932', // Green-950 base
    borderWidth: 1,
    borderColor: '#1F5932',
  },

  // Outline container: Border and base color
  outlineContainer: {
    backgroundColor: '#FAFAFA', // Neutral-50 base (bottom layer)
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)', // Tan border from Figma
    // Shadow from Figma: 0 1px 3px 0 rgba(90, 82, 34, 0.10), 0 1px 2px 0 rgba(90, 82, 34, 0.06)
    shadowColor: 'rgba(90, 82, 34, 1)', // Warm shadow color
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Outline gradient: Subtle tan gradient overlay
  outline: {
    backgroundColor: 'transparent', // Transparent so base shows through
  },

  // Text: Transparent button (text only)
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 24, // Padding for non-gradient variants
  },

  // Gradient overlay container
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999, // Fully rounded to match base
    paddingHorizontal: 24, // Padding inside gradient
  },

  // Inset highlight for secondary button
  insetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  disabled: {
    opacity: 0.4,
  },

  // Text styles - direct from Figma
  buttonText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700', // Bold
    lineHeight: 19, // 1.197 ratio
    letterSpacing: -0.48,
    textAlign: 'center',
  },

  primaryText: {
    color: '#1F5932', // Green-950 text on bright green
  },

  secondaryText: {
    color: '#FFFFFF', // White text on dark green
  },

  outlineText: {
    color: '#404040', // Neutral-700
  },

  textText: {
    color: '#525252', // Neutral-600
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
