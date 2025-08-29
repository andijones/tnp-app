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
      {/* Image Container with Favorite Button Overlay */}
      <View style={styles.imageContainer}>
        <FoodImage 
          imageUrl={food.image}
          size="large"
          style={styles.cardImage}
        />
        <View style={styles.favoriteOverlay}>
          <FavoriteButton
            foodId={food.id}
            isFavorite={isFavorite}
            onToggle={async (foodId: string) => {
              onToggleFavorite(foodId);
              return true;
            }}
            size={20}
          />
        </View>
      </View>
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        <Text style={styles.foodName} numberOfLines={2}>
          {food.name}
        </Text>
        
        {/* Meta Information */}
        <View style={styles.metaContainer}>
          {/* Ingredient Count */}
          {ingredientCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="list-outline" size={12} color={theme.colors.text.secondary} />
              <Text style={styles.metaText}>
                {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
              </Text>
            </View>
          )}
          
          {/* Supermarket */}
          <View style={styles.metaItem}>
            <Ionicons name="storefront-outline" size={12} color={theme.colors.text.secondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {food.supermarket || 'Store not specified'}
            </Text>
          </View>
          
          {/* NOVA Rating */}
          {food.nova_group && getNovaLabel(food.nova_group) && (
            <View style={styles.metaItem}>
              <View style={[styles.novaBadge, { backgroundColor: getNovaColor(food.nova_group) }]}>
                <Text style={styles.novaNumber}>{food.nova_group}</Text>
              </View>
              <Text style={styles.metaText} numberOfLines={1}>
                {getNovaLabel(food.nova_group)}
              </Text>
            </View>
          )}
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
  },
  
  imageContainer: {
    position: 'relative',
    aspectRatio: 1.1,
    backgroundColor: 'transparent',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  
  favoriteOverlay: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: theme.spacing.xs,
  },
  
  contentContainer: {
    padding: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    flex: 1,
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  
  metaContainer: {
    gap: 2,
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  
  novaBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  
  novaNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});