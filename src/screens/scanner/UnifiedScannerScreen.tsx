import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
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
import { logger } from '../../utils/logger';
import { FoodCelebration } from '../../components/common/FoodCelebration';

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
  const [showCelebration, setShowCelebration] = useState(false);

  // Barcode scanning state
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<TransformedProduct | null>(null);
  const [existingFoodId, setExistingFoodId] = useState<string | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [scanCooldown, setScanCooldown] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // Hide/show tab bar based on mode
  useEffect(() => {
    const shouldHideTabBar = currentMode === 'barcode' || currentMode === 'barcodeResult';
    navigation.setParams({ hideTabBar: shouldHideTabBar } as any);
  }, [currentMode, navigation]);

  const handleBarcodeScanned = async ({ data: barcode }: BarcodeScanningResult) => {
    // Prevent scanning same barcode multiple times
    if (scanCooldown || barcode === lastScannedBarcode || !barcode) {
      return;
    }

    logger.log('📷 Barcode scanned:', barcode);
    setLastScannedBarcode(barcode);
    setScannedBarcode(barcode);
    setScanCooldown(true);

    // Reset cooldown after 2 seconds
    setTimeout(() => setScanCooldown(false), 2000);

    try {
      setIsProcessing(true);

      // Step 1: Check local database first
      logger.log('🔍 Checking database for barcode:', barcode);
      const { data: existingFood, error: dbError } = await supabase
        .from('foods')
        .select('id')
        .eq('barcode_ean', barcode)
        .eq('status', 'approved')
        .maybeSingle();

      if (dbError) {
        logger.error('Database lookup error:', dbError);
      }

      if (existingFood) {
        logger.log('✅ Found in database:', existingFood.id);
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
      logger.log('🌐 Fetching from Open Food Facts...');
      const product = await fetchProductByBarcode(barcode);

      if (!product) {
        logger.log('❌ Product not found in Open Food Facts - navigating to ingredient scanner');
        resetScanner();
        const parentNav = navigation.getParent();
        if (parentNav) {
          (parentNav as any).navigate('IngredientScanner');
        }
        setIsProcessing(false);
        return;
      }

      // Step 3: Transform and display
      const transformedProduct = transformToFoodData(product);
      logger.log('✅ Product found:', transformedProduct.name);
      setBarcodeProduct(transformedProduct);
      setExistingFoodId(null);
      setCurrentMode('barcodeResult');

    } catch (error) {
      logger.error('❌ Barcode scan error:', error);
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

      // Show celebration animation
      setShowCelebration(true);

      // Show success message after brief delay
      setTimeout(() => {
        Alert.alert(
          'Success!',
          isAcceptable
            ? 'Product has been added to the database. Thank you for contributing!'
            : 'Product submitted for review. Our team will review it shortly.',
          [{ text: 'OK', onPress: resetScanner }]
        );
      }, 500);

    } catch (error) {
      logger.error('Save error:', error);
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
      {/* Product Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../../assets/Scan.png')}
          style={styles.scanImage}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>Scan an item</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        You can check if an item is processed or not by simply scanning the barcode.
      </Text>

      {/* Open Camera Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Open Camera"
          onPress={() => setCurrentMode('barcode')}
          variant="secondary"
        />
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

      {/* Celebration Animation */}
      {showCelebration && (
        <FoodCelebration
          onComplete={() => setShowCelebration(false)}
        />
      )}
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
    alignItems: 'center',
    paddingBottom: 120, // Account for tab bar
  },
  illustrationContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanImage: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 22, // Figma title size
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15, // Figma body size
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
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
