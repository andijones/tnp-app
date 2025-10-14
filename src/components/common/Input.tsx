import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, KeyboardTypeOptions, TextInputProps } from 'react-native';
import { theme } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  multiline = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  numberOfLines,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.multilineInput
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.text.tertiary}
        returnKeyType={multiline ? 'default' : 'done'}
        blurOnSubmit={!multiline}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    ...theme.typography.label,
    color: '#1F5932', // Green-950
    fontSize: 16, // 12px Figma × 1.33
    fontWeight: '600',
    lineHeight: 16, // normal line-height
    marginBottom: 11, // 8px Figma × 1.33
  },
  input: {
    // Figma styles converted to our scale
    paddingHorizontal: 21, // 16px Figma × 1.33
    paddingVertical: 16, // Adjust vertical padding for better text clearance
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 11, // 8px Figma × 1.33
    borderWidth: 2, // Match focused state to prevent jumping
    borderColor: '#FFFFFF', // White border for inactive state
    backgroundColor: '#FFFFFF',

    // Text styling
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'System', // System font supports light weights better
    fontWeight: '400', // Regular weight
    lineHeight: theme.typography.body.lineHeight,
    letterSpacing: theme.typography.body.letterSpacing,
    color: theme.colors.text.primary,
    height: 69, // 52px Figma × 1.33 scale factor
    textAlignVertical: 'center', // Ensure proper vertical text alignment

    // Remove shadows for clean design
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  multilineInput: {
    minHeight: 107, // 80px Figma × 1.33
    textAlignVertical: 'top',
    paddingTop: 21, // Maintain consistent padding
  },
  inputFocused: {
    borderRadius: 11, // 8px Figma × 1.33 (var(--Spacing-8, 8px))
    borderWidth: 2, // 2px solid from Figma
    borderColor: '#26733E', // var(--Green-900, #26733E)
    backgroundColor: '#FFFFFF', // var(--Neutral-white, #FFF)
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: '#fef2f2',
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: 5, // 4px Figma × 1.33
  },
});