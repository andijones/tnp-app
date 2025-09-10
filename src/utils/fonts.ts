import * as Font from 'expo-font';

export const loadFonts = async () => {
  console.log('Loading Bricolage Grotesque variable font...');
  
  try {
    await Font.loadAsync({
      'BricolageGrotesque': require('../../assets/fonts/BricolageGrotesque.ttf'),
    });
    console.log('✅ Bricolage Grotesque variable font loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Bricolage Grotesque variable font:', error);
    throw error;
  }
};

export const fontFamilies = {
  light: 'BricolageGrotesque',
  regular: 'BricolageGrotesque', 
  medium: 'BricolageGrotesque',
  semibold: 'BricolageGrotesque',
  bold: 'BricolageGrotesque',
} as const;