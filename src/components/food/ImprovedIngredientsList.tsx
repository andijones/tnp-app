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
  index: number;
}

const IngredientItem: React.FC<IngredientItemProps> = ({ ingredient, index }) => {
  return (
    <View style={styles.ingredientItem}>
      <View style={styles.bullet} />
      <Text style={styles.ingredientText}>
        {ingredient}
      </Text>
    </View>
  );
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
  
  // If parsing results in less than 2 items, try to split by other delimiters
  if (ingredientsList.length < 2) {
    // Try splitting by bullet points, periods, or other delimiters
    const fallbackIngredients = ingredientsText
      .split(/[•·\.\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 2);

    if (fallbackIngredients.length >= 2) {
      const cleanedIngredients = fallbackIngredients.map(item =>
        item.charAt(0).toUpperCase() + item.slice(1)
      );

      return (
        <View style={styles.container}>
          <View style={styles.ingredientsList}>
            {cleanedIngredients.map((ingredient, index) => (
              <IngredientItem
                key={index}
                ingredient={ingredient}
                index={index}
              />
            ))}
          </View>
        </View>
      );
    }

    // Fallback to original text if still can't parse
    return (
      <View style={styles.container}>
        <Text style={styles.fullText}>{ingredientsText}</Text>
      </View>
    );
  }

  const displayCount = showAll ? ingredientsList.length : Math.min(ingredientsList.length, 8);
  const displayIngredients = ingredientsList.slice(0, displayCount);
  const hasMore = ingredientsList.length > 8;

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
          {displayIngredients.map((ingredient, index) => (
            <IngredientItem
              key={index}
              ingredient={ingredient}
              index={index}
            />
          ))}
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
          Listed by weight, highest to lowest.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },

  // Ingredient Count Header
  countHeader: {
    marginBottom: theme.spacing.sm,
  },

  countText: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
  },

  // Ingredients List
  ingredientsCard: {
    paddingTop: theme.spacing.sm,
  },

  ingredientsList: {
    gap: theme.spacing.md,
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
    marginTop: 8,
    flexShrink: 0,
  },

  ingredientText: {
    ...theme.typography.subtext,
    color: theme.colors.text.primary,
    lineHeight: 20,
    flex: 1,
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
    ...theme.typography.subtextMedium,
    color: theme.colors.primary,
  },

  // Fallback Text Display
  fullText: {
    ...theme.typography.subtext,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },


  // Educational Note
  noteContainer: {
    paddingHorizontal: theme.spacing.xs,
  },

  noteText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});