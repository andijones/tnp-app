import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { NutritionInfo } from '../../types';

interface ImprovedNutritionPanelProps {
  nutrition?: NutritionInfo;
}

interface NutrientRowProps {
  label: string;
  value?: number;
  unit: string;
  isCalories?: boolean;
}

const NutrientRow: React.FC<NutrientRowProps> = ({ label, value, unit, isCalories = false }) => {
  if (value === undefined || value === null) return null;

  return (
    <View style={styles.nutrientRow}>
      <Text style={[styles.nutrientLabel, isCalories && styles.caloriesLabel]}>
        {label}
      </Text>
      <Text style={[styles.nutrientValue, isCalories && styles.caloriesValue]}>
        {value}{unit}
      </Text>
    </View>
  );
};


export const ImprovedNutritionPanel: React.FC<ImprovedNutritionPanelProps> = ({ nutrition }) => {
  if (!nutrition) {
    return (
      <Text style={styles.noDataText}>
        Nutrition information not available
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <NutrientRow
        label="Calories"
        value={nutrition.calories}
        unit=""
        isCalories={true}
      />

      <NutrientRow
        label="Total Fat"
        value={nutrition.fat}
        unit="g"
      />

      <NutrientRow
        label="Sodium"
        value={nutrition.sodium}
        unit="mg"
      />

      <NutrientRow
        label="Total Carbohydrate"
        value={nutrition.carbs}
        unit="g"
      />

      <NutrientRow
        label="Dietary Fiber"
        value={nutrition.fiber}
        unit="g"
      />

      <NutrientRow
        label="Total Sugars"
        value={nutrition.sugar}
        unit="g"
      />

      <NutrientRow
        label="Protein"
        value={nutrition.protein}
        unit="g"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },

  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },

  nutrientLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },

  caloriesLabel: {
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  nutrientValue: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },

  caloriesValue: {
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  noDataText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
});