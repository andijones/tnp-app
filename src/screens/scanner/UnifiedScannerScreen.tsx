import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { supabase } from '../../services/supabase/config';
import { useAuth } from '../../contexts/AuthContext';
import { fetchProductByBarcode, transformToFoodData, TransformedProduct } from '../../services/openFoodFacts';
import { BarcodeProductResult } from '../../components/scanner/BarcodeProductResult';

type ScanMode = 'intro' | 'barcode' | 'barcodeResult';

export const UnifiedScannerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentMode, setCurrentMode] = useState<ScanMode>('intro');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Barcode scanning state
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<TransformedProduct | null>(null);
  const [existingFoodId, setExistingFoodId] = useState<string | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [scanCooldown, setScanCooldown] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // Hide/show tab bar based on mode
  useEffect(() => {
    const shouldHideTabBar = currentMode === 'barcode';
    navigation.setParams({ hideTabBar: shouldHideTabBar } as any);
  }, [currentMode, navigation]);

  const handleBarcodeScanned = async ({ data: barcode }: BarcodeScanningResult) => {
    // Prevent scanning same barcode multiple times
    if (scanCooldown || barcode === lastScannedBarcode || !barcode) {
      return;
    }

    console.log('📷 Barcode scanned:', barcode);
    setLastScannedBarcode(barcode);
    setScannedBarcode(barcode);
    setScanCooldown(true);

    // Reset cooldown after 2 seconds
    setTimeout(() => setScanCooldown(false), 2000);

    try {
      setIsProcessing(true);

      // Step 1: Check local database first
      console.log('🔍 Checking database for barcode:', barcode);
      const { data: existingFood, error: dbError } = await supabase
        .from('foods')
        .select('id')
        .eq('barcode_ean', barcode)
        .eq('status', 'approved')
        .maybeSingle();

      if (dbError) {
        console.error('Database lookup error:', dbError);
      }

      if (existingFood) {
        console.log('✅ Found in database:', existingFood.id);
        // Still fetch from Open Food Facts to show product details
        const offProduct = await fetchProductByBarcode(barcode);
        if (offProduct) {
          const transformed = transformToFoodData(offProduct);
          setBarcodeProduct(transformed);
          setExistingFoodId(existingFood.id);
          setCurrentMode('barcodeResult');
        } else {
          Alert.alert('Product Exists', 'This product is already in our database.');
          resetScanner();
        }
        setIsProcessing(false);
        return;
      }

      // Step 2: Fetch from Open Food Facts
      console.log('🌐 Fetching from Open Food Facts...');
      const product = await fetchProductByBarcode(barcode);

      if (!product) {
        console.log('❌ Product not found in Open Food Facts');
        Alert.alert(
          'Product Not Found',
          'This barcode was not found in our database. You can scan ingredients manually using the ingredient scanner.',
          [
            { text: 'Try Again', onPress: () => resetScanner() },
            { text: 'Cancel', style: 'cancel', onPress: () => resetScanner() }
          ]
        );
        setIsProcessing(false);
        return;
      }

      // Step 3: Transform and display
      const transformedProduct = transformToFoodData(product);
      console.log('✅ Product found:', transformedProduct.name);
      setBarcodeProduct(transformedProduct);
      setExistingFoodId(null);
      setCurrentMode('barcodeResult');

    } catch (error) {
      console.error('❌ Barcode scan error:', error);
      Alert.alert(
        'Scan Failed',
        'Failed to process barcode. Please try again.',
        [{ text: 'OK', onPress: () => resetScanner() }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToDatabase = async () => {
    if (!barcodeProduct || !user) {
      Alert.alert('Error', 'Please log in to add products');
      return;
    }

    try {
      setIsSubmitting(true);

      // Determine status based on NOVA group
      const isAcceptable = barcodeProduct.novaGroup !== undefined &&
                          barcodeProduct.novaGroup >= 1 &&
                          barcodeProduct.novaGroup <= 3;
      const status = isAcceptable ? 'approved' : 'pending';

      // Insert into database
      const { data, error } = await supabase
        .from('foods')
        .insert({
          name: barcodeProduct.name,
          category: barcodeProduct.categories[0] || 'General',
          description: barcodeProduct.ingredients || '',
          image: barcodeProduct.image,
          barcode_ean: barcodeProduct.barcode,
          nova_group: barcodeProduct.novaGroup,
          nova_explanation: barcodeProduct.novaGroup
            ? `NOVA ${barcodeProduct.novaGroup} - ${barcodeProduct.additivesCount} additives detected`
            : null,
          nova_details: {
            additives: barcodeProduct.additives,
            ingredient_count: barcodeProduct.ingredients ? barcodeProduct.ingredients.split(',').length : 0,
          },
          contains_seed_oils: barcodeProduct.hasPalmOil,
          nutrition_data: barcodeProduct.nutrition ? {
            calories: barcodeProduct.nutrition.calories,
            protein: barcodeProduct.nutrition.protein,
            fat: barcodeProduct.nutrition.fat,
            carbs: barcodeProduct.nutrition.carbs,
            sugar: barcodeProduct.nutrition.sugar,
            fiber: barcodeProduct.nutrition.fiber,
            sodium: barcodeProduct.nutrition.sodium,
            servingSize: barcodeProduct.nutrition.servingSize,
          } : null,
          status,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success!',
        isAcceptable
          ? 'Product has been added to the database. Thank you for contributing!'
          : 'Product submitted for review. Our team will review it shortly.',
        [{ text: 'OK', onPress: resetScanner }]
      );

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewExisting = (foodId: string) => {
    (navigation as any).navigate('FoodDetail', { foodId });
  };

  const resetScanner = () => {
    setCurrentMode('intro');
    setScannedBarcode(null);
    setBarcodeProduct(null);
    setExistingFoodId(null);
    setLastScannedBarcode('');
    setScanCooldown(false);
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.scannerIconWrapper}>
          <View style={styles.scannerPulse} />
          <View style={styles.scannerIconContainer}>
            <Ionicons name="scan" size={48} color={theme.colors.green[950]} />
          </View>
        </View>

        <Text style={styles.heroTitle}>Product Scanner</Text>
        <Text style={styles.heroSubtitle}>
          Scan any product barcode to discover if it belongs in your pantry
        </Text>
      </View>

      {/* Feature Cards */}
      <View style={styles.featuresSection}>
        <View style={styles.featureCard}>
          <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(68, 219, 109, 0.15)' }]}>
            <Ionicons name="barcode-outline" size={20} color={theme.colors.green[950]} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Instant Lookup</Text>
            <Text style={styles.featureDescription}>
              Scan barcodes for instant product information
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(132, 204, 22, 0.15)' }]}>
            <Ionicons name="nutrition-outline" size={20} color="#84cc16" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Processing Level</Text>
            <Text style={styles.featureDescription}>
              See if food is whole, extracted, or lightly processed
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="add-circle-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Contribute</Text>
            <Text style={styles.featureDescription}>
              Add new products to help the community
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Button */}
      <View style={styles.ctaContainer}>
        <Button
          title="Start Scanning"
          onPress={() => setCurrentMode('barcode')}
          variant="primary"
          leftIcon={<Ionicons name="scan-outline" size={20} color="white" />}
        />
      </View>

      {/* Trust Badge */}
      <View style={styles.trustBadge}>
        <Ionicons name="shield-checkmark" size={14} color={theme.colors.green[950]} />
        <Text style={styles.trustText}>
          Powered by Open Food Facts
        </Text>
      </View>
    </View>
  );

  const renderBarcodeScanner = () => {
    if (!permission) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.green[500]} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="videocam-off-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          flash={flash}
          onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
          }}
        />

        {/* Scanning Overlay */}
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningHeader}>
            <Text style={styles.scanningTitle}>Scan Product Barcode</Text>
            <Text style={styles.scanningSubtitle}>
              Position barcode within the frame
            </Text>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanningFrameContainer}>
            <View style={styles.scanningFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.green[500]} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
          >
            <Ionicons
              name={flash === 'on' ? 'flash' : ('flash-off' as any)}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCurrentMode('intro')}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBarcodeResult = () => {
    if (!barcodeProduct) return null;

    return (
      <BarcodeProductResult
        product={barcodeProduct}
        onAddToDatabase={handleAddToDatabase}
        onScanAnother={resetScanner}
        onViewExisting={handleViewExisting}
        existingFoodId={existingFoodId || undefined}
        isSubmitting={isSubmitting}
      />
    );
  };

  return (
    <View style={[styles.safeArea, currentMode === 'intro' && { paddingTop: insets.top }]}>
      {currentMode === 'intro' && renderIntro()}
      {currentMode === 'barcode' && renderBarcodeScanner()}
      {currentMode === 'barcodeResult' && renderBarcodeResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  introContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scannerIconWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  scannerPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(68, 219, 109, 0.15)',
    top: -8,
    left: -8,
  },
  scannerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(68, 219, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.green[950],
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 24,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.green[950],
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  ctaContainer: {
    marginBottom: 24,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  scanningTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  scanningSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  scanningFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningFrame: {
    width: 280,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.green[500],
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  processingOverlay: {
    position: 'absolute',
    width: 280,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  processingText: {
    color: 'white',
    marginTop: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  permissionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  permissionButton: {
    backgroundColor: theme.colors.green[500],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
