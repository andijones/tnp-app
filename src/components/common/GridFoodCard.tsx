import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { FoodImage } from './FoodImage';
import { FavoriteButton } from './FavoriteButton';
import { getIngredientCount } from '../../utils/foodUtils';

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

  const getNovaStyles = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return {
          backgroundColor: theme.colors.green[50], // var(--Green-50, #E0FFE7)
          borderColor: theme.colors.green[300], // var(--Green-300, #84EDA0)
          color: theme.colors.green[900], // var(--Green-900, #26733E)
        };
      case 2:
        return {
          backgroundColor: '#FFFDD2',
          borderColor: '#E5E181',
          color: '#928D1D',
        };
      case 3:
        return {
          backgroundColor: '#FFF4E6',
          borderColor: '#F9DEBC',
          color: '#E6630B',
        };
      case 4:
        return {
          backgroundColor: theme.colors.nova?.group4 || '#ef4444',
          borderColor: theme.colors.nova?.group4 || '#ef4444',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: theme.colors.text.tertiary,
          borderColor: theme.colors.text.tertiary,
          color: '#FFFFFF',
        };
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
            <View style={[styles.novaBadge, getNovaStyles(food.nova_group)]}>
              <Text style={[styles.novaNumber, { color: getNovaStyles(food.nova_group).color }]}>{food.nova_group}</Text>
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
    backgroundColor: '#FFFFFF', // var(--Neutral-white, #FFF)
    borderRadius: 8, // var(--Spacing-8, 8px)
    borderWidth: 1,
    borderColor: '#E5E5E5', // var(--Neutral-200, #E5E5E5)
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    // Card Shadow from Figma
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: '#FFFFFF', // var(--Neutral-white, #FFF)
    borderRadius: 8, // var(--Spacing-8, 8px)
    borderWidth: 1,
    borderColor: '#E5E5E5', // var(--Neutral-200, #E5E5E5)
    padding: theme.spacing.xs,
    // Card Shadow from Figma
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 3,
  },
  
  contentContainer: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    flex: 1,
  },
  
  foodName: {
    ...theme.typography.cardTitle,
    color: theme.colors.green[950],
    marginBottom: theme.spacing.md,
  },
  
  metaContainer: {
    gap: theme.spacing.xs,
  },
  
  supermarketText: {
    ...theme.typography.cardMeta,
    color: theme.colors.neutral[500],
    marginBottom: 2,
  },
  
  ingredientText: {
    ...theme.typography.cardMeta,
    color: theme.colors.neutral[500],
  },
  
  novaBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  
  novaNumber: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Bricolage Grotesque',
  },
});