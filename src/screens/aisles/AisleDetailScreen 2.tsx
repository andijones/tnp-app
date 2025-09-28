import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Aisle } from '../../types/aisle';
import { Food } from '../../types';
import { aisleService } from '../../services/aisleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { useFavorites } from '../../hooks/useFavorites';

interface AisleDetailViewProps {
  navigation: any;
  route: {
    params: {
      slug: string;
      title: string;
    };
  };
}

export const AisleDetailView: React.FC<AisleDetailViewProps> = ({ 
  navigation, 
  route 
}) => {
  const { slug, title } = route.params;
  const [aisle, setAisle] = useState<Aisle | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [childAisles, setChildAisles] = useState<Aisle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    loadAisleData();
  }, [slug]);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, foods]);

  const loadAisleData = async () => {
    try {
      setLoading(true);
      
      // Handle special "all-foods" case
      if (slug === 'all-foods') {
        const allFoods = await aisleService.getAllFoods();
        setFoods(allFoods);
        setChildAisles([]);
        setAisle(null);
        return;
      }
      
      // Get aisle by slug
      const aisleData = await aisleService.getAisleBySlug(slug);
      if (!aisleData) {
        Alert.alert('Error', 'Aisle not found');
        navigation.goBack();
        return;
      }
      
      setAisle(aisleData);
      
      // Get child aisles
      const children = await aisleService.getChildAisles(aisleData.id);
      setChildAisles(children);
      
      // Get foods for this aisle
      const aislefoods = await aisleService.getFoodsForAisle(aisleData.id);
      setFoods(aislefoods);
      
    } catch (error) {
      console.error('Error loading aisle data:', error);
      Alert.alert('Error', 'Failed to load aisle data');
    } finally {
      setLoading(false);
    }
  };

  const filterFoods = () => {
    if (searchQuery.trim() === '') {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  };

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const navigateToChildAisle = (childAisle: Aisle) => {
    navigation.push('AisleDetail', { 
      slug: childAisle.slug, 
      title: childAisle.name 
    });
  };

  const renderChildAisle = ({ item }: { item: Aisle }) => (
    <TouchableOpacity
      style={styles.childAisleItem}
      onPress={() => navigateToChildAisle(item)}
    >
      <Text style={styles.childAisleName}>{item.name}</Text>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={theme.colors.text.secondary} 
      />
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading aisle..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
              placeholder={`Search in ${title}...`}
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
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity 
              onPress={() => setIsSearchActive(true)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FoodGrid
        foods={filteredFoods}
        onFoodPress={navigateToFoodDetail}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        ListHeaderComponent={() => (
          <View>
            {/* Results count */}
            <Text style={styles.resultsText}>
              {searchQuery 
                ? `${filteredFoods.length} results for "${searchQuery}"` 
                : `${foods.length} foods available`
              }
            </Text>

            {/* Child aisles section */}
            {childAisles.length > 0 && !searchQuery && (
              <View style={styles.childAislesSection}>
                <Text style={styles.sectionTitle}>Shop by Category</Text>
                <FlatList
                  data={childAisles}
                  renderItem={renderChildAisle}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.childAislesList}
                />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          searchQuery ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No foods in this aisle yet</Text>
              <Text style={styles.emptySubtext}>
                Check back later or explore other aisles
              </Text>
            </View>
          )
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  
  headerTitle: {
    flex: 1,
    fontSize: 22, // Updated to match other headers (was 20px)
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  searchInputExpanded: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  
  resultsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  childAislesSection: {
    marginBottom: theme.spacing.lg,
  },
  
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  
  childAislesList: {
    marginBottom: theme.spacing.md,
  },
  
  childAisleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  
  childAisleName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
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
  },
});