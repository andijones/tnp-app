import { Food, Supermarket } from '../types';
import { ProcessingLevelType, getProcessingLevel } from './processingLevel';

export interface FilterState {
  processingLevels: ProcessingLevelType[];
  supermarketIds: string[];
}

/**
 * Apply filters to food list
 * Returns filtered array based on active filters
 */
export const applyFilters = (
  foods: Food[],
  filters: FilterState,
  searchQuery?: string
): Food[] => {
  let filtered = [...foods];

  // Apply search filter first
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      food =>
        food.name.toLowerCase().includes(query) ||
        food.description?.toLowerCase().includes(query)
    );
  }

  // Apply processing level filter
  if (filters.processingLevels.length > 0) {
    filtered = filtered.filter(food => {
      if (!food.nova_group) return false;
      const level = getProcessingLevel(food.nova_group);
      return filters.processingLevels.includes(level.type);
    });
  }

  // Apply supermarket filter (using string array from food_supermarkets)
  if (filters.supermarketIds.length > 0) {
    filtered = filtered.filter(food => {
      // Check both legacy field and new supermarkets array
      const legacyMatch = food.supermarket && filters.supermarketIds.includes(food.supermarket);
      const newMatch = food.supermarkets && food.supermarkets.some(
        (supermarket: string) => filters.supermarketIds.includes(supermarket)
      );

      return legacyMatch || newMatch;
    });
  }

  return filtered;
};

/**
 * Extract unique supermarkets from food list
 * Returns array of supermarket names as strings
 */
export const getUniqueSupermarkets = (foods: Food[]): string[] => {
  const supermarketSet = new Set<string>();

  foods.forEach(food => {
    // Check legacy field
    if (food.supermarket) {
      supermarketSet.add(food.supermarket);
    }

    // Check new supermarkets array (array of strings)
    if (food.supermarkets && Array.isArray(food.supermarkets)) {
      food.supermarkets.forEach((supermarket: any) => {
        if (typeof supermarket === 'string') {
          supermarketSet.add(supermarket);
        }
      });
    }
  });

  return Array.from(supermarketSet).sort();
};

/**
 * Count foods matching each filter option
 * Useful for showing counts in filter UI
 */
export const getFilterCounts = (foods: Food[]) => {
  const processingCounts: Record<ProcessingLevelType, number> = {
    wholeFood: 0,
    extractedFoods: 0,
    lightlyProcessed: 0,
    processed: 0,
  };

  const supermarketCounts: Record<string, number> = {};

  foods.forEach(food => {
    // Count processing levels
    if (food.nova_group) {
      const level = getProcessingLevel(food.nova_group);
      processingCounts[level.type]++;
    }

    // Count supermarkets (using food_supermarkets relationship)
    if (food.supermarkets && food.supermarkets.length > 0) {
      food.supermarkets.forEach(fs => {
        if (fs.available && fs.supermarket) {
          const id = fs.supermarket.id;
          supermarketCounts[id] = (supermarketCounts[id] || 0) + 1;
        }
      });
    }
  });

  return {
    processingCounts,
    supermarketCounts,
  };
};
