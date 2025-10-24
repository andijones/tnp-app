import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { theme } from '../../theme';
import { logger } from '../../utils/logger';
import { Food, HomeScreenProps } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { AislePill } from '../../components/common/AislePill';
import { useFavorites } from '../../hooks/useFavorites';
import { FilterBar } from '../../components/common/FilterBar2';
import { FilterState, applyFilters, getUniqueSupermarkets } from '../../utils/filterUtils';
import { Supermarket } from '../../types';
import { Aisle } from '../../types/aisle';
import { aisleService } from '../../services/aisleService';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    processingLevels: [],
    supermarketIds: [],
  });
  const [availableSupermarkets, setAvailableSupermarkets] = useState<Supermarket[]>([]);
  const [matchedAisles, setMatchedAisles] = useState<Array<Aisle & { foodCount: number }>>([]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const foodGridRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    // Apply filters whenever search, filters, or foods change
    const filtered = applyFilters(foods, filters, searchQuery);
    setFilteredFoods(filtered);
  }, [searchQuery, foods, filters]);

  useEffect(() => {
    // Search aisles when searchQuery changes
    const searchAisles = async () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        const aisles = await aisleService.searchAisles(searchQuery, 3);
        setMatchedAisles(aisles);
      } else {
        setMatchedAisles([]);
      }
    };

    searchAisles();
  }, [searchQuery]);

  useEffect(() => {
    // Extract unique supermarkets when foods load
    if (foods.length > 0) {
      const supermarkets = getUniqueSupermarkets(foods);
      setAvailableSupermarkets(supermarkets);
    }
  }, [foods]);

  // Listen for tab press to scroll to top
  useEffect(() => {
    if (route?.params?.scrollToTop) {
      scrollToTop();
      // Clear the param so it doesn't trigger again
      navigation.setParams({ scrollToTop: undefined });
    }
  }, [route?.params?.scrollToTop]);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          food_supermarkets(supermarket)
        `)
        .eq('status', 'approved') // Only show approved foods (RLS handles permissions)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching foods:', error);
        Alert.alert('Error', 'Failed to load foods. Please try again.');
        return;
      }

      // Transform data to flatten supermarkets array
      const transformedData = (data || []).map(food => ({
        ...food,
        supermarkets: food.food_supermarkets?.map((fs: any) => fs.supermarket) ||
                      (food.supermarket ? [food.supermarket] : [])
      }));

      setFoods(transformedData);
    } catch (error) {
      logger.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const navigateToAisle = (slug: string, title: string) => {
    navigation.navigate('AisleDetail', { slug, title });
  };

  const scrollToTop = () => {
    foodGridRef.current?.scrollToOffset({ offset: 0, animated: true });
  };


  if (loading) {
    return (
      <View style={[styles.safeArea, styles.safeAreaWhite, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading foods..." />
      </View>
    );
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
                placeholder="Search Foods"
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
              onPress={() => navigation.navigate('AisleMenu')}
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.titleContainer}
              onPress={scrollToTop}
              activeOpacity={0.7}
            >
              <Text style={styles.headerTitleText}>Foods</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsSearchActive(true)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Bar - Only show when not searching */}
      {!isSearchActive && (
        <FilterBar
          activeFilters={filters}
          onFiltersChange={setFilters}
          availableSupermarkets={availableSupermarkets}
          totalCount={foods.length}
          filteredCount={filteredFoods.length}
        />
      )}

      <View style={styles.container}>
        <FoodGrid
          ref={foodGridRef}
          foods={filteredFoods}
          onFoodPress={navigateToFoodDetail}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        ListHeaderComponent={
          <View>
            {/* Scanner Feature Section - Only show when not searching */}
            {/* Temporarily hidden - may add back later
            {!searchQuery && (
              <View style={styles.featureSection}>
                <View style={styles.scannerCard}>
                  <View style={styles.backgroundContainer}>
                    <Image
                      source={require('../../../assets/bg-line.png')}
                      style={styles.backgroundSvg}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <Image
                      source={require('../../../assets/barcode.png')}
                      style={styles.barcodeImage}
                      resizeMode="contain"
                    />

                    <Text style={styles.scannerTitle}>
                      Scan any food to{'\n'}see if it's non-upf
                    </Text>

                  <Text style={styles.scannerSubtitle}>
                    Simply snap, AI analyses and you get a{'\n'}health score
                  </Text>

                    <Button
                      title="Scan Ingredients Now"
                      onPress={() => navigation.navigate('Scanner')}
                      variant="secondary"
                    />
                  </View>
                </View>
              </View>
            )}
            */}

            {/* Browse by Category - Show matched aisles when searching */}
            {matchedAisles.length > 0 && searchQuery && (
              <View style={styles.aislesSection}>
                <Text style={styles.aislesSectionHeader}>Browse by Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.aislesPillsContainer}
                >
                  {matchedAisles.map((aisle) => (
                    <AislePill
                      key={aisle.id}
                      label={aisle.name}
                      count={aisle.foodCount}
                      onPress={() => navigateToAisle(aisle.slug, aisle.name)}
                    />
                  ))}
                </ScrollView>

                {/* Divider between aisles and foods */}
                {filteredFoods.length > 0 && (
                  <View style={styles.divider} />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          (searchQuery || filters.processingLevels.length > 0 || filters.supermarketIds.length > 0) ? (
            <EmptyState />
          ) : null
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
  
  menuButton: {
    padding: 4,
    width: 32,
  },
  
  searchButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitleText: {
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#0A0A0A', // Neutral-950 from Figma
    letterSpacing: -0.44,
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
    color: '#0A0A0A', // Neutral-950
    letterSpacing: -0.15,
    paddingVertical: 0, // Ensure vertical alignment
    paddingHorizontal: 0, // Container handles horizontal padding
  },

  clearButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  featureSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  
  scannerCard: {
    backgroundColor: '#44DB6D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#35A756',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },

  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  backgroundSvg: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },

  cardContent: {
    padding: 24,
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 1,
  },

  
  barcodeImage: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  scannerTitle: {
    color: '#1F5932',
    textAlign: 'center',
    fontFamily: theme.typography.heading.fontFamily,
    fontSize: theme.typography.heading.fontSize, // 32px (2rem)
    fontWeight: 'bold',
    lineHeight: theme.typography.heading.lineHeight, // 119.712% of 32px = 38px
    letterSpacing: theme.typography.heading.letterSpacing, // -0.96px
    marginBottom: theme.spacing.lg,
    alignSelf: 'stretch',
  },
  
  scannerSubtitle: {
    ...theme.typography.body,
    color: '#2D5F3F',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    opacity: 0.8,
    alignSelf: 'stretch',
  },

  // Browse by Category Section
  aislesSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  aislesSectionHeader: {
    fontSize: 18, // Figma Headline
    fontWeight: '600',
    lineHeight: 22,
    color: '#0A0A0A', // Neutral-950
    letterSpacing: -0.2,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },

  aislesPillsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5E5', // Neutral-200
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
});