import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { RelatedFood } from '../../services/relatedFoodsService';
import { FoodImage } from '../common/FoodImage';
import { FavoriteButton } from '../common/FavoriteButton';
import { getIngredientCount } from '../../utils/foodUtils';

interface RelatedFoodCardProps {
  food: RelatedFood;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: (foodId: string) => void;
}

export const RelatedFoodCard: React.FC<RelatedFoodCardProps> = ({
  food,
  onPress,
  isFavorite,
  onToggleFavorite,
}) => {
  const ingredientCount = getIngredientCount(food.ingredients, food.description);

  const getNovaColor = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return theme.colors.nova?.group1 || '#22c55e';
      case 2:
        return theme.colors.nova?.group2 || '#84cc16';
      case 3:
        return theme.colors.nova?.group3 || '#f97316';
      case 4:
        return theme.colors.nova?.group4 || '#ef4444';
      default:
        return theme.colors.text.tertiary;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <FoodImage 
          imageUrl={food.image}
          size="small"
          style={styles.cardImage}
        />
        
        {/* NOVA Rating Badge */}
        {food.nova_group && (
          <View style={styles.novaOverlay}>
            <View style={[styles.novaBadge, { backgroundColor: getNovaColor(food.nova_group) }]}>
              <Text style={styles.novaText}>{food.nova_group}</Text>
            </View>
          </View>
        )}
        
        {/* Favorite Button */}
        <View style={styles.favoriteOverlay}>
          <FavoriteButton
            foodId={food.id}
            isFavorite={isFavorite}
            onToggle={async (foodId: string) => {
              onToggleFavorite(foodId);
              return true;
            }}
            size={16}
          />
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.foodName} numberOfLines={2}>
          {food.name}
        </Text>
        
        {/* Meta Info */}
        <View style={styles.metaContainer}>
          {/* Aisle Info */}
          {food.aisles && food.aisles.length > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="apps-outline" size={12} color={theme.colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {food.aisles[0].name}
              </Text>
            </View>
          )}
          
          {/* Ingredient Count */}
          {ingredientCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="list-outline" size={12} color={theme.colors.text.secondary} />
              <Text style={styles.metaText}>
                {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    width: 160, // Fixed width for consistent grid layout
    marginRight: theme.spacing.md,
  },
  
  imageContainer: {
    position: 'relative',
    aspectRatio: 1.2,
    backgroundColor: theme.colors.background,
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  
  novaOverlay: {
    position: 'absolute',
    top: theme.spacing.xs,
    left: theme.spacing.xs,
  },
  
  favoriteOverlay: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  
  novaBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  
  novaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  content: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    flex: 1,
  },
  
  foodName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
    lineHeight: 18,
  },
  
  metaContainer: {
    gap: 4,
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
    flex: 1,
  },
});