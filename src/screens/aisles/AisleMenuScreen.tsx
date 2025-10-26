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
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Aisle, AisleLevel } from '../../types/aisle';
import { aisleService } from '../../services/aisleService';
import { logger } from '../../utils/logger';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CategoryCard } from '../../components/aisles/CategoryCard';
import { QuickActionCard } from '../../components/aisles/QuickActionCard';
import { SectionHeader } from '../../components/aisles/SectionHeader';
import { AisleMenuSkeleton } from '../../components/common/skeletons/AisleMenuSkeleton';

interface AisleMenuViewProps {
  navigation: any;
}

export const AisleMenuView: React.FC<AisleMenuViewProps> = ({ navigation }) => {
  const [hierarchicalAisles, setHierarchicalAisles] = useState<Aisle[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigationStack, setNavigationStack] = useState<AisleLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<AisleLevel | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAisles, setFilteredAisles] = useState<Aisle[]>([]);

  useEffect(() => {
    loadAisles();
  }, []);

  useEffect(() => {
    filterAisles();
  }, [searchQuery, currentLevel]);

  const loadAisles = async () => {
    try {
      setLoading(true);
      const aisles = await aisleService.fetchAisles();
      setHierarchicalAisles(aisles);
      
      if (aisles.length > 0) {
        const rootLevel: AisleLevel = {
          title: 'Browse Aisles',
          aisles: aisles,
          parentSlug: null,
        };
        setNavigationStack([rootLevel]);
        setCurrentLevel(rootLevel);
      }
    } catch (error) {
      logger.error('Error loading aisles:', error);
      Alert.alert('Error', 'Failed to load aisles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAisles = () => {
    const aisles = currentLevel?.aisles || [];
    if (searchQuery.trim() === '') {
      setFilteredAisles(aisles);
    } else {
      const filtered = aisles.filter(aisle =>
        aisle.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAisles(filtered);
    }
  };

  const navigateToLevel = (aisle: Aisle) => {
    if (aisle.children && aisle.children.length > 0) {
      const newLevel: AisleLevel = {
        title: aisle.name,
        aisles: aisle.children,
        parentSlug: aisle.slug,
      };
      const newStack = [...navigationStack, newLevel];
      setNavigationStack(newStack);
      setCurrentLevel(newLevel);
    } else {
      // Navigate to aisle detail
      navigation.navigate('AisleDetail', { slug: aisle.slug, title: aisle.name });
    }
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1);
      setNavigationStack(newStack);
      setCurrentLevel(newStack[newStack.length - 1]);
    }
  };

  const navigateToShopAll = () => {
    if (currentLevel?.parentSlug) {
      navigation.navigate('AisleDetail', { 
        slug: currentLevel.parentSlug, 
        title: currentLevel.title 
      });
    }
  };

  const navigateToAllFoods = () => {
    // Create a special aisle detail view for all foods
    navigation.navigate('AisleDetail', { 
      slug: 'all-foods', 
      title: 'All Foods' 
    });
  };

  const renderAisleItem = ({ item, index }: { item: Aisle; index: number }) => {
    return (
      <CategoryCard
        aisle={item}
        onPress={navigateToLevel}
      />
    );
  };

  const createViewAllAisle = () => ({
    id: 'view-all-foods',
    name: 'View All Foods',
    slug: 'all-foods',
    children: [],
  });

  const createShopAllAisle = () => ({
    id: 'shop-all',
    name: `Shop all in ${currentLevel?.title}`,
    slug: currentLevel?.parentSlug || '',
    children: [],
  });

  if (loading) {
    return <AisleMenuSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, styles.safeAreaWhite]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
                placeholder="Search Aisles"
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
              onPress={navigationStack.length > 1 ? navigateBack : () => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentLevel?.title || 'Browse Aisles'}
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

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Categories List */}
          <View style={styles.categoriesContainer}>
            {/* View All Foods or Shop All - show as first item */}
            {navigationStack.length === 1 && (
              <CategoryCard
                aisle={createViewAllAisle()}
                onPress={() => navigateToAllFoods()}
              />
            )}

            {currentLevel?.parentSlug && (
              <CategoryCard
                aisle={createShopAllAisle()}
                onPress={() => navigateToShopAll()}
              />
            )}

            {/* Regular aisles */}
            {filteredAisles.map((item, index) => (
              <View key={item.id}>
                {renderAisleItem({ item, index })}
              </View>
            ))}

            {filteredAisles.length === 0 && searchQuery && (
              <EmptyState
                title="No categories found"
                message="Try adjusting your search terms"
                image={require('../../../assets/Inbox.png')}
              />
            )}
          </View>
        </ScrollView>
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

  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
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


  categoriesContainer: {
    paddingHorizontal: 16, // Figma: spacing-16
    paddingTop: 16, // Figma: spacing-16
  },
});