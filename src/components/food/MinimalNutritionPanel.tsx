import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { NutritionInfo } from '../../types';
import { SectionHeader } from '../common/SectionHeader';

interface MinimalNutritionPanelProps {
  nutrition?: NutritionInfo;
}

interface NutrientChipProps {
  label: string;
  value?: number;
  unit: string;
  color: string;
}

const NutrientChip: React.FC<NutrientChipProps> = ({ label, value, unit, color }) => {
  if (value === undefined) return null;
  
  return (
    <View style={[styles.nutrientChip, { borderColor: color }]}>
      <Text style={[styles.nutrientValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.nutrientLabel}>{label}</Text>
    </View>
  );
};

const getNutrientColor = (nutrient: string, value?: number): string => {
  if (value === undefined) return theme.colors.text.hint;
  
  switch (nutrient) {
    case 'protein':
      return value >= 10 ? theme.colors.success : theme.colors.primary;
    case 'fiber':
      return value >= 3 ? theme.colors.success : theme.colors.primary;
    case 'sugar':
      return value >= 15 ? theme.colors.error : value >= 5 ? theme.colors.warning : theme.colors.success;
    case 'sodium':
      return value >= 600 ? theme.colors.error : value >= 300 ? theme.colors.warning : theme.colors.success;
    case 'fat':
      return value >= 15 ? theme.colors.warning : theme.colors.primary;
    default:
      return theme.colors.primary;
  }
};

export const MinimalNutritionPanel: React.FC<MinimalNutritionPanelProps> = ({ nutrition }) => {
  const hasNutritionData = nutrition && Object.values(nutrition).some(value => value !== undefined);

  if (!hasNutritionData) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Nutrition" 
          icon="fitness-outline"
        />
        <View style={styles.noDataContainer}>
          <Ionicons name="nutrition-outline" size={32} color={theme.colors.text.hint} />
          <Text style={styles.noDataText}>Nutrition data not available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Nutrition" 
        icon="fitness-outline"
        subtitle={nutrition?.servingSize ? `Per ${nutrition.servingSize}` : "Per serving"}
      />
      
      <View style={styles.nutritionContainer}>
        {/* Calories - Featured */}
        {nutrition.calories && (
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesValue}>{nutrition.calories}</Text>
            <Text style={styles.caloriesLabel}>calories</Text>
          </View>
        )}
        
        {/* Nutrient Chips */}
        <View style={styles.nutrientsRow}>
          <NutrientChip 
            label="Protein" 
            value={nutrition.protein} 
            unit="g"
            color={getNutrientColor('protein', nutrition.protein)}
          />
          <NutrientChip 
            label="Carbs" 
            value={nutrition.carbs} 
            unit="g"
            color={getNutrientColor('carbs', nutrition.carbs)}
          />
          <NutrientChip 
            label="Fat" 
            value={nutrition.fat} 
            unit="g"
            color={getNutrientColor('fat', nutrition.fat)}
          />
        </View>
        
        {/* Secondary nutrients */}
        {(nutrition.fiber || nutrition.sugar || nutrition.sodium) && (
          <View style={styles.nutrientsRow}>
            <NutrientChip 
              label="Fiber" 
              value={nutrition.fiber} 
              unit="g"
              color={getNutrientColor('fiber', nutrition.fiber)}
            />
            <NutrientChip 
              label="Sugar" 
              value={nutrition.sugar} 
              unit="g"
              color={getNutrientColor('sugar', nutrition.sugar)}
            />
            <NutrientChip 
              label="Sodium" 
              value={nutrition.sodium} 
              unit="mg"
              color={getNutrientColor('sodium', nutrition.sodium)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },

  noDataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },

  noDataText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },

  nutritionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  caloriesSection: {
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },

  caloriesValue: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  caloriesLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.xs,
  },

  nutrientsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },

  nutrientChip: {
    flex: 1,
    minWidth: 80,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },

  nutrientValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },

  nutrientLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textTransform: 'capitalize',
  },
});