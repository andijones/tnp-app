import { logger } from './logger';

/**
 * Error types for different categories of errors
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  UPLOAD = 'UPLOAD',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class with user-friendly messages
 */
export class AppError extends Error {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  suggestedAction?: string;

  constructor(
    type: ErrorType,
    userMessage: string,
    technicalMessage: string,
    suggestedAction?: string
  ) {
    super(technicalMessage);
    this.type = type;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.suggestedAction = suggestedAction;
    this.name = 'AppError';
  }
}

/**
 * Parse Supabase errors into user-friendly messages
 */
export function parseSupabaseError(error: any): AppError {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status;

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
    return new AppError(
      ErrorType.NETWORK,
      'Connection problem',
      'Unable to connect to the server. Please check your internet connection.',
      'Try again when you have a stable internet connection.'
    );
  }

  // Authentication errors
  if (errorMessage.includes('invalid login credentials')) {
    return new AppError(
      ErrorType.AUTH,
      'Incorrect email or password',
      'The email or password you entered is incorrect.',
      'Please double-check your credentials and try again.'
    );
  }

  if (errorMessage.includes('email not confirmed')) {
    return new AppError(
      ErrorType.AUTH,
      'Email not verified',
      'Please verify your email address before signing in.',
      'Check your inbox for a verification email from The Naked Pantry.'
    );
  }

  if (errorMessage.includes('user already registered')) {
    return new AppError(
      ErrorType.AUTH,
      'Account already exists',
      'An account with this email already exists.',
      'Try signing in instead, or use a different email address.'
    );
  }

  if (errorMessage.includes('invalid refresh token') || errorMessage.includes('jwt expired')) {
    return new AppError(
      ErrorType.AUTH,
      'Session expired',
      'Your session has expired. Please sign in again.',
      'Sign in again to continue using the app.'
    );
  }

  if (errorMessage.includes('email rate limit exceeded')) {
    return new AppError(
      ErrorType.RATE_LIMIT,
      'Too many attempts',
      'You\'ve made too many requests. Please wait a moment.',
      'Try again in a few minutes.'
    );
  }

  // Permission errors
  if (errorCode === 403 || errorMessage.includes('permission denied')) {
    return new AppError(
      ErrorType.PERMISSION,
      'Permission denied',
      'You don\'t have permission to perform this action.',
      'Make sure you\'re signed in with the correct account.'
    );
  }

  // Not found errors
  if (errorCode === 404 || errorMessage.includes('not found')) {
    return new AppError(
      ErrorType.NOT_FOUND,
      'Item not found',
      'The item you\'re looking for doesn\'t exist or has been removed.',
      'Go back and try selecting a different item.'
    );
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('violates')) {
    return new AppError(
      ErrorType.VALIDATION,
      'Invalid information',
      'Some of the information you entered is invalid.',
      'Please check your input and try again.'
    );
  }

  // Rate limiting
  if (errorCode === 429) {
    return new AppError(
      ErrorType.RATE_LIMIT,
      'Too many requests',
      'You\'re making requests too quickly. Please slow down.',
      'Wait a moment before trying again.'
    );
  }

  // Server errors
  if (errorCode >= 500 && errorCode < 600) {
    return new AppError(
      ErrorType.SERVER,
      'Server error',
      'Our servers are experiencing issues. This is not your fault.',
      'Please try again in a few moments.'
    );
  }

  // Database errors
  if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
    return new AppError(
      ErrorType.DATABASE,
      'Item already exists',
      'This item already exists in the database.',
      'Try updating the existing item instead.'
    );
  }

  // Default unknown error
  return new AppError(
    ErrorType.UNKNOWN,
    'Something went wrong',
    error?.message || 'An unexpected error occurred.',
    'Please try again. If the problem persists, contact support.'
  );
}

/**
 * Parse upload errors into user-friendly messages
 */
export function parseUploadError(error: any): AppError {
  const errorMessage = error?.message?.toLowerCase() || '';

  if (errorMessage.includes('file too large') || errorMessage.includes('size')) {
    return new AppError(
      ErrorType.UPLOAD,
      'File too large',
      'The image you selected is too large.',
      'Please choose a smaller image (under 5MB).'
    );
  }

  if (errorMessage.includes('invalid file type') || errorMessage.includes('format')) {
    return new AppError(
      ErrorType.UPLOAD,
      'Invalid file type',
      'This file type is not supported.',
      'Please select a JPG, PNG, or HEIC image.'
    );
  }

  if (errorMessage.includes('storage')) {
    return new AppError(
      ErrorType.UPLOAD,
      'Storage error',
      'There was a problem saving your image.',
      'Please try again. If the problem persists, contact support.'
    );
  }

  return new AppError(
    ErrorType.UPLOAD,
    'Upload failed',
    'Unable to upload the image.',
    'Please try selecting a different image.'
  );
}

/**
 * Parse camera/permission errors
 */
export function parsePermissionError(permissionType: 'camera' | 'photos' | 'location'): AppError {
  const permissionLabels = {
    camera: 'Camera',
    photos: 'Photo Library',
    location: 'Location',
  };

  const label = permissionLabels[permissionType];

  return new AppError(
    ErrorType.PERMISSION,
    `${label} access required`,
    `This feature requires access to your ${label.toLowerCase()}.`,
    `Please go to Settings > The Naked Pantry and enable ${label} access.`
  );
}

/**
 * Format error for display to user
 */
export interface FormattedError {
  title: string;
  message: string;
  actionText?: string;
}

export function formatErrorForDisplay(error: any): FormattedError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error?.message?.includes('supabase') || error?.code) {
    appError = parseSupabaseError(error);
  } else {
    appError = new AppError(
      ErrorType.UNKNOWN,
      'Something went wrong',
      error?.message || 'An unexpected error occurred.',
      'Please try again.'
    );
  }

  // Log technical details for debugging
  logger.error(`[${appError.type}] ${appError.technicalMessage}`, error);

  return {
    title: appError.userMessage,
    message: appError.technicalMessage,
    actionText: appError.suggestedAction,
  };
}

/**
 * Create a validation error
 */
export function createValidationError(field: string, issue: string): AppError {
  return new AppError(
    ErrorType.VALIDATION,
    `Invalid ${field}`,
    issue,
    `Please check your ${field} and try again.`
  );
}

/**
 * Common validation errors
 */
export const ValidationErrors = {
  email: (email?: string) =>
    createValidationError(
      'email',
      email ? `"${email}" is not a valid email address.` : 'Please enter a valid email address.'
    ),

  password: (reason?: 'too_short' | 'too_weak') => {
    if (reason === 'too_short') {
      return createValidationError('password', 'Password must be at least 6 characters long.');
    }
    if (reason === 'too_weak') {
      return createValidationError(
        'password',
        'Password should include uppercase, lowercase, and numbers for better security.'
      );
    }
    return createValidationError('password', 'Please enter a valid password.');
  },

  required: (fieldName: string) =>
    createValidationError(fieldName, `${fieldName} is required.`),

  tooLong: (fieldName: string, maxLength: number) =>
    createValidationError(
      fieldName,
      `${fieldName} cannot be longer than ${maxLength} characters.`
    ),

  tooShort: (fieldName: string, minLength: number) =>
    createValidationError(
      fieldName,
      `${fieldName} must be at least ${minLength} characters.`
    ),

  invalidUrl: () =>
    createValidationError('URL', 'Please enter a valid URL (e.g., https://example.com)'),

  noImage: () =>
    new AppError(
      ErrorType.VALIDATION,
      'Image required',
      'Please add at least one image of the food product.',
      'Take a photo or select one from your library.'
    ),
};
