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
import { SvgXml } from 'react-native-svg';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FoodGrid } from '../../components/common/FoodGrid';
import { Button } from '../../components/common/Button';
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
                <View style={styles.scannerCard}>
                  {/* Background Pattern */}
                  <View style={styles.backgroundContainer}>
                    <Image
                      source={require('../../../assets/bg-line.png')}
                      style={styles.backgroundSvg}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    {/* Scanner Icon */}
                    <View style={styles.iconContainer}>
                      <Ionicons name="scan" size={24} color="white" />
                    </View>

                    {/* Main Title */}
                    <Text style={styles.scannerTitle}>
                      Scan any food to{'\n'}see if it's non-upf
                    </Text>

                  {/* Subtitle */}
                  <Text style={styles.scannerSubtitle}>
                    Simply snap, AI analyses and you get a{'\n'}health score
                  </Text>

                    {/* CTA Button */}
                    <Button
                      title="Scan Ingredients Now"
                      onPress={() => navigation.navigate('Scanner')}
                      variant="secondary"
                    />
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 0,
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

  iconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  
  barcodeIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  
  barcodeIcon: {
    width: 80,
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  
  barcodeLine: {
    width: 3,
    height: 25,
    backgroundColor: '#FFFFFF',
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