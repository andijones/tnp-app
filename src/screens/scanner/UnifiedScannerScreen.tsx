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
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { supabase } from '../../services/supabase/config';
import { useAuth } from '../../contexts/AuthContext';
import { fetchProductByBarcode, transformToFoodData, TransformedProduct } from '../../services/openFoodFacts';
import { BarcodeProductResult } from '../../components/scanner/BarcodeProductResult';
import { ScanCompleteScreen } from '../../components/scanner/ScanCompleteScreen';
import { logger } from '../../utils/logger';
import { FoodCelebration } from '../../components/common/FoodCelebration';
import { addScanToHistory } from '../../services/scanHistoryService';

type ScanMode = 'intro' | 'barcode' | 'scanComplete' | 'barcodeResult';

export const UnifiedScannerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentMode, setCurrentMode] = useState<ScanMode>('intro');
  const [torchEnabled, setTorchEnabled] = useState(false);
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
  const alertShowing = useRef(false);

  // Hide/show tab bar based on mode
  useEffect(() => {
    const shouldHideTabBar = currentMode === 'barcode' || currentMode === 'scanComplete' || currentMode === 'barcodeResult';
    navigation.setParams({ hideTabBar: shouldHideTabBar } as any);
  }, [currentMode, navigation]);

  // Track if we should reset on next focus
  const shouldResetOnFocus = useRef(false);

  // Reset scanner when screen comes back into focus (e.g., after navigating to ingredient scanner)
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus
      if (shouldResetOnFocus.current) {
        logger.log('Screen refocused after navigation - resetting scanner');
        resetScanner();
        shouldResetOnFocus.current = false;
      }

      return () => {
        // When screen loses focus, mark for reset if we're showing results
        if (currentMode === 'scanComplete' || currentMode === 'barcodeResult') {
          shouldResetOnFocus.current = true;
        }
      };
    }, [])
  );

  const handleBarcodeScanned = async ({ data: barcode }: BarcodeScanningResult) => {
    // Prevent scanning same barcode multiple times or while alert is showing
    if (scanCooldown || barcode === lastScannedBarcode || !barcode || alertShowing.current) {
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

          // Haptic feedback based on processing level
          if (transformed.novaGroup <= 3) {
            // Non-UPF: Happy, cheerful, joyful feedback
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 450);
          } else {
            // UPF (NOVA 4): Negative, warning, dangerous feedback
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 550);
          }

          // Go to scan complete screen first, then auto-transition to results
          setCurrentMode('scanComplete');

          // Auto-transition to results after 2 seconds
          setTimeout(() => {
            setCurrentMode('barcodeResult');
          }, 2000);

          // Add to scan history
          await addScanToHistory({
            productName: transformed.name,
            barcode: transformed.barcode,
            novaGroup: transformed.novaGroup,
            image: transformed.image,
            scanType: 'barcode',
          });
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

      // Step 4: Check if product has ingredients - if not, redirect to ingredient scanner
      if (!transformedProduct.ingredients || transformedProduct.ingredients.trim() === '') {
        logger.log('⚠️ Product found but no ingredients - navigating to ingredient scanner');

        // Check if alert is already showing
        if (alertShowing.current) {
          logger.log('Alert already showing, skipping duplicate');
          setIsProcessing(false);
          return;
        }

        // Mark alert as showing
        alertShowing.current = true;

        // Immediately reset state to prevent re-triggering
        setIsProcessing(false);
        setScannedBarcode(null);
        setBarcodeProduct(null);
        setExistingFoodId(null);

        // Show alert
        Alert.alert(
          'No Ingredients Found',
          'This product was found but has no ingredient list. Please scan the ingredients manually.',
          [
            {
              text: 'Scan Ingredients',
              onPress: () => {
                alertShowing.current = false;
                setLastScannedBarcode('');
                setScanCooldown(false);
                setCurrentMode('intro');

                // Navigate to ingredient scanner
                setTimeout(() => {
                  const parentNav = navigation.getParent();
                  if (parentNav) {
                    (parentNav as any).navigate('IngredientScanner');
                  }
                }, 100);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                alertShowing.current = false;
                setLastScannedBarcode('');
                setScanCooldown(false);
                setCurrentMode('intro');
              }
            }
          ]
        );
        return;
      }

      setBarcodeProduct(transformedProduct);
      setExistingFoodId(null);

      // Haptic feedback based on processing level
      if (transformedProduct.novaGroup <= 3) {
        // Non-UPF: Happy, cheerful, joyful feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 450);
      } else {
        // UPF (NOVA 4): Negative, warning, dangerous feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 550);
      }

      // Go to scan complete screen first, then auto-transition to results
      setCurrentMode('scanComplete');

      // Auto-transition to results after 2 seconds
      setTimeout(() => {
        setCurrentMode('barcodeResult');
      }, 2000);

      // Add to scan history
      await addScanToHistory({
        productName: transformedProduct.name,
        barcode: transformedProduct.barcode,
        novaGroup: transformedProduct.novaGroup,
        image: transformedProduct.image,
        scanType: 'barcode',
      });

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

      // All submissions require admin approval
      const status = 'pending';

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
          'Product submitted for review. Our team will review it shortly and it will appear in the app once approved.',
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

  const handleReturnHome = () => {
    resetScanner();
    (navigation as any).navigate('Home');
  };

  const resetScanner = () => {
    alertShowing.current = false;
    setCurrentMode('intro');
    setScannedBarcode(null);
    setBarcodeProduct(null);
    setExistingFoodId(null);
    setLastScannedBarcode('');
    setScanCooldown(false);
  };

  const renderIntro = () => {
    // Check camera permissions for split view
    if (!permission) {
      return (
        <View style={styles.introContainer}>
          <ActivityIndicator size="large" color={theme.colors.green[500]} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.introContainer}>
          <View style={styles.permissionContainer}>
            <Ionicons name="videocam-off-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.splitViewContainer}>
        {/* Top 70% - Active Camera with Barcode Scanning */}
        <View style={styles.cameraPreviewContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraPreview}
            facing="back"
            enableTorch={torchEnabled}
            onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
            }}
          />

          {/* Scanning Frame Overlay */}
          <View style={styles.scanningOverlay}>
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

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setTorchEnabled(!torchEnabled)}
            >
              <Ionicons
                name={torchEnabled ? 'flash' : ('flash-off' as any)}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            {/* Scan History Button */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => (navigation as any).navigate('ScanHistory')}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom 20% - Compact Content (50% width) */}
        <View style={styles.contentHalfContainer}>
          <View style={styles.contentWrapper}>
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
          </View>
        </View>
      </View>
    );
  };

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
          enableTorch={torchEnabled}
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
            onPress={() => setTorchEnabled(!torchEnabled)}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : ('flash-off' as any)}
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

  const renderScanComplete = () => {
    if (!barcodeProduct) return null;

    return (
      <ScanCompleteScreen
        novaGroup={barcodeProduct.novaGroup as 1 | 2 | 3 | 4}
        onCelebrationTrigger={() => setShowCelebration(true)}
      />
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
        onReturnHome={handleReturnHome}
        existingFoodId={existingFoodId || undefined}
        isSubmitting={isSubmitting}
      />
    );
  };

  return (
    <View style={[styles.safeArea, currentMode === 'intro' && { paddingTop: insets.top }]}>
      {currentMode === 'intro' && renderIntro()}
      {currentMode === 'barcode' && renderBarcodeScanner()}
      {currentMode === 'scanComplete' && renderScanComplete()}
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
  // Split View Container (70/30)
  splitViewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Top 70% - Active Camera Preview
  cameraPreviewContainer: {
    flex: 7, // 70% of screen
    backgroundColor: '#000000',
    position: 'relative',
  },

  cameraPreview: {
    flex: 1,
  },

  // Bottom 30% - Compact Content Container
  contentHalfContainer: {
    flex: 3, // 30% of screen
    backgroundColor: theme.colors.background,
    paddingTop: 8,
    paddingBottom: 100, // Account for tab bar
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Content Wrapper - 70% width, centered
  contentWrapper: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanImage: {
    width: 80, // Matching design system
    height: 80,
  },
  title: {
    fontSize: 22, // Figma title size (design system)
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15, // Figma body size (design system)
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 0,
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
