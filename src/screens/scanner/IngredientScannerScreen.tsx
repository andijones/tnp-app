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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
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
      case 1: return 'Unprocessed';
      case 2: return 'Processed Culinary';
      case 3: return 'Processed';
      case 4: return 'Ultra-processed';
      default: return 'Unknown';
    }
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="scan" size={64} color={theme.colors.primary} />
      </View>
      
      <Text style={styles.introTitle}>Ingredient Scanner</Text>
      <Text style={styles.introSubtitle}>
        AI-powered ingredient analysis with instant NOVA classification
      </Text>
      
      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Take a clear photo of the ingredients list</Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Take a photo of the product front</Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Get AI-powered NOVA classification</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => setCurrentStep('ingredients')}
      >
        <Text style={styles.startButtonText}>Start Scanning</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Uses OpenAI GPT-4 Vision for accurate ingredient extraction
      </Text>
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

    const { novaClassification, extractedText, productName } = scanResult;
    const novaColor = getNovaColor(novaClassification.nova_group);

    return (
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Scan Results</Text>
          <Text style={styles.productName}>{productName}</Text>
          
          <View style={[styles.novaCard, { borderColor: novaColor }]}>
            <View style={[styles.novaBadge, { backgroundColor: novaColor }]}>
              <Text style={styles.novaNumber}>NOVA {novaClassification.nova_group}</Text>
            </View>
            <Text style={styles.novaLabel}>{getNovaLabel(novaClassification.nova_group)}</Text>
            <Text style={styles.novaExplanation}>{novaClassification.explanation}</Text>
            
            {novaClassification.contains_seed_oils && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color={theme.colors.warning} />
                <Text style={styles.warningText}>Contains seed oils</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extracted Ingredients</Text>
          <View style={styles.ingredientsBox}>
            <Text style={styles.ingredientsText}>{extractedText}</Text>
          </View>
        </View>

        {novaClassification.nova_details.foundIndicators.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ultra-processed Indicators Found</Text>
            <View style={styles.indicatorsContainer}>
              {novaClassification.nova_details.foundIndicators.map((indicator, index) => (
                <View key={index} style={styles.indicatorChip}>
                  <Text style={styles.indicatorText}>{indicator}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captured Images</Text>
          <View style={styles.resultImages}>
            {scanResult.frontImage && (
              <View style={styles.resultImageContainer}>
                <Image source={{ uri: scanResult.frontImage }} style={styles.resultImage} />
                <Text style={styles.resultImageLabel}>Product</Text>
              </View>
            )}
            {scanResult.ingredientsImage && (
              <View style={styles.resultImageContainer}>
                <Image source={{ uri: scanResult.ingredientsImage }} style={styles.resultImage} />
                <Text style={styles.resultImageLabel}>Ingredients</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={saveToDatabase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Save to Database</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.scanAnotherButton]}
            onPress={resetScanner}
          >
            <Ionicons name="scan" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              Scan Another Product
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.resultDisclaimer}>
          This analysis is automated and for reference only. Results may vary based on image quality and OCR accuracy.
        </Text>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {currentStep === 'intro' && renderIntro()}
      {(currentStep === 'ingredients' || currentStep === 'front') && renderCamera()}
      {currentStep === 'processing' && renderProcessing()}
      {currentStep === 'results' && renderResults()}
    </SafeAreaView>
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
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  introTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  stepText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  startButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disclaimer: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.xl,
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
  },
  resultsHeader: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  productName: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  novaCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  novaBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  novaNumber: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  novaLabel: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  novaExplanation: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: `${theme.colors.warning}20`,
    borderRadius: theme.borderRadius.sm,
  },
  warningText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.warning,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ingredientsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  indicatorChip: {
    backgroundColor: `${theme.colors.error}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  indicatorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  resultImages: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  resultImageContainer: {
    alignItems: 'center',
  },
  resultImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  resultImageLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  actionButtons: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  scanAnotherButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.typography.subtitle.fontSize,
    fontFamily: theme.typography.subtitle.fontFamily,
    lineHeight: theme.typography.subtitle.lineHeight,
    letterSpacing: theme.typography.subtitle.letterSpacing,
    color: 'white',
  },
  resultDisclaimer: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 16,
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