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
            {/* Scanner Feature Section - Only show when not searching */}
            {!searchQuery && (
              <View style={styles.featureSection}>
                <View style={styles.gradientBackground}>
                  <View style={styles.featureContent}>
                    {/* Hero Content */}
                    <View style={styles.heroContent}>
                      <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                          <Ionicons name="scan" size={40} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>Scan Any Ingredient List</Text>
                        <Text style={styles.heroSubtitle}>
                          Instantly discover if foods are ultra-processed or truly healthy with our AI-powered scanner
                        </Text>
                      </View>
                    </View>

                    {/* Features Grid */}
                    <View style={styles.featuresGrid}>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconWrapper}>
                          <Ionicons name="flash" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.featureText}>Instant AI Analysis</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconWrapper}>
                          <Ionicons name="camera" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.featureText}>Just Take a Photo</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconWrapper}>
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.featureText}>Health Score</Text>
                      </View>
                    </View>

                    {/* Call to Action */}
                    <TouchableOpacity 
                      style={styles.ctaButton}
                      onPress={() => navigation.navigate('Scanner')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.ctaContent}>
                        <Ionicons name="scan" size={20} color="#FFFFFF" />
                        <Text style={styles.ctaText}>Try Scanner Now</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
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
  
  featureSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  
  gradientBackground: {
    backgroundColor: '#4F7942',
  },
  
  featureContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  
  heroContent: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  
  iconBackground: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  heroText: {
    alignItems: 'center',
  },
  
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  
  heroSubtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.sm,
  },
  
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  
  featureItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  
  featureIconWrapper: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  ctaText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.sm,
    letterSpacing: -0.3,
  },
  
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
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