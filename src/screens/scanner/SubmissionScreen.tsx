import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';

type SubmissionMode = 'photo' | 'url';

interface ImageItem {
  uri: string;
  id: string;
}

export const SubmissionScreen: React.FC = () => {
  const [mode, setMode] = useState<SubmissionMode>('photo');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            mode === 'photo' && styles.tabButtonActive,
          ]}
          onPress={() => setMode('photo')}
        >
          <Text style={[
            styles.tabText,
            mode === 'photo' && styles.tabTextActive,
          ]}>
            Photo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            mode === 'url' && styles.tabButtonActive,
          ]}
          onPress={() => setMode('url')}
        >
          <Text style={[
            styles.tabText,
            mode === 'url' && styles.tabTextActive,
          ]}>
            URL
          </Text>
        </TouchableOpacity>
      </View>
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
                <Ionicons name="camera" size={32} color={theme.colors.primary} />
                <Text style={styles.addImageText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addImageButton} onPress={addImageFromGallery}>
                <Ionicons name="images" size={32} color={theme.colors.primary} />
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Product Name *</Text>
        <TextInput
          style={styles.textInput}
          value={productName}
          onChangeText={setProductName}
          placeholder="Enter product name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Supermarket</Text>
        <TextInput
          style={styles.textInput}
          value={supermarket}
          onChangeText={setSupermarket}
          placeholder="e.g., Tesco, Sainsbury's"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional information about this product"
          multiline
          numberOfLines={3}
        />
      </View>
    </ScrollView>
  );

  const renderUrlMode = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Product URL *</Text>
        <TextInput
          style={styles.textInput}
          value={productUrl}
          onChangeText={setProductUrl}
          placeholder="https://example.com/product"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Paste a product URL from any major retailer. Our team will extract the product information and add it to the database.
        </Text>
      </View>
    </ScrollView>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Submit Food</Text>
        <Text style={styles.subtitle}>Help grow The Naked Pantry database</Text>
      </View>

      {renderModeSelector()}

      <View style={styles.container}>
        <View style={styles.content}>
          {mode === 'photo' && renderPhotoMode()}
          {mode === 'url' && renderUrlMode()}
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>
                  Submit {mode === 'photo' ? 'Photos' : 'URL'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Using fallback since border not in theme yet
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabSelector: {
    backgroundColor: '#F2F2F7',
    borderRadius: theme.borderRadius.full,
    padding: 2,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addImageContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}05`,
  },
  addImageText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${theme.colors.primary}10`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  submitContainer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F7F6F0',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});