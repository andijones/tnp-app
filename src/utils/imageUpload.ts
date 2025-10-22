import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase/config';

// Error types for better error handling
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 100; // 100 bytes (to detect empty files)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validate image file before processing
 * @param uri - Local file URI
 * @throws ImageValidationError if validation fails
 */
export const validateImage = async (uri: string): Promise<void> => {
  try {
    // Check if URI is valid
    if (!uri || typeof uri !== 'string') {
      throw new ImageValidationError('Invalid image URI');
    }

    // Check if file exists (for local URIs)
    if (isLocalUri(uri)) {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new ImageValidationError('Image file does not exist');
      }

      // Check file size
      if (fileInfo.size === undefined) {
        throw new ImageValidationError('Unable to determine file size');
      }

      if (fileInfo.size < MIN_FILE_SIZE) {
        throw new ImageValidationError('Image file is too small or corrupted');
      }

      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new ImageValidationError('Image file is too large (max 10MB)');
      }
    }

    // Try to fetch the image to verify it's accessible
    try {
      const response = await fetch(uri);

      if (!response.ok) {
        throw new ImageValidationError(`Failed to access image: ${response.status} ${response.statusText}`);
      }

      // Verify content type if available
      const contentType = response.headers.get('content-type');
      if (contentType && !ALLOWED_MIME_TYPES.some(type => contentType.includes(type))) {
        throw new ImageValidationError(`Unsupported image format: ${contentType}`);
      }

      // Check if response has content
      const blob = await response.blob();
      if (blob.size < MIN_FILE_SIZE) {
        throw new ImageValidationError('Image is empty or corrupted');
      }

      if (blob.size > MAX_FILE_SIZE) {
        throw new ImageValidationError('Image is too large (max 10MB)');
      }
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw error;
      }
      throw new ImageValidationError(`Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    throw new ImageValidationError(`Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload an image to Supabase Storage with comprehensive error handling
 * @param uri - Local file URI from image picker
 * @param bucket - Supabase storage bucket name
 * @param folder - Optional folder path within bucket
 * @param maxWidth - Maximum width for resizing (default: 400)
 * @param maxHeight - Maximum height for resizing (default: 400)
 * @returns Public URL of uploaded image
 * @throws ImageValidationError, ImageProcessingError, or ImageUploadError
 */
export const uploadImage = async (
  uri: string,
  bucket: string = 'avatars',
  folder?: string,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<string> => {
  try {
    console.log('Starting image upload:', { uri, bucket, folder });

    // Step 1: Validate the image
    await validateImage(uri);
    console.log('Image validation passed');

    // Step 2: Resize and compress the image
    let manipulatedImage;
    try {
      manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('Image processing completed');
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 3: Convert to blob for upload
    let blob;
    try {
      const response = await fetch(manipulatedImage.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch processed image: ${response.status}`);
      }
      blob = await response.blob();

      if (blob.size === 0) {
        throw new ImageProcessingError('Processed image is empty');
      }

      console.log('Image converted to blob:', blob.size, 'bytes');
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 4: Generate unique filename
    const fileExt = 'jpg'; // Always use jpg after compression
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Step 5: Upload to Supabase Storage with retry logic
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let uploadError: Error | null = null;

    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;

      try {
        const { data: uploadData, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          throw error;
        }

        console.log('Upload successful:', filePath);

        // Step 6: Get and verify public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        if (!publicUrl) {
          throw new ImageUploadError('Failed to generate public URL');
        }

        // Verify the uploaded image is accessible
        try {
          const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
          if (!verifyResponse.ok) {
            console.warn('Uploaded image may not be immediately accessible');
          }
        } catch (verifyError) {
          console.warn('Could not verify uploaded image accessibility:', verifyError);
        }

        return publicUrl;
      } catch (error) {
        uploadError = error instanceof Error ? error : new Error('Unknown upload error');
        console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError.message);

        if (uploadAttempts < maxAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }
    }

    // All attempts failed
    throw new ImageUploadError(
      `Upload failed after ${maxAttempts} attempts: ${uploadError?.message || 'Unknown error'}`
    );
  } catch (error) {
    console.error('Image upload error:', error);

    // Re-throw custom errors as-is
    if (error instanceof ImageValidationError ||
        error instanceof ImageProcessingError ||
        error instanceof ImageUploadError) {
      throw error;
    }

    // Wrap unknown errors
    throw new ImageUploadError(
      `Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image
 * @param bucket - Supabase storage bucket name
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'avatars'
): Promise<void> => {
  try {
    // Extract file path from public URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

    if (!filePath) {
      throw new Error('Invalid image URL');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Image delete error:', error);
    throw error;
  }
};

/**
 * Check if a string is a local file URI (not a remote URL)
 * @param uri - URI to check
 * @returns true if it's a local file URI
 */
export const isLocalUri = (uri: string): boolean => {
  return uri.startsWith('file://') ||
         uri.startsWith('content://') ||
         uri.startsWith('ph://') ||
         (!uri.startsWith('http://') && !uri.startsWith('https://'));
};

/**
 * Get a user-friendly error message from an image upload error
 * @param error - The error object
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof ImageValidationError) {
    if (error.message.includes('too large')) {
      return 'Image is too large. Please choose an image smaller than 10MB.';
    }
    if (error.message.includes('corrupted') || error.message.includes('empty')) {
      return 'Image appears to be corrupted. Please try a different image.';
    }
    if (error.message.includes('Unsupported')) {
      return 'Unsupported image format. Please use JPEG, PNG, or WebP.';
    }
    if (error.message.includes('does not exist')) {
      return 'Image file not found. Please select the image again.';
    }
    return 'Invalid image. Please try a different image.';
  }

  if (error instanceof ImageProcessingError) {
    return 'Failed to process image. The image may be corrupted or in an unsupported format.';
  }

  if (error instanceof ImageUploadError) {
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'Upload failed due to network issues. Please check your connection and try again.';
    }
    if (error.message.includes('storage')) {
      return 'Storage error. Please try again later.';
    }
    if (error.message.includes('after 3 attempts')) {
      return 'Upload failed after multiple attempts. Please check your connection and try again.';
    }
    return 'Failed to upload image. Please try again.';
  }

  if (error instanceof Error) {
    return `Upload error: ${error.message}`;
  }

  return 'An unexpected error occurred. Please try again.';
};
