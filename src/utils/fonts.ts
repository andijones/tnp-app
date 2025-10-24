import * as Font from 'expo-font';
import { logger } from './logger';

export const loadFonts = async () => {
  logger.log('Using system fonts - no custom font loading needed');
  // System fonts are used, no custom font loading required
};

export const fontFamilies = {
  light: 'System',
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;