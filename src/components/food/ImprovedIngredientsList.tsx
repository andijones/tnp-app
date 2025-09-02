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
        <View style={styles.headerContainer}>
          <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Ingredients</Text>
        </View>
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
      <View style={styles.headerContainer}>
        <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.ingredientCount}>
            {ingredientsList.length} ingredient{ingredientsList.length !== 1 ? 's' : ''} listed
          </Text>
        </View>
      </View>

      {/* Analysis Summary */}
      {(concernCounts.additives > 0 || concernCounts.allergens > 0 || concernCounts.natural > 0) && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            {concernCounts.natural > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={[styles.summaryText, { color: '#34C759' }]}>
                  {concernCounts.natural} natural
                </Text>
              </View>
            )}
            {concernCounts.allergens > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="warning" size={16} color="#FF9F0A" />
                <Text style={[styles.summaryText, { color: '#FF9F0A' }]}>
                  {concernCounts.allergens} allergen{concernCounts.allergens !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {concernCounts.additives > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={[styles.summaryText, { color: '#FF3B30' }]}>
                  {concernCounts.additives} additive{concernCounts.additives !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

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
              color="#007AFF" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Educational Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Ingredients are listed by weight, from most to least. Main ingredients appear first.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  ingredientCount: {
    fontSize: 15,
    color: '#6D6D70',
    marginTop: 1,
  },

  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  summaryText: {
    fontSize: 15,
    fontWeight: '600',
  },

  ingredientsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },

  chipText: {
    fontSize: 15,
    fontWeight: '500',
  },

  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    gap: 4,
  },

  showMoreText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },

  textCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  fullText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },

  noteContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },

  noteText: {
    fontSize: 13,
    color: '#6D6D70',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});