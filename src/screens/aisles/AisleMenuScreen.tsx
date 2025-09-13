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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Aisle, AisleLevel } from '../../types/aisle';
import { aisleService } from '../../services/aisleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CategoryCard } from '../../components/aisles/CategoryCard';
import { QuickActionCard } from '../../components/aisles/QuickActionCard';
import { SectionHeader } from '../../components/aisles/SectionHeader';

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
      console.error('Error loading aisles:', error);
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
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading aisles..." />
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
              placeholder="Search aisles..."
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
              onPress={navigationStack.length > 1 ? navigateBack : () => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentLevel?.title || 'Browse Aisles'}
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

      <ScrollView 
        style={styles.container}
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
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search terms
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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

  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
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

  
  categoriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },

  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
});