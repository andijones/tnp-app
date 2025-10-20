import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

export const BottomSheetSeparator: React.FC = () => {
  return <View style={styles.separator} />;
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: theme.colors.neutral[100],
    marginVertical: 12,
  },
});
