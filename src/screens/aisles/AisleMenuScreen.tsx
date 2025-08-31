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
import { Aisle, AisleLevel } from '../../types/aisle';
import { aisleService } from '../../services/aisleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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
    navigation.navigate('Home');
  };

  const renderAisleItem = ({ item }: { item: Aisle }) => {
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <TouchableOpacity
        style={styles.aisleItem}
        onPress={() => navigateToLevel(item)}
      >
        <View style={styles.aisleContent}>
          <Text style={styles.aisleName}>{item.name}</Text>
          {hasChildren && (
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading aisles..." />
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
              placeholder="Search aisles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.hint}
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

      <FlatList
        data={filteredAisles}
        renderItem={renderAisleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.aisleList}
        ListHeaderComponent={() => (
          currentLevel?.parentSlug ? (
            <TouchableOpacity
              style={[styles.aisleItem, styles.shopAllItem]}
              onPress={navigateToShopAll}
            >
              <View style={styles.aisleContent}>
                <Text style={[styles.aisleName, styles.shopAllText]}>
                  Shop all in {currentLevel.title}
                </Text>
                <Ionicons 
                  name="storefront" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
            </TouchableOpacity>
          ) : null
        )}
        ListFooterComponent={() => (
          navigationStack.length === 1 ? (
            <TouchableOpacity
              style={[styles.aisleItem, styles.viewAllItem]}
              onPress={navigateToAllFoods}
            >
              <View style={styles.aisleContent}>
                <Text style={[styles.aisleName, styles.viewAllText]}>
                  View All Foods
                </Text>
                <Ionicons 
                  name="grid" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
            </TouchableOpacity>
          ) : null
        )}
        showsVerticalScrollIndicator={false}
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
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  searchInputExpanded: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  
  aisleList: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  aisleItem: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  
  aisleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  
  aisleName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  shopAllItem: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  
  shopAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  viewAllItem: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});