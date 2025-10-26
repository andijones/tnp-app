# Error Handling System

The Naked Pantry uses a comprehensive, centralized error handling system to provide clear, actionable error messages to users.

## Overview

The error handling system is built around:
- **Centralized error parsing** in `src/utils/errorHandling.ts`
- **User-friendly messages** instead of technical jargon
- **Suggested actions** to help users resolve issues
- **Consistent error formatting** across the app

## Architecture

### Error Types

```typescript
enum ErrorType {
  NETWORK      // Connection/fetch errors
  AUTH         // Authentication errors
  VALIDATION   // Invalid user input
  PERMISSION   // Access denied errors
  NOT_FOUND    // Resource doesn't exist
  SERVER       // Server-side errors (5xx)
  DATABASE     // Database/constraint errors
  UPLOAD       // File upload errors
  RATE_LIMIT   // Too many requests
  UNKNOWN      // Fallback for unexpected errors
}
```

### AppError Class

Custom error class with user-friendly messaging:

```typescript
class AppError extends Error {
  type: ErrorType;              // Category of error
  userMessage: string;          // Simple title shown to user
  technicalMessage: string;     // Detailed description
  suggestedAction?: string;     // How to fix it
}
```

## Usage

### Basic Error Handling

```typescript
import { formatErrorForDisplay } from '../utils/errorHandling';

try {
  await someAsyncOperation();
} catch (error) {
  const formattedError = formatErrorForDisplay(error);
  Alert.alert(
    formattedError.title,    // "Connection problem"
    formattedError.message,  // "Unable to connect to the server..."
  );
}
```

### With Suggested Action

```typescript
const formattedError = formatErrorForDisplay(error);
Alert.alert(
  formattedError.title,
  formattedError.message +
    (formattedError.actionText ? `\n\n${formattedError.actionText}` : '')
);
```

## Error Parsing

### Supabase Errors

The system automatically parses Supabase errors into user-friendly messages:

| Supabase Error | User sees |
|----------------|-----------|
| "invalid login credentials" | **Incorrect email or password**<br>"The email or password you entered is incorrect."<br>*"Please double-check your credentials and try again."* |
| "email not confirmed" | **Email not verified**<br>"Please verify your email address before signing in."<br>*"Check your inbox for a verification email."* |
| "user already registered" | **Account already exists**<br>"An account with this email already exists."<br>*"Try signing in instead, or use a different email."* |
| "jwt expired" | **Session expired**<br>"Your session has expired. Please sign in again."<br>*"Sign in again to continue using the app."* |
| 403 status | **Permission denied**<br>"You don't have permission to perform this action."<br>*"Make sure you're signed in with the correct account."* |
| 404 status | **Item not found**<br>"The item you're looking for doesn't exist or has been removed."<br>*"Go back and try selecting a different item."* |
| 429 status | **Too many requests**<br>"You're making requests too quickly. Please slow down."<br>*"Wait a moment before trying again."* |
| 5xx status | **Server error**<br>"Our servers are experiencing issues. This is not your fault."<br>*"Please try again in a few moments."* |

### Upload Errors

Specialized parsing for image/file uploads:

```typescript
import { parseUploadError } from '../utils/errorHandling';

try {
  await uploadImage(file);
} catch (error) {
  const formattedError = parseUploadError(error);
  Alert.alert(formattedError.title, formattedError.message);
}
```

| Upload Error | User sees |
|--------------|-----------|
| "file too large" | **File too large**<br>"The image you selected is too large."<br>*"Please choose a smaller image (under 5MB)."* |
| "invalid file type" | **Invalid file type**<br>"This file type is not supported."<br>*"Please select a JPG, PNG, or HEIC image."* |
| "storage" | **Storage error**<br>"There was a problem saving your image."<br>*"Please try again. If the problem persists, contact support."* |

### Permission Errors

Helper for camera/photo/location permissions:

```typescript
import { parsePermissionError } from '../utils/errorHandling';

const error = parsePermissionError('camera');
Alert.alert(error.userMessage, error.technicalMessage);

// Shows:
// Title: "Camera access required"
// Message: "This feature requires access to your camera."
// Action: "Please go to Settings > The Naked Pantry and enable Camera access."
```

## Validation Errors

Pre-built validation error helpers:

