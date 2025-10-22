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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase/config';
import { validateImage, getUserFriendlyErrorMessage } from '../../utils/imageUpload';

interface ImageItem {
  uri: string;
  id: string;
}

// Casual placeholder suggestions that rotate
const PLACEHOLDERS = [
  "Spotted a healthy food? Tell us about it...\n\ne.g., Organic almond butter at Tesco",
  "Found something good? Share it here...\n\ne.g., Great ingredients on these crackers from Sainsbury's",
  "Seen a non-UPF product? Let us know...\n\ne.g., Just found this at Whole Foods!",
];

export const SubmissionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [suggestion, setSuggestion] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Rotate placeholder on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDERS.length);
    setPlaceholder(PLACEHOLDERS[randomIndex]);
  }, []);

  // Auto-detect URLs in the text
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = suggestion.match(urlRegex);
    if (match && match[0]) {
      setDetectedUrl(match[0]);
    } else {
      setDetectedUrl(null);
    }
  }, [suggestion]);

  const addPhoto = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert('Maximum Photos', 'You can add up to 3 photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: ImageItem = {
          uri: result.assets[0].uri,
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
      Alert.alert('Maximum Photos', 'You can add up to 3 photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: ImageItem = {
          uri: result.assets[0].uri,
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

  const addLink = () => {
    if (Platform.OS === 'android') {
      // Android: Show simple instruction to paste in main text box
      Alert.alert(
        'Add Product Link',
        'Paste the URL directly in the text box above. We\'ll detect it automatically!',
        [{ text: 'Got it' }]
      );
    } else {
      // iOS: Use Alert.prompt
      Alert.prompt(
        'Add Product Link',
        'Paste a product URL from any supermarket',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (url?: string) => {
              if (url && url.trim()) {
                // Add URL to suggestion text if not already there
                if (!suggestion.includes(url.trim())) {
                  setSuggestion(prev => prev ? `${prev}\n\n${url.trim()}` : url.trim());
                }
              }
            },
          },
        ],
        'plain-text',
        '',
        'url'
      );
    }
  };

  const handleSubmit = async () => {
    // Need at least one: text, photo, or URL
    if (!suggestion.trim() && selectedImages.length === 0) {
      Alert.alert(
        'Nothing to submit',
        'Add some text, a photo, or a link to share your find'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to share suggestions');
        return;
      }

      const uploadedImages: string[] = [];

      // Upload images if any with improved error handling
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];

        try {
          // Validate image before processing
          await validateImage(image.uri);

          // Resize and compress the image
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            image.uri,
            [{ resize: { width: 1200 } }], // Resize to max 1200px width
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );

          // Fetch processed image
          const response = await fetch(manipulatedImage.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch processed image: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();

          if (arrayBuffer.byteLength === 0) {
            throw new Error('Processed image is empty');
          }

          // Generate unique filename
          const fileName = `suggestion-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${i}.jpg`;

          // Upload to Supabase Storage with retry logic
          let uploadSuccess = false;
          let uploadAttempts = 0;
          const maxAttempts = 3;

          while (!uploadSuccess && uploadAttempts < maxAttempts) {
            uploadAttempts++;

            const { error: uploadError } = await supabase.storage
              .from('food-images')
              .upload(`submissions/${fileName}`, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: false
              });

            if (uploadError) {
              console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError);
              if (uploadAttempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
              } else {
                throw uploadError;
              }
            } else {
              uploadSuccess = true;
            }
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('food-images')
            .getPublicUrl(`submissions/${fileName}`);

          uploadedImages.push(publicUrl);
        } catch (imageError) {
          console.error(`Error uploading image ${i + 1}:`, imageError);

          // Get user-friendly error message
          const errorMessage = getUserFriendlyErrorMessage(imageError);

          throw new Error(`Failed to upload image ${i + 1}: ${errorMessage}`);
        }
      }

      // Build description from user suggestion + images
      let description = suggestion.trim();
      if (uploadedImages.length > 1) {
        const additionalImages = uploadedImages.slice(1).map((url, index) =>
          `Additional Image ${index + 2}: ${url}`
        ).join('\n');
        description += description ? `\n\n${additionalImages}` : additionalImages;
      }

      // If there's a detected URL, save it to food_links table
      if (detectedUrl) {
        await supabase
          .from('food_links')
          .insert({
            user_id: user.id,
            url: detectedUrl,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
      }

      // Save the suggestion to foods table
      const { error: insertError } = await supabase
        .from('foods')
        .insert({
          name: extractProductName(suggestion) || 'User suggestion',
          category: 'quick-suggestion',
          description: description,
          image: uploadedImages[0] || null,
          status: 'pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      // Success!
      Alert.alert(
        'Thanks!',
        'We\'ll check it out and add it to the app soon 🎉',
        [{ text: 'Suggest Another', onPress: resetForm }]
      );

    } catch (error) {
      console.error('Submission error:', error);

      let errorMessage = 'Failed to submit. Please try again.';
      if (error instanceof Error) {
        // Check if it's an image-related error (from our custom error messages)
        if (error.message.includes('upload image')) {
          errorMessage = error.message; // Use the detailed error message we created
        } else if (error.message.includes('image')) {
          errorMessage = 'Image upload failed. Please check your connection and try again.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Upload failed. Please try again.';
        }
      }

      Alert.alert('Oops!', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuggestion('');
    setSelectedImages([]);
    setDetectedUrl(null);
  };

  // Extract product name from suggestion text (simple heuristic)
  const extractProductName = (text: string): string | null => {
    if (!text) return null;

    // Take first line or first sentence
    const lines = text.split('\n');
    const firstLine = lines[0].trim();

    // Remove common words
    const cleaned = firstLine
      .replace(/spotted|found|seen|just|at|from|in/gi, '')
      .trim();

    // Limit to 100 chars
    return cleaned.substring(0, 100) || null;
  };

  // Check if we have any content
  const hasContent = suggestion.trim() || selectedImages.length > 0;

  return (
    <View style={styles.container}>
      {/* White Safe Area Background */}
      <View style={[styles.safeAreaBackground, { height: insets.top }]} />

      {/* Generic White Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Share a Find</Text>
          <Text style={styles.headerSubtitle}>Spotted something healthy? Let us know!</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 } // Account for tab bar (68px) + extra padding
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instruction Card - appears above input when empty */}
          {!hasContent && (
            <View style={styles.instructionCard}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="chatbox-outline" size={20} color="#1F5932" />
                </View>
                <View style={styles.instructionTextContainer}>
                  <Text style={styles.instructionTitle}>Tell us what you found</Text>
                  <Text style={styles.instructionDescription}>
                    Type the product name and where you found it
                  </Text>
                </View>
              </View>

              <View style={styles.instructionRow}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="camera-outline" size={20} color="#1F5932" />
                </View>
                <View style={styles.instructionTextContainer}>
                  <Text style={styles.instructionTitle}>Add a photo (optional)</Text>
                  <Text style={styles.instructionDescription}>
                    Tap the camera button below to add images
                  </Text>
                </View>
              </View>

              <View style={styles.instructionRow}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="link-outline" size={20} color="#1F5932" />
                </View>
                <View style={styles.instructionTextContainer}>
                  <Text style={styles.instructionTitle}>Share a link (optional)</Text>
                  <Text style={styles.instructionDescription}>
                    Paste a product URL and we'll detect it automatically
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Main Text Input */}
          <View style={styles.textInputCard}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor="#A3A3A3"
              value={suggestion}
              onChangeText={setSuggestion}
              multiline
              textAlignVertical="top"
              autoFocus={false}
            />
          </View>

          {/* Action Buttons - directly under input */}
          <View style={styles.inlineActions}>
            <TouchableOpacity
              style={styles.inlineActionButton}
              onPress={() => {
                Alert.alert(
                  'Add Photo',
                  'Choose how to add a photo',
                  [
                    { text: 'Camera', onPress: takePhoto },
                    { text: 'Photo Library', onPress: addPhoto },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={18} color="#404040" />
              <Text style={styles.inlineActionLabel}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inlineActionButton}
              onPress={addLink}
              activeOpacity={0.8}
            >
              <Ionicons name="link-outline" size={18} color="#404040" />
              <Text style={styles.inlineActionLabel}>Link</Text>
            </TouchableOpacity>

            <View style={styles.inlineActionSpacer} />

            <TouchableOpacity
              style={[styles.inlineSubmitButton, !hasContent && styles.inlineSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || !hasContent}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                  <Text style={styles.inlineSubmitLabel}>Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* URL Detection Preview */}
          {detectedUrl && (
            <View style={styles.urlPreview}>
              <View style={styles.urlPreviewIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#1F5932" />
              </View>
              <View style={styles.urlPreviewContent}>
                <Text style={styles.urlPreviewLabel}>Link detected</Text>
                <Text style={styles.urlPreviewText} numberOfLines={1}>
                  {detectedUrl}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetectedUrl(null)}>
                <Ionicons name="close" size={20} color="#737373" />
              </TouchableOpacity>
            </View>
          )}

          {/* Photos Grid */}
          {selectedImages.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.photosSectionLabel}>
                {selectedImages.length} {selectedImages.length === 1 ? 'photo' : 'photos'} added
              </Text>
              <View style={styles.photosGrid}>
                {selectedImages.map((image) => (
                  <View key={image.id} style={styles.photoWrapper}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.photoImage}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removeImage(image.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add More Button */}
                {selectedImages.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={addPhoto}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={32} color="#44DB6D" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Success tip when user has added content */}
          {hasContent && (
            <View style={styles.successTip}>
              <Ionicons name="checkmark-circle" size={16} color="#1F5932" />
              <Text style={styles.successTipText}>
                Looking good! Hit the Share button below when ready
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White for safe area
  },

  // White Safe Area Background
  safeAreaBackground: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },

  // Generic White Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.44,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '400',
  },

  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F6F0', // Neutral background for content area
  },
  scrollContent: {
    padding: 20,
    backgroundColor: '#F7F6F0',
  },

  // Instruction Card
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0FFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  instructionDescription: {
    fontSize: 13,
    color: '#737373',
    lineHeight: 18,
  },

  // Main Text Input
  textInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    minHeight: 140,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0A0A',
    lineHeight: 24,
    minHeight: 100,
  },

  // Inline Actions - directly under input box
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  // Outline button style for Photo and Link
  inlineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA', // Neutral-50 base (outline style)
    borderRadius: 9999, // Fully rounded (pill)
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)', // Tan border from design system
    gap: 6,
    // Shadow from design system outline
    shadowColor: 'rgba(90, 82, 34, 1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inlineActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#404040', // Neutral-700 (outline text)
    letterSpacing: -0.28,
  },
  inlineActionSpacer: {
    flex: 1,
  },
  // Secondary button style for Share (dark green)
  inlineSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: '#1F5932', // Green-950 (secondary style)
    borderRadius: 9999, // Fully rounded (pill)
    borderWidth: 1,
    borderColor: '#1F5932',
    gap: 6,
  },
  inlineSubmitButtonDisabled: {
    opacity: 0.4, // Design system disabled opacity
  },
  inlineSubmitLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF', // White text (secondary style)
    letterSpacing: -0.42,
  },

  // URL Preview Chip
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0FFE7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  urlPreviewIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlPreviewContent: {
    flex: 1,
  },
  urlPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F5932',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  urlPreviewText: {
    fontSize: 13,
    color: '#1F5932',
    fontWeight: '500',
  },

  // Photos Section
  photosSection: {
    marginBottom: 16,
  },
  photosSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#44DB6D',
    borderStyle: 'dashed',
    backgroundColor: '#F9FFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Success Tip
  successTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0FFE7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  successTipText: {
    flex: 1,
    fontSize: 14,
    color: '#1F5932',
    fontWeight: '500',
  },
});
