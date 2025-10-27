import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Food } from '../../types';
import { GridFoodCard } from '../common/GridFoodCard';
import { supabase } from '../../services/supabase/config';
import { logger } from '../../utils/logger';

interface SimilarFoodsSectionProps {
  currentFoodId: string;
  aisleId?: string;
  onFoodPress: (foodId: string) => void;
  isFavorite: (foodId: string) => boolean;
  onToggleFavorite: (foodId: string) => void;
}

export const SimilarFoodsSection: React.FC<SimilarFoodsSectionProps> = ({
  currentFoodId,
  aisleId,
  onFoodPress,
  isFavorite,
  onToggleFavorite,
}) => {
  const [similarFoods, setSimilarFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (aisleId) {
      fetchSimilarFoods();
    } else {
      setLoading(false);
    }
  }, [aisleId, currentFoodId]);

  const fetchSimilarFoods = async () => {
    if (!aisleId) return;

    try {
      setLoading(true);

      // Get foods from the same aisle
      const { data: foodAisles, error: aisleError } = await supabase
        .from('food_item_aisles')
        .select('food_id')
        .eq('aisle_id', aisleId);

      if (aisleError) {
        logger.error('Error fetching aisle foods:', aisleError);
        return;
      }

      const foodIds = foodAisles?.map(fa => fa.food_id).filter(id => id !== currentFoodId) || [];

      if (foodIds.length === 0) {
        setSimilarFoods([]);
        return;
      }

      // Fetch the actual foods
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select(`
          *,
          food_supermarkets(supermarket)
        `)
        .in('id', foodIds)
        .eq('status', 'approved')
        .limit(10); // Limit to 10 similar items

      if (foodsError) {
        logger.error('Error fetching foods:', foodsError);
        return;
      }

      // Transform data to flatten supermarkets array
      const transformedData = (foods || []).map(food => ({
        ...food,
        supermarkets: food.food_supermarkets?.map((fs: any) => fs.supermarket) ||
                      (food.supermarket ? [food.supermarket] : [])
      }));

      // Shuffle and take first 8 for variety
      const shuffled = transformedData.sort(() => Math.random() - 0.5).slice(0, 8);
      setSimilarFoods(shuffled);

    } catch (error) {
      logger.error('Error in fetchSimilarFoods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no aisle or no similar foods
  if (!aisleId || (!loading && similarFoods.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Similar Items You Might Like</Text>
        <Text style={styles.headerSubtitle}>From the same aisle</Text>
      </View>

      {/* Horizontal Scrollable Food Cards */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.green[600]} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {similarFoods.map((food) => (
            <View key={food.id} style={styles.cardWrapper}>
              <GridFoodCard
                food={food}
                onPress={() => onFoodPress(food.id)}
                isFavorite={isFavorite(food.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  header: {
    paddingHorizontal: 0, // No padding - parent handles it
    marginBottom: theme.spacing.md,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    letterSpacing: -0.13,
  },

  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 0, // No padding - parent handles it
    gap: 12,
  },

  cardWrapper: {
    width: 160, // Fixed width for consistent card size
  },
});
