import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/config';
import { Alert } from 'react-native';

interface UseFavoritesReturn {
  favorites: Set<string>;
  isFavorite: (foodId: string) => boolean;
  toggleFavorite: (foodId: string) => Promise<boolean>;
  loading: boolean;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('food_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      const favoriteIds = new Set(data.map(fav => fav.food_id));
      console.log('fetchFavorites: Loaded', favoriteIds.size, 'favorites from DB');
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((foodId: string): boolean => {
    return favorites.has(foodId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (foodId: string): Promise<boolean> => {
    console.log('🔄 toggleFavorite called for:', foodId);
    console.log('📊 Current favorites size:', favorites.size);
    console.log('❤️ Is currently favorite:', favorites.has(foodId));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save favorites');
        return false;
      }

      // First, check the actual state in the database to avoid race conditions
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_id', foodId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking favorite status:', checkError);
        Alert.alert('Error', 'Failed to check favorite status');
        return false;
      }

      const isCurrentlyFavorite = !!existingFavorite;
      console.log('🎯 Database state - Is favorite:', isCurrentlyFavorite);
      console.log('🎯 Action will be:', isCurrentlyFavorite ? 'REMOVE' : 'ADD');

      if (isCurrentlyFavorite) {
        console.log('➖ Removing from favorites...');
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId);

        if (error) {
          console.error('❌ Error removing favorite:', error);
          Alert.alert('Error', 'Failed to remove from favorites');
          return false;
        }

        console.log('✅ Successfully removed from DB, refreshing from database...');
        // Re-fetch from database to get the accurate state
        await fetchFavorites();
      } else {
        console.log('➕ Adding to favorites...');
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            food_id: foodId,
          });

        if (error) {
          console.error('❌ Error adding favorite:', error);
          // Don't show alert for duplicate error - it means it's already favorited
          if (error.code !== '23505') {
            Alert.alert('Error', 'Failed to add to favorites');
          }
          // Re-fetch to sync state even if there was a duplicate error
          await fetchFavorites();
          return false;
        }

        console.log('✅ Successfully added to DB, refreshing from database...');
        // Re-fetch from database to get the accurate state
        await fetchFavorites();
      }

      console.log('✨ toggleFavorite completed successfully');
      return true;
    } catch (error) {
      console.error('💥 Error toggling favorite:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      return false;
    }
  }, [fetchFavorites]); // Removed favorites from dependencies to prevent stale closure

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    loading,
  };
};