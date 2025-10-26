import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonLine } from '../Skeleton';
import { theme } from '../../../theme';

export const ProfileScreenSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <SkeletonCircle size={80} style={{ marginBottom: 16 }} />
        <SkeletonLine width={150} style={{ height: 24, marginBottom: 8 }} />
        <SkeletonLine width={200} style={{ marginBottom: 4 }} />
        <SkeletonLine width={180} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonLine width={40} style={{ height: 28, marginBottom: 8 }} />
            <SkeletonLine width={70} />
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Skeleton width="100%" height={56} borderRadius={9999} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={56} borderRadius={9999} />
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <SkeletonCircle size={24} style={{ marginRight: 12 }} />
              <SkeletonLine width={120} />
            </View>
            <SkeletonCircle size={16} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    padding: 16,
    alignItems: 'center',
  },
  actionButtons: {
    marginBottom: 24,
  },
  settingsList: {
    gap: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
