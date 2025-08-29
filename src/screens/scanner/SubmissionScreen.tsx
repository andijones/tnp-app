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

type SubmissionMode = 'photo' | 'url' | 'manual';

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
        const fileName = `photo-submission-${Date.now()}-${i}.jpg`;
        
        const response = await fetch(image.uri);
        const blob = await response.blob();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(`submissions/${fileName}`, blob, {
            contentType: 'image/jpeg',
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(`submissions/${fileName}`);

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
      Alert.alert('Error', 'Failed to submit photos. Please try again.');
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

  const submitManualEntry = async () => {
    if (!productName.trim()) {
      Alert.alert('Missing Information', 'Please provide a product name');
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
        .from('foods')
        .insert({
          name: productName.trim(),
          category: 'manual-submission',
          description: notes.trim(),
          status: 'pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success!', 
        'Your manual submission has been sent for review.',
        [{ text: 'OK', onPress: resetForm }]
      );

    } catch (error) {
      console.error('Manual submission error:', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
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
      case 'manual':
        submitManualEntry();
        break;
    }
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      {[
        { key: 'photo', icon: 'camera-outline', label: 'Photo' },
        { key: 'url', icon: 'link-outline', label: 'URL' },
        { key: 'manual', icon: 'create-outline', label: 'Manual' },
      ].map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.modeButton,
            mode === item.key && styles.modeButtonActive,
          ]}
          onPress={() => setMode(item.key as SubmissionMode)}
        >
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={mode === item.key ? theme.colors.primary : theme.colors.text.secondary}
          />
          <Text style={[
            styles.modeLabel,
            mode === item.key && styles.modeLabelActive,
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
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

  const renderManualMode = () => (
    <ScrollView style={styles.formContainer}>
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
        <Text style={styles.inputLabel}>Description/Notes</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe the product, ingredients, where you found it, etc."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Manual submissions are reviewed by our team. Please provide as much detail as possible to help us add the product accurately.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Submit Food</Text>
        <Text style={styles.subtitle}>Help grow The Naked Pantry database</Text>
      </View>

      {renderModeSelector()}

      <View style={styles.content}>
        {mode === 'photo' && renderPhotoMode()}
        {mode === 'url' && renderUrlMode()}
        {mode === 'manual' && renderManualMode()}
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
                Submit {mode === 'photo' ? 'Photos' : mode === 'url' ? 'URL' : 'Product'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Using fallback since border not in theme yet
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
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  modeButtonActive: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  modeLabel: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modeLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
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
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.background,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
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