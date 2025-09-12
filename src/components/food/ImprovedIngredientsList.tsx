import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface ImprovedIngredientsListProps {
  ingredients?: string;
  description?: string;
}

interface IngredientItemProps {
  ingredient: string;
  isMain: boolean;
  concern?: 'natural';
  index: number;
}

const IngredientItem: React.FC<IngredientItemProps> = ({ ingredient, isMain, concern, index }) => {
  const getIndicatorColor = () => {
    if (concern === 'natural') return theme.colors.success;
    if (isMain) return theme.colors.primary;
    return theme.colors.neutral[400];
  };

  const getTextColor = () => {
    if (isMain) return theme.colors.neutral[900];
    return theme.colors.neutral[700];
  };

  return (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientContent}>
        <View style={[styles.indicator, { backgroundColor: getIndicatorColor() }]} />
        <Text style={[styles.ingredientText, { color: getTextColor() }]}>
          {ingredient}
        </Text>
      </View>
      {isMain && (
        <Text style={styles.mainLabel}>Main</Text>
      )}
    </View>
  );
};

const analyzeIngredient = (ingredient: string, index: number): { concern?: 'natural'; isMain: boolean } => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Natural/beneficial ingredients that indicate minimal processing
  const natural = [
    'organic', 'natural', 'vitamin', 'mineral', 'fiber', 'protein',
    'whole grain', 'real fruit', 'vegetable', 'herb', 'spice',
    'sea salt', 'cane sugar', 'honey', 'maple syrup', 'olive oil',
  ];

  let concern: 'natural' | undefined;
  
  if (natural.some(nat => lowerIngredient.includes(nat))) {
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

  // Analyze ingredients for natural ingredients
  const analysisData = ingredientsList.map((ingredient, index) => ({
    ingredient,
    ...analyzeIngredient(ingredient, index),
  }));

  return (
    <View style={styles.container}>
      {/* Ingredient Count Header */}
      <View style={styles.countHeader}>
        <Text style={styles.countText}>
          {ingredientsList.length} ingredient{ingredientsList.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Ingredients List */}
      <View style={styles.ingredientsCard}>
        <View style={styles.ingredientsList}>
          {displayIngredients.map((ingredient, index) => {
            const analysis = analysisData[index];
            return (
              <IngredientItem
                key={index}
                ingredient={ingredient}
                isMain={analysis.isMain}
                concern={analysis.concern}
                index={index}
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

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.legendText}>Natural</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Main ingredient</Text>
        </View>
      </View>
      
      {/* Educational Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Listed by weight, highest to lowest.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },

  // Ingredient Count Header
  countHeader: {
    marginBottom: theme.spacing.md,
  },

  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },

  // Ingredients List
  ingredientsCard: {
    paddingTop: theme.spacing.sm,
  },

  ingredientsList: {
    gap: theme.spacing.sm,
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },

  ingredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  ingredientText: {
    ...theme.typography.body,
    fontSize: 16,
    flex: 1,
  },

  mainLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
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

  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  legendText: {
    fontSize: 14,
    fontFamily: 'System',
    color: theme.colors.neutral[600],
    fontWeight: '500',
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