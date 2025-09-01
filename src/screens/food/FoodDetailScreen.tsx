import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { NovaBadge } from '../../components/common/NovaBadge';
import { IconBadge } from '../../components/common/IconBadge';
import { SectionHeader } from '../../components/common/SectionHeader';
import { NutritionPanel } from '../../components/food/NutritionPanel';
import { IngredientsList } from '../../components/food/IngredientsList';
import { MinimalNutritionPanel } from '../../components/food/MinimalNutritionPanel';
import { RatingsSection } from '../../components/food/RatingsSection';
import { ReviewSubmission } from '../../components/food/ReviewSubmission';

const { width: screenWidth } = Dimensions.get('window');

export const FoodDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState<Food | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const reviewSectionRef = useRef<View>(null);

  useEffect(() => {
    fetchFoodDetails();
    checkIfFavorite();
  }, [foodId]);

  const fetchFoodDetails = async () => {
    try {
      const { data: foodData, error: foodError } = await supabase
        .from('foods')
        .select('*')
        .eq('id', foodId)
        .single();

      if (foodError) {
        console.error('Error fetching food:', foodError);
        Alert.alert('Error', 'Failed to load food details');
        navigation.goBack();
        return;
      }

      // Fetch aisle associations
      const { data: aisleData } = await supabase
        .from('food_item_aisles')
        .select(`
          aisle_id,
          aisles!inner(
            id,
            name,
            slug
          )
        `)
        .eq('food_id', foodId)
        .limit(1)
        .single();

      // Fetch ratings first
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('id, rating, review, created_at, user_id')
        .eq('food_id', foodId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      }

      console.log('Raw ratings data:', ratingsData);
      console.log('Aisle data from food item:', aisleData);

      // Fetch user profiles for ratings
      const ratings = [];
      if (ratingsData && ratingsData.length > 0) {
        for (const rating of ratingsData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', rating.user_id)
            .single();

          ratings.push({
            ...rating,
            ratingValue: parseInt(rating.rating) || 0,
            username: profileData?.username,
            avatar_url: profileData?.avatar_url
          });
        }
      }

      console.log('Processed ratings:', ratings);

      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length 
        : 0;

      // Check if current user has already reviewed this food
      const { data: { user } } = await supabase.auth.getUser();
      let userHasReview = false;
      if (user && ratingsData && ratingsData.length > 0) {
        userHasReview = ratingsData.some(rating => rating.user_id === user.id);
      }
      setHasUserReview(userHasReview);

      // Parse nutrition data from JSONB column
      let nutritionData = null;
      if (foodData.nutrition_data) {
        nutritionData = foodData.nutrition_data;
      }

      setFood({
        ...foodData,
        aisle: aisleData?.aisles || null,
        nutrition: nutritionData,
        ratings,
        average_rating: averageRating,
        ratings_count: ratings.length
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_id', foodId)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save favorites');
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            food_id: foodId,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const shareFood = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const reportFood = () => {
    Alert.alert('Report', 'Report functionality coming soon!');
  };

  const handleViewFood = async () => {
    if (!food?.url) {
      Alert.alert('Not Available', 'This food doesn\'t have a supermarket link available.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(food.url);
      if (supported) {
        await Linking.openURL(food.url);
      } else {
        Alert.alert('Error', 'Unable to open this link on your device.');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open supermarket link.');
    }
  };

  const handleGoogleSearch = async () => {
    if (!food?.name) {
      Alert.alert('Error', 'Food name not available.');
      return;
    }

    try {
      const encodedFoodName = encodeURIComponent(food.name);
      const googleSearchUrl = `https://www.google.com/search?q=${encodedFoodName}`;
      
      const supported = await Linking.canOpenURL(googleSearchUrl);
      if (supported) {
        await Linking.openURL(googleSearchUrl);
      } else {
        Alert.alert('Error', 'Unable to open Google search on your device.');
      }
    } catch (error) {
      console.error('Error opening Google search:', error);
      Alert.alert('Error', 'Failed to open Google search.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading food details..." />
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Food not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF" 
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={shareFood}
          >
            <Ionicons name="share-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerActionButton, favoriteLoading && styles.actionButtonDisabled]}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? theme.colors.error : "#1A1A1A"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {food.image ? (
            <Image source={{ uri: food.image }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={80} color={theme.colors.text.tertiary} />
            </View>
          )}
        </View>

        {/* Content Cards */}
        <View style={styles.contentWrapper}>
          {/* Main Info Card */}
          <View style={styles.mainCard}>
            <Text style={styles.heroTitle}>{food.name}</Text>
            
            {/* NOVA Badge */}
            {food.nova_group && (
              <View style={styles.novaBadgeContainer}>
                <NovaBadge novaGroup={food.nova_group} size="large" showLabel />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {food.url && (
                <Button
                  title="View Food"
                  onPress={handleViewFood}
                  variant="primary"
                  style={styles.primaryActionButton}
                  leftIcon={<Ionicons name="storefront" size={20} color="white" />}
                />
              )}
              
              <Button
                title="Search Google"
                onPress={handleGoogleSearch}
                variant="text"
                style={styles.secondaryActionButton}
                leftIcon={<Ionicons name="search" size={20} color={theme.colors.primary} />}
              />
            </View>
          </View>

          {/* Quick Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="storefront" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Available at</Text>
                <Text style={styles.infoValue}>
                  {food.supermarket || 'Supermarket not specified'}
                </Text>
              </View>
            </View>
            
            {food.aisle?.name && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => {
                  if (food.aisle?.slug && food.aisle?.name) {
                    navigation.navigate('AisleDetail', {
                      slug: food.aisle.slug,
                      title: food.aisle.name
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="apps" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Found in</Text>
                  <Text style={styles.infoValue}>{food.aisle.name}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color={theme.colors.text.tertiary} 
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => {
                reviewSectionRef.current?.measureLayout(
                  scrollViewRef.current as any,
                  (x, y) => {
                    scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                  },
                  () => {}
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Rating</Text>
                {food.average_rating && food.ratings_count && food.ratings_count > 0 ? (
                  <Text style={styles.infoValue}>
                    {food.average_rating.toFixed(1)} ({food.ratings_count} review{food.ratings_count === 1 ? '' : 's'})
                  </Text>
                ) : (
                  <Text style={styles.infoValue}>No ratings yet</Text>
                )}
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={18} 
                color={theme.colors.text.tertiary} 
              />
            </TouchableOpacity>
          </View>

          {/* Ingredients Card */}
          <View style={styles.sectionCard}>
            <IngredientsList 
              ingredients={food.ingredients} 
              description={food.description} 
            />
          </View>

          {/* Nutrition Card */}
          <View style={styles.sectionCard}>
            <MinimalNutritionPanel nutrition={food.nutrition} />
          </View>

          {/* Reviews Card */}
          <View ref={reviewSectionRef} style={styles.sectionCard}>
            <RatingsSection 
              ratings={food.ratings}
              averageRating={food.average_rating}
              ratingsCount={food.ratings_count}
              reviewSubmission={
                <ReviewSubmission 
                  foodId={foodId}
                  onReviewSubmitted={fetchFoodDetails}
                  hasExistingReview={hasUserReview}
                />
              }
            />
          </View>

          {/* Report Button */}
          <TouchableOpacity style={styles.reportButton} onPress={reportFood}>
            <Ionicons name="flag-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.reportText}>Report incorrect information</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Fixed Header
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    zIndex: 10,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: '#F7F6F0',
  },
  
  // Hero Section
  heroContainer: {
    height: 300,
    marginBottom: -30, // Creates overlap with content
    backgroundColor: '#FFFFFF',
  },
  
  heroImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'contain',
  },
  
  heroPlaceholder: {
    width: screenWidth,
    height: 300,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  
  // Header Action Buttons
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  actionButtonDisabled: {
    opacity: 0.5,
  },
  
  // Content Wrapper
  contentWrapper: {
    paddingTop: 50, // Account for overlap with hero
    paddingHorizontal: 20,
    gap: 20,
  },
  
  // Main Content Card
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 38,
  },
  
  novaBadgeContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  
  // Action Buttons
  actionButtonsContainer: {
    gap: 12,
  },

  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    paddingVertical: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  secondaryActionButton: {
    backgroundColor: 'rgba(34, 139, 34, 0.08)',
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingVertical: 16,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 2,
  },
  
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Report Button
  reportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: 4,
    flexDirection: 'row',
  },
  
  reportText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
  },
  
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginVertical: 20,
    textAlign: 'center',
  },
});