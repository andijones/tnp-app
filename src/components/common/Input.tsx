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
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            error && styles.inputError,
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
          placeholderTextColor="#A3A3A3"
          returnKeyType={multiline ? 'default' : 'done'}
          blurOnSubmit={!multiline}
          textAlignVertical="center"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },

  // Label - direct from Figma (no scaling)
  label: {
    fontSize: 11, // Figma 11px → 11pt RN
    fontWeight: '500',
    color: '#737373', // Neutral-500
    letterSpacing: 0.33, // Figma 0.33px
    textTransform: 'uppercase',
    marginBottom: 6, // Figma 6px
  },

  // Input Container (handles border and background)
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8, // Keep at 8px (design system standard)
    borderWidth: 1,
    borderColor: '#E5E5E5', // Neutral-200
    shadowColor: 'rgba(112, 112, 112, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },

  inputContainerFocused: {
    borderColor: '#26733E', // Green-900 - Active state
  },

  inputContainerError: {
    borderColor: '#FF2D55', // Error red
  },

  // Input Field - direct from Figma (no scaling)
  input: {
    paddingHorizontal: 16, // Figma 16px → 16pt RN
    paddingTop: 16, // iOS needs explicit padding for vertical centering
    paddingBottom: 16, // iOS needs explicit padding for vertical centering
    fontSize: 15, // Figma 15px → 15pt RN
    fontWeight: '400',
    lineHeight: 22, // Figma 22px → 22pt RN
    letterSpacing: -0.3, // Figma -0.3px
    color: '#171717', // Neutral-900
    height: 54, // Figma 54px → 54pt RN (fixed height, not minHeight)
  },

  multilineInput: {
    minHeight: 100, // Figma 100px → 100pt RN
    textAlignVertical: 'top',
    paddingTop: 16,
  },

  inputError: {
    color: '#FF2D55', // Error text color
  },

  // Error Message - direct from Figma (no scaling)
  errorText: {
    fontSize: 12, // Figma 12px → 12pt RN
    fontWeight: '400',
    lineHeight: 16, // Figma 16px → 16pt RN
    letterSpacing: -0.24, // Figma -0.24px
    color: '#FF2D55',
    marginTop: 6, // Figma 6px
  },
});
