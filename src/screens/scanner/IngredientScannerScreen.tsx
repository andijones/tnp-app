import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ProcessingLevelCard } from '../../components/common/ProcessingLevelCard';
import { FoodCelebration } from '../../components/common/FoodCelebration';
import { ScanCompleteScreen } from '../../components/scanner/ScanCompleteScreen';
import { supabase } from '../../services/supabase/config';
import { classifyFoodByIngredients, type NovaClassificationResult } from '../../utils/enhancedNovaClassifier';
import { useNavigation } from '@react-navigation/native';
import { addScanToHistory } from '../../services/scanHistoryService';
import { logger } from '../../utils/logger';

type ScanStep = 'intro' | 'capture_ingredients' | 'processing' | 'scan_complete' | 'review' | 'capture_front' | 'submission';

interface ScanData {
  ingredientsImage: string;
  frontImage?: string;
  extractedText: string;
  classification: NovaClassificationResult;
}

export const IngredientScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState<ScanStep>('intro');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Scan data
  const [scanData, setScanData] = useState<ScanData | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Request permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Show celebration animation when scan completes with non-UPF food
  useEffect(() => {
    if (currentStep === 'scan_complete' && scanData) {
      const isNonUPF = scanData.classification.nova_group <= 3;
      if (isNonUPF) {
        setShowCelebration(true);
      }
    }
  }, [currentStep, scanData]);

  const optimizeImage = async (imageUri: string): Promise<string> => {
    try {
      logger.log('Optimizing image...');
      // Resize to max 2048px width, 80% quality for OCR
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 2048 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      logger.log('Image optimized:', manipulatedImage.uri);
      return manipulatedImage.uri;
    } catch (error) {
      logger.error('Image optimization failed:', error);
      return imageUri;
    }
  };

  const convertToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data); // Return full data URL
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      logger.error('Base64 conversion failed:', error);
      throw error;
    }
  };

  const extractIngredientsText = async (imageDataUrl: string): Promise<string> => {
    try {
      logger.log('📸 Calling ingredient-extractor edge function...');

      const { data, error } = await supabase.functions.invoke('ingredient-extractor', {
        body: { imageData: imageDataUrl }
      });

      logger.log('Edge function response:', { data, error });

      if (error) {
        logger.error('Edge function error:', error);
        throw new Error(`OCR failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract ingredients');
      }

      if (!data.extractedText || !data.extractedText.trim()) {
        throw new Error('No ingredients text found in the image');
      }

      logger.log('✅ Extracted text:', data.extractedText);
      return data.extractedText;

    } catch (error: any) {
      logger.error('OCR extraction error:', error);

      // Handle specific error cases
      if (error.message?.includes('Rate limit exceeded')) {
        throw new Error('RATE_LIMIT');
      }

      if (error.message?.includes('Invalid authentication')) {
        throw new Error('AUTH_ERROR');
      }

      throw error;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      logger.log('📷 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image');
      }

      logger.log('✅ Photo captured:', photo.uri);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if we're capturing ingredients or front photo
      if (currentStep === 'capture_ingredients') {
        // Move to processing step
        setCurrentStep('processing');

        // Optimize image
        const optimizedUri = await optimizeImage(photo.uri);

        // Convert to base64
        logger.log('Converting to base64...');
        const imageDataUrl = await convertToBase64(optimizedUri);

        // Extract ingredients via AI
        logger.log('Extracting ingredients via AI...');
        const extractedText = await extractIngredientsText(imageDataUrl);

        // Classify ingredients
        logger.log('Classifying ingredients...');
        const classification = await classifyFoodByIngredients(extractedText);

        logger.log('✅ Classification complete:', classification);

        // Haptic feedback based on processing level
        if (classification.nova_group <= 3) {
          // Non-UPF: Happy, cheerful, joyful feedback
          // Triple light tap pattern: ✨ ta-ta-ta (celebratory)
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 450);
        } else {
          // UPF (NOVA 4): Negative, warning, dangerous feedback
          // Long warning pattern: ⚠️ BUZZ-pause-THUD-THUD (alarming)
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 550);
        }

        // Store scan data
        setScanData({
          ingredientsImage: optimizedUri,
          extractedText,
          classification,
        });

        // Move to scan complete step (shows celebration or warning)
        setCurrentStep('scan_complete');

        // Auto-transition to review after 2 seconds
        setTimeout(() => {
          setCurrentStep('review');
        }, 2000);
      } else if (currentStep === 'capture_front') {
        // Optimize front image
        const optimizedUri = await optimizeImage(photo.uri);

        // Update scan data with front image
        setScanData(prev => prev ? { ...prev, frontImage: optimizedUri } : null);

        // Move to review/submission step
        setCurrentStep('review');
      }

    } catch (error: any) {
      logger.error('Failed to process image:', error);

      let errorTitle = 'Processing Failed';
      let errorMessage = 'Unable to analyze the image. Please try again with a clearer photo.';

      if (error.message === 'RATE_LIMIT') {
        errorTitle = 'Rate Limit Exceeded';
        errorMessage = 'Please wait a minute before scanning again.';
      } else if (error.message === 'AUTH_ERROR') {
        errorTitle = 'Authentication Error';
        errorMessage = 'Please log in again to use this feature.';
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [{ text: 'OK', onPress: resetScanner }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!scanData) return;

    // Validate: Non-UPF must have front photo
    const isNonUPF = scanData.classification.nova_group <= 3;
    if (isNonUPF && !scanData.frontImage) {
      Alert.alert('Photo Required', 'Please add a product photo before submitting.');
      return;
    }

    try {
      setIsProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to submit');
        return;
      }

      logger.log('Submitting scan data...');

      // Use front image if available, otherwise ingredients image
      const primaryImageUri = scanData.frontImage || scanData.ingredientsImage;

      // React Native: Create FormData for file upload
      const fileName = `scanner-${Date.now()}-${user.id}.jpg`;
      const formData = new FormData();

      // @ts-ignore - React Native FormData accepts uri/name/type object
      formData.append('file', {
        uri: primaryImageUri,
        name: fileName,
        type: 'image/jpeg',
      });

      // Upload image to storage using FormData
      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(`submissions/${fileName}`, formData, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        logger.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(`submissions/${fileName}`);

      // Create description with extracted ingredients and analysis
      const description = `AI Scanned Product\n\nIngredients: ${scanData.extractedText}\n\nNOVA Classification: ${scanData.classification.explanation}\n\nProcessing Indicators: ${scanData.classification.nova_details.foundIndicators.join(', ') || 'None'}\n\nContains Seed Oils: ${scanData.classification.contains_seed_oils ? 'Yes' : 'No'}`;

      // Generate simple name from first few ingredients or generic name
      const firstIngredients = scanData.extractedText.split(',').slice(0, 2).join(', ');
      const foodName = firstIngredients.length > 50
        ? 'Scanned Product'
        : firstIngredients || 'Scanned Product';

      // Insert into database
      const { data: insertedFood, error: insertError } = await supabase
        .from('foods')
        .insert({
          name: foodName,
          category: 'scanner-submission',
          description,
          image: publicUrl,
          nova_group: scanData.classification.nova_group,
          nova_explanation: scanData.classification.explanation,
          nova_details: scanData.classification.nova_details,
          contains_seed_oils: scanData.classification.contains_seed_oils,
          status: 'pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Insert error:', insertError);
        throw insertError;
      }

      logger.log('✅ Food submitted:', insertedFood);

      // Add to scan history
      await addScanToHistory({
        productName: foodName,
        barcode: 'ai-scan',
        novaGroup: scanData.classification.nova_group,
        image: publicUrl,
        scanType: 'ocr',
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Success!',
        'Your product has been submitted. Thank you for contributing!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      logger.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setCurrentStep('intro');
    setScanData(null);
    setShowCelebration(false);
  };

  const getNovaColor = (novaGroup: number): string => {
    switch (novaGroup) {
      case 1: return theme.colors.nova.group1;
      case 2: return theme.colors.nova.group2;
      case 3: return theme.colors.nova.group3;
      case 4: return theme.colors.nova.group4;
      default: return theme.colors.text.secondary;
    }
  };

  const getNovaLabel = (novaGroup: number): string => {
    switch (novaGroup) {
      case 1: return 'Whole Food';
      case 2: return 'Extracted Foods';
      case 3: return 'Lightly Processed';
      case 4: return 'Processed';
      default: return 'Unknown';
    }
  };

  // Render intro screen
  const renderIntro = () => (
    <View style={styles.introContainer}>
      <ScrollView
        contentContainerStyle={styles.introScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Illustration Section - 70% */}
          <View style={styles.illustrationSection}>
            <View style={styles.largeIconContainer}>
              <Ionicons name="document-text" size={80} color={theme.colors.green[500]} />
            </View>
            <Text style={styles.introTitle}>AI Ingredient Scanner</Text>
            <Text style={styles.introSubtitle}>
              Use AI to extract and analyze ingredients from food packages
            </Text>
          </View>

          {/* Instructions Section - 30% */}
          <View style={styles.instructionsSection}>
            <View style={styles.step}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="camera" size={20} color={theme.colors.green[950]} />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>1. Capture Ingredients</Text>
                <Text style={styles.stepDescription}>
                  Take a clear photo of the ingredients list
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="sparkles" size={20} color={theme.colors.green[950]} />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>2. AI Analysis</Text>
                <Text style={styles.stepDescription}>
                  Our AI extracts and classifies ingredients
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.green[950]} />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>3. Review & Submit</Text>
                <Text style={styles.stepDescription}>
                  Confirm details and help build our database
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setCurrentStep('capture_ingredients')}
            >
              <Text style={styles.startButtonText}>Start AI Scan</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Barcode Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render camera screen
  const renderCamera = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need access to your camera to scan {currentStep === 'capture_front' ? 'the product' : 'ingredients'}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const isFrontCapture = currentStep === 'capture_front';

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Top controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  if (isFrontCapture) {
                    setCurrentStep('review');
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Ionicons name={isFrontCapture ? "image" : "document-text"} size={24} color="#FFFFFF" />
                <Text style={styles.cameraTitle}>{isFrontCapture ? 'Product Photo' : 'Scan Ingredients'}</Text>
              </View>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              >
                <Ionicons
                  name={flash === 'off' ? 'flash-off' : 'flash'}
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Center frame guide */}
            <View style={styles.frameGuide}>
              <View style={[styles.frameCorner, styles.topLeft]} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
              <Text style={styles.frameText}>
                {isFrontCapture ? 'Position product within frame' : 'Position ingredients list within frame'}
              </Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <Text style={styles.helpText}>
                {isFrontCapture
                  ? 'Capture the front of the product package'
                  : 'Ensure ingredients are clearly visible and well-lit'}
              </Text>

              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  };

  // Render processing screen
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingContent}>
        <View style={styles.processingIconContainer}>
          <Ionicons name="sparkles" size={64} color={theme.colors.green[500]} />
        </View>
        <Text style={styles.processingTitle}>AI Analyzing...</Text>
        <Text style={styles.processingSubtitle}>
          Extracting ingredients and classifying food
        </Text>
        <ActivityIndicator size="large" color={theme.colors.green[500]} style={styles.spinner} />
      </View>
    </View>
  );

  // Render scan complete screen (celebration for non-UPF, warning for UPF)
  const renderScanComplete = () => {
    if (!scanData) return null;

    return (
      <ScanCompleteScreen
        novaGroup={scanData.classification.nova_group as 1 | 2 | 3 | 4}
        onCelebrationTrigger={() => setShowCelebration(true)}
      />
    );
  };

  // Render review screen
  const renderReview = () => {
    if (!scanData) return null;

    const isNonUPF = scanData.classification.nova_group <= 3;
    const canSubmit = !isNonUPF || scanData.frontImage; // UPF can submit without front photo

    return (
      <View style={styles.reviewContainer}>
        <ScrollView
          style={styles.reviewScroll}
          contentContainerStyle={styles.reviewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.reviewHeader}>
            <TouchableOpacity
              style={styles.backIconButton}
              onPress={resetScanner}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.reviewHeaderTitle}>Review Scan Results</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Captured Images */}
          <View style={styles.imagesSection}>
            {scanData.frontImage && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.imageLabel}>Product Photo</Text>
                <Image source={{ uri: scanData.frontImage }} style={styles.imagePreview} />
              </View>
            )}
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imageLabel}>Ingredients List</Text>
              <Image source={{ uri: scanData.ingredientsImage }} style={styles.imagePreview} />
            </View>
          </View>

          {/* Processing Level Card (Design System) */}
          <ProcessingLevelCard level={scanData.classification.nova_group as 1 | 2 | 3 | 4} />

          {/* Extracted Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extracted Ingredients</Text>
            <View style={styles.ingredientsBox}>
              <Text style={styles.ingredientsText}>{scanData.extractedText}</Text>
            </View>
          </View>

          {/* Add Front Photo Button (REQUIRED for non-UPF, show if no front photo yet) */}
          {isNonUPF && !scanData.frontImage && (
            <View style={styles.section}>
              <View style={styles.requiredPhotoCard}>
                <Ionicons name="camera" size={32} color={theme.colors.green[600]} />
                <Text style={styles.requiredPhotoTitle}>Product Photo Required</Text>
                <Text style={styles.requiredPhotoText}>
                  Help others discover this product by adding a photo of the front package
                </Text>
              </View>
              <Button
                title="Capture Product Photo"
                onPress={() => setCurrentStep('capture_front')}
                variant="primary"
                leftIcon={<Ionicons name="camera" size={20} color="#FFFFFF" />}
              />
            </View>
          )}

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <Button
              title={isProcessing ? "Submitting..." : "Submit"}
              onPress={handleSubmit}
              variant="primary"
              disabled={isProcessing || !canSubmit}
              rightIcon={!isProcessing ? <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" /> : undefined}
            />
            {!canSubmit && (
              <Text style={styles.submitHintText}>
                Add a product photo to submit this great find!
              </Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  // Main render
  return (
    <View style={styles.container}>
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'capture_ingredients' && renderCamera()}
      {currentStep === 'capture_front' && renderCamera()}
      {currentStep === 'processing' && renderProcessing()}
      {currentStep === 'scan_complete' && renderScanComplete()}
      {currentStep === 'review' && renderReview()}

      {/* Celebration Animation (only for non-UPF foods) */}
      {showCelebration && (
        <FoodCelebration
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Intro screen styles
  introContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  introScrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  illustrationSection: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  largeIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.green[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  introTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  introSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  instructionsSection: {
    flex: 0.3,
    paddingVertical: theme.spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.green[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
  },
  startButton: {
    height: 56,
    backgroundColor: theme.colors.green[500],
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  startButtonText: {
    ...theme.typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  backButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.green[950],
  },

  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  cameraTitle: {
    ...theme.typography.headline,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
  frameGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.green[500],
    borderWidth: 3,
  },
  topLeft: {
    top: '20%',
    left: '10%',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: '20%',
    right: '10%',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: '20%',
    left: '10%',
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: '20%',
    right: '10%',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  frameText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: '60%',
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  helpText: {
    ...theme.typography.subtext,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.green[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Processing styles
  processingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  processingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.green[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  processingTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  processingSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  spinner: {
    marginTop: theme.spacing.lg,
  },

  // Review screen styles
  reviewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  reviewScroll: {
    flex: 1,
  },
  reviewScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderTitle: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
  },
  imagesSection: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  imagePreviewContainer: {
    gap: theme.spacing.xs,
  },
  imageLabel: {
    ...theme.typography.label,
    color: theme.colors.text.secondary,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    resizeMode: 'contain',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  ingredientsBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  ingredientsText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  requiredPhotoCard: {
    backgroundColor: theme.colors.green[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.green[200],
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  requiredPhotoTitle: {
    ...theme.typography.headline,
    color: theme.colors.green[950],
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  requiredPhotoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  submitButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  submitHintText: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },

  // Permission screen styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  permissionTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  permissionSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    height: 56,
    backgroundColor: theme.colors.green[500],
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButtonText: {
    ...theme.typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
