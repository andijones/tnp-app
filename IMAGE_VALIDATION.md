# Image Upload Validation System

The Naked Pantry implements comprehensive image validation to ensure high-quality uploads and prevent errors before they occur.

## Overview

All images are validated **before upload** to:
- Prevent user frustration from failed uploads
- Reduce bandwidth usage
- Ensure consistent image quality
- Provide clear, actionable error messages

## Validation Rules

### File Size

| Rule | Value | Reason |
|------|-------|--------|
| **Maximum** | 5 MB | Balance quality vs performance |
| **Minimum** | 100 bytes | Detect corrupted/empty files |

### Supported Formats

| Format | Extensions | MIME Types |
|--------|-----------|------------|
| **JPEG** | `.jpg`, `.jpeg` | `image/jpeg`, `image/jpg` |
| **PNG** | `.png` | `image/png` |
| **WebP** | `.webp` | `image/webp` |
| **HEIC/HEIF** | `.heic`, `.heif` | `image/heic`, `image/heif` |

### Image Dimensions

| Rule | Value | Reason |
|------|-------|--------|
| **Maximum** | 4096px | Prevent memory issues |
| **Minimum** | 50px | Avoid tiny/corrupted images |

## Implementation

### Core Validation Function

```typescript
import { validateImage, getUserFriendlyErrorMessage } from '../utils/imageUpload';

try {
  await validateImage(imageUri);
  // Image is valid, proceed with upload
} catch (error) {
  const message = getUserFriendlyErrorMessage(error);
  Alert.alert('Invalid Image', message);
}
```

### Validation Constants

All validation constants are exported for use in UI:

```typescript
import {
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  formatFileSize,
  getMaxFileSizeLabel
} from '../utils/imageUpload';

// Show max file size to user
const maxSize = getMaxFileSizeLabel(); // "5.0 MB"

// Check if extension is allowed
const isAllowed = ALLOWED_EXTENSIONS.includes('.jpg'); // true
```

## User-Facing Error Messages

### File Too Large

**Before validation:**
```
"Upload failed: file too large"
```

**After validation:**
```
Title: "Invalid Image"
Message: "Image is too large (8.2 MB). Maximum size is 5.0 MB."
```

### Unsupported Format

**Before validation:**
```
"Upload error"
```

**After validation:**
```
Title: "Invalid Image"
Message: "Unsupported file type. Please use JPEG, PNG, WebP, or HEIC images."
```

### Corrupted File

**Before validation:**
```
"Failed to process image"
```

**After validation:**
```
Title: "Invalid Image"
Message: "Image file is too small or corrupted"
```

## Integration Examples

### SubmissionScreen (Food Photos)

```typescript
const addPhoto = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    try {
      // Validate BEFORE adding to state
      await validateImage(result.assets[0].uri);

      setSelectedImages(prev => [...prev, {
        uri: result.assets[0].uri,
        id: Date.now().toString(),
      }]);
    } catch (validationError) {
      // Show user-friendly error
      const errorMessage = getUserFriendlyErrorMessage(validationError);
      Alert.alert('Invalid Image', errorMessage);
    }
  }
};
```

### ProfileScreen (Avatar Upload)

```typescript
const handleImagePicker = async () => {
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!pickerResult.canceled && pickerResult.assets[0]) {
    const imageUri = pickerResult.assets[0].uri;

    try {
      // Validate BEFORE setting form data
      await validateImage(imageUri);
      setFormData(prev => ({ ...prev, avatar_url: imageUri }));
    } catch (validationError) {
      const errorMessage = getUserFriendlyErrorMessage(validationError);
      Alert.alert('Invalid Image', errorMessage);
    }
  }
};
```

## Validation Flow

```
┌─────────────────────┐
│  User Selects Image │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Extension    │◄── ALLOWED_EXTENSIONS
│  (.jpg, .png, etc)  │
└──────────┬──────────┘
           │ Valid
           ▼
┌─────────────────────┐
│  Check File Exists  │
└──────────┬──────────┘
           │ Exists
           ▼
┌─────────────────────┐
│   Check File Size   │◄── MIN_FILE_SIZE
│                     │◄── MAX_FILE_SIZE
└──────────┬──────────┘
           │ Valid Size
           ▼
┌─────────────────────┐
│  (Optional)         │
│  Check MIME Type    │◄── ALLOWED_MIME_TYPES
│  for Remote URLs    │
└──────────┬──────────┘
           │ Valid
           ▼
┌─────────────────────┐
│  Image Validated ✓  │
│  Ready for Upload   │
└─────────────────────┘
```

