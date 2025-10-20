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
            size={20}
            color="#737373" // Neutral-500 from Figma (gray chevron)
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAFAFA', // Neutral-50 from Figma
    borderRadius: 8, // Figma: 8px (spacing-8)
    height: 52, // Fixed height from Figma
    borderWidth: 0.5, // Figma: 0.5px
    borderColor: 'rgba(161, 153, 105, 0.3)', // Subtle warm border from Figma
    marginBottom: 8, // Gap between items (spacing-8)
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Figma: spacing-16
    paddingVertical: 0, // Vertically centered
    height: '100%',
  },

  textContainer: {
    flex: 1,
  },

  categoryName: {
    fontSize: 14, // Figma: 14px
    fontWeight: '600', // Semibold
    color: '#171717', // Neutral-900 from Figma
    letterSpacing: -0.28, // Figma tracking
    fontFamily: 'System',
  },

  actionContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});