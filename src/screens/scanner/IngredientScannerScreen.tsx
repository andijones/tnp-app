import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { ProcessingLevelCard } from '../../components/common/ProcessingLevelCard';
import { supabase } from '../../services/supabase/config';
import { classifyFoodByIngredients, type NovaClassificationResult } from '../../utils/enhancedNovaClassifier';

type ScanStep = 'intro' | 'ingredients' | 'front' | 'processing' | 'results';

interface ScanResult {
  extractedText: string;
  novaClassification: NovaClassificationResult;
  productName: string;
  ingredientsImage: string;
  frontImage: string;
}

export const IngredientScannerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState<ScanStep>('intro');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  // Store images during the process
  const [ingredientsImage, setIngredientsImage] = useState<string | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraView>(null);

  // Hide/show tab bar based on scan step using route params
  useEffect(() => {
    const shouldHideTabBar = currentStep === 'ingredients' || currentStep === 'front' || currentStep === 'processing' || currentStep === 'results';

    navigation.setParams({ hideTabBar: shouldHideTabBar } as any);
  }, [currentStep, navigation]);

  const optimizeImage = async (imageUri: string): Promise<string> => {
    try {
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // Resize to max 1200px width, maintaining aspect ratio
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return imageUri; // Return original if optimization fails
    }
  };

  const convertToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Base64 conversion failed:', error);
      throw error;
    }
  };

  const extractIngredientsText = async (imageBase64: string): Promise<string> => {
    try {
      console.log('Calling ingredient-extractor edge function...');
      
      const { data, error } = await supabase.functions.invoke('ingredient-extractor', {
        body: { imageData: imageBase64 }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`OCR failed: ${error.message}`);
      }

      if (!data || !data.extractedText) {
        throw new Error('No text extracted from image');
      }

      console.log('Extracted text:', data.extractedText);
      return data.extractedText;
      
    } catch (error) {
      console.error('OCR extraction error:', error);
      
      // Fallback: return a sample for testing
      Alert.alert(
        'OCR Service Unavailable', 
        'Using sample data for demonstration. In production, this would extract text from your image.'
      );
      
      return "water, organic tomatoes, organic onions, sea salt, organic garlic, organic basil, natural flavoring";
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image');
      }

      const optimizedUri = await optimizeImage(photo.uri);

      if (currentStep === 'ingredients') {
        setIngredientsImage(optimizedUri);
        // Brief pause to show success state before transitioning
        setTimeout(() => {
          setCurrentStep('front');
        }, 800);
      } else if (currentStep === 'front') {
        setFrontImage(optimizedUri);
        // Brief pause to show success state before processing
        setTimeout(async () => {
          setCurrentStep('processing');
          await processImages(ingredientsImage!, optimizedUri);
        }, 800);
      }
      
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const processImages = async (ingredientsImageUri: string, frontImageUri: string) => {
    try {
      setIsProcessing(true);

      // Step 1: Convert ingredients image to base64
      console.log('Converting image to base64...');
      const ingredientsBase64 = await convertToBase64(ingredientsImageUri);

      // Step 2: Extract text using OCR
      console.log('Extracting ingredients text via OCR...');
      const extractedText = await extractIngredientsText(ingredientsBase64);

      // Step 3: Classify using NOVA classifier
      console.log('Classifying ingredients...');
      const novaClassification = await classifyFoodByIngredients(extractedText);

      // Step 4: Create result
      const result: ScanResult = {
        extractedText,
        novaClassification,
        productName: 'Scanned Product', // Could enhance this by extracting from front image
        ingredientsImage: ingredientsImageUri,
        frontImage: frontImageUri,
      };

      setScanResult(result);
      setCurrentStep('results');

    } catch (error) {
      console.error('Processing failed:', error);
      Alert.alert(
        'Processing Failed',
        'Unable to analyze the images. Please try again with clearer photos.',
        [{ text: 'Retry', onPress: resetScanner }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToDatabase = async () => {
    if (!scanResult) return;

    try {
      setIsProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save results');
        return;
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).slice(2, 11);

      // Upload ingredients image to storage
      const ingredientsFileName = `scanner-submission-${timestamp}-${randomId}-ingredients.jpg`;
      console.log('Uploading ingredients image:', ingredientsFileName, 'URI:', scanResult.ingredientsImage);
      
      const ingredientsResponse = await fetch(scanResult.ingredientsImage);
      if (!ingredientsResponse.ok) {
        throw new Error(`Failed to fetch ingredients image: ${ingredientsResponse.status}`);
      }
      
      const ingredientsArrayBuffer = await ingredientsResponse.arrayBuffer();
      console.log('Ingredients ArrayBuffer size:', ingredientsArrayBuffer.byteLength);
      
      if (ingredientsArrayBuffer.byteLength === 0) {
        throw new Error('Ingredients image ArrayBuffer is empty - image may be corrupted');
      }
      
      const { data: ingredientsUploadData, error: ingredientsUploadError } = await supabase.storage
        .from('food-images')
        .upload(`submissions/${ingredientsFileName}`, ingredientsArrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (ingredientsUploadError) {
        console.error('Ingredients upload error:', ingredientsUploadError);
        throw ingredientsUploadError;
      }

      const { data: { publicUrl: ingredientsPublicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(`submissions/${ingredientsFileName}`);

      // Upload front image to storage
      const frontFileName = `scanner-submission-${timestamp}-${randomId}-front.jpg`;
      console.log('Uploading front image:', frontFileName, 'URI:', scanResult.frontImage);
      
      const frontResponse = await fetch(scanResult.frontImage);
      if (!frontResponse.ok) {
        throw new Error(`Failed to fetch front image: ${frontResponse.status}`);
      }
      
      const frontArrayBuffer = await frontResponse.arrayBuffer();
      console.log('Front ArrayBuffer size:', frontArrayBuffer.byteLength);
      
      if (frontArrayBuffer.byteLength === 0) {
        throw new Error('Front image ArrayBuffer is empty - image may be corrupted');
      }
      
      const { data: frontUploadData, error: frontUploadError } = await supabase.storage
        .from('food-images')
        .upload(`submissions/${frontFileName}`, frontArrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (frontUploadError) {
        console.error('Front upload error:', frontUploadError);
        throw frontUploadError;
      }

      const { data: { publicUrl: frontPublicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(`submissions/${frontFileName}`);

      console.log('Ingredients upload successful:', ingredientsUploadData);
      console.log('Front upload successful:', frontUploadData);
      console.log('Ingredients public URL:', ingredientsPublicUrl);
      console.log('Front public URL:', frontPublicUrl);
      
      // Verify both uploaded images are accessible
      try {
        const [ingredientsUrlTest, frontUrlTest] = await Promise.all([
          fetch(ingredientsPublicUrl),
          fetch(frontPublicUrl)
        ]);
        console.log('Ingredients URL accessibility test:', ingredientsUrlTest.status);
        console.log('Front URL accessibility test:', frontUrlTest.status);
        if (!ingredientsUrlTest.ok || !frontUrlTest.ok) {
          console.warn('Warning: Some uploaded images may not be accessible');
        }
      } catch (urlTestError) {
        console.warn('Warning: Could not verify image accessibility:', urlTestError);
      }

      // Create detailed description including both image URLs for admin reference
      const description = `Scanned ingredients: ${scanResult.extractedText}\n\nNOVA Analysis: ${scanResult.novaClassification.explanation}\n\nFound indicators: ${scanResult.novaClassification.nova_details.foundIndicators.join(', ') || 'None'}\n\nSeed oils detected: ${scanResult.novaClassification.contains_seed_oils ? 'Yes' : 'No'}\n\nIngredients image: ${ingredientsPublicUrl}`;

      // Insert into foods table with AI-generated data and both images
      const { error: insertError } = await supabase
        .from('foods')
        .insert({
          name: scanResult.productName,
          category: 'scanner-submission',
          description,
          image: frontPublicUrl, // Primary image (front of product)
          nova_group: scanResult.novaClassification.nova_group,
          nova_explanation: scanResult.novaClassification.explanation,
          nova_details: scanResult.novaClassification.nova_details,
          contains_seed_oils: scanResult.novaClassification.contains_seed_oils,
          status: 'pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Success!',
        'Your scanned product has been saved and sent for review. Both ingredient and product photos have been uploaded. Thank you for contributing!',
        [{ text: 'OK', onPress: resetScanner }]
      );

    } catch (error) {
      console.error('Save error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save results. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Could not access the captured images. Please try scanning again.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Image upload failed. Please check your internet connection and try again.';
        } else if (error.message.includes('policies')) {
          errorMessage = 'Storage permission error. Please contact support.';
        }
      }
      
      Alert.alert('Save Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setCurrentStep('intro');
    setIngredientsImage(null);
    setFrontImage(null);
    setScanResult(null);
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      {/* Product Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../../assets/Ingredients.png')}
          style={styles.ingredientsImage}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>Scan Ingredients</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        We couldn't find that barcode, but no worries, we can still help. Just point your camera at the ingredients list and snap it
      </Text>

      {/* CTA Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Scan Ingredients"
          onPress={() => setCurrentStep('ingredients')}
          variant="secondary"
        />
        <Button
          title="Return Home"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    </View>
  );

  const renderCamera = () => {
    if (!permission) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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

    const isIngredientsStep = currentStep === 'ingredients';
    const isFrontStep = currentStep === 'front';

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        />
        
        {/* Enhanced Progress Header */}
        <View style={styles.progressHeader}>
          <View style={styles.progressIndicators}>
            {/* Step 1 - Ingredients */}
            <View style={[
              styles.progressStep,
              ingredientsImage ? styles.progressStepCompleted : 
              isIngredientsStep ? styles.progressStepActive : styles.progressStepInactive
            ]}>
              {ingredientsImage ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={styles.progressStepNumber}>1</Text>
              )}
            </View>
            
            <View style={[
              styles.progressLine,
              ingredientsImage ? styles.progressLineCompleted : styles.progressLineInactive
            ]} />
            
            {/* Step 2 - Front Photo */}
            <View style={[
              styles.progressStep,
              frontImage ? styles.progressStepCompleted :
              isFrontStep ? styles.progressStepActive : styles.progressStepInactive
            ]}>
              {frontImage ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={styles.progressStepNumber}>2</Text>
              )}
            </View>
          </View>
          
          <Text style={styles.progressTitle}>
            {isIngredientsStep ? 'Scan Ingredients List' : 'Scan Product Front'}
          </Text>
        </View>

        {/* Enhanced Instruction Overlay */}
        <View style={styles.instructionOverlay}>
          <View style={[
            styles.instructionCard,
            isIngredientsStep ? styles.instructionCardIngredients : styles.instructionCardFront
          ]}>
            <Ionicons 
              name={isIngredientsStep ? 'list-outline' : 'image-outline'} 
              size={24} 
              color="white" 
            />
            <Text style={styles.instructionTitle}>
              {isIngredientsStep ? 'Ingredients List' : 'Product Front'}
            </Text>
            <Text style={styles.instructionDescription}>
              {isIngredientsStep 
                ? 'Position the ingredients list clearly in the frame. Ensure good lighting and focus.' 
                : 'Capture the front of the product package for identification.'
              }
            </Text>
            
            {/* Show completed step preview */}
            {ingredientsImage && isIngredientsStep && (
              <View style={styles.completedStepPreview}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.completedStepText}>Ingredients captured! Now scan the front.</Text>
              </View>
            )}
            
            {frontImage && isFrontStep && (
              <View style={styles.completedStepPreview}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.completedStepText}>Front photo captured! Processing...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Enhanced Controls */}
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
            style={[
              styles.captureButton,
              ingredientsImage && isIngredientsStep ? styles.captureButtonSuccess : {},
              frontImage && isFrontStep ? styles.captureButtonSuccess : {}
            ]}
            onPress={takePicture}
          >
            <View style={[
              styles.captureButtonInner,
              ingredientsImage && isIngredientsStep ? styles.captureButtonInnerSuccess : {},
              frontImage && isFrontStep ? styles.captureButtonInnerSuccess : {}
            ]}>
              {((ingredientsImage && isIngredientsStep) || (frontImage && isFrontStep)) && (
                <Ionicons name="checkmark" size={30} color="white" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCurrentStep('intro')}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Show preview of captured image */}
        {ingredientsImage && isFrontStep && (
          <View style={styles.capturedPreview}>
            <Image source={{ uri: ingredientsImage }} style={styles.previewImage} />
            <View style={styles.previewBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.processingTitle}>Analyzing Ingredients</Text>
      <Text style={styles.processingSubtitle}>
        Using AI to extract text and classify food processing level...
      </Text>
      
      <View style={styles.processingImages}>
        {ingredientsImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: ingredientsImage }} style={styles.processingImage} />
            <Text style={styles.imageLabel}>Ingredients</Text>
          </View>
        )}
        {frontImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: frontImage }} style={styles.processingImage} />
            <Text style={styles.imageLabel}>Product</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderResults = () => {
    if (!scanResult) return null;

    const { novaClassification, extractedText } = scanResult;
    const isUltraProcessed = novaClassification.nova_group === 4;

    return (
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>Scan Results</Text>

        {/* Processing Level Card */}
        <View style={styles.processingLevelContainer}>
          <ProcessingLevelCard level={novaClassification.nova_group as 1 | 2 | 3 | 4} />
        </View>

        {/* Captured Images Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Captured Images</Text>
          <View style={styles.capturedImagesRow}>
            {scanResult.frontImage && (
              <View style={styles.capturedImageWrapper}>
                <Image source={{ uri: scanResult.frontImage }} style={styles.capturedImage} />
              </View>
            )}
            {scanResult.ingredientsImage && (
              <View style={styles.capturedImageWrapper}>
                <Image source={{ uri: scanResult.ingredientsImage }} style={styles.capturedImage} />
              </View>
            )}
          </View>
        </View>

        {/* Extracted Ingredients Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Extracted Ingredients</Text>
          <Text style={styles.ingredientsText}>{extractedText}</Text>
        </View>

        {/* Reasons this food is UPF - Only for ultra-processed */}
        {isUltraProcessed && novaClassification.nova_details.foundIndicators.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionCardTitle, styles.upfTitle]}>
              Reasons this food is UPF
            </Text>
            <View style={styles.indicatorsContainer}>
              {novaClassification.nova_details.foundIndicators.map((indicator, index) => (
                <View key={index} style={styles.indicatorChip}>
                  <Text style={styles.indicatorText}>{indicator}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ultra-processed message or submit button */}
        {isUltraProcessed ? (
          <Text style={styles.ultraProcessedMessage}>
            Cannot submit to our database as it's{'\n'}ultra processed.
          </Text>
        ) : (
          <View style={styles.submitButtonContainer}>
            <Button
              title="Submit food to app"
              onPress={saveToDatabase}
              variant="secondary"
              disabled={isProcessing}
            />
          </View>
        )}

        {/* Scan Another Button */}
        <View style={styles.scanAnotherButtonContainer}>
          <Button
            title={isUltraProcessed ? "Scan another food" : "Scan another product"}
            onPress={resetScanner}
            variant="outline"
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.safeArea, (currentStep === 'intro' || currentStep === 'results') && { paddingTop: insets.top }]}>
      {currentStep === 'intro' && renderIntro()}
      {(currentStep === 'ingredients' || currentStep === 'front') && renderCamera()}
      {currentStep === 'processing' && renderProcessing()}
      {currentStep === 'results' && renderResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F6F0',
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
    backgroundColor: '#F7F6F0',
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
  ingredientsImage: {
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
    gap: 12,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  
  // Enhanced Progress Header
  progressHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  
  progressIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  
  progressStepActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  
  progressStepCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  
  progressStepInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  
  progressStepNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: theme.spacing.sm,
  },
  
  progressLineCompleted: {
    backgroundColor: theme.colors.success,
  },
  
  progressLineInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  progressTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Enhanced Instruction Overlay
  instructionOverlay: {
    position: 'absolute',
    top: 160,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 5,
  },
  
  instructionCard: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  
  instructionCardIngredients: {
    borderColor: theme.colors.primary,
  },
  
  instructionCardFront: {
    borderColor: theme.colors.warning,
  },
  
  instructionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  instructionDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  completedStepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  
  completedStepText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInnerSuccess: {
    backgroundColor: theme.colors.success,
  },
  
  // Captured Image Preview
  capturedPreview: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  previewBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  processingTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  processingSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  processingImages: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  imageContainer: {
    alignItems: 'center',
  },
  processingImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  imageLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  resultsContent: {
    padding: 24,
    paddingBottom: 120, // Account for floating tab bar
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  processingLevelContainer: {
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.48,
  },
  upfTitle: {
    color: theme.colors.error,
  },
  capturedImagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  capturedImageWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral[100],
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ingredientsText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 20,
    letterSpacing: 0,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indicatorChip: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  indicatorText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.error,
    letterSpacing: -0.13,
  },
  ultraProcessedMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  submitButtonContainer: {
    marginBottom: 12,
  },
  scanAnotherButtonContainer: {
    marginBottom: 16,
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});