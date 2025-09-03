import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface ImprovedIngredientsListProps {
  ingredients?: string;
  description?: string;
}

interface IngredientChipProps {
  ingredient: string;
  isMain: boolean;
  concern?: 'additive' | 'allergen' | 'natural';
}

const IngredientChip: React.FC<IngredientChipProps> = ({ ingredient, isMain, concern }) => {
  const getChipStyle = () => {
    if (concern === 'additive') {
      return {
        backgroundColor: '#FFE6E6',
        borderColor: '#FF3B30',
        textColor: '#FF3B30',
      };
    }
    if (concern === 'allergen') {
      return {
        backgroundColor: '#FFF4E6',
        borderColor: '#FF9F0A',
        textColor: '#FF9F0A',
      };
    }
    if (concern === 'natural') {
      return {
        backgroundColor: '#E8F5E8',
        borderColor: '#34C759',
        textColor: '#34C759',
      };
    }
    if (isMain) {
      return {
        backgroundColor: '#E8F4FD',
        borderColor: '#007AFF',
        textColor: '#007AFF',
      };
    }
    return {
      backgroundColor: '#F2F2F7',
      borderColor: '#C7C7CC',
      textColor: '#6D6D70',
    };
  };

  const chipStyle = getChipStyle();

  return (
    <View style={[
      styles.ingredientChip, 
      { 
        backgroundColor: chipStyle.backgroundColor,
        borderColor: chipStyle.borderColor,
      }
    ]}>
      <Text style={[styles.chipText, { color: chipStyle.textColor }]}>
        {ingredient}
      </Text>
    </View>
  );
};

const analyzeIngredient = (ingredient: string, index: number): { concern?: 'additive' | 'allergen' | 'natural'; isMain: boolean } => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Common additives/preservatives
  const additives = [
    'sodium benzoate', 'potassium sorbate', 'calcium propionate',
    'bht', 'bha', 'tbhq', 'sodium nitrite', 'monosodium glutamate',
    'artificial color', 'artificial flavor', 'high fructose corn syrup',
    'carrageenan', 'xanthan gum', 'guar gum', 'polysorbate',
  ];
  
  // Common allergens
  const allergens = [
    'wheat', 'milk', 'egg', 'soy', 'peanut', 'tree nut', 'fish', 'shellfish',
    'sesame', 'dairy', 'gluten',
  ];
  
  // Natural/beneficial ingredients
  const natural = [
    'organic', 'natural', 'vitamin', 'mineral', 'fiber', 'protein',
    'whole grain', 'real fruit', 'vegetable', 'herb', 'spice',
  ];

  let concern: 'additive' | 'allergen' | 'natural' | undefined;
  
  if (additives.some(additive => lowerIngredient.includes(additive))) {
    concern = 'additive';
  } else if (allergens.some(allergen => lowerIngredient.includes(allergen))) {
    concern = 'allergen';
  } else if (natural.some(nat => lowerIngredient.includes(nat))) {
    concern = 'natural';
  }
  
  return {
    concern,
    isMain: index < 3, // First 3 ingredients are main ingredients
  };
};

const parseIngredients = (ingredientsText: string): string[] => {
  if (!ingredientsText) return [];
  
  return ingredientsText
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 1)
    .map(item => {
      // Clean up parenthetical information but keep important ones
      const cleaned = item.replace(/\s*\([^)]*\)/g, '').trim();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    })
    .filter(item => item.length > 1);
};

export const ImprovedIngredientsList: React.FC<ImprovedIngredientsListProps> = ({ 
  ingredients, 
  description 
}) => {
  const [showAll, setShowAll] = useState(false);
  const ingredientsText = ingredients || description;
  
  if (!ingredientsText) {
    return null;
  }

  const ingredientsList = parseIngredients(ingredientsText);
  
  // If parsing results in less than 2 items, show as original text
  if (ingredientsList.length < 2) {
    return (
      <View style={styles.container}>
        <View style={styles.textCard}>
          <Text style={styles.fullText}>{ingredientsText}</Text>
        </View>
      </View>
    );
  }

  const displayCount = showAll ? ingredientsList.length : Math.min(ingredientsList.length, 8);
  const displayIngredients = ingredientsList.slice(0, displayCount);
  const hasMore = ingredientsList.length > 8;

  // Analyze ingredients for concerns
  const analysisData = ingredientsList.map((ingredient, index) => ({
    ingredient,
    ...analyzeIngredient(ingredient, index),
  }));

  const concernCounts = {
    additives: analysisData.filter(item => item.concern === 'additive').length,
    allergens: analysisData.filter(item => item.concern === 'allergen').length,
    natural: analysisData.filter(item => item.concern === 'natural').length,
  };

  return (
    <View style={styles.container}>
      {/* Quick Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ingredientsList.length}</Text>
          <Text style={styles.statLabel}>Ingredients</Text>
        </View>
        
        {concernCounts.natural > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                {concernCounts.natural}
              </Text>
            </View>
            <Text style={styles.statLabel}>Natural</Text>
          </View>
        )}
        
        {concernCounts.allergens > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="warning" size={16} color={theme.colors.warning} />
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                {concernCounts.allergens}
              </Text>
            </View>
            <Text style={styles.statLabel}>Allergen{concernCounts.allergens !== 1 ? 's' : ''}</Text>
          </View>
        )}
        
        {concernCounts.additives > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
              <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                {concernCounts.additives}
              </Text>
            </View>
            <Text style={styles.statLabel}>Additive{concernCounts.additives !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Ingredients Grid */}
      <View style={styles.ingredientsCard}>
        <View style={styles.ingredientsGrid}>
          {displayIngredients.map((ingredient, index) => {
            const analysis = analysisData[index];
            return (
              <IngredientChip
                key={index}
                ingredient={ingredient}
                isMain={analysis.isMain}
                concern={analysis.concern}
              />
            );
          })}
        </View>

        {hasMore && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAll(!showAll)}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>
              {showAll ? 'Show Less' : `Show ${ingredientsList.length - displayCount} More`}
            </Text>
            <Ionicons 
              name={showAll ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Educational Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Listed by weight, highest to lowest. Color coding indicates potential health concerns.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },

  // Stats Summary Row
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  statIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  statNumber: {
    ...theme.typography.headline,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Ingredients Grid
  ingredientsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },

  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  ingredientChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    marginBottom: theme.spacing.xs,
  },

  chipText: {
    ...theme.typography.subtextMedium,
  },

  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },

  showMoreText: {
    ...theme.typography.bodySemibold,
    color: theme.colors.primary,
  },

  // Fallback Text Display
  textCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },

  fullText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },

  // Educational Note
  noteContainer: {
    paddingHorizontal: theme.spacing.xs,
  },

  noteText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});