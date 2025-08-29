export const theme = {
    colors: {
      // Primary colors for The Naked Pantry
      primary: '#4CAF50',      // Green for healthy foods
      secondary: '#FF9800',     // Orange for warnings/seed oils
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      border: '#E0E0E0',  // Add this line
      
      // Neutral colors
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: {
        primary: '#212121',
        secondary: '#757575',
        hint: '#BDBDBD',
      },
      
      // NOVA classification colors
      nova: {
        group1: '#4CAF50',  // Unprocessed - Green
        group2: '#8BC34A',  // Processed culinary - Light Green  
        group3: '#FF9800',  // Processed foods - Orange
        group4: '#F44336',  // Ultra-processed - Red
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
      sm: 4,
      md: 8,
      lg: 16,
      full: 9999,
    },
    
    typography: {
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      },
      // Fixed fontWeight - using proper React Native values
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