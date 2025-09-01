import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { FoodImage } from './FoodImage';
import { FavoriteButton } from './FavoriteButton';

interface GridFoodCardProps {
  food: Food;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: (foodId: string) => void;
}

export const GridFoodCard: React.FC<GridFoodCardProps> = ({
  food,
  onPress,
  isFavorite,
  onToggleFavorite,
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevIsFavorite = useRef(isFavorite);
  
  useEffect(() => {
    if (prevIsFavorite.current !== isFavorite) {
      // Animate when favorite status changes
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevIsFavorite.current = isFavorite;
  }, [isFavorite, bounceAnim]);
  const getIngredientCount = (ingredientsText?: string, description?: string): number => {
    const text = ingredientsText || description || '';
    if (!text) return 0;
    
    const ingredients = text
      .split(/[,;]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .filter(item => item.length < 100);
      
    return ingredients.length;
  };

  const ingredientCount = getIngredientCount(food.ingredients, food.description);

  const getNovaLabel = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return 'Unprocessed';
      case 2:
        return 'Minimally Processed';
      case 3:
        return 'Processed';
      case 4:
        return 'Ultra-processed';
      default:
        return null;
    }
  };

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
        return theme.colors.text.hint;
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: bounceAnim }]
      }}
    >
      <TouchableOpacity 
        style={styles.gridCard} 
        onPress={onPress}
        activeOpacity={0.7}
      >
      {/* Image Container with Overlays */}
      <View style={styles.imageContainer}>
        <FoodImage 
          imageUrl={food.image}
          size="large"
          style={styles.cardImage}
        />
        
        {/* NOVA Rating Overlay */}
        {food.nova_group && getNovaLabel(food.nova_group) && (
          <View style={styles.novaOverlay}>
            <View style={[styles.novaBadge, { backgroundColor: getNovaColor(food.nova_group) }]}>
              <Text style={styles.novaNumber}>{food.nova_group}</Text>
            </View>
          </View>
        )}
        
        {/* Favorite Button Overlay */}
        <View style={styles.favoriteOverlay}>
          <FavoriteButton
            foodId={food.id}
            isFavorite={isFavorite}
            onToggle={async (foodId: string) => {
              onToggleFavorite(foodId);
              return true;
            }}
            size={22}
          />
        </View>
      </View>
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        <Text style={styles.foodName} numberOfLines={2}>
          {food.name}
        </Text>
        
        {/* Simplified Meta Information */}
        <View style={styles.metaContainer}>
          {/* Supermarket - Primary info */}
          <Text style={styles.supermarketText} numberOfLines={1}>
            {food.supermarket || 'Store not specified'}
          </Text>
          
          {/* Ingredient Count - Secondary info */}
          {ingredientCount > 0 && (
            <Text style={styles.ingredientText}>
              {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  
  imageContainer: {
    position: 'relative',
    aspectRatio: 1.4,
    backgroundColor: 'transparent',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  
  
  novaOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
  },
  
  favoriteOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  
  contentContainer: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    flex: 1,
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  
  metaContainer: {
    gap: theme.spacing.xs,
  },
  
  supermarketText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  
  ingredientText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.hint,
    fontWeight: '400',
  },
  
  novaBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  
  novaNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});