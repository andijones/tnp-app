import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SegmentedTabs } from '../../components/common/SegmentedTabs';
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

  const tabOptions = ['Photo', 'URL'];
  const getModeIndex = (mode: SubmissionMode) => mode === 'photo' ? 0 : 1;
  const getIndexMode = (index: number): SubmissionMode => index === 0 ? 'photo' : 'url';

  // Form data
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [notes, setNotes] = useState('');

  const compressImage = async (uri: string): Promise<string> => {
    // For now, return the original URI
    // In production, you'd implement proper image compression here
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

      // Upload images to Supabase Storage
      const uploadedImages: string[] = [];
      
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const fileName = `photo-submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`;
        
        console.log('Uploading image:', fileName, 'URI:', image.uri);
        
        // Convert image URI to ArrayBuffer for better React Native compatibility
        const response = await fetch(image.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);
        
        // Verify ArrayBuffer has content
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
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(`submissions/${fileName}`);

        console.log('Public URL:', publicUrl);
        
        // Verify the uploaded image is accessible
        try {
          const urlTest = await fetch(publicUrl);
          console.log('URL accessibility test:', urlTest.status);
          if (!urlTest.ok) {
            console.warn('Warning: Uploaded image may not be accessible');
          }
        } catch (urlTestError) {
          console.warn('Warning: Could not verify image accessibility:', urlTestError);
        }
        
        uploadedImages.push(publicUrl);
      }

      // Create description with additional image URLs
      let description = notes.trim();
      if (uploadedImages.length > 1) {
        const additionalImages = uploadedImages.slice(1).map((url, index) => 
          `Additional Image ${index + 2}: ${url}`
        ).join('\n');
        description += description ? `\n\n${additionalImages}` : additionalImages;
      }

      // Insert into foods table
      const { error: insertError } = await supabase
        .from('foods')
        .insert({
          name: productName.trim(),
          category: 'photo-submission',
          description: description,
          image: uploadedImages[0], // Primary image
          status: 'pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        'Success!', 
        'Your photo submission has been sent for review. Thank you for contributing!',
        [{ text: 'OK', onPress: resetForm }]
      );

    } catch (error) {
      console.error('Photo submission error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit photos. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch image')) {
          errorMessage = 'Could not access the selected image. Please try selecting a different image.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Image upload failed. Please check your internet connection and try again.';
        } else if (error.message.includes('policies')) {
          errorMessage = 'Storage permission error. Please contact support.';
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
        'Success!', 
        'Your URL submission has been sent for review.',
        [{ text: 'OK', onPress: resetForm }]
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
    switch (mode) {
      case 'photo':
        submitPhotoSubmission();
        break;
      case 'url':
        submitUrl();
        break;
    }
  };

  const renderModeSelector = () => (
    <View style={styles.tabContainer}>
      <SegmentedTabs
        options={tabOptions}
        selectedIndex={getModeIndex(mode)}
        onSelectionChange={(index) => setMode(getIndexMode(index))}
        style={styles.segmentedTabs}
      />
    </View>
  );

  const renderPhotoMode = () => (
    <ScrollView style={styles.formContainer}>
      {/* Image Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Images (Max 3)</Text>
        
        <View style={styles.imageGrid}>
          {selectedImages.map((image) => (
            <View key={image.id} style={styles.imageItem}>
              <Image source={{ uri: image.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(image.id)}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {selectedImages.length < 3 && (
            <View style={styles.addImageContainer}>
              <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={theme.colors.text.secondary} />
                <Text style={styles.addImageText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addImageButton} onPress={addImageFromGallery}>
                <Ionicons name="images" size={24} color={theme.colors.text.secondary} />
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Form Fields */}
      <Input
        label="Product Name *"
        value={productName}
        onChangeText={setProductName}
        placeholder="Enter product name"
      />

      <Input
        label="Supermarket"
        value={supermarket}
        onChangeText={setSupermarket}
        placeholder="e.g., Tesco, Sainsbury's"
      />

      <Input
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional information about this product"
        multiline
      />
    </ScrollView>
  );

  const renderUrlMode = () => (
    <ScrollView style={styles.formContainer}>
      <Input
        label="Product URL *"
        value={productUrl}
        onChangeText={setProductUrl}
        placeholder="https://example.com/product"
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Paste a product URL from any major retailer. Our team will extract the product information and add it to the database.
        </Text>
      </View>
    </ScrollView>
  );


  return (
    <KeyboardAvoidingView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Descriptive Header */}
        <View style={styles.descriptiveHeader}>
          <Text style={styles.descriptiveTitle}>Add a Food to the Database</Text>
          <Text style={styles.descriptiveBody}>
            Help the community by contributing products you've found. Your submissions help others make healthier choices.
          </Text>
        </View>

        {/* Mode Selector Card */}
        <View style={styles.modeCard}>
          <Text style={styles.modeLabel}>How would you like to submit?</Text>
          <SegmentedTabs
            options={tabOptions}
            selectedIndex={getModeIndex(mode)}
            onSelectionChange={(index) => setMode(getIndexMode(index))}
          />
        </View>

        {/* Photo Mode */}
        {mode === 'photo' && (
          <>
            {/* Image Upload Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="images" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Product Photos</Text>
              </View>

              <View style={styles.imageGrid}>
                {selectedImages.map((image) => (
                  <View key={image.id} style={styles.imageWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeImage(image.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {selectedImages.length < 3 && (
                  <>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={28} color={theme.colors.primary} />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={addImageFromGallery}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="image" size={28} color={theme.colors.primary} />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {selectedImages.length < 3 && (
                <Text style={styles.helperText}>
                  Upload up to 3 clear photos of the product
                </Text>
              )}
            </View>

            {/* Product Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Product Details</Text>
              </View>

              <Input
                label="Product Name *"
                value={productName}
                onChangeText={setProductName}
                placeholder="E.g., Organic Almond Milk"
              />

              <Input
                label="Supermarket"
                value={supermarket}
                onChangeText={setSupermarket}
                placeholder="E.g., Tesco, Sainsbury's"
              />

              <Input
                label="Additional Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special details about this product..."
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* URL Mode */}
        {mode === 'url' && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="link" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Product URL</Text>
              </View>

              <Input
                label="Product Link *"
                value={productUrl}
                onChangeText={setProductUrl}
                placeholder="https://www.supermarket.com/product"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.infoCardText}>
                We'll automatically extract product details from the URL and add it to our database
              </Text>
            </View>
          </>
        )}

        {/* Submit Button */}
        <Button
          title={isSubmitting ? "Submitting..." : "Submit for Review"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="secondary"
          leftIcon={isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="paper-plane" size={20} color="#FFFFFF" />}
        />

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons name="time" size={16} color="#737373" />
          <Text style={styles.footerNoteText}>
            Submissions are reviewed within 24-48 hours
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 140, // Extra padding for floating tab bar
  },

  // Descriptive Header
  descriptiveHeader: {
    marginBottom: 24,
  },
  descriptiveTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F5932',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  descriptiveBody: {
    fontSize: 15,
    color: '#737373',
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  // Mode Selector
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F5932',
    marginBottom: 12,
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F5932',
  },

  // Image Grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#44DB6D',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(68, 219, 109, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F5932',
  },
  helperText: {
    fontSize: 13,
    color: '#737373',
    marginTop: 4,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(68, 219, 109, 0.08)',
    borderWidth: 1,
    borderColor: '#44DB6D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#1F5932',
    lineHeight: 20,
  },


  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerNoteText: {
    fontSize: 13,
    color: '#737373',
  },
});