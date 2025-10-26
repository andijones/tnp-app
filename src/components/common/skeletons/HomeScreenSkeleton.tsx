import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonLine } from '../Skeleton';
import { GridFoodCardSkeleton } from './GridFoodCardSkeleton';
import { theme } from '../../../theme';

export const HomeScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonLine width={150} style={{ height: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={48} borderRadius={9999} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Skeleton width={100} height={36} borderRadius={18} style={{ marginRight: 8 }} />
        <Skeleton width={120} height={36} borderRadius={18} style={{ marginRight: 8 }} />
        <Skeleton width={90} height={36} borderRadius={18} />
      </View>

      {/* Food Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.gridItem}>
              <GridFoodCardSkeleton />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
  },
});
