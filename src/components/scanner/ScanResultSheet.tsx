import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../common/Button';
import { Food } from '../../types';

interface ScanResultSheetProps {
  visible: boolean;
  food: Food | null;
  onClose: () => void;
  onScanAnother: () => void;
  onReturnHome: () => void;
}

export const ScanResultSheet: React.FC<ScanResultSheetProps> = ({
  visible,
  food,
  onClose,
  onScanAnother,
  onReturnHome,
}) => {
  if (!food) return null;

  // Get processing level info
  const getProcessingLevelInfo = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return {
          label: 'Whole Foods',
          badge: 'Nova 1',
          backgroundColor: '#A3F6B8', // Green-200
          borderColor: '#89eaa2',
          textColor: '#26733E', // Dark green
        };
      case 2:
        return {
          label: 'Extracted Foods',
          badge: 'Nova 2',
          backgroundColor: '#FFF491',
          borderColor: '#E1D02E',
          textColor: '#928D1D',
        };
      case 3:
        return {
          label: 'Lightly Processed',
          badge: 'Nova 3',
          backgroundColor: '#FFCA9B',
          borderColor: '#E0A36C',
          textColor: '#E6630B',
        };
      case 4:
        return {
          label: 'Processed',
          badge: 'Nova 4',
          backgroundColor: '#FFD4D4',
          borderColor: '#DC2626',
          textColor: '#DC2626',
        };
      default:
        return {
          label: 'Unknown',
          badge: 'N/A',
          backgroundColor: '#F5F5F5',
          borderColor: '#E5E5E5',
          textColor: '#737373',
        };
    }
  };

  const processingInfo = getProcessingLevelInfo(food.nova_group);

  // Check if sections have data - Each check is separate for granular control
  const hasIngredients = Boolean(food.ingredients && food.ingredients.trim());
  const hasAdditives = Boolean(food.nutrition_data?.additives && food.nutrition_data.additives.trim());
  const hasAllergens = Boolean(food.nutrition_data?.allergens && food.nutrition_data.allergens.trim());
  const hasPalmOil = Boolean(
    food.nutrition_data?.palm_oil ||
    (food.ingredients && food.ingredients.toLowerCase().includes('palm oil'))
  );

  // Check each nutrition field separately
  const hasCalories = food.nutrition_data?.calories != null;
  const hasFat = food.nutrition_data?.fat != null;
  const hasCarbs = food.nutrition_data?.carbs != null;
  const hasProtein = food.nutrition_data?.protein != null;
  const hasFiber = food.nutrition_data?.fiber != null;
  const hasSugar = food.nutrition_data?.sugar != null;
  const hasSodium = food.nutrition_data?.sodium != null;

  // Show nutrition section if ANY nutrition field has data
  const hasNutrition = hasCalories || hasFat || hasCarbs || hasProtein || hasFiber || hasSugar || hasSodium;

  // Check additional info fields separately
  const isVegan = Boolean(food.nutrition_data?.vegan);
  const isVegetarian = Boolean(food.nutrition_data?.vegetarian);
  const hasAdditionalInfoText = Boolean(food.nutrition_data?.additional_info && food.nutrition_data.additional_info.trim());

  const hasAdditionalInfo = isVegan || isVegetarian || hasAdditionalInfoText;

  // Determine which is the last nutrition row for styling
  const nutritionFields = [
    { key: 'calories', hasData: hasCalories },
    { key: 'fat', hasData: hasFat },
    { key: 'carbs', hasData: hasCarbs },
    { key: 'protein', hasData: hasProtein },
    { key: 'fiber', hasData: hasFiber },
    { key: 'sugar', hasData: hasSugar },
    { key: 'sodium', hasData: hasSodium },
  ];
  const lastNutritionField = nutritionFields.filter(f => f.hasData).pop()?.key;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Blurred backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        {/* Sheet container */}
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan results</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={theme.colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Processing Level - Simple Banner */}
            <View
              style={[
                styles.processingBanner,
                {
                  backgroundColor: processingInfo.backgroundColor,
                  borderColor: processingInfo.borderColor,
                },
              ]}
            >
              <View style={styles.processingRow}>
                <Ionicons
                  name={
                    food.nova_group === 1 ? "leaf" :
                    food.nova_group === 2 ? "water" :
                    "restaurant"
                  }
                  size={20}
                  color={processingInfo.textColor}
                />
                <Text
                  style={[
                    styles.processingLabel,
                    { color: processingInfo.textColor },
                  ]}
                >
                  {processingInfo.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.processingDescription,
                  { color: processingInfo.textColor },
                ]}
              >
                {food.nova_group === 1
                  ? "Natural, unprocessed ingredients"
                  : food.nova_group === 2
                  ? "Minimally processed"
                  : food.nova_group === 3
                  ? "Lightly processed"
                  : "Ultra-processed"}
              </Text>
            </View>

            {/* Product Image */}
            <View style={styles.imageContainer}>
              {food.image ? (
                <Image
                  source={{ uri: food.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons
                    name="nutrition-outline"
                    size={80}
                    color={theme.colors.neutral[300]}
                  />
                </View>
              )}
            </View>

            {/* Title and Metadata */}
            <View style={styles.titleSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.productTitle}>{food.name}</Text>
                {food.supermarket && (
                  <Text style={styles.supermarketLabel}>
                    {food.supermarket.toUpperCase()}
                  </Text>
                )}
                {food.url && (
                  <Text style={styles.barcodeLabel}>
                    {food.url}
                  </Text>
                )}
              </View>
            </View>

            {/* Ingredients */}
            {hasIngredients && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.ingredientsText}>{food.ingredients}</Text>
              </View>
            )}

            {/* Warnings Section - All in one clean list */}
            {(hasAdditives || hasPalmOil || hasAllergens) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contains</Text>
                <View style={styles.warningsList}>
                  {hasAdditives && (
                    <View style={styles.warningItem}>
                      <View style={styles.warningDot} />
                      <Text style={styles.warningText}>{food.nutrition_data!.additives}</Text>
                    </View>
                  )}
                  {hasPalmOil && (
                    <View style={styles.warningItem}>
                      <View style={styles.warningDot} />
                      <Text style={styles.warningText}>Palm oil</Text>
                    </View>
                  )}
                  {hasAllergens && (
                    <View style={styles.warningItem}>
                      <View style={styles.warningDot} />
                      <Text style={styles.warningText}>Allergens: {food.nutrition_data!.allergens}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Nutrition - Simple Grid */}
            {hasNutrition && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
                <View style={styles.nutritionGrid}>
                  {hasCalories && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.calories}
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Calories</Text>
                    </View>
                  )}
                  {hasProtein && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.protein}g
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Protein</Text>
                    </View>
                  )}
                  {hasCarbs && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.carbs}g
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Carbs</Text>
                    </View>
                  )}
                  {hasFat && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.fat}g
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Fat</Text>
                    </View>
                  )}
                  {hasFiber && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.fiber}g
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Fiber</Text>
                    </View>
                  )}
                  {hasSugar && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.sugar}g
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Sugar</Text>
                    </View>
                  )}
                  {hasSodium && (
                    <View style={styles.nutritionGridItem}>
                      <Text style={styles.nutritionGridValue}>
                        {food.nutrition_data!.sodium}mg
                      </Text>
                      <Text style={styles.nutritionGridLabel}>Sodium</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Additional Info - Simple badges and text */}
            {hasAdditionalInfo && (
              <View style={styles.section}>
                {(isVegan || isVegetarian) && (
                  <View style={styles.badgesRow}>
                    {isVegan && (
                      <View style={styles.badge}>
                        <Ionicons name="leaf" size={14} color={theme.colors.green[700]} />
                        <Text style={styles.badgeText}>Vegan</Text>
                      </View>
                    )}
                    {isVegetarian && (
                      <View style={styles.badge}>
                        <Ionicons name="nutrition" size={14} color={theme.colors.green[700]} />
                        <Text style={styles.badgeText}>Vegetarian</Text>
                      </View>
                    )}
                  </View>
                )}
                {hasAdditionalInfoText && (
                  <Text style={styles.additionalInfoText}>
                    {food.nutrition_data!.additional_info}
                  </Text>
                )}
              </View>
            )}

            {/* UPF Warning for Nova 4 */}
            {food.nova_group === 4 && (
              <View style={styles.upfWarning}>
                <Text style={styles.upfWarningText}>
                  Cannot submit to our database as it's ultra processed.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <Button
                title="Scan another item"
                onPress={onScanAnother}
                variant="secondary"
              />
              <Button
                title="Return home"
                onPress={onReturnHome}
                variant="outline"
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(235, 234, 228, 0.8)',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#EBEAE4',
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.36,
    color: '#0A0A0A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 300,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24, // Clean, consistent spacing
  },
  // Processing Banner - Simple
  processingBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingLabel: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.32,
  },
  processingDescription: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.13,
    opacity: 0.85,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  productImage: {
    width: 200,
    height: 200,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    width: '100%',
  },
  titleContainer: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEAE4',
  },
  productTitle: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.44,
    color: '#262626',
    textAlign: 'center',
  },
  supermarketLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    letterSpacing: 0.33,
    color: '#1F5932',
    textAlign: 'center',
  },
  barcodeLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    letterSpacing: 0.33,
    color: '#525252',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 18,
    letterSpacing: 0.5,
    color: '#737373',
    marginBottom: 8,
  },

  // Ingredients - Simple text
  ingredientsText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.15,
    color: '#262626',
  },

  // Warnings - Clean list
  warningsList: {
    gap: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 9,
  },
  warningText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.15,
    color: '#262626',
    flex: 1,
  },

  // Nutrition Grid - Cleaner
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nutritionGridItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  nutritionGridValue: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.36,
    color: '#0A0A0A',
  },
  nutritionGridLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#A3A3A3',
  },
  // Additional Info - Cleaner
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0FFE7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A3F6B8',
  },
  badgeText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.13,
    color: '#26733E',
  },
  additionalInfoText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.14,
    color: '#737373',
    marginTop: 4,
  },
  // UPF Warning
  upfWarning: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  upfWarningText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.13,
    color: '#737373',
    textAlign: 'center',
  },

  buttonGroup: {
    gap: 16,
    marginTop: 8,
  },
});