```typescript
import { ValidationErrors } from '../utils/errorHandling';

// Email validation
if (!isValidEmail(email)) {
  throw ValidationErrors.email(email);
}

// Password validation
if (password.length < 6) {
  throw ValidationErrors.password('too_short');
}

// Required field
if (!name) {
  throw ValidationErrors.required('Name');
}

// Length constraints
if (text.length > 500) {
  throw ValidationErrors.tooLong('Description', 500);
}

// URL validation
if (!isValidUrl(url)) {
  throw ValidationErrors.invalidUrl();
}

// Image required
if (images.length === 0) {
  throw ValidationErrors.noImage();
}
```

## Integration Examples

### Authentication (AuthScreen)

```typescript
const handleAuth = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email, password
    });

    if (error) {
      const formattedError = formatErrorForDisplay(error);
      Alert.alert(formattedError.title, formattedError.message);
      return;
    }
  } catch (error) {
    const formattedError = formatErrorForDisplay(error);
    Alert.alert(formattedError.title, formattedError.message);
  }
};
```

### Food Submission (SubmissionScreen)

```typescript
const handleSubmit = async () => {
  try {
    // Validation
    if (!suggestion.trim() && selectedImages.length === 0) {
      throw ValidationErrors.required('Text or image');
    }

    // Upload images
    for (const image of images) {
      try {
        await uploadImage(image);
      } catch (uploadError) {
        throw parseUploadError(uploadError);
      }
    }

    // Submit to database
    const { error } = await supabase.from('foods').insert(data);
    if (error) throw error;

    Alert.alert('Success', 'Food submitted successfully!');
  } catch (error) {
    const formattedError = formatErrorForDisplay(error);
    Alert.alert(formattedError.title, formattedError.message);
  }
};
```

## Best Practices

### ✅ DO:

- **Use formatErrorForDisplay()** for all error messages
- **Catch errors at the operation level** where you have context
- **Log technical details** using logger.error() for debugging
- **Show suggested actions** when possible
- **Be specific** about what went wrong and how to fix it

### ❌ DON'T:

- **Don't show raw error messages** like "Cannot read property 'foo' of undefined"
- **Don't use generic "An error occurred"** without context
- **Don't show technical stack traces** to users
- **Don't skip error handling** - always catch and handle errors
- **Don't forget to log** the technical error for debugging

## Error Message Guidelines

### User Message (Title)
- **Short and clear** (2-4 words)
- **No jargon** or technical terms
- **Describe the problem**, not the cause

Examples:
- ✅ "Connection problem"
- ✅ "Incorrect password"
- ✅ "File too large"
- ❌ "Network request failed"
- ❌ "Authentication error"
- ❌ "ECONNREFUSED"

### Technical Message (Body)
- **Plain language** explanation
- **What happened** from user's perspective
- **Avoid blame** ("you entered" → "the password entered")

Examples:
- ✅ "Unable to connect to the server. Please check your internet connection."
- ✅ "The password you entered is incorrect."
- ✅ "The image you selected is too large."
- ❌ "fetch() returned 503"
- ❌ "Invalid credentials provided"
- ❌ "File size exceeds maximum allowed bytes"

### Suggested Action (Optional)
- **Specific steps** to resolve
- **Actionable** and achievable
- **Helpful** without being condescending

Examples:
- ✅ "Try again when you have a stable internet connection."
- ✅ "Please double-check your password and try again."
- ✅ "Please choose a smaller image (under 5MB)."
- ❌ "Fix your network"
- ❌ "Enter valid data"
- ❌ "RTFM"

## Testing

When testing error handling:

1. **Network errors**: Turn off wifi/data
2. **Auth errors**: Use wrong credentials
3. **Validation errors**: Leave fields empty, use invalid formats
4. **Permission errors**: Deny camera/photos access
5. **Upload errors**: Try uploading very large files
6. **Rate limiting**: Make rapid repeated requests

## Future Improvements

- Add error tracking service (Sentry, Bugsnag)
- Implement retry logic for transient failures
- Add offline queue for failed operations
- Show network status indicator
- Add error recovery suggestions UI

## Related Files

- `src/utils/errorHandling.ts` - Main error handling utilities
- `src/utils/logger.ts` - Logging utilities
- `src/utils/imageUpload.ts` - Image-specific error handling
- `src/screens/auth/AuthScreen.tsx` - Auth error handling example
- `src/screens/scanner/SubmissionScreen.tsx` - Submission error handling example
