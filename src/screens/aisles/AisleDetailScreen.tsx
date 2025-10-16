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
import { FilterBar } from '../../components/common/FilterBar2';
import { FilterState, applyFilters, getUniqueSupermarkets } from '../../utils/filterUtils';
import { Supermarket } from '../../types';
import { FilterChip } from '../../components/common/FilterChip';
import { BottomSheetModal } from '../../components/common/BottomSheetModal';

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
  const [filters, setFilters] = useState<FilterState>({
    processingLevels: [],
    supermarketIds: [],
  });
  const [availableSupermarkets, setAvailableSupermarkets] = useState<Supermarket[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    loadAisleData();
  }, [slug]);

  useEffect(() => {
    // Apply filters whenever search, filters, or foods change
    const filtered = applyFilters(foods, filters, searchQuery);
    setFilteredFoods(filtered);
  }, [searchQuery, foods, filters]);

  useEffect(() => {
    // Extract unique supermarkets when foods load
    if (foods.length > 0) {
      const supermarkets = getUniqueSupermarkets(foods);
      setAvailableSupermarkets(supermarkets);
    }
  }, [foods]);

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

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const navigateToChildAisle = (childAisle: Aisle) => {
    setCategoryModalVisible(false);
    navigation.push('AisleDetail', {
      slug: childAisle.slug,
      title: childAisle.name
    });
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading aisle..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

      {/* Filter Bar */}
      {!isSearchActive && (
        <View style={styles.filterSection}>
          <FilterBar
            activeFilters={filters}
            onFiltersChange={setFilters}
            availableSupermarkets={availableSupermarkets}
            totalCount={foods.length}
            filteredCount={filteredFoods.length}
            categoryChip={
              childAisles.length > 0 ? (
                <FilterChip
                  label="Category"
                  icon="grid"
                  active={false}
                  onPress={() => setCategoryModalVisible(true)}
                />
              ) : null
            }
          />
        </View>
      )}

      <FoodGrid
        foods={filteredFoods}
        onFoodPress={navigateToFoodDetail}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
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

      {/* Category Bottom Sheet Modal */}
      <BottomSheetModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        title="Shop by Category"
        footerButtons={[
          {
            label: 'Done',
            onPress: () => setCategoryModalVisible(false),
            variant: 'primary',
          },
        ]}
      >
        <View style={styles.modalContent}>
          {childAisles.map((childAisle) => (
            <TouchableOpacity
              key={childAisle.id}
              style={styles.modalItem}
              onPress={() => navigateToChildAisle(childAisle)}
              activeOpacity={0.7}
            >
              <View style={styles.modalItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="grid"
                    size={20}
                    color={theme.colors.green[600]}
                  />
                </View>
                <Text style={styles.modalItemText}>
                  {childAisle.name}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>
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
  
  headerTitle: {
    ...theme.typography.heading,
    fontSize: 22, // Reduced from 26 to 22 (4px decrease)
    color: theme.colors.green[950],
    flex: 1,
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

  filterSection: {
    // No additional styling needed, FilterBar has its own container
  },

  // Modal Content Styles
  modalContent: {
    paddingVertical: theme.spacing.xs,
  },

  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },

  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.green[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  modalItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: 'System',
    fontWeight: '500',
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