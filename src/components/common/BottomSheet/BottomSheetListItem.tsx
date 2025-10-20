import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface BottomSheetListItemProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export const BottomSheetListItem: React.FC<BottomSheetListItemProps> = ({
  label,
  selected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>{label}</Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.green[950]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    letterSpacing: -0.48,
    color: theme.colors.neutral[800],
  },
});
