import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Get processing level color and border based on NOVA group (for bottom-right bar)
  const getProcessingLevelStyle = (novaGroup?: number): { backgroundColor: string; borderColor: string } => {
    switch (novaGroup) {
      case 1:
        return {
          backgroundColor: '#dbffd6',
          borderColor: '#aadea3',
        };
      case 2:
        return {
          backgroundColor: '#fff491',
          borderColor: '#e1d02e',
        };
      case 3:
        return {
          backgroundColor: '#ffca9b',
          borderColor: '#e0a36c',
        };
      case 4:
        return {
          backgroundColor: '#FFD4D4',
          borderColor: '#DC2626',
        };
      default:
        return {
          backgroundColor: '#F5F5F5',
          borderColor: '#E5E5E5',
        };
    }
  };

  const processingStyle = getProcessingLevelStyle(food.nova_group);

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
        {/* White Background Container with Image */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageInnerContainer}>
            <FoodImage
              imageUrl={food.image}
              size="large"
              style={styles.cardImage}
            />
          </View>

          {/* Favorite Button - Bottom Right of white container */}
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

          {/* Bottom Row: Ingredient Count and Processing Bar */}
          <View style={styles.bottomRow}>
            {ingredientCount > 0 && (
              <Text style={styles.ingredientText}>
                {ingredientCount} Ingredient{ingredientCount === 1 ? '' : 's'}
              </Text>
            )}

            {/* Processing Level Bar - Bottom Right */}
            {food.nova_group && (
              <View
                style={[
                  styles.processingBar,
                  {
                    backgroundColor: processingStyle.backgroundColor,
                    borderColor: processingStyle.borderColor,
                  }
                ]}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: 'transparent', // Transparent card
    borderRadius: 6,
    marginBottom: 0,
    overflow: 'visible',
    flex: 1,
  },

  // White background container (outer layer)
  imageOuterContainer: {
    position: 'relative',
    aspectRatio: 1, // Square container
    backgroundColor: '#FFFFFF', // Clean white background
    borderRadius: 8, // Slightly rounded for premium feel
    padding: 12, // Creates the "matting" effect around the image
    // Subtle shadow for depth and card separation
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06, // Very subtle shadow
    shadowRadius: 8,
    elevation: 3, // Android shadow
  },

  // Inner container for scaled image (75% size)
  imageInnerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 6, // Rounded corners for the image container
  },

  cardImage: {
    width: '75%', // Scaled down to 75%
    height: '75%', // Scaled down to 75%
    borderRadius: 6, // Image itself has rounded corners
  },

  // Favorite Button - Bottom Right (8px from edges)
  favoriteOverlay: {
    position: 'absolute',
    bottom: 8, // 8px from bottom edge
    right: 8, // 8px from right edge
  },

  favoriteGradientContainer: {
    width: 40, // Figma 40px
    height: 40, // Figma 40px
    borderRadius: 300, // Fully rounded
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
    paddingTop: 10, // Increased from 8px for better breathing room
    paddingHorizontal: 2, // Subtle horizontal padding for better text alignment
    gap: 6, // Increased from 4px for better vertical rhythm
  },

  foodName: {
    fontSize: 16, // var(--spacing/16) from Figma
    fontWeight: '700', // Bold
    lineHeight: 19.15, // 1.197 ratio from Figma
    letterSpacing: -0.48,
    color: '#171717', // var(--neutral/900)
  },

  // Bottom row containing ingredient count and processing bar
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2, // Subtle spacing for optical balance
  },

  ingredientText: {
    fontSize: 12, // Figma CardMeta
    fontWeight: '400', // Regular
    lineHeight: 12, // Normal line-height
    color: '#737373', // var(--neutral/500)
  },

  // Processing Level Bar - Bottom Right (40x8px)
  processingBar: {
    width: 40, // Figma width
    height: 8, // Figma height
    borderRadius: 2, // Figma border radius
    borderWidth: 0.5, // Figma border
  },
});