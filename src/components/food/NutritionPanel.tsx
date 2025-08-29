import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { NutritionInfo } from '../../types';
import { SectionHeader } from '../common/SectionHeader';

interface NutritionPanelProps {
  nutrition?: NutritionInfo;
}

interface NutrientRowProps {
  label: string;
  value?: number;
  unit: string;
  dailyValue?: number;
}

const NutrientRow: React.FC<NutrientRowProps> = ({ label, value, unit, dailyValue }) => (
  <View style={styles.nutrientRow}>
    <Text style={styles.nutrientLabel}>{label}</Text>
    <View style={styles.nutrientValues}>
      {value !== undefined ? (
        <>
          <Text style={styles.nutrientValue}>{value}{unit}</Text>
          {dailyValue && (
            <Text style={styles.dailyValue}>{dailyValue}% DV</Text>
          )}
        </>
      ) : (
        <Text style={styles.noData}>--</Text>
      )}
    </View>
  </View>
);

export const NutritionPanel: React.FC<NutritionPanelProps> = ({ nutrition }) => {
  const hasNutritionData = nutrition && Object.values(nutrition).some(value => value !== undefined);

  if (!hasNutritionData) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Nutrition Facts" 
          icon="nutrition-outline"
          subtitle={nutrition?.servingSize ? `Per ${nutrition.servingSize}` : "Per serving"}
        />
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={48} color={theme.colors.text.hint} />
          <Text style={styles.noDataTitle}>No nutrition data available</Text>
          <Text style={styles.noDataSubtitle}>
            This information may be added in future updates
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Nutrition Facts" 
        icon="nutrition-outline"
        subtitle={nutrition?.servingSize ? `Per ${nutrition.servingSize}` : "Per serving"}
      />
      <View style={styles.nutritionCard}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionTitle}>Nutrition Facts</Text>
        </View>
        
        {nutrition.calories && (
          <View style={styles.caloriesSection}>
            <View style={styles.caloriesRow}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{nutrition.calories}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.dailyValueNote}>% Daily Value*</Text>
        
        <View style={styles.nutrientsSection}>
          <NutrientRow 
            label="Total Fat" 
            value={nutrition.fat} 
            unit="g"
            dailyValue={nutrition.fat ? Math.round((nutrition.fat / 65) * 100) : undefined}
          />
          <NutrientRow 
            label="Total Carbohydrates" 
            value={nutrition.carbs} 
            unit="g"
            dailyValue={nutrition.carbs ? Math.round((nutrition.carbs / 300) * 100) : undefined}
          />
          {nutrition.fiber && (
            <View style={styles.indentedRow}>
              <NutrientRow 
                label="Dietary Fiber" 
                value={nutrition.fiber} 
                unit="g"
                dailyValue={Math.round((nutrition.fiber / 25) * 100)}
              />
            </View>
          )}
          {nutrition.sugar && (
            <View style={styles.indentedRow}>
              <NutrientRow 
                label="Total Sugars" 
                value={nutrition.sugar} 
                unit="g"
              />
            </View>
          )}
          <NutrientRow 
            label="Protein" 
            value={nutrition.protein} 
            unit="g"
            dailyValue={nutrition.protein ? Math.round((nutrition.protein / 50) * 100) : undefined}
          />
          <NutrientRow 
            label="Sodium" 
            value={nutrition.sodium} 
            unit="mg"
            dailyValue={nutrition.sodium ? Math.round((nutrition.sodium / 2300) * 100) : undefined}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            *Percent Daily Values are based on a 2,000 calorie diet
          </Text>
        </View>
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
    alignItems: 'center',
  },

  noDataTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  noDataSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  nutritionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },

  nutritionHeader: {
    paddingBottom: theme.spacing.md,
  },

  nutritionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  caloriesSection: {
    paddingVertical: theme.spacing.sm,
  },

  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  caloriesLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  caloriesValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  divider: {
    height: 2,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },

  dailyValueNote: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
  },

  nutrientsSection: {
    gap: theme.spacing.xs,
  },

  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },

  indentedRow: {
    paddingLeft: theme.spacing.lg,
  },

  nutrientLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    flex: 1,
  },

  nutrientValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  nutrientValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'right',
  },

  dailyValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'right',
  },

  noData: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.hint,
    fontStyle: 'italic',
  },

  footer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },

  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});