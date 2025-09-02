import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const [favoritesFoods, setFavoritesFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();

  // Fetch favorites directly from database on screen focus
  const fetchFavoritesFoods = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavoritesFoods([]);
        setLoading(false);
        return;
      }

      // Get favorite food IDs with created_at for sorting
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('food_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favError) {
        console.error('Error fetching favorite IDs:', favError);
        Alert.alert('Error', 'Failed to load favorites');
        setLoading(false);
        return;
      }

      const favoriteIds = favoritesData.map(fav => fav.food_id).filter(id => id != null);
      
      if (favoriteIds.length === 0) {
        setFavoritesFoods([]);
        setLoading(false);
        return;
      }

      // Get the actual food data
      const { data: foodsData, error: foodError } = await supabase
        .from('foods')
        .select('*')
        .in('id', favoriteIds)
        .eq('status', 'approved');

      if (foodError) {
        console.error('Error fetching foods:', foodError);
        Alert.alert('Error', 'Failed to load favorite foods');
      } else {
        console.log('Direct fetch: Got', foodsData?.length || 0, 'foods for', favoriteIds.length, 'favorites');
        // Sort foods to match the favorites order (newest first)
        const orderedFoods = favoriteIds.map(id => foodsData?.find(food => food.id === id)).filter(Boolean) as Food[];
        setFavoritesFoods(orderedFoods);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('FavoritesScreen focused - fetching fresh data');
      fetchFavoritesFoods();
    }, [])
  );

  // Filter foods based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFoods(favoritesFoods);
    } else {
      const filtered = favoritesFoods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  }, [searchQuery, favoritesFoods]);

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const handleToggleFavorite = async (foodId: string) => {
    await toggleFavorite(foodId);
    // Refresh the list after toggling
    fetchFavoritesFoods();
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading favorites..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {isSearchActive ? (
          // Search active header
          <View style={styles.searchActiveHeader}>
            <TouchableOpacity 
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInputExpanded}
              placeholder="Search favorites..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.tertiary}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Normal header
          <View style={styles.headerTopRow}>
            <View style={styles.spacer} />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Favorites</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsSearchActive(true)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.container}>
        <FoodGrid
        foods={filteredFoods}
        onFoodPress={navigateToFoodDetail}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        ListHeaderComponent={() => (
          <View>
            {searchQuery ? (
              <Text style={styles.resultsText}>
                {filteredFoods.length} result{filteredFoods.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
            ) : (
              <Text style={styles.foodCountText}>
                {favoritesFoods.length} saved food{favoritesFoods.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          searchQuery ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No favorites found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>
                Start adding foods to your favorites by tapping the heart icon
              </Text>
            </View>
          )
        }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  container: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },
  
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  searchActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  backButton: {
    padding: 4,
    marginRight: theme.spacing.sm,
  },
  
  
  searchButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  
  spacer: {
    width: 32,
  },
  
  searchInputExpanded: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  
  resultsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  foodCountText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
});