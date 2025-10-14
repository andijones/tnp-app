import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { TransformedProduct } from '../../services/openFoodFacts';
import { getProcessingLevel } from '../../utils/processingLevel';

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
  const isUnknown = product.novaGroup === undefined;

  // Get processing level info
  const level = getProcessingLevel(product.novaGroup);

  return (
    <ScrollView style={styles.container}>
      {/* Processing Level Badge - Hero Element */}
      {product.novaGroup && (
        <View style={styles.levelSection}>
          <View style={[styles.levelBadge, { backgroundColor: level.lightBg }]}>
            <View style={[styles.levelIconContainer, { backgroundColor: level.color }]}>
              <Ionicons name={level.icon as any} size={32} color="white" />
            </View>
            <Text style={[styles.levelLabel, { color: level.color }]}>
              {level.label}
            </Text>
            <Text style={styles.levelDescription}>{level.description}</Text>
          </View>
        </View>
      )}

      {/* Status Message */}
      {existingFoodId ? (
        <View style={[styles.statusCard, { backgroundColor: '#E8F5E8' }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: theme.colors.success }]}>
              Food item already exists
            </Text>
            <Text style={styles.statusMessage}>
              This product is already in our database
            </Text>
          </View>
        </View>
      ) : isAcceptable ? (
        <View style={[styles.statusCard, { backgroundColor: '#E8F5E8' }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: theme.colors.success }]}>
              ✓ This product qualifies for our database
            </Text>
            <Text style={styles.statusMessage}>
              This is a whole, extracted, or lightly processed food.
            </Text>
          </View>
        </View>
      ) : isUltraProcessed ? (
        <View style={[styles.statusCard, { backgroundColor: '#FFE6E6' }]}>
          <Ionicons name="close-circle" size={24} color={theme.colors.error} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: theme.colors.error }]}>
              ⚠️ This product is ultra-processed
            </Text>
            <Text style={styles.statusMessage}>
              We only accept Whole Foods, Extracted Foods, and Lightly Processed items.
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.statusCard, { backgroundColor: '#FFF4E6' }]}>
          <Ionicons name="help-circle" size={24} color={theme.colors.warning} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: theme.colors.warning }]}>
              Processing level unknown
            </Text>
            <Text style={styles.statusMessage}>
              Submit this for manual review by our team.
            </Text>
          </View>
        </View>
      )}

      {/* Product Image */}
      {product.image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>
      )}

      {/* Product Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.brand && <Text style={styles.brandText}>{product.brand}</Text>}
        <Text style={styles.barcodeText}>Barcode: {product.barcode}</Text>
      </View>

      {/* Ingredients Section */}
      {product.ingredients && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsBox}>
            <Text style={styles.ingredientsText}>{product.ingredients}</Text>
          </View>
        </View>
      )}

      {/* Nutrition Section */}
      {product.nutrition && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Facts (per 100g)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{Math.round(product.nutrition.calories)}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{product.nutrition.protein.toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{product.nutrition.carbs.toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{product.nutrition.fat.toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>
      )}

      {/* Additives Warning */}
      {product.additivesCount > 0 && (
        <View style={styles.section}>
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
        <View style={styles.section}>
          <View style={[styles.warningBox, { backgroundColor: `${theme.colors.error}15` }]}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.warningText, { color: theme.colors.error }]}>
              Contains palm oil
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {existingFoodId ? (
          <>
            {onViewExisting && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => onViewExisting(existingFoodId)}
              >
                <Ionicons name="eye" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>See item here</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onScanAnother}
            >
              <Ionicons name="scan" size={20} color={theme.colors.green[950]} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, { color: theme.colors.green[950] }]}>
                Scan Another Product
              </Text>
            </TouchableOpacity>
          </>
        ) : isAcceptable ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onAddToDatabase}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Add to Database</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onScanAnother}
            >
              <Ionicons name="scan" size={20} color={theme.colors.green[950]} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, { color: theme.colors.green[950] }]}>
                Scan Another Product
              </Text>
            </TouchableOpacity>
          </>
        ) : isUltraProcessed ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.disabledButton]}
              disabled
            >
              <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Cannot Add - Ultra-Processed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onScanAnother}
            >
              <Ionicons name="scan" size={20} color={theme.colors.green[950]} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, { color: theme.colors.green[950] }]}>
                Scan Another Product
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={onAddToDatabase}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Submit for Review</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onScanAnother}
            >
              <Ionicons name="scan" size={20} color={theme.colors.green[950]} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, { color: theme.colors.green[950] }]}>
                Scan Another Product
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Data sourced from Open Food Facts. Processing level determined automatically.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  levelSection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  levelBadge: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  levelIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  levelLabel: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: theme.spacing.xs,
  },
  levelDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'flex-start',
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  brandText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  barcodeText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  ingredientsBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ingredientsText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  nutritionItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.md,
  },
  warningText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  actionButtons: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.green[500],
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.green[950],
  },
  reviewButton: {
    backgroundColor: theme.colors.warning,
  },
  disabledButton: {
    backgroundColor: theme.colors.text.tertiary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 120,
    paddingHorizontal: theme.spacing.lg,
  },
});
