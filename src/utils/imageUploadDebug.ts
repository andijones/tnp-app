// Image Upload Debug Utilities
// Add this to your app to help diagnose upload issues

import { supabase } from '../services/supabase/config';

export const debugStoragePermissions = async () => {
  try {
    console.log('=== Storage Debug ===');
    
    // Test 1: Check if we can list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('food-images')
      .list('submissions', {
        limit: 5,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ Cannot list files:', listError);
      return false;
    }

    console.log('✅ Can list files. Recent submissions:', files?.length || 0);
    
    // Test 2: Try to upload a simple test file
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `debug-test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(`submissions/${testFileName}`, testData);

    if (uploadError) {
      console.error('❌ Cannot upload test file:', uploadError);
      return false;
    }

    console.log('✅ Test upload successful:', uploadData?.path);

    // Test 3: Try to get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(`submissions/${testFileName}`);

    console.log('✅ Public URL generated:', publicUrl);

    // Test 4: Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('food-images')
      .remove([`submissions/${testFileName}`]);

    if (deleteError) {
      console.warn('⚠️  Could not clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Storage debug failed:', error);
    return false;
  }
};

export const debugImageProcessing = async (imageUri: string) => {
  try {
    console.log('=== Image Processing Debug ===');
    console.log('Original URI:', imageUri);

    // Test 1: Check if we can fetch the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      console.error('❌ Cannot fetch image:', response.status, response.statusText);
      return false;
    }
    console.log('✅ Image fetch successful');

    // Test 2: Check blob conversion
    const blob = await response.blob();
    console.log('✅ Blob created - Size:', blob.size, 'Type:', blob.type);

    if (blob.size === 0) {
      console.error('❌ Blob is empty!');
      return false;
    }

    if (!blob.type.startsWith('image/')) {
      console.warn('⚠️  Blob type is not an image:', blob.type);
    }

    return true;
  } catch (error) {
    console.error('❌ Image processing debug failed:', error);
    return false;
  }
};

// Call this function when your app starts to check storage setup
export const runStorageHealthCheck = async () => {
  console.log('🔍 Running storage health check...');
  
  const storageOk = await debugStoragePermissions();
  
  if (storageOk) {
    console.log('✅ Storage is working correctly');
  } else {
    console.error('❌ Storage has issues - check Supabase dashboard for bucket policies');
  }
  
  return storageOk;
};