import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Skeleton, SkeletonLine } from '../Skeleton';
import { theme } from '../../../theme';

const CategoryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.categoryCard}>
      <SkeletonLine width={120} style={{ height: 14 }} />
      <Skeleton width={20} height={20} borderRadius={10} />
    </View>
  );
};

export const AisleMenuSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
          <SkeletonLine width={150} style={{ flex: 1, height: 22 }} />
          <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.categoriesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CategoryCardSkeleton key={i} />
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
  scrollContent: {
    paddingBottom: 100,
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
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryCard: {
    backgroundColor: theme.colors.neutral.BG2,
    borderRadius: 8,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
