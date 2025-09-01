import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { useFavorites } from '../../hooks/useFavorites';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const foodGridRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  }, [searchQuery, foods]);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching foods:', error);
        Alert.alert('Error', 'Failed to load foods. Please try again.');
        return;
      }

      setFoods(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFoodDetail = (foodId: string) => {
    navigation.navigate('FoodDetail', { foodId });
  };

  const scrollToTop = () => {
    foodGridRef.current?.scrollToOffset({ offset: 0, animated: true });
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading foods..." />
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
              placeholder="Search foods..."
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
              onPress={() => navigation.navigate('AisleMenu')} 
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoContainer}
              onPress={scrollToTop}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </TouchableOpacity>
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
          ref={foodGridRef}
          foods={filteredFoods}
          onFoodPress={navigateToFoodDetail}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        ListHeaderComponent={
          <View>
            {/* Scanner Promotion Section - Only show when not searching */}
            {!searchQuery && (
              <View style={styles.promoSection}>
                <View style={styles.promoContent}>
                  <View style={styles.promoIcon}>
                    <Ionicons name="scan" size={32} color={theme.colors.primary} />
                  </View>
                  <View style={styles.promoText}>
                    <Text style={styles.promoTitle}>Scan Any Ingredient List</Text>
                    <Text style={styles.promoSubtitle}>
                      Instantly discover if foods are ultra-processed or truly healthy
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.promoButton}
                  onPress={() => navigation.navigate('Scanner')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.promoButtonText}>Try Scanner</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.promoBenefits}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="flash" size={16} color={theme.colors.primary} />
                    <Text style={styles.benefitText}>Instant results</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="camera" size={16} color={theme.colors.primary} />
                    <Text style={styles.benefitText}>Just take a photo</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {searchQuery 
                  ? `${filteredFoods.length} results for "${searchQuery}"` 
                  : `${foods.length} foods available`
                }
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>No foods found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search
            </Text>
          </View>
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
  
  menuButton: {
    padding: 4,
    width: 32,
  },
  
  searchButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  
  backButton: {
    padding: 4,
    marginRight: theme.spacing.sm,
  },
  
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  logo: {
    height: 50,
    width: 180,
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
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
  
  promoSection: {
    backgroundColor: '#F8FBF8',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  promoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  
  promoIcon: {
    width: 48,
    height: 48,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  
  promoText: {
    flex: 1,
  },
  
  promoTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  promoSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  promoButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  
  promoButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: theme.spacing.xs,
  },
  
  promoBenefits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  
  benefitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  
  statsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
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