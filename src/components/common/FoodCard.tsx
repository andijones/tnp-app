import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { FoodImage } from './FoodImage';
import { FavoriteButton } from './FavoriteButton';
import { getIngredientCount } from '../../utils/foodUtils';

interface FoodCardProps {
  food: Food;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: (foodId: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onPress,
  isFavorite,
  onToggleFavorite,
}) => {
  const ingredientCount = getIngredientCount(food.ingredients, food.description);

  // Build accessibility label
  const accessibilityLabel = `${food.name}, ${
    ingredientCount > 0 ? `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}` : ''
  }, ${food.supermarket || 'Store not specified'}${
    isFavorite ? ', favorited' : ''
  }`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view food details"
    >
      <View style={styles.foodCard}>
        {/* Header with Food Image and Favorite Button */}
        <View style={styles.cardHeader}>
          <FoodImage 
            imageUrl={food.image}
            size="medium"
            novaGroup={food.nova_group}
          />
          
          <FavoriteButton
            foodId={food.id}
            isFavorite={isFavorite}
            onToggle={async (foodId: string) => {
              onToggleFavorite(foodId);
              return true;
            }}
          />
        </View>
        
        {/* Food Info */}
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          
          <View style={styles.metaRow}>
            {/* Ingredient Count */}
            {ingredientCount > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="list-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>
                  {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
                </Text>
              </View>
            )}
            
            {/* Supermarket */}
            <View style={styles.metaItem}>
              <Ionicons name="storefront-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={styles.metaText}>
                {food.supermarket || 'Store not specified'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  foodCard: {
    padding: 11,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 8, // var(--Spacing-8, 8px)
    borderWidth: 1,
    borderColor: '#000000', // Testing border visibility
    backgroundColor: '#FFFFFF', // var(--Neutral-white, #FFF)
    marginBottom: theme.spacing.md,
    overflow: 'visible',
    
    // Card Shadow - adjusted for React Native visibility
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 11, // 8px Figma × 1.33 (gap between sections)
  },
  
  foodInfo: {
    alignSelf: 'stretch',
  },
  
  foodName: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    marginBottom: 11, // 8px Figma × 1.33 (gap between elements)
  },
  
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  metaText: {
    ...theme.typography.cardMeta,
    color: theme.colors.text.secondary,
  },
});