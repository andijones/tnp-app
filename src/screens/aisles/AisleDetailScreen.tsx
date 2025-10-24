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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Aisle } from '../../types/aisle';
import { Food } from '../../types';
import { logger } from '../../utils/logger';
import { aisleService } from '../../services/aisleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { EmptyState } from '../../components/common/EmptyState';
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
      logger.error('Error loading aisle data:', error);
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
      <SafeAreaView style={[styles.safeArea, styles.safeAreaWhite]}>
        <LoadingSpinner message="Loading aisle..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, styles.safeAreaWhite]}>
      <View style={styles.container}>
        {/* Header with SafeArea combined */}
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
                placeholder={`Search ${title}`}
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={() => setIsSearchActive(true)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={24} color={theme.colors.text.secondary} />
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
          (searchQuery || filters.processingLevels.length > 0 || filters.supermarketIds.length > 0) ? (
            <EmptyState />
          ) : (
            <View style={styles.emptyAisleContainer}>
              <Image
                source={require('../../../assets/Inbox.png')}
                style={styles.emptyAisleImage}
                resizeMode="contain"
              />
              <View style={styles.emptyAisleTextContainer}>
                <Text style={styles.emptyAisleHeading}>This aisle is empty</Text>
                <Text style={styles.emptyAisleBody}>
                  We haven't added any foods to this aisle yet, please keep checking back.
                </Text>
              </View>
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
    backgroundColor: '#F7F6F0', // Neutral-BG
  },

  safeAreaWhite: {
    backgroundColor: '#FFFFFF', // White for header area
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F6F0', // Neutral-BG
  },

  headerContainer: {
    backgroundColor: '#FFFFFF', // White from Figma
    paddingHorizontal: 24, // Figma 24px
    paddingTop: 20, // Padding after safe area - nudge content down
    paddingBottom: 23, // Figma 23px gap
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
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#0A0A0A', // Neutral-950 from Figma
    letterSpacing: -0.44,
    flex: 1,
    textAlign: 'center',
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
  
  // Figma Empty Aisle State - No Foods in Aisle
  emptyAisleContainer: {
    alignItems: 'center',
    paddingTop: 200, // Figma 200px top padding for vertical centering
    paddingHorizontal: 16, // Figma 16px horizontal padding
    maxWidth: 300, // Figma 300px max width for content
    alignSelf: 'center',
  },

  emptyAisleImage: {
    width: 160, // Figma 160px
    height: 160, // Figma 160px
    marginBottom: 8, // Figma 8px gap to text
  },

  emptyAisleTextContainer: {
    gap: 4, // Figma 4px gap between heading and body
    alignItems: 'center',
    width: '100%',
  },

  emptyAisleHeading: {
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#262626', // Neutral-800
    letterSpacing: -0.44,
    textAlign: 'center',
  },

  emptyAisleBody: {
    fontSize: 15, // Figma Body
    fontWeight: '400',
    lineHeight: 21,
    color: '#737373', // Neutral-500
    letterSpacing: -0.15,
    textAlign: 'center',
  },
});