## Benefits

### For Users
- ✅ **Instant feedback** - Know immediately if image won't work
- ✅ **Clear errors** - Understand exactly what's wrong
- ✅ **No wasted time** - Don't wait for upload to fail
- ✅ **Better UX** - Smooth, frustration-free experience

### For App
- ✅ **Reduced bandwidth** - Don't upload invalid files
- ✅ **Fewer errors** - Catch issues before they cause problems
- ✅ **Better performance** - Smaller, optimized images
- ✅ **Consistent quality** - All images meet standards

### For Support
- ✅ **Fewer tickets** - Users fix issues themselves
- ✅ **Clear error logs** - Technical details logged for debugging
- ✅ **Easy troubleshooting** - Validation errors are specific

## Error Types

### ImageValidationError
Thrown when image fails validation checks:
- Invalid URI
- Unsupported format
- File too large/small
- File doesn't exist
- Wrong MIME type

### ImageProcessingError
Thrown when image manipulation fails:
- Resize failed
- Compress failed
- Format conversion failed

### ImageUploadError
Thrown when upload to storage fails:
- Network error
- Storage error
- Permission error
- Multiple upload attempts failed

## Testing

### Manual Testing Checklist

- [ ] Upload JPEG image (should work)
- [ ] Upload PNG image (should work)
- [ ] Upload WebP image (should work)
- [ ] Upload HEIC image from iPhone (should work)
- [ ] Upload GIF (should fail with format error)
- [ ] Upload video (should fail with format error)
- [ ] Upload 10MB+ image (should fail with size error)
- [ ] Upload corrupted image (should fail with corruption error)
- [ ] Upload with no internet (should fail gracefully during upload, not validation)
- [ ] Take photo with camera (should work)
- [ ] Select from library (should work)

### Automated Testing

```typescript
import { validateImage, MAX_FILE_SIZE } from '../utils/imageUpload';

describe('Image Validation', () => {
  it('accepts valid JPEG', async () => {
    await expect(validateImage('file:///valid.jpg')).resolves.toBeUndefined();
  });

  it('rejects unsupported format', async () => {
    await expect(validateImage('file:///invalid.gif'))
      .rejects
      .toThrow('Unsupported file type');
  });

  it('rejects file over size limit', async () => {
    // Mock file larger than MAX_FILE_SIZE
    await expect(validateImage('file:///huge.jpg'))
      .rejects
      .toThrow('too large');
  });
});
```

## Configuration

To adjust validation rules, update constants in `src/utils/imageUpload.ts`:

```typescript
// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MIN_FILE_SIZE = 100; // 100 bytes

// Allowed formats
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'
];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/heic', 'image/heif'
];

// Dimension constraints
export const MAX_DIMENSION = 4096; // 4K
export const MIN_DIMENSION = 50; // 50px
```

## Future Enhancements

Potential improvements to consider:

- [ ] **Image dimension validation** - Check actual pixel dimensions
- [ ] **Aspect ratio validation** - Ensure images aren't too wide/tall
- [ ] **Face detection** - For avatar uploads, verify face is present
- [ ] **Content filtering** - Check for inappropriate content
- [ ] **Duplicate detection** - Prevent uploading same image twice
- [ ] **Automatic optimization** - Suggest optimal size/format
- [ ] **Progressive upload** - Show upload progress
- [ ] **Retry logic** - Auto-retry failed uploads

## Related Files

- `src/utils/imageUpload.ts` - Core validation logic
- `src/utils/errorHandling.ts` - Error formatting
- `src/screens/scanner/SubmissionScreen.tsx` - Food photo validation
- `src/screens/profile/ProfileScreen.tsx` - Avatar validation
- `ERROR_HANDLING.md` - General error handling docs

## Support

If users report validation issues:

1. **Check error logs** - ValidationErrors are logged with technical details
2. **Verify image properties** - File size, format, dimensions
3. **Test with same image** - Reproduce the issue
4. **Check constants** - Ensure validation rules are correct
5. **Update if needed** - Adjust MAX_FILE_SIZE or formats if necessary

For questions or issues, contact the development team.
