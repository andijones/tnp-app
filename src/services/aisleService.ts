// src/services/aisleService.ts

import { supabase } from './supabase/config';
import { Aisle, FoodItemAisle, AisleLevel } from '../types/aisle';
import { Food } from '../types';

class AisleService {
  private aisleCache: Map<string, Food[]> = new Map();
  private cacheTimestamps: Map<string, Date> = new Map();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Fetch all aisles and build hierarchy
  async fetchAisles(): Promise<Aisle[]> {
    try {
      const { data, error } = await supabase
        .from('aisles')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching aisles:', error);
        throw error;
      }

      return this.buildHierarchy(data || []);
    } catch (error) {
      console.error('Error in fetchAisles:', error);
      throw error;
    }
  }

  // Build hierarchical structure from flat array
  private buildHierarchy(flatAisles: Aisle[]): Aisle[] {
    const aisleMap: Map<string, Aisle> = new Map();
    const rootAisles: Aisle[] = [];

    // Create map of all aisles
    flatAisles.forEach(aisle => {
      aisleMap.set(aisle.id, { ...aisle, children: [] });
    });

    // Build hierarchy
    flatAisles.forEach(aisle => {
      const aisleWithChildren = aisleMap.get(aisle.id)!;
      
      if (aisle.parent_id) {
        const parent = aisleMap.get(aisle.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(aisleWithChildren);
        }
      } else {
        rootAisles.push(aisleWithChildren);
      }
    });

    // Sort children by name
    const sortAisles = (aisles: Aisle[]) => {
      aisles.sort((a, b) => a.name.localeCompare(b.name));
      aisles.forEach(aisle => {
        if (aisle.children) {
          sortAisles(aisle.children);
        }
      });
    };

    sortAisles(rootAisles);
    return rootAisles;
  }

  // Get aisle by slug
  async getAisleBySlug(slug: string): Promise<Aisle | null> {
    try {
      const { data, error } = await supabase
        .from('aisles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching aisle by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAisleBySlug:', error);
      return null;
    }
  }

  // Get child aisles for a parent
  async getChildAisles(parentId: string): Promise<Aisle[]> {
    try {
      const { data, error } = await supabase
        .from('aisles')
        .select('*')
        .eq('parent_id', parentId)
        .order('name');

      if (error) {
        console.error('Error fetching child aisles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChildAisles:', error);
      return [];
    }
  }

  // Get foods for specific aisle (including descendants)
  async getFoodsForAisle(aisleId: string): Promise<Food[]> {
    // Check cache first
    const cached = this.getCachedFoods(aisleId);
    if (cached) {
      return cached;
    }

    try {
      // Get descendant aisles using the database function
      const { data: descendants, error: descendantsError } = await supabase
        .rpc('get_descendant_aisles', { parent_aisle_id: aisleId });

      if (descendantsError) {
        console.error('Error getting descendant aisles:', descendantsError);
      }

      const allAisleIds = [aisleId, ...(descendants || []).map((d: Aisle) => d.id)];

      // Get food-aisle relationships
      const { data: foodAisles, error: foodAislesError } = await supabase
        .from('food_item_aisles')
        .select('food_id')
        .in('aisle_id', allAisleIds);

      if (foodAislesError) {
        console.error('Error fetching food-aisle relationships:', foodAislesError);
        return [];
      }

      const foodIds = [...new Set(foodAisles?.map(fa => fa.food_id) || [])];

      if (foodIds.length === 0) {
        return [];
      }

      // Get actual food data with supermarkets
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select(`
          *,
          food_supermarkets(supermarket)
        `)
        .in('id', foodIds)
        .eq('status', 'approved') // Only show approved foods (RLS handles permissions)
        .order('created_at', { ascending: false });

      if (foodsError) {
        console.error('Error fetching foods:', foodsError);
        return [];
      }

      // Transform data to flatten supermarkets array
      const transformedData = (foods || []).map(food => ({
        ...food,
        supermarkets: food.food_supermarkets?.map((fs: any) => fs.supermarket) ||
                      (food.supermarket ? [food.supermarket] : [])
      }));

      this.cacheFoods(transformedData, aisleId);
      return transformedData;

    } catch (error) {
      console.error('Error in getFoodsForAisle:', error);
      return [];
    }
  }

  // Get all foods (for "View All Foods" functionality)
  async getAllFoods(): Promise<Food[]> {
    try {
      const { data: foods, error } = await supabase
        .from('foods')
        .select(`
          *,
          food_supermarkets(supermarket)
        `)
        .eq('status', 'approved') // Only show approved foods (RLS handles permissions)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all foods:', error);
        return [];
      }

      // Transform data to flatten supermarkets array
      const transformedData = (foods || []).map(food => ({
        ...food,
        supermarkets: food.food_supermarkets?.map((fs: any) => fs.supermarket) ||
                      (food.supermarket ? [food.supermarket] : [])
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getAllFoods:', error);
      return [];
    }
  }

  // Search foods within a specific aisle
  async searchFoodsInAisle(query: string, aisleId: string): Promise<Food[]> {
    const foods = await this.getFoodsForAisle(aisleId);
    return foods.filter(food => 
      food.name.toLowerCase().includes(query.toLowerCase()) ||
      food.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Cache management
  private getCachedFoods(aisleId: string): Food[] | null {
    const timestamp = this.cacheTimestamps.get(aisleId);
    if (!timestamp || Date.now() - timestamp.getTime() > this.CACHE_EXPIRY) {
      return null;
    }
    return this.aisleCache.get(aisleId) || null;
  }

  private cacheFoods(foods: Food[], aisleId: string): void {
    this.aisleCache.set(aisleId, foods);
    this.cacheTimestamps.set(aisleId, new Date());
  }

  // Clear cache
  clearCache(): void {
    this.aisleCache.clear();
    this.cacheTimestamps.clear();
  }
}

// Export singleton instance
export const aisleService = new AisleService();