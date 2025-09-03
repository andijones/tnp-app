import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { RelatedFood, relatedFoodsService } from '../../services/relatedFoodsService';
import { FoodCard } from '../common/FoodCard';
import { useFavorites } from '../../hooks/useFavorites';

interface RelatedFoodsSectionProps {
  currentFood: Food;
  onFoodPress: (foodId: string) => void;
}

// Skeleton loading component
const RelatedFoodSkeleton: React.FC = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonImageContainer}>
      <View style={styles.skeletonImage} />
    </View>
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonMeta} />
      <View style={styles.skeletonMetaSmall} />
    </View>
  </View>
);

export const RelatedFoodsSection: React.FC<RelatedFoodsSectionProps> = ({
  currentFood,
  onFoodPress,
}) => {
  const [relatedFoods, setRelatedFoods] = useState<RelatedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchRelatedFoods();
  }, [currentFood.id]);

  const fetchRelatedFoods = async () => {
    if (!currentFood) return;

    setLoading(true);
    setError(null);

    try {
      const foods = await relatedFoodsService.getRelatedFoods(currentFood);
      setRelatedFoods(foods);
    } catch (err) {
      console.error('Error fetching related foods:', err);
      setError('Failed to load related foods');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (foodId: string) => {
    try {
      await toggleFavorite(foodId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderSkeletonCards = () => (
    <View style={styles.listContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <RelatedFoodSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );

  const renderRelatedFoods = () => {
    if (relatedFoods.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={40} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyText}>No similar foods found</Text>
          <Text style={styles.emptySubtext}>
            Try exploring foods from the same aisle or category
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {relatedFoods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onPress={() => onFoodPress(food.id)}
            isFavorite={isFavorite(food.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
      <Text style={styles.errorText}>Unable to load related foods</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchRelatedFoods}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Don't render the section if we're loading and there's no cached data
  // This prevents the section from appearing and disappearing
  if (loading && relatedFoods.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="grid-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Similar Foods</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Other non-UPF foods you might like</Text>
        </View>
        {renderSkeletonCards()}
      </View>
    );
  }

  // Don't render anything if we have no foods and no loading/error state
  if (!loading && !error && relatedFoods.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="grid-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Similar Foods</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Other non-UPF foods you might like</Text>
      </View>
      
      {loading ? renderSkeletonCards() : error ? renderError() : renderRelatedFoods()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  
  sectionTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
  },
  
  sectionSubtitle: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  // Skeleton styles - Match FoodCard layout
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  
  skeletonImageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
    opacity: 0.6,
  },
  
  skeletonContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  
  skeletonTitle: {
    height: 18,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    opacity: 0.6,
    marginBottom: 6,
  },
  
  skeletonMeta: {
    height: 14,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    opacity: 0.4,
    width: '80%',
  },
  
  skeletonMetaSmall: {
    height: 14,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    opacity: 0.4,
    width: '60%',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  
  emptyText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Error state
  errorState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  
  errorText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  
  retryButtonText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});