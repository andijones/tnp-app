import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    <Text style={styles.ingredientText}>
      {ingredient}
    </Text>
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
          <Text style={styles.ingredientsText}>
            {cleanedIngredients.join(', ')}
          </Text>
        </View>
      );
    }

    // Fallback to original text if still can't parse
    return (
      <View style={styles.container}>
        <Text style={styles.ingredientsText}>{ingredientsText}</Text>
      </View>
    );
  }

  const displayCount = showAll ? ingredientsList.length : Math.min(ingredientsList.length, 8);
  const displayIngredients = ingredientsList.slice(0, displayCount);
  const hasMore = ingredientsList.length > 8;

  return (
    <View style={styles.container}>
      <Text style={styles.ingredientsText}>
        {displayIngredients.join(', ')}
        {hasMore && !showAll && ` and ${ingredientsList.length - displayCount} more`}
      </Text>

      {hasMore && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>
            {showAll ? 'Show less' : 'Show all ingredients'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Clean container with no extra spacing
  },

  ingredientsText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },

  expandButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },

  expandText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },

  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },
});