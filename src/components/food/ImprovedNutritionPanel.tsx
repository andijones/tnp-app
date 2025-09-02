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

const NutrientRow: React.FC<NutrientRowProps> = ({ 
  label, 
  value, 
  unit, 
  dailyValue, 
  healthIndicator = 'neutral',
  isCalories = false 
}) => {
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
    default:
      return 'neutral';
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
        <View style={styles.headerContainer}>
          <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="nutrition-outline" size={48} color="#C7C7CC" />
          <Text style={styles.noDataTitle}>No Nutrition Data</Text>
          <Text style={styles.noDataSubtitle}>
            Nutrition information is not available for this product
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          {nutrition?.servingSize && (
            <Text style={styles.servingSize}>Per {nutrition.servingSize}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.nutritionCard}>
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
          label="Saturated Fat"
          value={nutrition.saturatedFat}
          unit="g"
          dailyValue={calculateDailyValue('saturatedFat', nutrition.saturatedFat)}
          healthIndicator={getHealthIndicator('saturatedFat', nutrition.saturatedFat)}
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
          * Percent Daily Values are based on a 2,000 calorie diet
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

  servingSize: {
    fontSize: 15,
    color: '#6D6D70',
    marginTop: 1,
  },

  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44, // iOS standard touch target
  },

  caloriesRow: {
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5EA',
  },

  nutrientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nutrientLabel: {
    fontSize: 17,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },

  caloriesLabel: {
    fontSize: 20,
    fontWeight: '600',
  },

  dailyValueText: {
    fontSize: 15,
    color: '#6D6D70',
    marginLeft: 8,
  },

  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },

  nutrientValue: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'right',
  },

  caloriesValue: {
    fontSize: 28,
    fontWeight: '700',
  },

  indicatorContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },

  footnoteContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },

  footnoteText: {
    fontSize: 13,
    color: '#6D6D70',
    fontStyle: 'italic',
  },

  noDataContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  noDataTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },

  noDataSubtitle: {
    fontSize: 15,
    color: '#6D6D70',
    textAlign: 'center',
    lineHeight: 20,
  },
});