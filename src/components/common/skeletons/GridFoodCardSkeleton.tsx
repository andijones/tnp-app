import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonLine } from '../Skeleton';
import { theme } from '../../../theme';

export const GridFoodCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* White container with centered image skeleton */}
      <View style={styles.imageOuterContainer}>
        <View style={styles.imageInnerContainer}>
          <Skeleton width="75%" height="75%" borderRadius={6} />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Title skeleton - 2 lines */}
        <SkeletonLine width="90%" style={{ marginBottom: 4 }} />
        <SkeletonLine width="70%" style={{ marginBottom: 6 }} />

        {/* Bottom row: ingredient count and processing bar */}
        <View style={styles.bottomRow}>
          <SkeletonLine width="60%" height={12} />
          <Skeleton width={40} height={8} borderRadius={2} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    overflow: 'visible',
    marginBottom: 24, // Match FoodGrid vertical spacing
  },
  imageOuterContainer: {
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageInnerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  content: {
    paddingTop: 10,
    paddingHorizontal: 2,
    gap: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
});
