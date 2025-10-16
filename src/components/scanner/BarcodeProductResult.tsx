import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
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
  existingFoodId?: string;
  isSubmitting?: boolean;
}

export const BarcodeProductResult: React.FC<BarcodeProductResultProps> = ({
  product,
  onAddToDatabase,
  onScanAnother,
  onViewExisting,
  existingFoodId,
  isSubmitting = false,
}) => {
  // Determine product acceptability
  const isAcceptable = product.novaGroup !== undefined && product.novaGroup >= 1 && product.novaGroup <= 3;
  const isUltraProcessed = product.novaGroup === 4;

  // Determine brand/store display
  const displayBrand = product.brand || (product.stores.length > 0 ? product.stores[0] : null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.pageTitle}>Scan Results</Text>

        {/* Main Product Card */}
        <View style={styles.productCard}>
          {/* Product Image */}
          {product.image && (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          )}

          {/* Product Details */}
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            {displayBrand && (
              <Text style={styles.brandLabel}>{displayBrand}</Text>
            )}
          </View>

          {/* Barcode */}
          <Text style={styles.barcodeText}>{product.barcode}</Text>

          {/* Processing Level Card */}
          {product.novaGroup && (
            <View style={styles.processingLevelContainer}>
              <ProcessingLevelCard level={product.novaGroup} />
            </View>
          )}
        </View>

        {/* Ingredients Section */}
        {product.ingredients && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredientsText}>{product.ingredients}</Text>
          </View>
        )}

        {/* Nutrition Facts Section */}
        {product.nutrition && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nutrition Facts (Per 100g)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionContent}>
                  <Text style={styles.nutritionValue}>{Math.round(product.nutrition.calories)}</Text>
                  <Text style={styles.nutritionLabel}>CALORIES</Text>
                </View>
              </View>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionContent}>
                  <Text style={styles.nutritionValue}>{product.nutrition.protein.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>PROTEIN</Text>
                </View>
              </View>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionContent}>
                  <Text style={styles.nutritionValue}>{product.nutrition.carbs.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>CARBS</Text>
                </View>
              </View>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionContent}>
                  <Text style={styles.nutritionValue}>{product.nutrition.fat.toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>FAT</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Scores Section */}
        {(product.nutriScore || product.ecoScore) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quality Scores</Text>
            <View style={styles.scoresContainer}>
              {product.nutriScore && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Nutri-Score</Text>
                  <View style={[styles.scoreBadge, styles[`nutriScore${product.nutriScore}`]]}>
                    <Text style={styles.scoreValue}>{product.nutriScore}</Text>
                  </View>
                  <Text style={styles.scoreDescription}>Nutritional quality</Text>
                </View>
              )}
              {product.ecoScore && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Eco-Score</Text>
                  <View style={[styles.scoreBadge, styles[`ecoScore${product.ecoScore}`]]}>
                    <Text style={styles.scoreValue}>{product.ecoScore}</Text>
                  </View>
                  <Text style={styles.scoreDescription}>Environmental impact</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Dietary Info Section */}
        {(product.veganStatus !== 'unknown' || product.labels.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Dietary Information</Text>
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
          </View>
        )}

        {/* Additives Warning */}
        {product.additivesCount > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.warningText}>
                Contains {product.additivesCount} additive{product.additivesCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Palm Oil Warning */}
        {product.hasPalmOil && (
          <View style={styles.sectionCard}>
            <View style={[styles.warningBox, { backgroundColor: `${theme.colors.error}15` }]}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.warningText, { color: theme.colors.error }]}>
                Contains palm oil
              </Text>
            </View>
          </View>
        )}

        {/* Allergens Section */}
        {product.allergens.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Allergens</Text>
            <View style={[styles.warningBox, { backgroundColor: `${theme.colors.error}10` }]}>
              <Ionicons name="warning" size={20} color={theme.colors.error} />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                <Text style={[styles.warningText, { color: theme.colors.error, fontWeight: '700' }]}>
                  Contains allergens:
                </Text>
                <Text style={[styles.warningText, { color: theme.colors.error, fontWeight: '500', marginTop: 4 }]}>
                  {product.allergens.join(', ')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Traces Section */}
        {product.traces.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={theme.colors.text.secondary} />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                <Text style={styles.infoText}>
                  May contain traces of: {product.traces.join(', ')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stores Section */}
        {product.stores.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Where to Buy</Text>
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

        {/* Vitamins & Minerals Section */}
        {(product.vitamins.length > 0 || product.minerals.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vitamins & Minerals</Text>
            <View style={styles.nutrientsContainer}>
              {product.vitamins.length > 0 && (
                <View style={styles.nutrientGroup}>
                  <Text style={styles.nutrientGroupTitle}>Vitamins</Text>
                  <View style={styles.tagsContainer}>
                    {product.vitamins.map((vitamin, index) => (
                      <View key={index} style={[styles.tag, styles.vitaminTag]}>
                        <Text style={[styles.tagText, { fontSize: 12 }]}>{vitamin}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {product.minerals.length > 0 && (
                <View style={styles.nutrientGroup}>
                  <Text style={styles.nutrientGroupTitle}>Minerals</Text>
                  <View style={styles.tagsContainer}>
                    {product.minerals.map((mineral, index) => (
                      <View key={index} style={[styles.tag, styles.mineralTag]}>
                        <Text style={[styles.tagText, { fontSize: 12 }]}>{mineral}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
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
            <Button
              title="Scan another product"
              onPress={onScanAnother}
              variant="outline"
            />
          )}
        </View>
      </ScrollView>
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
    lineHeight: 28,
    letterSpacing: -0.44,
    color: theme.colors.neutral[800],
    textAlign: 'center',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  productDetails: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.44,
    color: theme.colors.neutral[800],
    textAlign: 'center',
    minHeight: 58,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    letterSpacing: 0.33,
    color: theme.colors.green[950],
    textTransform: 'uppercase',
  },
  barcodeText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    letterSpacing: 0,
    color: theme.colors.neutral[500],
    textTransform: 'uppercase',
  },
  processingLevelContainer: {
    width: '100%',
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19.15, // 1.197 ratio
    letterSpacing: -0.48,
    color: theme.colors.neutral[800],
  },
  ingredientsText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: -0.13,
    color: theme.colors.neutral[600],
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 0.5,
    borderColor: theme.colors.neutral[200],
    borderRadius: 8,
    width: 156,
    height: 72,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionContent: {
    alignItems: 'center',
    gap: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19.15, // 1.197 ratio
    letterSpacing: -0.48,
    color: theme.colors.neutral[800],
    textAlign: 'center',
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    letterSpacing: 0.33,
    color: theme.colors.neutral[500],
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ultraProcessedMessage: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: -0.13,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginBottom: 16,
    width: 300,
    alignSelf: 'center',
  },
  actionButtons: {
    gap: 16,
  },
  // Scores
  scoresContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  scoreDescription: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  // Nutri-Score colors
  nutriScoreA: { backgroundColor: '#038141' },
  nutriScoreB: { backgroundColor: '#85BB2F' },
  nutriScoreC: { backgroundColor: '#FECB02' },
  nutriScoreD: { backgroundColor: '#EE8100' },
  nutriScoreE: { backgroundColor: '#E63E11' },
  // Eco-Score colors
  ecoScoreA: { backgroundColor: '#008140' },
  ecoScoreB: { backgroundColor: '#51A63F' },
  ecoScoreC: { backgroundColor: '#FDB913' },
  ecoScoreD: { backgroundColor: '#F17423' },
  ecoScoreE: { backgroundColor: '#ED1C24' },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 16,
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
  vitaminTag: {
    backgroundColor: `${theme.colors.green[500]}10`,
  },
  mineralTag: {
    backgroundColor: `${theme.colors.green[700]}10`,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  // Warning boxes
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  // Nutrients
  nutrientsContainer: {
    gap: 12,
  },
  nutrientGroup: {
    gap: 8,
  },
  nutrientGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});
