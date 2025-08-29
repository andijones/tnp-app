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
        {food.description && (
          <Text style={styles.foodDescription} numberOfLines={2}>
            {food.description}
          </Text>
        )}
        <View style={styles.foodMeta}>
          <Ionicons name="storefront-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.foodMetaText}>Available in stores</Text>
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
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  
  foodInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  foodDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  foodMetaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
});