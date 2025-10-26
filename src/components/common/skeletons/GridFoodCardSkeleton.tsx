import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonLine } from '../Skeleton';
import { theme } from '../../../theme';

export const GridFoodCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Image skeleton */}
      <Skeleton width="100%" height={140} borderRadius={6} />

      {/* Content area */}
      <View style={styles.content}>
        {/* Title skeleton - 2 lines */}
        <SkeletonLine width="90%" style={{ marginBottom: 4 }} />
        <SkeletonLine width="70%" style={{ marginBottom: 8 }} />

        {/* Badge skeleton */}
        <Skeleton width={60} height={24} borderRadius={12} style={{ marginBottom: 8 }} />

        {/* Meta info skeleton */}
        <SkeletonLine width="50%" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    overflow: 'hidden',
    marginBottom: 16,
  },
  content: {
    padding: 12,
  },
});
