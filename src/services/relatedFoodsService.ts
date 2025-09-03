// src/services/relatedFoodsService.ts

import { supabase } from './supabase/config';
import { Food, Aisle } from '../types';

interface RelatedFood extends Food {
  aisles: Aisle[];
}

class RelatedFoodsService {
  private readonly MAX_ITEMS = 4;
  private cache: Map<string, RelatedFood[]> = new Map();
  private cacheTimestamps: Map<string, Date> = new Map();
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  /**
   * Get related foods using 3-tier priority algorithm
   */
  async getRelatedFoods(currentFood: Food): Promise<RelatedFood[]> {
    // Early exit if no category and no aisle data
    if (!currentFood.category && !currentFood.aisle_id && !currentFood.aisle) {
      return [];
    }

    // Check cache first
    const cached = this.getCachedRelatedFoods(currentFood.id);
    if (cached) {
      return cached;
    }

    try {
      const categoryTags = this.extractCategoryTags(currentFood.category);
      const aisleIds = await this.getAisleIds(currentFood);

      const relatedFoods: RelatedFood[] = [];
      const seenFoodIds = new Set<string>([currentFood.id]);

      // Tier 1: Foods with BOTH same category tags AND same aisles
      if (categoryTags.length > 0 && aisleIds.length > 0) {
        const tier1Foods = await this.fetchTier1Foods(currentFood.id, categoryTags, aisleIds);
        this.addUniqueFood(relatedFoods, tier1Foods, seenFoodIds);
      }

      // Tier 2: Foods in same aisles only (if we need more)
      if (relatedFoods.length < this.MAX_ITEMS && aisleIds.length > 0) {
        const tier2Foods = await this.fetchTier2Foods(currentFood.id, aisleIds);
        this.addUniqueFood(relatedFoods, tier2Foods, seenFoodIds);
      }

      // Tier 3: Foods with same category tags only (if we still need more)
      if (relatedFoods.length < this.MAX_ITEMS && categoryTags.length > 0) {
        const tier3Foods = await this.fetchTier3Foods(currentFood.id, categoryTags);
        this.addUniqueFood(relatedFoods, tier3Foods, seenFoodIds);
      }

      // Limit to MAX_ITEMS
      const result = relatedFoods.slice(0, this.MAX_ITEMS);
      
      // Cache the result
      this.cacheRelatedFoods(currentFood.id, result);
      
      return result;

    } catch (error) {
      console.error('Error fetching related foods:', error);
      return [];
    }
  }

  /**
   * Tier 1: Foods with BOTH same category tags AND same aisles
   */
  private async fetchTier1Foods(currentFoodId: string, categoryTags: string[], aisleIds: string[]): Promise<RelatedFood[]> {
    // Build category filter condition
    const categoryFilter = categoryTags.map(tag => `category.ilike.%${tag.trim()}%`);
    
    const { data, error } = await supabase
      .from('foods')
      .select(`
        *,
        food_item_aisles!inner(
          aisle_id,
          aisles!inner(
            id,
            name,
            slug
          )
        )
      `)
      .eq('status', 'approved')
      .neq('id', currentFoodId)
      .in('food_item_aisles.aisle_id', aisleIds)
      .or(categoryFilter.join(','))
      .limit(this.MAX_ITEMS * 2);

    if (error) {
      console.error('Error in Tier 1 query:', error);
      return [];
    }

    return this.transformToRelatedFoods(data || []);
  }

  /**
   * Tier 2: Foods in same aisles only
   */
  private async fetchTier2Foods(currentFoodId: string, aisleIds: string[]): Promise<RelatedFood[]> {
    const { data, error } = await supabase
      .from('foods')
      .select(`
        *,
        food_item_aisles!inner(
          aisle_id,
          aisles!inner(
            id,
            name,
            slug
          )
        )
      `)
      .eq('status', 'approved')
      .neq('id', currentFoodId)
      .in('food_item_aisles.aisle_id', aisleIds)
      .limit(this.MAX_ITEMS * 2); // Get more than needed for deduplication

    if (error) {
      console.error('Error in Tier 2 query:', error);
      return [];
    }

    return this.transformToRelatedFoods(data || []);
  }

