import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Skeleton, SkeletonLine } from '../Skeleton';
import { GridFoodCardSkeleton } from './GridFoodCardSkeleton';
import { theme } from '../../../theme';

export const AisleDetailSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
            <SkeletonLine width={150} style={{ flex: 1, height: 22 }} />
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterSection}>
          <View style={styles.filterBar}>
            <Skeleton width={100} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            <Skeleton width={120} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            <Skeleton width={90} height={36} borderRadius={18} />
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 23,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
