import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodCard } from '../../components/common/FoodCard';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const [favoritesFoods, setFavoritesFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  
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

      // Get favorite food IDs
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('food_id')
        .eq('user_id', user.id);

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
        setFavoritesFoods(foodsData || []);
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

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const handleToggleFavorite = async (foodId: string) => {
    await toggleFavorite(foodId);
    // Refresh the list after toggling
    fetchFavoritesFoods();
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <FoodCard
      food={item}
      onPress={() => navigateToFoodDetail(item.id)}
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={handleToggleFavorite}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading favorites..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with hamburger menu */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.openDrawer()} 
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favoritesFoods.length} saved food{favoritesFoods.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={favoritesFoods}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.foodList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.text.hint} />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding foods to your favorites by tapping the heart icon
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  
  menuButton: {
    marginRight: theme.spacing.md,
    padding: 4,
  },
  
  headerContent: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  headerSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  
  foodList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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