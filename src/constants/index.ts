// src/constants/index.ts

// App Information
export const APP_INFO = {
    name: 'The Naked Pantry',
    version: '1.0.0',
    description: 'Discover healthy, non-ultra processed foods',
    website: 'https://thenakedpantry.com',
    supportEmail: 'support@thenakedpantry.com',
  };
  
  // API Configuration
  export const API_CONFIG = {
    supabaseUrl: 'https://uacihrlnwlqhpbobzajs.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2locmxud2xxaHBib2J6YWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTE2MjUsImV4cCI6MjA2MDEyNzYyNX0.NKoj5Olfg3sxPX0p3AT4POlxs4wmHa3XmcAIXEttxXU',
  };
  
  // Storage Buckets
  export const STORAGE_BUCKETS = {
    foodImages: 'food-images',
    avatars: 'avatars',
  };
  
  // Database Tables
  export const TABLES = {
    foods: 'foods',
    favorites: 'favorites',
    ratings: 'ratings',
    profiles: 'profiles',
    userRoles: 'user_roles',
    foodLinks: 'food_links',
    supermarkets: 'food_supermarkets',
    aisles: 'aisles',
    foodAisles: 'food_item_aisles',
  };
  
  // Food Status Options
  export const FOOD_STATUS = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
  } as const;
  
  // NOVA Classification
  export const NOVA_GROUPS = {
    1: {
      label: 'Unprocessed or minimally processed',
      description: 'Natural foods obtained directly from plants or animals',
      color: '#4CAF50',
      examples: ['Fresh fruits', 'Vegetables', 'Meat', 'Eggs', 'Milk'],
    },
    2: {
      label: 'Processed culinary ingredients',
      description: 'Substances derived from Group 1 foods or from nature',
      color: '#8BC34A',
      examples: ['Oils', 'Butter', 'Sugar', 'Salt', 'Vinegar'],
    },
    3: {
      label: 'Processed foods',
      description: 'Products made by adding Group 2 substances to Group 1 foods',
      color: '#FF9800',
      examples: ['Canned vegetables', 'Cheese', 'Fresh bread', 'Smoked meats'],
    },
    4: {
      label: 'Ultra-processed foods',
      description: 'Industrial formulations with 5 or more ingredients',
      color: '#F44336',
      examples: ['Soft drinks', 'Packaged snacks', 'Instant soups', 'Fast food'],
    },
  } as const;
  
  // User Roles
  export const USER_ROLES = {
    user: 'user',
    admin: 'admin',
    moderator: 'moderator',
  } as const;
  
  // Validation Rules
  export const VALIDATION = {
    email: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
    },
    password: {
      required: 'Password is required',
      minLength: 'Password must be at least 6 characters',
      weak: 'Password should contain uppercase, lowercase, and numbers',
    },
    name: {
      required: 'Name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 50 characters',
    },
    foodName: {
      required: 'Food name is required',
      minLength: 'Food name must be at least 2 characters',
      maxLength: 'Food name cannot exceed 100 characters',
    },
    ingredients: {
      required: 'Ingredients are required',
      minLength: 'Please provide more detailed ingredients',
    },
    url: {
      required: 'URL is required',
      invalid: 'Please enter a valid URL',
    },
  };
  
  // Error Messages
  export const ERROR_MESSAGES = {
    network: 'Network error. Please check your connection.',
    unauthorized: 'Please log in to continue.',
    forbidden: 'You don\'t have permission to perform this action.',
    notFound: 'The requested item was not found.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    camera: 'Camera access is required to scan ingredients.',
    storage: 'Storage access is required to save photos.',
  };
  
  // Success Messages
  export const SUCCESS_MESSAGES = {
    foodSubmitted: 'Food submitted successfully! It will be reviewed soon.',
    favoriteAdded: 'Added to your favorites!',
    favoriteRemoved: 'Removed from favorites.',
    profileUpdated: 'Profile updated successfully.',
    passwordChanged: 'Password changed successfully.',
    accountCreated: 'Account created successfully! Welcome to The Naked Pantry.',
  };