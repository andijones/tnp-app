import { supabase } from './supabase/config';
import { Supermarket, FoodSupermarket } from '../types';
import { logger } from '../utils/logger';

/**
 * Service for fetching supermarket data from database
 */
export const supermarketService = {
  /**
   * Fetch all supermarkets from the database
   */
  async getAllSupermarkets(): Promise<Supermarket[]> {
    try {
      const { data, error } = await supabase
        .from('supermarkets')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching supermarkets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllSupermarkets:', error);
      return [];
    }
  },

  /**
   * Fetch supermarkets that have at least one food item
   */
  async getSupermarketsWithFoods(): Promise<Supermarket[]> {
    try {
      // Get unique supermarket IDs from food_supermarkets join table
      const { data: foodSupermarkets, error: fsError } = await supabase
        .from('food_supermarkets')
        .select('supermarket_id')
        .eq('available', true);

      if (fsError) {
        logger.error('Error fetching food_supermarkets:', fsError);
        return [];
      }

      // Get unique supermarket IDs
      const uniqueSupermarketIds = [
        ...new Set(foodSupermarkets?.map(fs => fs.supermarket_id) || [])
      ];

      if (uniqueSupermarketIds.length === 0) {
        return [];
      }

      // Fetch supermarket details
      const { data: supermarkets, error: smError } = await supabase
        .from('supermarkets')
        .select('*')
        .in('id', uniqueSupermarketIds)
        .order('name', { ascending: true });

      if (smError) {
        logger.error('Error fetching supermarkets:', smError);
        return [];
      }

      return supermarkets || [];
    } catch (error) {
      logger.error('Error in getSupermarketsWithFoods:', error);
      return [];
    }
  },

  /**
   * Get supermarkets for a specific food item
   */
  async getSupermarketsForFood(foodId: string): Promise<FoodSupermarket[]> {
    try {
      const { data, error } = await supabase
        .from('food_supermarkets')
        .select(`
          *,
          supermarket:supermarkets (
            id,
            name,
            logo
          )
        `)
        .eq('food_id', foodId);

      if (error) {
        logger.error('Error fetching food supermarkets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getSupermarketsForFood:', error);
      return [];
    }
  },

  /**
   * Get food IDs available at specific supermarkets
   * Used for filtering
   */
  async getFoodIdsBySupermarkets(supermarketIds: string[]): Promise<string[]> {
    try {
      if (supermarketIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('food_supermarkets')
        .select('food_id')
        .in('supermarket_id', supermarketIds)
        .eq('available', true);

      if (error) {
        logger.error('Error fetching food IDs by supermarkets:', error);
        return [];
      }

      // Get unique food IDs
      const uniqueFoodIds = [...new Set(data?.map(fs => fs.food_id) || [])];
      return uniqueFoodIds;
    } catch (error) {
      logger.error('Error in getFoodIdsBySupermarkets:', error);
      return [];
    }
  },
};
