import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { NutritionInfo } from '../../types';

interface ImprovedNutritionPanelProps {
  nutrition?: NutritionInfo;
}

interface NutrientRowProps {
  label: string;
  value?: number;
  unit: string;
  dailyValue?: number;
  healthIndicator?: 'good' | 'moderate' | 'high' | 'neutral';
  isCalories?: boolean;
}

const NutrientRow: React.FC<NutrientRowProps> = (props) => {
  const { 
    label, 
    value, 
    unit, 
    dailyValue, 
    healthIndicator = 'neutral',
    isCalories = false 
  } = props;
  if (value === undefined) return null;

  const getIndicatorColor = () => {
    switch (healthIndicator) {
      case 'good': return '#34C759'; // iOS green
      case 'moderate': return '#FF9F0A'; // iOS orange
      case 'high': return '#FF3B30'; // iOS red
      default: return '#8E8E93'; // iOS gray
    }
  };

  const getIndicatorIcon = () => {
    switch (healthIndicator) {
      case 'good': return 'checkmark-circle';
      case 'moderate': return 'warning';
      case 'high': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  return (
    <View style={[styles.nutrientRow, isCalories && styles.caloriesRow]}>
      <View style={styles.nutrientInfo}>
        <Text style={[styles.nutrientLabel, isCalories && styles.caloriesLabel]}>
          {label}
        </Text>
        {dailyValue && (
          <Text style={styles.dailyValueText}>
            {dailyValue}% DV
          </Text>
        )}
      </View>
      
      <View style={styles.nutrientValueContainer}>
        <Text style={[styles.nutrientValue, isCalories && styles.caloriesValue]}>
          {value}{unit}
        </Text>
        {healthIndicator !== 'neutral' && (
          <View style={[styles.indicatorContainer, { backgroundColor: getIndicatorColor() }]}>
            <Ionicons 
              name={getIndicatorIcon()} 
              size={12} 
              color="white" 
            />
          </View>
        )}
      </View>
    </View>
  );
};

const getHealthIndicator = (nutrient: string, value?: number): 'good' | 'moderate' | 'high' | 'neutral' => {
  if (value === undefined) return 'neutral';
  
  switch (nutrient) {
    case 'protein':
      return value >= 10 ? 'good' : 'neutral';
    case 'fiber':
      return value >= 3 ? 'good' : 'neutral';
    case 'sugar':
      return value >= 15 ? 'high' : value >= 5 ? 'moderate' : 'good';
    case 'sodium':
      return value >= 600 ? 'high' : value >= 300 ? 'moderate' : 'good';
    case 'saturatedFat':
      return value >= 5 ? 'high' : value >= 2 ? 'moderate' : 'good';
    case 'calories':
      return 'neutral'; // Calories are context-dependent
    default:
      return 'neutral';
  }
};

const getIndicatorColor = (indicator: 'good' | 'moderate' | 'high' | 'neutral'): string => {
  switch (indicator) {
    case 'good': return theme.colors.success;
    case 'moderate': return theme.colors.warning;
    case 'high': return theme.colors.error;
    default: return theme.colors.text.tertiary;
  }
};

const calculateDailyValue = (nutrient: string, value?: number): number | undefined => {
  if (value === undefined) return undefined;
  
  const dailyValues: { [key: string]: number } = {
    fat: 65,
    saturatedFat: 20,
    sodium: 2300,
    carbs: 300,
    fiber: 25,
    sugar: 50,
    protein: 50,
  };
  
  const dv = dailyValues[nutrient];
  return dv ? Math.round((value / dv) * 100) : undefined;
};

export const ImprovedNutritionPanel: React.FC<ImprovedNutritionPanelProps> = ({ nutrition }) => {
  const hasNutritionData = nutrition && Object.values(nutrition).some(value => value !== undefined);

  if (!hasNutritionData) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="nutrition-outline" size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.noDataTitle}>No Nutrition Data</Text>
          <Text style={styles.noDataSubtitle}>
            Nutrition information is not available for this product
          </Text>
        </View>
      </View>
    );
  }

  // Get key nutrients that are available
  const keyNutrients = [
    { key: 'calories', label: 'Calories', value: nutrition.calories, unit: '', isCalories: true },
    { key: 'protein', label: 'Protein', value: nutrition.protein, unit: 'g' },
    { key: 'fiber', label: 'Fiber', value: nutrition.fiber, unit: 'g' },
    { key: 'sugar', label: 'Sugar', value: nutrition.sugar, unit: 'g' },
    { key: 'sodium', label: 'Sodium', value: nutrition.sodium, unit: 'mg' },
  ].filter(nutrient => nutrient.value !== undefined);

  const hasBasicInfo = keyNutrients.length > 0;

  return (
    <View style={styles.container}>
      {/* Quick Nutrition Overview */}
      {hasBasicInfo && (
        <View style={styles.quickStatsRow}>
          {keyNutrients.slice(0, 4).map((nutrient, index) => (
            <View key={nutrient.key} style={styles.quickStat}>
              <Text style={[
                styles.quickStatValue, 
                nutrient.isCalories && styles.caloriesValue
              ]}>
                {nutrient.value}{nutrient.unit}
              </Text>
              <Text style={styles.quickStatLabel}>{nutrient.label}</Text>
              {getHealthIndicator(nutrient.key, nutrient.value) !== 'neutral' && (
                <View style={[
                  styles.quickStatIndicator,
                  { backgroundColor: getIndicatorColor(getHealthIndicator(nutrient.key, nutrient.value)) }
                ]} />
              )}
            </View>
          ))}
        </View>
      )}
      
      {/* Detailed Nutrition Facts */}
      <View style={styles.nutritionCard}>
        {nutrition.servingSize && (
          <View style={styles.servingSizeContainer}>
            <Text style={styles.servingSizeLabel}>Per serving</Text>
            <Text style={styles.servingSizeValue}>{nutrition.servingSize}</Text>
          </View>
        )}
        
        {/* Calories - Always first and prominent */}
        <NutrientRow
          label="Calories"
          value={nutrition.calories}
          unit=""
          isCalories={true}
        />
        
        {nutrition.calories && <View style={styles.separator} />}
        
        {/* Macronutrients */}
        <NutrientRow
          label="Total Fat"
          value={nutrition.fat}
          unit="g"
          dailyValue={calculateDailyValue('fat', nutrition.fat)}
          healthIndicator={getHealthIndicator('fat', nutrition.fat)}
        />
        
        
        <NutrientRow
          label="Sodium"
          value={nutrition.sodium}
          unit="mg"
          dailyValue={calculateDailyValue('sodium', nutrition.sodium)}
          healthIndicator={getHealthIndicator('sodium', nutrition.sodium)}
        />
        
        <NutrientRow
          label="Total Carbohydrate"
          value={nutrition.carbs}
          unit="g"
          dailyValue={calculateDailyValue('carbs', nutrition.carbs)}
          healthIndicator={getHealthIndicator('carbs', nutrition.carbs)}
        />
        
        <NutrientRow
          label="Dietary Fiber"
          value={nutrition.fiber}
          unit="g"
          dailyValue={calculateDailyValue('fiber', nutrition.fiber)}
          healthIndicator={getHealthIndicator('fiber', nutrition.fiber)}
        />
        
        <NutrientRow
          label="Total Sugars"
          value={nutrition.sugar}
          unit="g"
          healthIndicator={getHealthIndicator('sugar', nutrition.sugar)}
        />
        
        <NutrientRow
          label="Protein"
          value={nutrition.protein}
          unit="g"
          dailyValue={calculateDailyValue('protein', nutrition.protein)}
          healthIndicator={getHealthIndicator('protein', nutrition.protein)}
        />
      </View>
      
      <View style={styles.footnoteContainer}>
        <Text style={styles.footnoteText}>
          * Percent Daily Values based on 2,000 calorie diet. Color coding indicates health impact.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },

  // Quick Stats Overview
  quickStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },

  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    position: 'relative',
  },

  quickStatValue: {
    ...theme.typography.headline,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  caloriesValue: {
    ...theme.typography.display,
    fontSize: 24,
  },

  quickStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  quickStatIndicator: {
    position: 'absolute',
    top: -2,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Detailed Nutrition Card
  nutritionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },

  servingSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.xs,
  },

  servingSizeLabel: {
    ...theme.typography.subtextMedium,
    color: theme.colors.text.secondary,
  },

  servingSizeValue: {
    ...theme.typography.bodySemibold,
    color: theme.colors.text.primary,
  },

  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },

  caloriesRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },

  nutrientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nutrientLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },

  caloriesLabel: {
    ...theme.typography.headline,
    fontWeight: '600',
  },

  dailyValueText: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },

  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },

  nutrientValue: {
    ...theme.typography.bodySemibold,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },

  indicatorContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },

  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },

  footnoteContainer: {
    paddingHorizontal: theme.spacing.xs,
  },

  footnoteText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  noDataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  noDataTitle: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },

  noDataSubtitle: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});