  /**
   * Tier 3: Foods with same category tags only
   */
  private async fetchTier3Foods(currentFoodId: string, categoryTags: string[]): Promise<RelatedFood[]> {
    // Build the category filter condition
    const categoryFilter = categoryTags.map(tag => `category.ilike.%${tag.trim()}%`);
    
    const { data, error } = await supabase
      .from('foods')
      .select(`
        *,
        food_item_aisles(
          aisle_id,
          aisles(
            id,
            name,
            slug
          )
        )
      `)
      .eq('status', 'approved')
      .neq('id', currentFoodId)
      .or(categoryFilter.join(','))
      .limit(this.MAX_ITEMS * 2);

    if (error) {
      console.error('Error in Tier 3 query:', error);
      return [];
    }

    return this.transformToRelatedFoods(data || []);
  }

  /**
   * Extract category tags from comma-separated string
   */
  private extractCategoryTags(category?: string): string[] {
    if (!category) return [];
    return category.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  /**
   * Get aisle IDs from current food
   */
  private async getAisleIds(currentFood: Food): Promise<string[]> {
    const aisleIds: string[] = [];

    // If we have aisle_id directly
    if (currentFood.aisle_id) {
      aisleIds.push(currentFood.aisle_id);
    }

    // If we have aisle object
    if (currentFood.aisle?.id) {
      aisleIds.push(currentFood.aisle.id);
    }

    // Fetch from food_item_aisles table if we don't have direct aisle data
    if (aisleIds.length === 0) {
      try {
        const { data, error } = await supabase
          .from('food_item_aisles')
          .select('aisle_id')
          .eq('food_id', currentFood.id);

        if (!error && data) {
          aisleIds.push(...data.map(item => item.aisle_id));
        }
      } catch (error) {
        console.error('Error fetching aisle IDs:', error);
      }
    }

    return [...new Set(aisleIds)]; // Remove duplicates
  }

  /**
   * Transform raw data to RelatedFood objects
   */
  private transformToRelatedFoods(data: any[]): RelatedFood[] {
    return data.map(item => {
      // Handle different data structures from different queries
      let aisles: Aisle[] = [];

      if (item.food_item_aisles) {
        // From queries with food_item_aisles join
        if (Array.isArray(item.food_item_aisles)) {
          aisles = item.food_item_aisles
            .filter((fia: any) => fia.aisles)
            .map((fia: any) => fia.aisles);
        } else if (item.food_item_aisles.aisles) {
          aisles = [item.food_item_aisles.aisles];
        }
      }

      return {
        ...item,
        aisles,
        nutrition: item.nutrition_data || item.nutrition
      };
    });
  }

  /**
   * Add foods to result array, avoiding duplicates
   */
  private addUniqueFood(
    result: RelatedFood[], 
    newFoods: RelatedFood[], 
    seenIds: Set<string>
  ): void {
    for (const food of newFoods) {
      if (result.length >= this.MAX_ITEMS) break;
      if (!seenIds.has(food.id)) {
        result.push(food);
        seenIds.add(food.id);
      }
    }
  }

  /**
   * Cache management
   */
  private getCachedRelatedFoods(foodId: string): RelatedFood[] | null {
    const timestamp = this.cacheTimestamps.get(foodId);
    if (!timestamp || Date.now() - timestamp.getTime() > this.CACHE_EXPIRY) {
      return null;
    }
    return this.cache.get(foodId) || null;
  }

  private cacheRelatedFoods(foodId: string, foods: RelatedFood[]): void {
    this.cache.set(foodId, foods);
    this.cacheTimestamps.set(foodId, new Date());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

// Export singleton instance
export const relatedFoodsService = new RelatedFoodsService();
export type { RelatedFood };