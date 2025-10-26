import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonLine, SkeletonBox } from '../Skeleton';
import { theme } from '../../../theme';

export const FoodDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <SkeletonCircle size={36} style={{ marginLeft: 16 }} />
        <SkeletonCircle size={36} style={{ marginRight: 16 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <Skeleton width="100%" height={280} borderRadius={0} />

        {/* Processing Level Card */}
        <View style={styles.processingCard}>
          <Skeleton width={120} height={32} borderRadius={16} />
        </View>

        {/* Product Info */}
        <View style={styles.infoCard}>
          {/* Store and Aisle */}
          <View style={styles.metaRow}>
            <SkeletonLine width={80} />
            <Skeleton width={100} height={24} borderRadius={12} />
          </View>

          {/* Title */}
          <SkeletonLine width="95%" style={{ marginBottom: 6, height: 24 }} />
          <SkeletonLine width="75%" style={{ marginBottom: 16, height: 24 }} />

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Skeleton width={100} height={16} borderRadius={8} />
            <SkeletonLine width={60} />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Skeleton width="100%" height={56} borderRadius={9999} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={56} borderRadius={9999} />
          </View>
        </View>

        {/* Collapsible Sections */}
        <View style={styles.sectionsContainer}>
          {/* Ingredients Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <SkeletonCircle size={24} style={{ marginRight: 8 }} />
              <SkeletonLine width={120} style={{ height: 18 }} />
            </View>
            <SkeletonLine width="100%" style={{ marginBottom: 4 }} />
            <SkeletonLine width="95%" style={{ marginBottom: 4 }} />
            <SkeletonLine width="80%" />
          </View>

          {/* Nutrition Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <SkeletonCircle size={24} style={{ marginRight: 8 }} />
              <SkeletonLine width={140} style={{ height: 18 }} />
            </View>
            <View style={styles.nutritionGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={156} height={72} borderRadius={8} />
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <SkeletonCircle size={24} style={{ marginRight: 8 }} />
              <SkeletonLine width={100} style={{ height: 18 }} />
            </View>
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <SkeletonCircle size={32} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SkeletonLine width={120} style={{ marginBottom: 4 }} />
                  <SkeletonLine width={80} />
                </View>
              </View>
              <SkeletonLine width="100%" style={{ marginTop: 8, marginBottom: 4 }} />
              <SkeletonLine width="90%" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  processingCard: {
    padding: 16,
    backgroundColor: theme.colors.neutral.white,
  },
  infoCard: {
    padding: 16,
    backgroundColor: theme.colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
  sectionsContainer: {
    marginTop: 16,
  },
  sectionCard: {
    backgroundColor: theme.colors.neutral.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  reviewItem: {
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
