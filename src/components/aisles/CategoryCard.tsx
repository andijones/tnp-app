import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Aisle } from '../../types/aisle';

interface CategoryCardProps {
  aisle: Aisle;
  onPress: (aisle: Aisle) => void;
  variant?: 'default' | 'featured' | 'compact';
  foodCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  aisle,
  onPress,
  variant = 'default',
  foodCount,
}) => {
  const hasChildren = aisle.children && aisle.children.length > 0;
  
  const getIcon = (aisleName: string): keyof typeof Ionicons.glyphMap => {
    const name = aisleName.toLowerCase();
    if (name.includes('fruit') || name.includes('produce')) return 'leaf';
    if (name.includes('meat') || name.includes('protein')) return 'fish';
    if (name.includes('dairy')) return 'cafe';
    if (name.includes('bakery') || name.includes('bread')) return 'restaurant';
    if (name.includes('frozen')) return 'snow';
    if (name.includes('snack')) return 'fast-food';
    if (name.includes('beverage') || name.includes('drink')) return 'wine';
    if (name.includes('pantry') || name.includes('grain')) return 'basket';
    return 'storefront';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(aisle)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.categoryName}>
            {aisle.name}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.text.secondary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  categoryName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },

  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});