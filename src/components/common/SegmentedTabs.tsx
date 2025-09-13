import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface SegmentedTabsProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  style?: ViewStyle;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  options,
  selectedIndex,
  onSelectionChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.segment,
              index === 0 && styles.firstSegment,
              index === options.length - 1 && styles.lastSegment,
              isSelected && styles.selectedSegment,
            ]}
            onPress={() => onSelectionChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              isSelected && styles.selectedSegmentText,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  firstSegment: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  lastSegment: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  selectedSegment: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    fontFamily: 'System',
  },
  selectedSegmentText: {
    color: '#000000',
    fontWeight: '600',
  },
});