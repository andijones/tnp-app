import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  multiline = false,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, multiline && styles.multilineInput]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        placeholderTextColor={theme.colors.text.tertiary}
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
    padding: 21, // 16px Figma × 1.33
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 11, // 8px Figma × 1.33
    borderWidth: 1,
    borderColor: '#E5E5E5', // Neutral-200
    backgroundColor: '#FFFFFF',
    
    // Text styling
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'System', // System font supports light weights better
    fontWeight: '400', // Regular weight
    lineHeight: theme.typography.body.lineHeight,
    letterSpacing: theme.typography.body.letterSpacing,
    color: theme.colors.text.primary,
    minHeight: 64, // 48px Figma × 1.33
    
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