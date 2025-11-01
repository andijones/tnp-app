import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  // Get processing level color based on NOVA group
  // Using slightly more saturated colors for better visibility while maintaining elegance
  const getProcessingLevelColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1:
        return '#C1FFD0'; // Green-100 - More visible green for Whole Food
      case 2:
        return '#FFF9B3'; // Richer yellow - Extracted Foods
      case 3:
        return '#FFE4CC'; // Warmer orange - Lightly Processed
      case 4:
        return '#FFD4D4'; // Soft red - Processed (rarely shown)
      default:
        return '#F5F5F5'; // Neutral fallback
    }
  };

  // Get icon name for processing level
  const getProcessingLevelIcon = (novaGroup?: number): keyof typeof Ionicons.glyphMap => {
    switch (novaGroup) {
      case 1:
        return 'leaf'; // Whole Food - natural/leaf icon
      case 2:
        return 'water'; // Extracted Foods - drop/liquid icon
      case 3:
        return 'restaurant'; // Lightly Processed - bowl/food icon
      case 4:
        return 'warning'; // Processed - warning icon
      default:
        return 'help-circle'; // Fallback
    }
  };

  // Get icon color for contrast against background
  const getProcessingLevelIconColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1:
        return '#26733E'; // Dark green for contrast
      case 2:
        return '#928D1D'; // Dark yellow/olive for contrast
      case 3:
        return '#E6630B'; // Dark orange for contrast
      case 4:
        return '#DC2626'; // Dark red for contrast
      default:
        return '#737373'; // Neutral gray
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

          {/* Processing Level Color Overlay with Icon - Top Left */}
          {food.nova_group && (
            <View
              style={[
                styles.processingLevelOverlay,
                { backgroundColor: getProcessingLevelColor(food.nova_group) }
              ]}
            >
              <Ionicons
                name={getProcessingLevelIcon(food.nova_group)}
                size={18}
                color={getProcessingLevelIconColor(food.nova_group)}
              />
            </View>
          )}

          {/* Favorite Button Overlay - Top Right with Gradient Background */}
          <View style={styles.favoriteOverlay}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0)', 'rgba(212, 207, 181, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.favoriteGradientContainer}
            >
              <View style={styles.favoriteGradientOverlay}>
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
            </LinearGradient>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Text style={styles.foodName} numberOfLines={2}>
            {food.name}
          </Text>

          {/* Ingredient Count */}
          {ingredientCount > 0 && (
            <Text style={styles.ingredientText}>
              {ingredientCount} Ingredient{ingredientCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: '#FFFFFF', // var(--neutral/white)
    borderRadius: 6, // var(--spacing/6, 6px) from Figma
    borderWidth: 0.5,
    borderColor: '#E5E5E5', // var(--neutral/200)
    marginBottom: 0,
    overflow: 'hidden',
    flex: 1,
  },

  imageContainer: {
    position: 'relative',
    aspectRatio: 1, // Square image from Figma (152x152)
    backgroundColor: 'transparent',
  },

  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 3.8, // Figma inner image radius
  },

  // Processing Level Color Overlay with Icon - Top Left (33x33)
  processingLevelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 33, // 44px reduced by 25% = 33px
    height: 33, // 44px reduced by 25% = 33px
    borderBottomRightRadius: 6, // Proportionally reduced from 8px
    // Center the icon
    justifyContent: 'center',
    alignItems: 'center',
    // Border for definition
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)', // Subtle border for definition
    // Shadow for depth and visibility (slightly reduced)
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowOpacity: 0.09, // Reduced from 0.12
    shadowRadius: 3,
    elevation: 2, // Android shadow (reduced from 3)
  },

  // Favorite Button Overlay - Top Right (40x40)
  favoriteOverlay: {
    position: 'absolute',
    top: 7.5, // Figma positioning
    right: 7.5, // Figma positioning from right edge
  },

  favoriteGradientContainer: {
    width: 40, // Figma 40px
    height: 40, // Figma 40px
    borderRadius: 300, // Fully rounded (pill-shaped)
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)', // Figma border color
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteGradientOverlay: {
    width: '100%',
    height: '100%',
    borderRadius: 300,
    backgroundColor: '#FAFAFA', // Base background from gradient
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    padding: 8, // var(--spacing/8) from Figma
    gap: 8, // var(--spacing/8) between elements
  },

  foodName: {
    fontSize: 16, // var(--spacing/16) from Figma
    fontWeight: '700', // Bold
    lineHeight: 19, // 1.197 ratio
    letterSpacing: -0.48,
    color: '#171717', // var(--neutral/900)
  },

  ingredientText: {
    fontSize: 12, // Figma CardMeta
    fontWeight: '400', // Regular
    lineHeight: 12, // Normal line-height
    color: '#737373', // var(--neutral/500)
  },
});