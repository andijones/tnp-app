import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';

type SubmissionMode = 'photo' | 'url';

interface ImageItem {
  uri: string;
  id: string;
}

export const SubmissionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<SubmissionMode>('photo');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Form data
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [notes, setNotes] = useState('');

  // Animation for mode switching
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchMode = (newMode: SubmissionMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setMode(newMode);
  };

  const compressImage = async (uri: string): Promise<string> => {
    return uri;
  };

  const addImageFromGallery = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert('Maximum Images', 'You can upload up to 3 images per submission');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const newImage: ImageItem = {
          uri: compressedUri,
          id: Date.now().toString(),
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert('Maximum Images', 'You can upload up to 3 images per submission');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const newImage: ImageItem = {
          uri: compressedUri,
          id: Date.now().toString(),
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error(error);
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const submitPhotoSubmission = async () => {
    if (selectedImages.length === 0 || !productName.trim()) {
      Alert.alert('Missing Information', 'Please provide at least one image and a product name');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to submit');
        return;
      }

      const uploadedImages: string[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const fileName = `photo-submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`;

        const response = await fetch(image.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
          throw new Error('Image ArrayBuffer is empty - image may be corrupted');
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(`submissions/${fileName}`, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(`submissions/${fileName}`);

        uploadedImages.push(publicUrl);
      }

      let description = notes.trim();
      if (uploadedImages.length > 1) {
        const additionalImages = uploadedImages.slice(1).map((url, index) =>
          `Additional Image ${index + 2}: ${url}`
        ).join('\n');
        description += description ? `\n\n${additionalImages}` : additionalImages;
      }

      const { error: insertError } = await supabase
        .from('foods')
        .insert({
          name: productName.trim(),
          category: 'photo-submission',
          description: description,
          image: uploadedImages[0],
          status: 'pending',
          user_id: user.id,
          supermarket: supermarket.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        '✓ Submitted!',
        'Your food has been submitted for review. We\'ll notify you once it\'s approved.',
        [{ text: 'Got it', onPress: resetForm }]
      );

    } catch (error) {
      console.error('Photo submission error:', error);

      let errorMessage = 'Failed to submit. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch image')) {
          errorMessage = 'Could not access the selected image. Please try a different image.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Upload failed. Please check your connection and try again.';
        }
      }

      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitUrl = async () => {
    if (!productUrl.trim()) {
      Alert.alert('Missing URL', 'Please provide a product URL');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to submit');
        return;
      }

      const { error } = await supabase
        .from('food_links')
        .insert({
          user_id: user.id,
          url: productUrl.trim(),
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        '✓ Submitted!',
        'Your product link has been submitted. We\'ll extract the details and add it to our database.',
        [{ text: 'Got it', onPress: resetForm }]
      );

    } catch (error) {
      console.error('URL submission error:', error);
      Alert.alert('Error', 'Failed to submit URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedImages([]);
    setProductName('');
    setProductUrl('');
    setSupermarket('');
    setNotes('');
    setMode('photo');
  };

  const handleSubmit = () => {
    if (mode === 'photo') {
      submitPhotoSubmission();
    } else {
      submitUrl();
    }
  };

  const isPhotoFormValid = selectedImages.length > 0 && productName.trim().length > 0;
  const isUrlFormValid = productUrl.trim().length > 0;
  const isFormValid = mode === 'photo' ? isPhotoFormValid : isUrlFormValid;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Food</Text>
        <Text style={styles.headerSubtitle}>Help grow our database</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode Selector */}
          <View style={styles.modeSelectorContainer}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
              onPress={() => switchMode('photo')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera"
                size={20}
                color={mode === 'photo' ? '#1F5932' : '#737373'}
              />
              <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, mode === 'url' && styles.modeButtonActive]}
              onPress={() => switchMode('url')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="link"
                size={20}
                color={mode === 'url' ? '#1F5932' : '#737373'}
              />
              <Text style={[styles.modeButtonText, mode === 'url' && styles.modeButtonTextActive]}>
                Share Link
              </Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Photo Mode */}
            {mode === 'photo' && (
              <View style={styles.formContent}>
                {/* Hero Image Upload */}
                {selectedImages.length === 0 ? (
                  <View style={styles.emptyImageState}>
                    <View style={styles.emptyImageIconContainer}>
                      <Ionicons name="camera" size={48} color="#44DB6D" />
                    </View>
                    <Text style={styles.emptyImageTitle}>Add product photos</Text>
                    <Text style={styles.emptyImageSubtitle}>
                      Take clear photos of the product and ingredients
                    </Text>

                    <View style={styles.uploadActionsRow}>
                      <TouchableOpacity
                        style={styles.uploadActionButton}
                        onPress={takePhoto}
                        activeOpacity={0.7}
                      >
                        <View style={styles.uploadActionIconContainer}>
                          <Ionicons name="camera" size={24} color="#1F5932" />
                        </View>
                        <Text style={styles.uploadActionLabel}>Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.uploadActionButton}
                        onPress={addImageFromGallery}
                        activeOpacity={0.7}
                      >
                        <View style={styles.uploadActionIconContainer}>
                          <Ionicons name="images" size={24} color="#1F5932" />
                        </View>
                        <Text style={styles.uploadActionLabel}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagesContainer}>
                    {/* Primary Image */}
                    <View style={styles.primaryImageContainer}>
                      <Image
                        source={{ uri: selectedImages[0].uri }}
                        style={styles.primaryImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(selectedImages[0].id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    {/* Thumbnail Grid */}
                    <View style={styles.thumbnailGrid}>
                      {selectedImages.slice(1).map((image) => (
                        <View key={image.id} style={styles.thumbnailWrapper}>
                          <Image
                            source={{ uri: image.uri }}
                            style={styles.thumbnailImage}
                          />
                          <TouchableOpacity
                            style={styles.removeThumbnailButton}
                            onPress={() => removeImage(image.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add More Button */}
                      {selectedImages.length < 3 && (
                        <TouchableOpacity
                          style={styles.addMoreButton}
                          onPress={addImageFromGallery}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={28} color="#44DB6D" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.imageCounter}>
                      {selectedImages.length} of 3 photos
                    </Text>
                  </View>
                )}

                {/* Form Fields - Only show after image is added */}
                {selectedImages.length > 0 && (
                  <View style={styles.formFields}>
                    <Input
                      label="Product Name"
                      value={productName}
                      onChangeText={setProductName}
                      placeholder="E.g., Organic Almond Milk"
                    />

                    <Input
                      label="Supermarket (Optional)"
                      value={supermarket}
                      onChangeText={setSupermarket}
                      placeholder="E.g., Tesco, Sainsbury's"
                    />

                    <Input
                      label="Notes (Optional)"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Any additional details..."
                      multiline
                    />
                  </View>
                )}
              </View>
            )}

            {/* URL Mode */}
            {mode === 'url' && (
              <View style={styles.formContent}>
                <View style={styles.urlHero}>
                  <View style={styles.urlIconContainer}>
                    <Ionicons name="link" size={40} color="#44DB6D" />
                  </View>
                  <Text style={styles.urlTitle}>Share a product link</Text>
                  <Text style={styles.urlSubtitle}>
                    We'll automatically extract the product details
                  </Text>
                </View>

                <View style={styles.formFields}>
                  <Input
                    label="Product URL"
                    value={productUrl}
                    onChangeText={setProductUrl}
                    placeholder="https://www.supermarket.com/product"
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <View style={styles.urlInfoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#1F5932" />
                    <Text style={styles.urlInfoText}>
                      Paste any supermarket product URL
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Submit Button - Now inside ScrollView */}
          <View style={styles.submitContainer}>
            <Button
              title={isSubmitting ? "Submitting..." : "Submit"}
              onPress={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              variant="secondary"
              leftIcon={
                isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                )
              }
            />
            <Text style={styles.submitNote}>
              Reviewed within 24-48 hours
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F5932',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#737373',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Extra padding for tab bar (100px) + spacing
  },

  // Mode Selector
  modeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#E0FFE7',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#737373',
  },
  modeButtonTextActive: {
    color: '#1F5932',
  },

  // Form Content
  formContent: {
    gap: 24,
  },

  // Empty Image State
  emptyImageState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyImageIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0FFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyImageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F5932',
    marginBottom: 8,
  },
  emptyImageSubtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 28,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  uploadActionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0FFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F5932',
  },

  // Images Container (with photos)
  imagesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  primaryImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  primaryImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbnailButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#44DB6D',
    borderStyle: 'dashed',
    backgroundColor: '#E0FFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCounter: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
  },

  // Form Fields
  formFields: {
    gap: 0,
  },

  // URL Mode
  urlHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  urlIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0FFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  urlTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F5932',
    marginBottom: 8,
  },
  urlSubtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  urlInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0FFE7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: -8,
  },
  urlInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1F5932',
    fontWeight: '500',
  },

  // Submit Container
  submitContainer: {
    marginTop: 32,
  },
  submitNote: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginTop: 8,
  },
});
