// Processing level utilities
// Maps NOVA groups to user-friendly processing levels

export type ProcessingLevelType = 'wholeFood' | 'extractedFoods' | 'lightlyProcessed' | 'processed';

export interface ProcessingLevelInfo {
  type: ProcessingLevelType;
  label: string;
  shortLabel: string;
  description: string;
  position: number; // 0-100 for progress bar
  color: string;
  lightBg: string;
  icon: string;
}

/**
 * Convert NOVA group (1-4) to user-friendly processing level
 */
export const getProcessingLevel = (novaGroup?: number): ProcessingLevelInfo => {
  switch (novaGroup) {
    case 1:
      return {
        type: 'wholeFood',
        label: 'Whole Food',
        shortLabel: 'Whole',
        description: 'Natural and unprocessed',
        position: 10, // 10% on scale
        color: '#22c55e',
        lightBg: '#E8F5E8',
        icon: 'leaf',
      };
    case 2:
      return {
        type: 'extractedFoods',
        label: 'Extracted Foods',
        shortLabel: 'Extracted',
        description: 'Single ingredient like oil or butter',
        position: 35, // 35% on scale
        color: '#84cc16',
        lightBg: '#F0F8E8',
        icon: 'restaurant',
      };
    case 3:
      return {
        type: 'lightlyProcessed',
        label: 'Lightly Processed',
        shortLabel: 'Lightly',
        description: 'Few added ingredients',
        position: 65, // 65% on scale
        color: '#f59e0b',
        lightBg: '#FFF4E6',
        icon: 'warning-outline',
      };
    case 4:
      return {
        type: 'processed',
        label: 'Processed',
        shortLabel: 'Processed',
        description: 'Multiple added ingredients',
        position: 90, // 90% on scale
        color: '#ff6b35',
        lightBg: '#FFE6E6',
        icon: 'alert-circle-outline',
      };
    default:
      return {
        type: 'wholeFood',
        label: 'Unknown',
        shortLabel: '?',
        description: 'Processing level not available',
        position: 50,
        color: '#6b7280',
        lightBg: '#f3f4f6',
        icon: 'help-circle-outline',
      };
  }
};
