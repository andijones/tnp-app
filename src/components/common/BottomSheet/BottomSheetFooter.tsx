import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

interface BottomSheetFooterProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
  primaryDisabled?: boolean;
}

export const BottomSheetFooter: React.FC<BottomSheetFooterProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Clear/Secondary Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onSecondaryPress}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
      </TouchableOpacity>

      {/* Apply/Primary Button */}
      <TouchableOpacity
        style={[styles.primaryButton, primaryDisabled && styles.primaryButtonDisabled]}
        onPress={onPrimaryPress}
        activeOpacity={0.8}
        disabled={primaryDisabled}
      >
        <View style={styles.primaryButtonInner}>
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: theme.colors.neutral.BG2,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 19,
    letterSpacing: -0.48,
    color: theme.colors.neutral[600],
  },
  primaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: theme.colors.green[950],
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#043614',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonInner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 19,
    letterSpacing: -0.48,
    color: theme.colors.neutral.white,
  },
});
