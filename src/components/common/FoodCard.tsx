import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { FoodImage } from './FoodImage';
import { FavoriteButton } from './FavoriteButton';

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
  const getIngredientCount = (ingredientsText?: string, description?: string): number => {
    const text = ingredientsText || description || '';
    if (!text) return 0;
    
    // Split by common delimiters and clean up
    const ingredients = text
      .split(/[,;]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .filter(item => item.length < 100); // Remove suspiciously long strings
      
    return ingredients.length;
  };

  const ingredientCount = getIngredientCount(food.ingredients, food.description);

  return (
    <TouchableOpacity 
      style={styles.foodCard} 
      onPress={onPress}
    >
      {/* Food Image with NOVA tag */}
      <FoodImage 
        imageUrl={food.image}
        size="medium"
        novaGroup={food.nova_group}
      />
      
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
      
      <FavoriteButton
        foodId={food.id}
        isFavorite={isFavorite}
        onToggle={async (foodId: string) => {
          onToggleFavorite(foodId);
          return true;
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  foodCard: {
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
  
  foodInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});