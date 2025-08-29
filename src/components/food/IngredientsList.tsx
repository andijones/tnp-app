import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { SectionHeader } from '../common/SectionHeader';

interface IngredientsListProps {
  ingredients?: string;
  description?: string;
}

const parseIngredients = (ingredientsText: string): string[] => {
  if (!ingredientsText) return [];
  
  // Split by common delimiters and clean up
  const items = ingredientsText
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      // Remove parenthetical information for cleaner display
      return item.replace(/\s*\([^)]*\)/g, '').trim();
    })
    .filter(item => item.length > 1);
    
  return items;
};

export const IngredientsList: React.FC<IngredientsListProps> = ({ 
  ingredients, 
  description 
}) => {
  const ingredientsText = ingredients || description;
  
  if (!ingredientsText) {
    return null;
  }

  const ingredientsList = parseIngredients(ingredientsText);
  
  // If parsing results in less than 2 items, show as original text
  if (ingredientsList.length < 2) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Ingredients" 
          icon="list-outline"
          subtitle="What's inside this product"
        />
        <View style={styles.textContainer}>
          <Text style={styles.ingredientsText}>{ingredientsText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Ingredients" 
        icon="list-outline"
        subtitle={`${ingredientsList.length} ingredients listed`}
      />
      <View style={styles.listContainer}>
        {ingredientsList.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <View style={styles.bullet} />
            <Text style={styles.ingredientText}>
              {ingredient}
              {index < ingredientsList.length - 1 ? '' : ''}
            </Text>
          </View>
        ))}
      </View>
      
      {ingredientsList.length > 5 && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Ingredients are listed in order of predominance by weight
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },

  textContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },

  ingredientsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },

  listContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
    marginTop: 8,
    flexShrink: 0,
  },

  ingredientText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    flex: 1,
  },

  noteContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },

  noteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});