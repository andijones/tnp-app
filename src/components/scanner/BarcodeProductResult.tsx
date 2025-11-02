import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { TransformedProduct } from '../../services/openFoodFacts';
import { ProcessingLevelCard } from '../common/ProcessingLevelCard';
import { Button } from '../common/Button';

interface BarcodeProductResultProps {
  product: TransformedProduct;
  onAddToDatabase: () => void;
  onScanAnother: () => void;
  onViewExisting?: (foodId: string) => void;
  onReturnHome?: () => void;
  existingFoodId?: string;
  isSubmitting?: boolean;
}

export const BarcodeProductResult: React.FC<BarcodeProductResultProps> = ({
  product,
  onAddToDatabase,
  onScanAnother,
  onViewExisting,
  onReturnHome,
  existingFoodId,
  isSubmitting = false,
}) => {
  // Determine product acceptability
  const isAcceptable = product.novaGroup !== undefined && product.novaGroup >= 1 && product.novaGroup <= 3;
  const isUltraProcessed = product.novaGroup === 4;

  // Determine brand/store display
  const displayBrand = product.brand || (product.stores.length > 0 ? product.stores[0] : null);

  // State for collapsible sections
  const [showNutrition, setShowNutrition] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Success animation
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const [showCheckmark, setShowCheckmark] = useState(true);

  // Trigger success animation and haptic feedback on mount
  useEffect(() => {
    // Haptic feedback for successful scan
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Checkmark animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.timing(checkmarkOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowCheckmark(false));
  }, []);

  // Get processing level color (same as GridFoodCard)
  const getProcessingLevelColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1: return '#C1FFD0'; // Green-100
      case 2: return '#FFF9B3'; // Yellow
      case 3: return '#FFE4CC'; // Orange
      case 4: return '#FFD4D4'; // Red
      default: return '#F5F5F5';
    }
  };

  const getProcessingLevelIcon = (novaGroup?: number): keyof typeof Ionicons.glyphMap => {
    switch (novaGroup) {
      case 1: return 'leaf';
      case 2: return 'water';
      case 3: return 'restaurant';
      case 4: return 'warning';
      default: return 'help-circle';
    }
  };

  const getProcessingLevelIconColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1: return '#26733E';
      case 2: return '#928D1D';
      case 3: return '#E6630B';
      case 4: return '#DC2626';
      default: return '#737373';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.pageTitle}>Scan Results</Text>

        {/* Main Product Card - Inspired by GridFoodCard */}
        <View style={styles.productCard}>
          {/* Product Image Container with Processing Level Badge */}
          <View style={styles.imageContainer}>
            {product.image && (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            )}

            {/* Processing Level Badge - Top Left (like GridFoodCard) */}
            {product.novaGroup && (
              <View
                style={[
                  styles.processingLevelBadge,
                  { backgroundColor: getProcessingLevelColor(product.novaGroup) }
                ]}
              >
                <Ionicons
                  name={getProcessingLevelIcon(product.novaGroup)}
                  size={20}
                  color={getProcessingLevelIconColor(product.novaGroup)}
                />
              </View>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            {displayBrand && (
              <Text style={styles.brandLabel}>{displayBrand}</Text>
            )}
            <Text style={styles.barcodeText}>{product.barcode}</Text>
          </View>
        </View>

        {/* Processing Level Card */}
        {product.novaGroup && (
          <View style={styles.processingLevelContainer}>
            <ProcessingLevelCard level={product.novaGroup} />
          </View>
        )}

        {/* Key Information - Always Visible */}

        {/* Ingredients Section - Compact */}
        {product.ingredients && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={18} color={theme.colors.green[950]} />
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <Text style={styles.ingredientsText} numberOfLines={3}>{product.ingredients}</Text>
          </View>
        )}

        {/* Warnings - Always Visible if Present */}
        {product.additivesCount > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              Contains {product.additivesCount} additive{product.additivesCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {product.hasPalmOil && (
          <View style={[styles.warningCard, { backgroundColor: `${theme.colors.error}15` }]}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.warningText, { color: theme.colors.error }]}>Contains palm oil</Text>
          </View>
        )}

        {product.allergens.length > 0 && (
          <View style={[styles.warningCard, { backgroundColor: `${theme.colors.error}15` }]}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningText, { color: theme.colors.error }]}>
                Allergens: {product.allergens.join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Nutrition Facts - Collapsible */}
        {product.nutrition && (
          <TouchableOpacity
            style={styles.collapsibleSection}
            onPress={() => setShowNutrition(!showNutrition)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeader}>
              <View style={styles.sectionHeader}>
                <Ionicons name="nutrition" size={18} color={theme.colors.green[950]} />
                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              </View>
              <Ionicons
                name={showNutrition ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </View>

            {showNutrition && (
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(product.nutrition.calories)}</Text>
                  <Text style={styles.nutritionLabel}>CALORIES</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{product.nutrition.protein.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>PROTEIN</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{product.nutrition.carbs.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>CARBS</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{product.nutrition.fat.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>FAT</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Additional Information - Collapsible */}
        {(product.nutriScore || product.ecoScore || product.veganStatus !== 'unknown' || product.labels.length > 0 || product.stores.length > 0) && (
          <TouchableOpacity
            style={styles.collapsibleSection}
            onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeader}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={18} color={theme.colors.green[950]} />
                <Text style={styles.sectionTitle}>Additional Info</Text>
              </View>
              <Ionicons
                name={showAdditionalInfo ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </View>

            {showAdditionalInfo && (
              <View style={styles.additionalInfoContent}>
                {/* Dietary Tags */}
                {(product.veganStatus !== 'unknown' || product.labels.length > 0) && (
                  <View style={styles.tagsContainer}>
                    {product.veganStatus === 'vegan' && (
                      <View style={[styles.tag, styles.veganTag]}>
                        <Ionicons name="leaf" size={14} color={theme.colors.success} />
                        <Text style={[styles.tagText, { color: theme.colors.success }]}>Vegan</Text>
                      </View>
                    )}
                    {product.veganStatus === 'vegetarian' && (
                      <View style={[styles.tag, styles.vegetarianTag]}>
                        <Ionicons name="leaf-outline" size={14} color={theme.colors.green[700]} />
                        <Text style={[styles.tagText, { color: theme.colors.green[700] }]}>Vegetarian</Text>
                      </View>
                    )}
                    {product.labels.map((label, index) => (
                      <View key={index} style={styles.tag}>
                        <Ionicons name="checkmark-circle" size={14} color={theme.colors.green[600]} />
                        <Text style={styles.tagText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Stores */}
                {product.stores.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>Where to Buy</Text>
                    <View style={styles.tagsContainer}>
                      {product.stores.map((store, index) => (
                        <View key={index} style={[styles.tag, styles.storeTag]}>
                          <Ionicons name="storefront" size={14} color={theme.colors.green[600]} />
                          <Text style={styles.tagText}>{store}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Ultra Processed Message */}
        {isUltraProcessed && (
          <Text style={styles.ultraProcessedMessage}>
            Cannot submit to our database as it's{'\n'}ultra processed.
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {existingFoodId ? (
            <>
              {onViewExisting && (
                <Button
                  title="See item here"
                  onPress={() => onViewExisting(existingFoodId)}
                  variant="secondary"
                />
              )}
              <Button
                title="Scan another product"
                onPress={onScanAnother}
                variant="outline"
              />
            </>
          ) : isAcceptable ? (
            <>
              <Button
                title={isSubmitting ? "Submitting..." : "Submit food to app"}
                onPress={onAddToDatabase}
                disabled={isSubmitting}
                variant="secondary"
              />
              <Button
                title="Scan another product"
                onPress={onScanAnother}
                variant="outline"
              />
            </>
          ) : (
            <>
              <Button
                title="Scan another item"
                onPress={onScanAnother}
                variant="secondary"
              />
              {onReturnHome && (
                <Button
                  title="Return Home"
                  onPress={onReturnHome}
                  variant="outline"
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Success Checkmark Animation Overlay */}
      {showCheckmark && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: checkmarkOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.successCheckmark,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          </Animated.View>
          <Text style={styles.successText}>Scan Complete!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Product Card - Inspired by GridFoodCard
  productCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  imageContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'visible',
  },

  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: theme.colors.neutral[100],
  },

  // Processing Level Badge (like GridFoodCard)
  processingLevelBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 38,
    height: 38,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  productDetails: {
    gap: 6,
    alignItems: 'center',
  },

  productName: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: -0.57,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  brandLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0,
    color: theme.colors.green[950],
    textTransform: 'uppercase',
  },

  barcodeText: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    letterSpacing: 0,
    color: theme.colors.text.secondary,
  },

  processingLevelContainer: {
    marginBottom: 16,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: -0.48,
    color: theme.colors.text.primary,
  },

  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: -0.2,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },

  ingredientsText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    color: theme.colors.text.primary,
  },
  // Warning Cards
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: 8,
    marginBottom: 12,
  },

  warningText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: theme.colors.warning,
    flex: 1,
  },

  // Collapsible Sections
  collapsibleSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  additionalInfoContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.neutral[200],
  },

  // Nutrition Grid
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.neutral[200],
  },

  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },

  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.54,
    color: theme.colors.text.primary,
  },

  nutritionLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    letterSpacing: 0.5,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 12,
    gap: 4,
  },

  veganTag: {
    backgroundColor: `${theme.colors.success}15`,
  },

  vegetarianTag: {
    backgroundColor: `${theme.colors.green[700]}15`,
  },

  storeTag: {
    backgroundColor: theme.colors.green[50],
  },

  tagText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
    color: theme.colors.text.primary,
  },

  // Ultra Processed Message
  ultraProcessedMessage: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: 16,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },

  // Success Animation Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  successCheckmark: {
    marginBottom: 16,
  },

  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
