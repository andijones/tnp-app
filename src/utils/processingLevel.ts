// Processing level utilities
// Maps NOVA groups to user-friendly processing levels

export type ProcessingLevelType = 'wholeFood' | 'extractedFoods' | 'lightlyProcessed' | 'processed';

export interface ProcessingLevelInfo {
  type: ProcessingLevelType;
  label: string;
  shortLabel: string;
  description: string;
  position: number; // 0-100 for progress bar
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
      };
    case 2:
      return {
        type: 'extractedFoods',
        label: 'Extracted Foods',
        shortLabel: 'Extracted',
        description: 'Single ingredient',
        position: 35, // 35% on scale
      };
    case 3:
      return {
        type: 'lightlyProcessed',
        label: 'Lightly Processed',
        shortLabel: 'Lightly',
        description: 'Few added ingredients',
        position: 65, // 65% on scale
      };
    case 4:
      return {
        type: 'processed',
        label: 'Processed',
        shortLabel: 'Processed',
        description: 'Multiple added ingredients',
        position: 90, // 90% on scale
      };
    default:
      return {
        type: 'wholeFood',
        label: 'Unknown',
        shortLabel: '?',
        description: 'Processing level not available',
        position: 50,
      };
  }
};
