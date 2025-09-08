import { fontFamilies } from '../utils/fonts';

export const theme = {
    colors: {
      // Primary brand color
      primary: '#02621C',      // Brand green
      
      // System colors - minimal set
      success: '#22c55e',      // Clean green for success states
      error: '#ef4444',        // Clean red for error states  
      warning: '#f59e0b',      // Clean orange for warning states
      
      // Neutral colors - simplified
      background: '#F7F6F0',   // Warm background
      surface: '#FFFFFF',      // Clean white for cards
      border: '#e5e5e5',       // Subtle borders
      divider: '#f3f4f6',      // Very light dividers
      
      // Text hierarchy - streamlined
      text: {
        primary: '#1f2937',    // Dark gray for primary text
        secondary: '#6b7280',  // Medium gray for secondary text
        tertiary: '#9ca3af',   // Light gray for tertiary text
        inverse: '#ffffff',    // White text on dark backgrounds
      },
      
      // NOVA classification colors - using system colors
      nova: {
        group1: '#22c55e',     // Unprocessed - Success green
        group2: '#84cc16',     // Processed culinary - Light green  
        group3: '#f59e0b',     // Processed foods - Warning orange
        group4: '#ef4444',     // Ultra-processed - Error red
      }
    },
    
    spacing: {
      xs: 4,
      sm: 8, 
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    borderRadius: {
      sm: 8,
      md: 8,
      lg: 8,
      full: 9999,
    },
    
    typography: {
      // Display text for hero sections and main headlines
      display: {
        fontSize: 32,
        fontFamily: fontFamilies.bold,
        lineHeight: 36,
        letterSpacing: -0.5,
      },
      
      // Title text for section headers
      title: {
        fontSize: 22,
        fontFamily: fontFamilies.bold,
        lineHeight: 26,
        letterSpacing: -0.3,
      },
      
      // Headline for card titles and important content
      headline: {
        fontSize: 18,
        fontFamily: fontFamilies.semibold,
        lineHeight: 22,
        letterSpacing: -0.2,
      },
      
      // Body text in multiple weights
      body: {
        fontSize: 16,
        fontFamily: fontFamilies.regular,
        lineHeight: 22,
        letterSpacing: 0,
      },
      bodyMedium: {
        fontSize: 16,
        fontFamily: fontFamilies.medium,
        lineHeight: 22,
        letterSpacing: 0,
      },
      bodySemibold: {
        fontSize: 16,
        fontFamily: fontFamilies.semibold,
        lineHeight: 22,
        letterSpacing: 0,
      },
      
      // Subtext for descriptions and secondary content  
      subtext: {
        fontSize: 14,
        fontFamily: fontFamilies.regular,
        lineHeight: 20,
        letterSpacing: 0,
      },
      subtextMedium: {
        fontSize: 14,
        fontFamily: fontFamilies.medium,
        lineHeight: 20,
        letterSpacing: 0,
      },
      
      // Caption for metadata and small labels
      caption: {
        fontSize: 12,
        fontFamily: fontFamilies.regular,
        lineHeight: 16,
        letterSpacing: 0,
      },
      captionMedium: {
        fontSize: 12,
        fontFamily: fontFamilies.medium,
        lineHeight: 16,
        letterSpacing: 0,
      },
      
      // Labels for UI elements
      label: {
        fontSize: 14,
        fontFamily: fontFamilies.semibold,
        lineHeight: 18,
        letterSpacing: 0.1,
      },
      
      // Legacy fontSize values for gradual migration
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      },
      fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
      },
    },
    
    shadows: {
      sm: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      md: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }
  };