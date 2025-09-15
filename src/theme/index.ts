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
      
      // Neutral color palette
      neutral: {
        white: '#FFFFFF',
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#E5E5E5',
        300: '#D4D4D4',
        400: '#A3A3A3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0A0A0A',
        BG: '#F7F6F0',
        BG2: '#EBEAE4',
      },
      
      // Green color palette
      green: {
        25: '#F9FFFA',
        50: '#E0FFE7', 
        100: '#C1FFD0',
        200: '#A3F6B8',
        300: '#84EDA0',
        400: '#65E488',
        500: '#44DB6D',
        600: '#3CC161',
        700: '#35A756',
        800: '#2D8D4A',
        900: '#26733E',
        950: '#1F5932',
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
        lineHeight: Math.round(32 * 1.19712), // 38.31px rounded to 38
        letterSpacing: -0.96,
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
        fontSize: 20, // 15px Figma size × 1.33
        fontFamily: 'System',
        fontWeight: '400' as const,
        lineHeight: 28, // 21px Figma × 1.33 = 28px (140%)
        letterSpacing: -0.2, // -0.15px Figma × 1.33
      },
      bodyMedium: {
        fontSize: 20, // 15px Figma size × 1.33
        fontFamily: 'System',
        fontWeight: '400' as const,
        lineHeight: 28, // 21px Figma × 1.33 = 28px (140%)
        letterSpacing: -0.2, // -0.15px Figma × 1.33
      },
      bodySemibold: {
        fontSize: 20, // 15px Figma size × 1.33
        fontFamily: 'System',
        fontWeight: '400' as const,
        lineHeight: 28, // 21px Figma × 1.33 = 28px (140%)
        letterSpacing: -0.2, // -0.15px Figma × 1.33
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
      
      // Card title style
      cardTitle: {
        fontSize: 19,
        fontFamily: 'System',
        fontWeight: 'bold' as const,
        lineHeight: Math.round(19 * 1.19712), // 22.75px rounded to 23
        letterSpacing: -0.57,
      },
      
      // Card meta style
      cardMeta: {
        fontSize: 14,
        fontFamily: 'System',
        fontWeight: '500',
        lineHeight: 16,
        letterSpacing: -0.3,
      },
      
      // Label style (updated)
      labelNew: {
        fontSize: 12,
        fontFamily: fontFamilies.semibold,
        lineHeight: 12, // normal line-height
        letterSpacing: 0,
      },
      
      // Heading style
      heading: {
        fontSize: 30,
        fontFamily: 'System',
        fontWeight: 'bold' as const,
        lineHeight: Math.round(30 * 1.19712), // 35.91px rounded to 36
        letterSpacing: -0.90,
      },
      
      // Body style
      bodyNew: {
        fontSize: 20, // 15px Figma size × 1.33
        fontFamily: 'System',
        fontWeight: '400' as const,
        lineHeight: 28, // 21px Figma × 1.33 = 28px (140%)
        letterSpacing: -0.2, // -0.15px Figma × 1.33
      },
      
      // Subtitle style
      subtitle: {
        fontSize: 21, // 16px Figma size × 1.33
        fontFamily: fontFamilies.semibold,
        fontWeight: '600' as const, // semibold
        lineHeight: Math.round(21 * 1.19712), // 25.13px rounded to 25
        letterSpacing: -0.63, // -0.48 × 1.31
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