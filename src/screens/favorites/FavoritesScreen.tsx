import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { EmptyState } from '../../components/common/EmptyState';
import { useFavorites } from '../../hooks/useFavorites';
import { logger } from '../../utils/logger';
import { FavoritesScreenSkeleton } from '../../components/common/skeletons/FavoritesScreenSkeleton';

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
        logger.error('Error fetching favorite IDs:', favError);
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
        .eq('status', 'approved'); // Only show approved foods (RLS handles permissions)

      if (foodError) {
        logger.error('Error fetching foods:', foodError);
        Alert.alert('Error', 'Failed to load favorite foods');
      } else {
        logger.log('Direct fetch: Got', foodsData?.length || 0, 'foods for', favoriteIds.length, 'favorites');
        // Sort foods to match the favorites order (newest first)
        const orderedFoods = favoriteIds.map(id => foodsData?.find(food => food.id === id)).filter(Boolean) as Food[];
        setFavoritesFoods(orderedFoods);
      }
    } catch (error) {
      logger.error('Error fetching favorites:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      logger.log('FavoritesScreen focused - fetching fresh data');
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
    return <FavoritesScreenSkeleton />;
  }

  return (
    <View style={[styles.safeArea, styles.safeAreaWhite]}>
      {/* White Safe Area Background */}
      <View style={[styles.safeAreaBackground, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.headerContainer}>
        {isSearchActive ? (
          // Search active header - New Design
          <View style={styles.searchActiveHeader}>
            <TouchableOpacity
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              style={styles.searchBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#737373" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Favourites"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#A3A3A3" // Neutral-400
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close" size={16} color="#737373" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          // Normal header
          <View style={styles.headerTopRow}>
            <View style={styles.spacer} />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Favourites</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsSearchActive(true)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.container}>
        <FoodGrid
        foods={filteredFoods}
        onFoodPress={navigateToFoodDetail}
        isFavorite={() => true} // All items on this screen are favorites
        onToggleFavorite={handleToggleFavorite}
        ListHeaderComponent={() => (
          searchQuery ? (
            <Text style={styles.resultsText}>
              {filteredFoods.length} result{filteredFoods.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
          ) : null
        )}
        ListEmptyComponent={
          searchQuery ? (
            <EmptyState />
          ) : (
            <View style={styles.noFavoritesContainer}>
              <Image
                source={require('../../../assets/NoFav.png')}
                style={styles.noFavoritesImage}
                resizeMode="contain"
              />
              <View style={styles.noFavoritesTextContainer}>
                <Text style={styles.noFavoritesHeading}>No Favourites</Text>
                <Text style={styles.noFavoritesBody}>
                  You haven't saved any foods to your favourites yet. Just simply tap the heart icon on a food.
                </Text>
              </View>
            </View>
          )
        }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F6F0', // Neutral-BG
  },

  safeAreaWhite: {
    backgroundColor: '#FFFFFF', // White for header area
  },

  // White Safe Area Background
  safeAreaBackground: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F6F0', // Neutral-BG content area
  },

  headerContainer: {
    backgroundColor: '#FFFFFF', // White from Figma
    paddingHorizontal: 24, // Figma 24px
    paddingTop: 20, // Padding after safe area - nudge content down
    paddingBottom: 23, // Figma 23px gap
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    // Shadow for elevation
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40, // Figma height
    gap: 16, // Figma spacing-16
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
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#0A0A0A', // Neutral-950 from Figma
    letterSpacing: -0.44,
  },

  spacer: {
    width: 32,
  },

  // Search Active Header Components
  searchBackButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F6F0', // Neutral-BG from Figma
    borderRadius: 8, // Figma spacing-8
    paddingHorizontal: 16, // Figma spacing-16
    paddingVertical: 12, // Figma spacing-12
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15, // Figma Body
    fontWeight: '400',
    lineHeight: 21,
    color: '#0A0A0A', // Neutral-950
    letterSpacing: -0.15,
    padding: 0, // Remove default padding
  },

  clearButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
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

  // No Favorites State - Separate from search empty state
  noFavoritesContainer: {
    alignItems: 'center',
    paddingTop: 200, // Figma 200px top padding for vertical centering
    paddingHorizontal: 16, // Figma 16px horizontal padding
    maxWidth: 300, // Figma 300px max width for content
    alignSelf: 'center',
  },

  noFavoritesImage: {
    width: 160, // Figma 160px
    height: 160, // Figma 160px
    marginBottom: 4, // Figma 4px gap to text
  },

  noFavoritesTextContainer: {
    gap: 8, // Figma 8px gap between heading and body
    alignItems: 'center',
    width: '100%',
  },

  noFavoritesHeading: {
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#262626', // Neutral-800
    letterSpacing: -0.44,
    textAlign: 'center',
  },

  noFavoritesBody: {
    fontSize: 13, // Figma Body
    fontWeight: '400',
    lineHeight: 17,
    color: '#737373', // Neutral-500
    letterSpacing: -0.13,
    textAlign: 'center',
  },
});